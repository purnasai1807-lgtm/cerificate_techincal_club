import base64
import csv
import hashlib
import hmac
import io
import json
import mimetypes
import os
import secrets
import smtplib
import sys
import time
import uuid
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

from flask import Blueprint, jsonify, request, send_file
from werkzeug.utils import secure_filename

try:
    import requests
except ImportError:  # pragma: no cover - requests should always be installed via requirements.txt
    requests = None

BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    from pypdf import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader
except ImportError:
    PdfReader = PdfWriter = canvas = ImageReader = None

import db


certificate_api = Blueprint("certificate_api", __name__, url_prefix="/api/v1")
ROOT = Path(__file__).resolve().parent.parent


def _now():
    return datetime.now(timezone.utc).isoformat()


def _default_state():
    return {
        "imports": [], "participants": [], "templates": [], "certificates": [],
        "emailJobs": [], "auditLogs": [], "settings": {
            "eventName": "", "organizationName": "", "certificateIdPrefix": "CERT",
            "issueDate": "", "activeTemplateId": "", "requireCheckIn": True,
            "requireCheckOut": True, "senderName": "", "replyToAddress": "",
            "emailSubject": "Your certificate", "emailBodyTemplate": "",
        },
    }


def _load_state():
    try:
        saved = db.load_state() or {}
    except Exception as exc:
        raise RuntimeError(f"Certificate portal data cannot be read: {exc}") from exc
    if not isinstance(saved, dict):
        raise RuntimeError("Certificate portal state is not a dictionary")
    saved_portal = saved.get("certificatePortal") if isinstance(saved.get("certificatePortal"), dict) else saved
    if saved_portal is None:
        return _default_state()
    state = _default_state()
    state.update(saved_portal)
    state["settings"] = {**_default_state()["settings"], **saved_portal.get("settings", {})}
    return state


portal_state = _load_state()


def _save_state():
    container = db.load_state() or {}
    if not isinstance(container, dict):
        container = {}
    container["certificatePortal"] = portal_state
    db.save_state(container)


def _response(data=None, message=None, status=200):
    payload = {"success": True, "data": data}
    if message:
        payload["message"] = message
    return jsonify(payload), status


def _error(code, message, status=400, details=None):
    return jsonify(success=False, error={"code": code, "message": message, "details": details or {}},
                   requestId=uuid.uuid4().hex), status


def _token(user):
    body = json.dumps({"sub": user["id"], "role": user["role"], "exp": int(time.time()) + 86400},
                      separators=(",", ":")).encode().hex()
    sig = hmac.new(os.getenv("JWT_SECRET", "certificate-portal-local-secret").encode(),
                   body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{sig}"


def _current_admin():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        body, sig = header[7:].split(".", 1)
        expected = hmac.new(os.getenv("JWT_SECRET", "certificate-portal-local-secret").encode(),
                            body.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(bytes.fromhex(body))
        return payload if payload["exp"] >= int(time.time()) and payload["role"] == "ADMIN" else None
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return None


def _require_admin():
    return _current_admin() is not None


def _audit(action, record, status="SUCCESS", details=""):
    portal_state["auditLogs"].insert(0, {
        "id": f"aud_{uuid.uuid4().hex[:10]}", "action": action,
        "admin": os.getenv("ADMIN_EMAIL", "administrator"), "record": record,
        "date": _now(), "status": status, "details": details,
    })
    _save_state()


def _normalize_key(value):
    return "".join(ch for ch in str(value).lower() if ch.isalnum())


def _extract_pdf_rows(raw):
    if PdfReader is None:
        raise ValueError("PDF processing is unavailable. Install the backend PDF dependencies.")
    reader = PdfReader(io.BytesIO(raw))
    lines = []
    for page in reader.pages:
        lines.extend((page.extract_text() or "").splitlines())
    rows = []
    for line in lines:
        values = [part.strip() for part in line.split("|")]
        if len(values) > 1:
            rows.append(values)
    if not rows:
        return [], []
    headers = rows[0]
    return headers, [dict(zip(headers, row)) for row in rows[1:]]


def _decode_csv(raw):
    # CSV exports can be UTF-8, UTF-8 with BOM, UTF-16, or occasionally
    # another common Windows encoding. Decode without inventing/replacing
    # participant data whenever possible.
    for encoding in ("utf-8-sig", "utf-16", "cp1252"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError("The CSV encoding could not be read. Please save the file as UTF-8 CSV and upload it again.")


def _parse_csv_text(text):
    # Excel/Google Sheets exports may use comma, semicolon, or tab delimiters.
    # Sniff only from the header/sample and fall back to comma.
    sample = text[:8192]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        delimiter = dialect.delimiter
    except csv.Error:
        delimiter = ","

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    raw_headers = list(reader.fieldnames or [])
    headers = [str(h or "").strip() for h in raw_headers]
    if not headers or not any(headers):
        raise ValueError("The CSV has no readable header row. Make sure the first row contains column names.")
    if len(set(headers)) != len(headers):
        raise ValueError("The CSV contains duplicate column names. Rename the duplicate headers and upload again.")

    rows = []
    for row in reader:
        # Rebuild rows using the cleaned header names so headers such as
        # ` Name ` still map correctly. Extra unnamed cells are ignored rather
        # than silently becoming fabricated fields.
        clean = {}
        for raw_header, header in zip(raw_headers, headers):
            value = row.get(raw_header)
            clean[header] = "" if value is None else str(value).strip()
        if any(value != "" for value in clean.values()):
            rows.append(clean)

    if not rows:
        raise ValueError("The CSV contains headers but no data rows.")
    return headers, rows


def _parse_upload(file_storage):
    filename = secure_filename(file_storage.filename or "")
    extension = Path(filename).suffix.lower()
    raw = file_storage.read()
    if not raw:
        raise ValueError("The uploaded file is empty.")
    if extension == ".csv":
        text = _decode_csv(raw)
        headers, rows = _parse_csv_text(text)
        return headers, rows, "CSV", raw
    if extension == ".pdf":
        headers, rows = _extract_pdf_rows(raw)
        if not headers or not rows:
            raise ValueError("The PDF contains no readable attendance rows.")
        return headers, rows, "PDF", raw
    raise ValueError("Only CSV and PDF attendance files are supported.")


def _mapping_value(row, mapping, key):
    column = mapping.get(key)
    return str(row.get(column, "")).strip() if column else ""


def _participant_from_row(row, mapping, index):
    aliases = {
        "name": ("name", "studentname", "fullname", "participantname"),
        "email": ("email", "mailid", "emailaddress"),
        "studentId": ("studentid", "id", "studentnumber"),
        "rollNumber": ("rollnumber", "rollno", "rollno"),
        "checkIn": ("checkin", "checkintime", "entry", "entrytime"),
        "checkOut": ("checkout", "checkouttime", "exit", "exittime"),
    }
    normalized = {_normalize_key(k): str(v or "").strip() for k, v in row.items()}

    def value(key):
        mapped = _mapping_value(row, mapping, key)
        if mapped:
            return mapped
        for alias in aliases[key]:
            if normalized.get(alias):
                return normalized[alias]
        return ""

    name, email = value("name"), value("email")
    student_id, roll = value("studentId"), value("rollNumber")
    check_in, check_out = value("checkIn"), value("checkOut")
    errors = []
    if not name:
        errors.append("MISSING_NAME")
    if not email or "@" not in email:
        errors.append("INVALID_EMAIL")
    if not student_id:
        errors.append("MISSING_STUDENT_ID")
    if not roll:
        errors.append("MISSING_ROLL_NUMBER")
    if not check_in:
        errors.append("MISSING_CHECK_IN")
    if not check_out:
        errors.append("MISSING_CHECK_OUT")
    eligible = bool(check_in and check_out and not any(e in errors for e in ("MISSING_NAME", "INVALID_EMAIL")))
    return {
        "id": f"part_{uuid.uuid4().hex[:12]}", "name": name, "email": email,
        "studentId": student_id, "rollNumber": roll, "checkIn": check_in or None,
        "checkOut": check_out or None, "eligibility": "ELIGIBLE" if eligible else "NOT_ELIGIBLE",
        "eligibilityReason": "Check-in and check-out verified" if eligible else ", ".join(errors),
        "certificateStatus": "PENDING", "validationErrors": errors, "sourceRow": index + 2,
    }


def _paginate(items):
    page = max(int(request.args.get("page", 1)), 1)
    limit = min(max(int(request.args.get("limit", 25)), 1), 100)
    total = len(items)
    start = (page - 1) * limit
    return {"items": items[start:start + limit], "pagination": {
        "page": page, "limit": limit, "total": total,
        "totalPages": (total + limit - 1) // limit if total else 0,
    }}


@certificate_api.post("/auth/login")
def portal_login():
    body = request.get_json(silent=True) or {}
    email = str(body.get("email") or body.get("usernameOrEmail") or "").strip().lower()
    password = str(body.get("password", ""))
    configured_email = (os.getenv("ADMIN_EMAIL") or "").strip().lower()
    configured_username = (os.getenv("ADMIN_USERNAME") or "").strip().lower()
    configured_password = os.getenv("ADMIN_PASSWORD") or ""
    if not configured_email or not configured_password:
        return _error("SERVER_NOT_CONFIGURED", "Administrator credentials are not configured on the server.", 503)
    accepted_aliases = {configured_email}
    if configured_username:
        accepted_aliases.add(configured_username)
    if email not in accepted_aliases or not hmac.compare_digest(password, configured_password):
        return _error("INVALID_CREDENTIALS", "Invalid administrator credentials.", 401)
    user = {"id": "admin", "name": os.getenv("ADMIN_FULL_NAME", "Administrator"),
            "email": configured_email, "role": "ADMIN", "lastLogin": _now()}
    return _response({"accessToken": _token(user), "expiresAt": datetime.fromtimestamp(int(time.time()) + 86400, timezone.utc).isoformat(), "user": user})


@certificate_api.get("/auth/me")
def portal_me():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    return _response({"id": "admin", "name": os.getenv("ADMIN_FULL_NAME", "Administrator"),
                      "email": os.getenv("ADMIN_EMAIL", ""), "role": "ADMIN", "lastLogin": _now()})


@certificate_api.post("/auth/logout")
def portal_logout():
    return _response(None, "Logged out successfully")


@certificate_api.post("/imports")
def create_import():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    uploaded = request.files.get("file")
    if not uploaded:
        return _error("FILE_REQUIRED", "Attendance file is required.", 422)
    raw_size = request.content_length or 0
    if raw_size > 25 * 1024 * 1024:
        return _error("FILE_TOO_LARGE", "Attendance files are limited to 25 MB.", 413)
    try:
        columns, rows, file_type, raw = _parse_upload(uploaded)
    except ValueError as exc:
        return _error("INVALID_FILE", str(exc), 422)
    import_id = f"imp_{uuid.uuid4().hex[:12]}"
    db.save_file(f"import:{import_id}", secure_filename(uploaded.filename), raw, mimetypes.guess_type(uploaded.filename or "")[0] or "application/octet-stream")
    job = {"id": import_id, "filename": uploaded.filename, "fileType": file_type,
           "fileSize": str(len(raw)), "uploadedAt": _now(), "status": "UPLOADED",
           "columns": columns, "rawRows": rows, "mapping": {}, "records": [],
           "totalRecords": len(rows), "validRecords": 0, "invalidRecords": 0,
           "duplicateRecords": 0, "missingNames": 0, "missingEmails": 0,
           "missingIds": 0, "missingRollNumbers": 0, "missingCheckIn": 0, "missingCheckOut": 0}
    portal_state["imports"].append(job)
    _save_state()
    _audit("FILE_UPLOADED", uploaded.filename)
    return _response({"importId": import_id, "filename": uploaded.filename, "fileType": file_type, "status": "UPLOADED"}, status=201)


@certificate_api.get("/imports")
def import_history():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    # Never fabricate upload records. This list contains only files actually
    # accepted by the backend and persisted in the portal state.
    items = []
    for job in reversed(portal_state["imports"]):
        items.append({
            key: value for key, value in job.items()
            if key not in ("rawRows", "records", "mapping")
        })
    return _response(_paginate(items))


@certificate_api.get("/imports/<import_id>/file")
def import_file(import_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    job = _find_import(import_id)
    if not job:
        return _error("NOT_FOUND", "Import job not found.", 404)
    stored = db.load_file(f"import:{import_id}")
    if not stored:
        return _error("NOT_FOUND", "Uploaded file is not available in persistent storage.", 404)
    return send_file(
        io.BytesIO(stored["data"]),
        download_name=stored.get("filename") or job.get("filename") or "attendance-file",
        mimetype=stored.get("content_type") or "application/octet-stream",
    )


def _find_import(import_id):
    return next((item for item in portal_state["imports"] if item["id"] == import_id), None)


@certificate_api.get("/imports/<import_id>")
def import_status(import_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    job = _find_import(import_id)
    if not job:
        return _error("NOT_FOUND", "Import job not found.", 404)
    return _response({key: value for key, value in job.items() if key not in ("rawRows", "mapping")})


@certificate_api.get("/imports/<import_id>/preview")
def import_preview(import_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    job = _find_import(import_id)
    if not job:
        return _error("NOT_FOUND", "Import job not found.", 404)
    return _response({"columns": job["columns"], "records": job["rawRows"]})


@certificate_api.post("/imports/<import_id>/mapping")
def import_mapping(import_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    job = _find_import(import_id)
    if not job:
        return _error("NOT_FOUND", "Import job not found.", 404)
    job["mapping"] = request.get_json(silent=True).get("mapping", {}) if request.is_json else {}
    job["status"] = "PROCESSING"
    _save_state()
    return _response({"importId": import_id, "status": job["status"], "mapping": job["mapping"]})


def _validate_job_records(job, mapping=None):
    rows = job.get("rawRows") or []
    if not rows:
        return False
    mapping = mapping or job.get("mapping") or {}
    records = [_participant_from_row(row, mapping, index) for index, row in enumerate(rows)]
    seen = set()
    duplicates = 0
    for record in records:
        email = record.get("email", "").strip().lower()
        roll = record.get("rollNumber", "").strip().lower()
        identity = (email, roll)
        # Missing identifiers are validation errors, not duplicate records.
        if (email or roll) and identity in seen:
            duplicates += 1
            record["validationErrors"].append("DUPLICATE_RECORD")
            record["eligibility"] = "NOT_ELIGIBLE"
        if email or roll:
            seen.add(identity)
    job["records"] = records
    job["status"] = "VALIDATED"
    job["validRecords"] = sum(not r["validationErrors"] for r in records)
    job["invalidRecords"] = len(records) - job["validRecords"]
    job["duplicateRecords"] = duplicates
    job["missingNames"] = sum("MISSING_NAME" in r["validationErrors"] for r in records)
    job["missingEmails"] = sum("INVALID_EMAIL" in r["validationErrors"] for r in records)
    job["missingIds"] = sum("MISSING_STUDENT_ID" in r["validationErrors"] for r in records)
    job["missingRollNumbers"] = sum("MISSING_ROLL_NUMBER" in r["validationErrors"] for r in records)
    job["missingCheckIn"] = sum("MISSING_CHECK_IN" in r["validationErrors"] for r in records)
    job["missingCheckOut"] = sum("MISSING_CHECK_OUT" in r["validationErrors"] for r in records)
    return True


@certificate_api.post("/imports/<import_id>/validate")
def validate_import(import_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    job = _find_import(import_id)
    if not job:
        return _error("NOT_FOUND", "Import job not found.", 404)
    body = request.get_json(silent=True) or {}
    if body.get("mapping"):
        job["mapping"] = body["mapping"]
    if not _validate_job_records(job, job.get("mapping")):
        return _error("INVALID_STATE", "Import job has no rows to validate.", 422)
    _save_state()
    _audit("FILE_PROCESSED", job["filename"])
    records = job["records"]
    errors = [{"row": r["sourceRow"], "codes": r["validationErrors"]} for r in records if r["validationErrors"]]
    return _response({"status": "VALIDATED", "totalRecords": len(records), "validRecords": job["validRecords"],
                      "invalidRecords": job["invalidRecords"], "duplicateRecords": job["duplicateRecords"],
                      "eligibleRecords": sum(r["eligibility"] == "ELIGIBLE" for r in records),
                      "ineligibleRecords": sum(r["eligibility"] != "ELIGIBLE" for r in records), "errors": errors})


@certificate_api.post("/imports/<import_id>/confirm")
def confirm_import(import_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    job = _find_import(import_id)
    if not job:
        return _error("NOT_FOUND", "Import job not found.", 404)
    body = request.get_json(silent=True) or {}
    if job.get("status") != "VALIDATED":
        if not _validate_job_records(job, body.get("mapping") or job.get("mapping")):
            return _error("INVALID_STATE", "Import must be validated before confirmation.", 422)
    if job.get("status") == "IMPORTED":
        return _response({"importId": import_id, "status": "IMPORTED", "participantsCreated": 0,
                          "certificateRequestsCreated": 0})
    records = job["records"] if not body.get("importValidRecordsOnly", True) else [r for r in job["records"] if not r["validationErrors"]]
    existing = {p["id"] for p in portal_state["participants"]}
    records = [r for r in records if r["id"] not in existing]
    portal_state["participants"].extend(records)
    prefix = portal_state["settings"].get("certificateIdPrefix") or "CERT"
    active_template = portal_state["settings"].get("activeTemplateId")
    created = []
    for index, participant in enumerate(records, 1):
        if participant["eligibility"] != "ELIGIBLE":
            continue
        certificate_id = f"{prefix}-{len(portal_state['certificates']) + index:05d}"
        created.append({"id": f"cert_{uuid.uuid4().hex[:12]}", "certificateId": certificate_id,
                        "participantId": participant["id"], "participantName": participant["name"],
                        "participantEmail": participant["email"], "participantRollNumber": participant["rollNumber"],
                        "participantStudentId": participant["studentId"], "checkIn": participant["checkIn"],
                        "checkOut": participant["checkOut"], "templateId": active_template or "",
                        "templateName": "", "status": "PENDING", "eventName": portal_state["settings"]["eventName"],
                        "issueDate": portal_state["settings"]["issueDate"] or _now()[:10]})
    portal_state["certificates"].extend(created)
    job["status"] = "IMPORTED"
    _save_state()
    return _response({"importId": import_id, "status": "IMPORTED", "participantsCreated": len(records),
                      "certificateRequestsCreated": len(created)})


@certificate_api.get("/participants")
def participants():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    items = list(portal_state["participants"])
    search = request.args.get("search", "").strip().lower()
    if search:
        items = [p for p in items if search in json.dumps(p).lower()]
    if request.args.get("eligibility") and request.args["eligibility"] != "ALL":
        items = [p for p in items if p["eligibility"] == request.args["eligibility"]]
    if request.args.get("certificateStatus") and request.args["certificateStatus"] != "ALL":
        items = [p for p in items if p.get("certificateStatus") == request.args["certificateStatus"]]
    paginated = _paginate(items)
    paginated["total"] = paginated["pagination"]["total"]
    paginated["totalPages"] = paginated["pagination"]["totalPages"]
    return _response(paginated)


@certificate_api.get("/participants/<participant_id>")
def participant_detail(participant_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    item = next((p for p in portal_state["participants"] if p["id"] == participant_id), None)
    return _response(item) if item else _error("NOT_FOUND", "Participant not found.", 404)


@certificate_api.delete("/participants/<participant_id>")
def delete_participant(participant_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)

    participant = next((p for p in portal_state["participants"] if p.get("id") == participant_id), None)
    if not participant:
        return _error("NOT_FOUND", "Participant not found.", 404)

    before_participants = len(portal_state["participants"])
    portal_state["participants"] = [p for p in portal_state["participants"] if p.get("id") != participant_id]

    removed_certificates = [c for c in portal_state["certificates"] if c.get("participantId") == participant_id]
    removed_certificate_ids = {c.get("certificateId") for c in removed_certificates}
    portal_state["certificates"] = [c for c in portal_state["certificates"] if c.get("participantId") != participant_id]

    portal_state["emailJobs"] = [
        j for j in portal_state["emailJobs"]
        if j.get("certificateId") not in removed_certificate_ids
    ]
    for certificate_id in removed_certificate_ids:
        db.delete_file(f"certificate:{certificate_id}")

    _save_state()
    _audit("PARTICIPANT_DELETED", participant.get("name", participant_id), details=f"Deleted participant {participant_id} and {len(removed_certificates)} certificate record(s).")
    return _response({
        "deleted": True,
        "participantId": participant_id,
        "certificatesDeleted": len(removed_certificates),
        "participantsRemaining": before_participants - 1,
    }, message="Participant and related certificate records deleted.")


@certificate_api.post("/participants/bulk-delete")
def bulk_delete_participants():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)

    body = request.get_json(silent=True) or {}
    delete_all = bool(body.get("deleteAll"))
    ids = {str(item) for item in (body.get("ids") or []) if item}

    if not delete_all and not ids:
        return _error("NO_SELECTION", "Select at least one participant or choose Delete All.", 422)

    if delete_all:
        target_ids = {str(p.get("id")) for p in portal_state["participants"]}
    else:
        target_ids = ids

    before = len(portal_state["participants"])
    removed_participants = [p for p in portal_state["participants"] if str(p.get("id")) in target_ids]
    removed_participant_ids = {str(p.get("id")) for p in removed_participants}
    portal_state["participants"] = [p for p in portal_state["participants"] if str(p.get("id")) not in removed_participant_ids]

    removed_certificates = [c for c in portal_state["certificates"] if str(c.get("participantId")) in removed_participant_ids]
    removed_certificate_ids = {str(c.get("certificateId")) for c in removed_certificates}
    portal_state["certificates"] = [c for c in portal_state["certificates"] if str(c.get("participantId")) not in removed_participant_ids]

    before_jobs = len(portal_state["emailJobs"])
    portal_state["emailJobs"] = [j for j in portal_state["emailJobs"] if str(j.get("certificateId")) not in removed_certificate_ids]
    removed_email_jobs = before_jobs - len(portal_state["emailJobs"])
    for certificate_id in removed_certificate_ids:
        db.delete_file(f"certificate:{certificate_id}")

    _save_state()
    action = "PARTICIPANTS_BULK_DELETED" if delete_all else "PARTICIPANTS_SELECTED_DELETED"
    _audit(action, f"{len(removed_participants)} participant(s)", details=f"Deleted {len(removed_participants)} participant(s), {len(removed_certificates)} certificate(s), and {removed_email_jobs} email log(s).")
    return _response({
        "deleted": True,
        "participantsDeleted": len(removed_participants),
        "certificatesDeleted": len(removed_certificates),
        "emailLogsDeleted": removed_email_jobs,
        "participantsRemaining": before - len(removed_participants),
    }, message="All matching participant records and related certificate/email records deleted." if delete_all else "Selected participants and related records deleted.")


@certificate_api.get("/templates")
def templates():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)

    # Only expose templates whose uploaded bytes actually exist in persistent
    # storage. This prevents stale database metadata from appearing as a real
    # certificate template after a storage migration or accidental file loss.
    available = []
    stale_ids = []
    for template in portal_state["templates"]:
        stored = db.load_file(f"template:{template['id']}")
        if stored is None:
            stale_ids.append(template["id"])
            continue
        available.append(template)

    if stale_ids:
        portal_state["templates"] = available
        active_id = portal_state["settings"].get("activeTemplateId")
        if active_id not in {item["id"] for item in available}:
            new_active = available[0] if available else None
            for item in available:
                item["active"] = item["id"] == (new_active["id"] if new_active else "")
            portal_state["settings"]["activeTemplateId"] = new_active["id"] if new_active else ""
        _save_state()

    return _response(available)


@certificate_api.get("/templates/<template_id>")
def template_detail(template_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    template = next((item for item in portal_state["templates"] if item["id"] == template_id), None)
    if not template:
        return _error("NOT_FOUND", "Template not found.", 404)
    return _response(template)


@certificate_api.post("/templates")
def create_template():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    uploaded = request.files.get("file")
    if not uploaded:
        return _error("FILE_REQUIRED", "Certificate template file is required.", 422)
    extension = Path(uploaded.filename or "").suffix.lower().lstrip(".")
    if extension not in ("pdf", "png", "jpg", "jpeg"):
        return _error("INVALID_FILE", "Only PDF, PNG, JPG, and JPEG templates are supported.", 422)
    raw_template = uploaded.read()
    if not raw_template:
        return _error("EMPTY_FILE", "The certificate template file is empty.", 422)
    if len(raw_template) > 25 * 1024 * 1024:
        return _error("FILE_TOO_LARGE", "Certificate templates are limited to 25 MB.", 413)
    template_id = f"tpl_{uuid.uuid4().hex[:12]}"
    filename = f"{template_id}.{extension}"
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    db.save_file(f"template:{template_id}", filename, raw_template, content_type)
    item = {"id": template_id, "name": request.form.get("name") or uploaded.filename,
            "fileType": extension.upper(), "filePath": filename, "previewUrl": f"/api/v1/templates/{template_id}/file",
            "active": not portal_state["templates"], "uploadedAt": _now(), "usageCount": 0, "fields": []}
    portal_state["templates"].append(item)
    if item["active"]:
        portal_state["settings"]["activeTemplateId"] = template_id
    _save_state()
    _audit("TEMPLATE_UPLOADED", item["name"])
    return _response({key: value for key, value in item.items() if key != "filePath"}, status=201)


@certificate_api.get("/templates/<template_id>/file")
def template_file(template_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    item = next((t for t in portal_state["templates"] if t["id"] == template_id), None)
    if not item:
        return _error("NOT_FOUND", "Template not found.", 404)
    stored = db.load_file(f"template:{template_id}")
    if not stored:
        return _error("NOT_FOUND", "Template file not found.", 404)
    return send_file(io.BytesIO(stored["data"]), download_name=item["name"],
                     mimetype=stored.get("content_type") or "application/octet-stream")


@certificate_api.post("/templates/<template_id>/activate")
def activate_template(template_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    item = next((t for t in portal_state["templates"] if t["id"] == template_id), None)
    if not item:
        return _error("NOT_FOUND", "Template not found.", 404)
    for template in portal_state["templates"]:
        template["active"] = template["id"] == template_id
    portal_state["settings"]["activeTemplateId"] = template_id
    _save_state()
    return _response({"templateId": template_id, "active": True})


@certificate_api.put("/templates/<template_id>/fields")
def update_template_fields(template_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    item = next((t for t in portal_state["templates"] if t["id"] == template_id), None)
    if not item:
        return _error("NOT_FOUND", "Template not found.", 404)
    fields = (request.get_json(silent=True) or {}).get("fields")
    if not isinstance(fields, list):
        return _error("INVALID_FIELDS", "Fields must be an array.", 422)
    item["fields"] = fields
    _save_state()
    _audit("TEMPLATE_UPDATED", item["name"])
    return _response(item)


@certificate_api.delete("/templates/<template_id>")
def delete_template(template_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    item = next((t for t in portal_state["templates"] if t["id"] == template_id), None)
    if not item:
        return _error("NOT_FOUND", "Template not found.", 404)
    was_active = bool(item.get("active"))
    portal_state["templates"].remove(item)
    if was_active and portal_state["templates"]:
        portal_state["templates"][0]["active"] = True
        portal_state["settings"]["activeTemplateId"] = portal_state["templates"][0]["id"]
    elif was_active:
        portal_state["settings"]["activeTemplateId"] = ""
    _save_state()
    db.delete_file(f"template:{template_id}")
    return _response(True)


def _certificate_filtered():
    items = list(portal_state["certificates"])
    status = request.args.get("status")
    search = request.args.get("search", "").lower()
    if status and status != "ALL":
        items = [c for c in items if c["status"] == status]
    if search:
        items = [c for c in items if search in json.dumps(c).lower()]
    return items


@certificate_api.get("/certificates")
def certificates():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    items = _certificate_filtered()
    result = _paginate(items)
    result["countsByStatus"] = {status: sum(c["status"] == status for c in portal_state["certificates"])
                                for status in ("PENDING", "APPROVED", "REJECTED", "GENERATING", "GENERATED", "EMAIL_QUEUED", "SENT", "FAILED")}
    result["total"] = result["pagination"]["total"]
    return _response(result)


@certificate_api.get("/certificates/<certificate_id>")
def certificate_detail(certificate_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    item = _find_certificate(certificate_id)
    if item:
        return _response(item)
    participant = next((p for p in portal_state["participants"]
                       if p.get("rollNumber") == certificate_id or p.get("studentId") == certificate_id or p.get("email") == certificate_id), None)
    if participant:
        related = next((c for c in portal_state["certificates"] if c.get("participantId") == participant.get("id")), None)
        return _response({"participant": participant, "status": related["status"] if related else "PENDING",
                          "certificateId": related.get("certificateId") if related else None})
    return _error("NOT_FOUND", "Certificate not found.", 404)


def _find_certificate(certificate_id):
    return next((c for c in portal_state["certificates"] if c["id"] == certificate_id or c["certificateId"] == certificate_id), None)


def _find_certificate_for_participant(identifier):
    participant = next((p for p in portal_state["participants"]
                       if str(p.get("rollNumber", "")).lower() == str(identifier).lower()
                       or str(p.get("studentId", "")).lower() == str(identifier).lower()
                       or str(p.get("email", "")).lower() == str(identifier).lower()), None)
    if not participant:
        return None
    return next((c for c in portal_state["certificates"] if c.get("participantId") == participant.get("id")), None)


def _find_participant_for_identifier(identifier):
    identifier = str(identifier).strip()
    return next((p for p in portal_state["participants"]
                 if str(p.get("rollNumber", "")).lower() == identifier.lower()
                 or str(p.get("studentId", "")).lower() == identifier.lower()
                 or str(p.get("email", "")).lower() == identifier.lower()), None)


@certificate_api.get("/certificates/lookup/<identifier>")
def lookup_certificate_by_identifier(identifier):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    participant = _find_participant_for_identifier(identifier)
    if not participant:
        return _error("NOT_FOUND", "Participant not found.", 404)
    certificate = next((c for c in portal_state["certificates"] if c.get("participantId") == participant.get("id")), None)
    return _response({"participant": participant, "certificate": certificate, "status": certificate["status"] if certificate else "PENDING"})


@certificate_api.post("/certificates/lookup/<identifier>/approve")
def approve_certificate_by_identifier(identifier):
    """Approve, generate, and email a certificate in one operation."""
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    participant = _find_participant_for_identifier(identifier)
    if not participant:
        return _error("NOT_FOUND", "Participant not found.", 404)
    item = next((c for c in portal_state["certificates"] if c.get("participantId") == participant.get("id")), None)
    if not item:
        return _error("NOT_FOUND", "Certificate not found.", 404)
    if item["status"] != "PENDING":
        return _error("INVALID_STATE", "Only pending certificates can be approved.", 422)

    item.update({"status": "APPROVED", "approvedBy": os.getenv("ADMIN_EMAIL", "administrator"),
                 "approvedAt": _now(), "approvalComment": (request.get_json(silent=True) or {}).get("comment", "")})
    _save_state()
    _audit("CERTIFICATE_APPROVED", item["certificateId"])

    # The frontend action is named "Approve & Send", so this endpoint must
    # actually generate the personalized PDF and deliver it by email.
    template = next((t for t in portal_state["templates"] if t["id"] == item.get("templateId")), None)
    if not template:
        item.update({"status": "FAILED", "failureReason": "Active certificate template not found."})
        _save_state()
        return _error("GENERATION_FAILED", "Certificate template not found.", 422)

    try:
        file_key = _render_certificate(item, template)
        item.update({
            "status": "GENERATED",
            "generatedAt": _now(),
            "certificateUrl": f"/api/v1/certificates/{item['certificateId']}/download",
        })
        _audit("CERTIFICATE_GENERATED", item["certificateId"])

        stored_certificate = db.load_file(file_key)
        if not stored_certificate:
            raise RuntimeError("Generated certificate file is not available to attach.")

        email_job_id = f"email_{uuid.uuid4().hex[:12]}"
        subject, body = _render_email_content(item)
        job = {
            "id": email_job_id,
            "jobId": email_job_id,
            "certificateId": item["certificateId"],
            "recipient": item["participantEmail"],
            "studentName": item.get("participantName", ""),
            "status": "PROCESSING",
            "createdAt": _now(),
            "sentAt": None,
            "attempts": 1,
            "subject": subject,
            "body": body,
            "attachmentFilename": stored_certificate.get("filename") or f"{item['certificateId']}.pdf",
        }
        portal_state["emailJobs"].append(job)
        _save_state()

        _deliver_certificate_email(item, stored_certificate, subject, body)
        job.update({"status": "SENT", "sentAt": _now()})
        item.update({"status": "SENT", "sentAt": job["sentAt"], "emailDeliveryStatus": "SENT"})
        _audit("EMAIL_SENT", item["certificateId"])
        _save_state()

        return _response({
            "participant": participant,
            "certificate": item,
            "sentToEmail": item["participantEmail"],
            "emailJobId": email_job_id,
        }, message="Certificate approved, generated, and emailed successfully.")
    except (OSError, smtplib.SMTPException, RuntimeError, ValueError) as exc:
        item.update({"status": "FAILED", "emailDeliveryStatus": "FAILED", "failureReason": str(exc)})
        if "email_job_id" in locals():
            job.update({"status": "FAILED", "error": str(exc)})
        _audit("EMAIL_FAILED", item["certificateId"], "FAILED", str(exc))
        _save_state()
        return _error("EMAIL_FAILED", str(exc), 502)


@certificate_api.post("/certificates/<certificate_id>/approve")
def approve_certificate(certificate_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    item = _find_certificate(certificate_id)
    if not item:
        item = _find_certificate_for_participant(certificate_id)
    if not item:
        return _error("NOT_FOUND", "Certificate not found.", 404)
    if item["status"] != "PENDING":
        return _error("INVALID_STATE", "Only pending certificates can be approved.", 422)
    item.update({"status": "APPROVED", "approvedBy": os.getenv("ADMIN_EMAIL", "administrator"),
                 "approvedAt": _now(), "approvalComment": (request.get_json(silent=True) or {}).get("comment", "")})
    _save_state()
    _audit("CERTIFICATE_APPROVED", item["certificateId"])
    return _response(item)


@certificate_api.post("/certificates/<certificate_id>/reject")
def reject_certificate(certificate_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    item = _find_certificate(certificate_id)
    if not item:
        return _error("NOT_FOUND", "Certificate not found.", 404)
    item.update({"status": "REJECTED", "rejectionReason": (request.get_json(silent=True) or {}).get("reason", ""),
                 "rejectedBy": os.getenv("ADMIN_EMAIL", "administrator"), "rejectedAt": _now()})
    _save_state()
    _audit("CERTIFICATE_REJECTED", item["certificateId"], "WARNING", item.get("rejectionReason", ""))
    return _response(item)


@certificate_api.post("/certificates/bulk-approve")
def bulk_approve():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    ids = (request.get_json(silent=True) or {}).get("certificateIds", [])
    results, approved = [], 0
    for identifier in ids:
        item = _find_certificate(identifier)
        if item and item["status"] == "PENDING":
            item.update({"status": "APPROVED", "approvedBy": os.getenv("ADMIN_EMAIL", "administrator"), "approvedAt": _now()})
            results.append({"id": identifier, "status": "APPROVED"})
            approved += 1
        else:
            results.append({"id": identifier, "status": "FAILED", "reason": "Certificate is missing or not pending."})
    _save_state()
    return _response({"total": len(ids), "approved": approved, "approvedCount": approved,
                      "failed": len(ids) - approved, "results": results})


def _render_certificate(item, template):
    if PdfReader is None or canvas is None:
        raise RuntimeError("Certificate rendering dependencies are not installed.")

    # Never generate/send a certificate with an empty recipient name.
    participant_name = str(item.get("participantName") or item.get("participant", {}).get("name") or "").strip()
    if not participant_name:
        raise RuntimeError("Participant name is empty; certificate generation was stopped.")

    stored_template = db.load_file(f"template:{template['id']}")
    if not stored_template:
        raise RuntimeError("Template file not found.")
    source = io.BytesIO(stored_template["data"])
    fields = template.get("fields") or []
    normalized_field_keys = set()
    for f in fields:
        raw_key = f.get("key") or f.get("fieldKey") or ""
        k = str(raw_key).strip().upper().replace("{{", "").replace("}}", "")
        normalized_field_keys.add({"FULL_NAME": "NAME", "PARTICIPANT_NAME": "NAME", "STUDENTNAME": "NAME"}.get(k, k))
    if "NAME" not in normalized_field_keys:
        raise RuntimeError("Certificate template has no Participant Name field. Open Template Editor, add 'Participant Name', position it, and save before generating.")
    font_map = {
        "Cinzel": "Helvetica-Bold",
        "Playfair Display": "Times-Roman",
        "Inter": "Helvetica",
        "Plus Jakarta Sans": "Helvetica",
        "Great Vibes": "Times-Italic",
        "Helvetica": "Helvetica",
        "Helvetica-Bold": "Helvetica-Bold",
        "Times-Roman": "Times-Roman",
        "Times-Italic": "Times-Italic",
    }
    style_map = {
        "normal": "",
        "italic": "-Oblique",
        "bold": "-Bold",
        "bold italic": "-BoldOblique",
    }
    if template["fileType"] == "PDF":
        reader = PdfReader(source)
        page = reader.pages[0]
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)
        packet = io.BytesIO()
        overlay = canvas.Canvas(packet, pagesize=(width, height))
        values = {"NAME": participant_name, "EMAIL": str(item.get("participantEmail") or ""),
                  "STUDENT_ID": str(item.get("participantStudentId") or ""), "ROLL_NO": str(item.get("participantRollNumber") or ""),
                  "EVENT_NAME": str(item.get("eventName") or ""), "DATE": str(item.get("issueDate") or ""), "CERTIFICATE_ID": str(item.get("certificateId") or "")}
        for field in fields:
            if field.get("visible", True) is False:
                continue
            raw_key = field.get("key") or field.get("fieldKey") or ""
            key = str(raw_key).strip().upper().replace("{{", "").replace("}}", "")
            aliases = {"FULL_NAME": "NAME", "PARTICIPANT_NAME": "NAME", "STUDENTNAME": "NAME", "ROLLNUMBER": "ROLL_NO", "STUDENTID": "STUDENT_ID", "EVENT": "EVENT_NAME", "CERTIFICATEID": "CERTIFICATE_ID"}
            key = aliases.get(key, key)
            value = values.get(key, "")
            x, y = float(field.get("x", field.get("xPercent", 50))) / 100 * width, (100 - float(field.get("y", field.get("yPercent", 50)))) / 100 * height
            overlay.setFillColor(field.get("color", "#111827"))
            base_font = font_map.get(field.get("fontFamily"), "Helvetica")
            style = field.get("fontStyle", "normal")
            font_name = base_font + style_map.get(style, "")
            if font_name not in ("Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique",
                                 "Times-Roman", "Times-Italic", "Times-Bold", "Times-BoldItalic"):
                font_name = base_font
            overlay.setFont(font_name, float(field.get("fontSize", 24)))
            alignment = field.get("textAlign", "center")
            if alignment == "left":
                overlay.drawString(x, y, value)
            elif alignment == "right":
                overlay.drawRightString(x, y, value)
            else:
                overlay.drawCentredString(x, y, value)
        # showPage() guarantees the overlay always emits exactly one page,
        # even when there are no visible fields to draw (e.g. a template
        # with every placeholder removed or hidden). Without this, an
        # all-blank overlay produces a zero-page PDF and the merge below
        # raises IndexError.
        overlay.showPage()
        overlay.save()
        packet.seek(0)
        page.merge_page(PdfReader(packet).pages[0])
        writer = PdfWriter()
        writer.add_page(page)
        result = io.BytesIO()
        writer.write(result)
        output_bytes = result.getvalue()
    else:
        packet = io.BytesIO()
        overlay = canvas.Canvas(packet, pagesize=(842, 595))
        overlay.drawImage(ImageReader(source), 0, 0, width=842, height=595)
        values = {"NAME": participant_name, "EMAIL": str(item.get("participantEmail") or ""), "STUDENT_ID": str(item.get("participantStudentId") or ""), "ROLL_NO": str(item.get("participantRollNumber") or ""), "EVENT_NAME": str(item.get("eventName") or ""), "DATE": str(item.get("issueDate") or ""), "CERTIFICATE_ID": str(item.get("certificateId") or "")}
        for field in fields:
            if field.get("visible", True) is False:
                continue
            raw_key = field.get("key") or field.get("fieldKey") or ""
            key = str(raw_key).strip().upper().replace("{{", "").replace("}}", "")
            aliases = {"FULL_NAME": "NAME", "PARTICIPANT_NAME": "NAME", "STUDENTNAME": "NAME", "ROLLNUMBER": "ROLL_NO", "STUDENTID": "STUDENT_ID", "EVENT": "EVENT_NAME", "CERTIFICATEID": "CERTIFICATE_ID"}
            key = aliases.get(key, key)
            x, y = float(field.get("x", field.get("xPercent", 50))) / 100 * 842, (100 - float(field.get("y", field.get("yPercent", 50)))) / 100 * 595
            overlay.setFillColor(field.get("color", "#111827"))
            base_font = font_map.get(field.get("fontFamily"), "Helvetica")
            style = field.get("fontStyle", "normal")
            font_name = base_font + style_map.get(style, "")
            if font_name not in ("Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique",
                                 "Times-Roman", "Times-Italic", "Times-Bold", "Times-BoldItalic"):
                font_name = base_font
            overlay.setFont(font_name, float(field.get("fontSize", 24)))
            alignment = field.get("textAlign", "center")
            value = values.get(key, "")
            if alignment == "left":
                overlay.drawString(x, y, value)
            elif alignment == "right":
                overlay.drawRightString(x, y, value)
            else:
                overlay.drawCentredString(x, y, value)
        overlay.save()
        packet.seek(0)
        output_bytes = packet.read()
    file_key = f"certificate:{item['certificateId']}"
    db.save_file(file_key, f"{item['certificateId']}.pdf", output_bytes, "application/pdf")
    return file_key


@certificate_api.post("/certificates/<certificate_id>/generate")
def generate_certificate(certificate_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    item = _find_certificate(certificate_id)
    template = next((t for t in portal_state["templates"] if t["id"] == item.get("templateId")), None) if item else None
    if not item or not template:
        return _error("NOT_FOUND", "Certificate or active template not found.", 404)
    if item["status"] not in ("APPROVED", "FAILED"):
        return _error("INVALID_STATE", "Certificate must be approved before generation.", 422)
    job_id = f"job_gen_{uuid.uuid4().hex[:12]}"
    try:
        file_key = _render_certificate(item, template)
        item.update({"status": "GENERATED", "generatedAt": _now(), "certificateUrl": f"/api/v1/jobs/{job_id}/file"})
        job = {"jobId": job_id, "type": "CERTIFICATE_GENERATION", "status": "COMPLETED", "progress": 100, "certificateUrl": item["certificateUrl"], "fileKey": file_key}
    except (OSError, RuntimeError, ValueError) as exc:
        item.update({"status": "FAILED", "failureReason": str(exc)})
        job = {"jobId": job_id, "type": "CERTIFICATE_GENERATION", "status": "FAILED", "progress": None, "certificateUrl": None, "error": str(exc)}
    portal_state.setdefault("jobs", []).append(job)
    _save_state()
    _audit("CERTIFICATE_GENERATED", item["certificateId"], "SUCCESS" if item["status"] == "GENERATED" else "FAILED", item.get("failureReason", ""))
    return _response({"certificateId": item["certificateId"], "status": item["status"], "jobId": job_id})


@certificate_api.get("/jobs/<job_id>")
def job_status(job_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    job = next((j for j in portal_state.get("jobs", []) if j["jobId"] == job_id), None)
    return _response({key: value for key, value in job.items() if key != "fileKey"}) if job else _error("NOT_FOUND", "Job not found.", 404)


@certificate_api.get("/jobs/<job_id>/file")
def job_file(job_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    job = next((j for j in portal_state.get("jobs", []) if j["jobId"] == job_id), None)
    if not job or not job.get("fileKey"):
        return _error("NOT_FOUND", "Generated certificate is not available.", 404)
    stored = db.load_file(job["fileKey"])
    if not stored:
        return _error("NOT_FOUND", "Generated certificate is not available.", 404)
    return send_file(io.BytesIO(stored["data"]), as_attachment=True,
                     download_name=stored.get("filename") or "certificate.pdf",
                     mimetype=stored.get("content_type") or "application/pdf")


def _render_email_content(item):
    """Render the exact subject/body that will be sent and logged."""
    settings = portal_state["settings"]
    values = {
        "{{NAME}}": str(item.get("participantName") or ""),
        "{{EMAIL}}": str(item.get("participantEmail") or ""),
        "{{STUDENT_ID}}": str(item.get("participantStudentId") or ""),
        "{{ROLL_NO}}": str(item.get("participantRollNumber") or ""),
        "{{EVENT_NAME}}": str(item.get("eventName") or settings.get("eventName") or ""),
        "{{DATE}}": str(item.get("issueDate") or ""),
        "{{CERTIFICATE_ID}}": str(item.get("certificateId") or ""),
    }
    subject = str(settings.get("emailSubject") or "Your certificate")
    body = str(settings.get("emailBodyTemplate") or "Your certificate is attached.")
    for token, value in values.items():
        subject = subject.replace(token, value)
        body = body.replace(token, value)
    return subject, body


def _send_via_brevo(item, stored_certificate, subject, body):
    api_key = os.getenv("BREVO_API_KEY")
    if not api_key:
        return False
    if requests is None:
        raise RuntimeError("The 'requests' package is required for Brevo email delivery.")
    sender_email = os.getenv("BREVO_SENDER_EMAIL")
    if not sender_email:
        raise RuntimeError("BREVO_SENDER_EMAIL is not configured.")
    sender_name = os.getenv("BREVO_SENDER_NAME") or portal_state.get("settings", {}).get("senderName") or sender_email
    filename = stored_certificate.get("filename") or f"{item['certificateId']}.pdf"
    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": item["participantEmail"]}],
        "subject": subject,
        "textContent": body,
        "attachment": [{
            "content": base64.b64encode(stored_certificate["data"]).decode("ascii"),
            "name": filename,
        }],
    }
    reply_to = portal_state.get("settings", {}).get("replyToAddress")
    if reply_to:
        payload["replyTo"] = {"email": reply_to}
    response = requests.post(
        BREVO_SEND_URL,
        headers={"api-key": api_key, "Content-Type": "application/json", "Accept": "application/json"},
        json=payload,
        timeout=20,
    )
    if response.status_code >= 300:
        detail = response.text[:300]
        raise RuntimeError(f"Brevo API error ({response.status_code}): {detail}")
    return True


def _send_via_smtp(item, stored_certificate, subject, body):
    host, port = os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT", "587"))
    if not host or not os.getenv("SMTP_USERNAME") or not os.getenv("SMTP_PASSWORD"):
        return False
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = os.getenv("SMTP_FROM", os.getenv("SMTP_USERNAME"))
    message["To"] = item["participantEmail"]
    reply_to = os.getenv("SMTP_REPLY_TO") or portal_state.get("settings", {}).get("replyToAddress")
    if reply_to:
        message["Reply-To"] = reply_to
    message.set_content(body)
    attachment_content_type = stored_certificate.get("content_type") or "application/pdf"
    maintype, _, subtype = attachment_content_type.partition("/")
    message.add_attachment(
        stored_certificate["data"],
        maintype=maintype or "application",
        subtype=subtype or "pdf",
        filename=stored_certificate.get("filename") or f"{item['certificateId']}.pdf",
    )
    with smtplib.SMTP(host, port, timeout=20) as smtp:
        smtp.starttls()
        smtp.login(os.getenv("SMTP_USERNAME"), os.getenv("SMTP_PASSWORD"))
        smtp.send_message(message)
    return True


def _deliver_certificate_email(item, stored_certificate, subject, body):
    """Send the already-rendered email through the configured provider."""
    if _send_via_brevo(item, stored_certificate, subject, body):
        return
    if _send_via_smtp(item, stored_certificate, subject, body):
        return
    raise RuntimeError("Email delivery is not configured.")




@certificate_api.post("/certificates/<certificate_id>/send")
def send_certificate(certificate_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    item = _find_certificate(certificate_id)
    if not item or item["status"] not in ("GENERATED", "FAILED"):
        return _error("INVALID_STATE", "A generated certificate is required before sending.", 422)

    # A failed delivery can be retried using the same generated certificate.
    if item["status"] == "FAILED":
        item["status"] = "GENERATED"

    email_job_id = f"email_{uuid.uuid4().hex[:12]}"
    subject, body = _render_email_content(item)
    job = {
        "id": email_job_id,
        "jobId": email_job_id,
        "certificateId": item["certificateId"],
        "recipient": item["participantEmail"],
        "studentName": item.get("participantName", ""),
        "status": "PROCESSING",
        "createdAt": _now(),
        "sentAt": None,
        "attempts": 1,
        "subject": subject,
        "body": body,
        "attachmentFilename": None,
    }
    try:
        stored_certificate = db.load_file(f"certificate:{item['certificateId']}")
        if not stored_certificate:
            raise RuntimeError("Generated certificate file is not available to attach.")
        job["attachmentFilename"] = stored_certificate.get("filename") or f"{item['certificateId']}.pdf"
        _deliver_certificate_email(item, stored_certificate, subject, body)
        job.update({"status": "SENT", "sentAt": _now()})
        item.update({"status": "SENT", "sentAt": job["sentAt"], "emailDeliveryStatus": "SENT"})
        _audit("EMAIL_SENT", item["certificateId"])
    except (OSError, smtplib.SMTPException, RuntimeError) as exc:
        job.update({"status": "FAILED", "error": str(exc)})
        item.update({"status": "FAILED", "emailDeliveryStatus": "FAILED", "failureReason": str(exc)})
        _audit("EMAIL_FAILED", item["certificateId"], "FAILED", str(exc))

    portal_state["emailJobs"].append(job)
    _save_state()
    return _response({
        "certificateId": item["certificateId"],
        "status": item["status"],
        "emailJobId": email_job_id,
    })


@certificate_api.get("/email-jobs/<job_id>")
def email_job(job_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    job = next((j for j in portal_state["emailJobs"] if j["jobId"] == job_id), None)
    return _response(job) if job else _error("NOT_FOUND", "Email job not found.", 404)


@certificate_api.post("/email-jobs/<job_id>/retry")
def retry_email(job_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    job = next((j for j in portal_state["emailJobs"] if j["jobId"] == job_id), None)
    if not job:
        return _error("NOT_FOUND", "Email job not found.", 404)
    return send_certificate(job["certificateId"])


@certificate_api.get("/emails")
def email_logs():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    return _response(_paginate(portal_state["emailJobs"]))


@certificate_api.get("/dashboard/stats")
def dashboard_stats():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    certificates = portal_state["certificates"]
    return _response({
        "participants": len(portal_state["participants"]),
        "eligible": sum(p["eligibility"] == "ELIGIBLE" for p in portal_state["participants"]),
        "ineligible": sum(p["eligibility"] != "ELIGIBLE" for p in portal_state["participants"]),
        "pending": sum(c["status"] == "PENDING" for c in certificates),
        "approved": sum(c["status"] == "APPROVED" for c in certificates),
        "rejected": sum(c["status"] == "REJECTED" for c in certificates),
        "generated": sum(c["status"] == "GENERATED" for c in certificates),
        "sent": sum(c["status"] == "SENT" for c in certificates),
        "failed": sum(c["status"] == "FAILED" for c in certificates),
    })


@certificate_api.get("/audit")
def audit_logs():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    return _response(_paginate(portal_state["auditLogs"]))


@certificate_api.get("/settings")
def get_settings():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    return _response(portal_state["settings"])


@certificate_api.put("/settings")
def update_settings():
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    body = request.get_json(silent=True) or {}
    blocked = {"smtpPassword", "apiKey", "databasePassword", "privateKey"}
    portal_state["settings"].update({key: value for key, value in body.items() if key not in blocked})
    _save_state()
    _audit("SETTINGS_UPDATED", "system settings")
    return _response(portal_state["settings"])


@certificate_api.get("/certificates/<certificate_id>/download")
def certificate_download(certificate_id):
    if not _require_admin():
        return _error("UNAUTHORIZED", "Authentication required.", 401)
    item = _find_certificate(certificate_id)
    if not item or item.get("status") not in ("GENERATED", "SENT"):
        return _error("NOT_FOUND", "Generated certificate is not available.", 404)
    stored = db.load_file(f"certificate:{item['certificateId']}")
    if not stored:
        return _error("NOT_FOUND", "Generated certificate file is not available.", 404)
    return send_file(io.BytesIO(stored["data"]), as_attachment=True,
                     download_name=stored.get("filename") or f"{item['certificateId']}.pdf",
                     mimetype=stored.get("content_type") or "application/pdf")


@certificate_api.get("/public/certificates/<certificate_id>/file")
def public_certificate_file(certificate_id):
    item = _find_certificate(certificate_id)
    if not item or item.get("status") not in ("GENERATED", "SENT"):
        return _error("NOT_FOUND", "Certificate is not publicly available.", 404)
    stored = db.load_file(f"certificate:{item['certificateId']}")
    if not stored:
        return _error("NOT_FOUND", "Certificate file is not available.", 404)
    return send_file(
        io.BytesIO(stored["data"]),
        download_name=stored.get("filename") or f"{item['certificateId']}.pdf",
        mimetype=stored.get("content_type") or "application/pdf",
    )


@certificate_api.get("/public/certificates/<certificate_id>/verify")
def verify_certificate(certificate_id):
    item = _find_certificate(certificate_id)
    if not item or item["status"] not in ("GENERATED", "SENT"):
        return _response({"valid": False, "isValid": False, "status": "NOT_FOUND", "certificateId": certificate_id,
                          "name": "", "recipientName": "", "eventName": "", "organization": "", "issuedAt": "", "issueDate": ""})
    issued_at = item.get("generatedAt") or item.get("issueDate") or ""
    return _response({"valid": True, "isValid": True, "certificateId": item["certificateId"],
                      "name": item["participantName"], "recipientName": item["participantName"],
                      "eventName": item["eventName"], "organization": portal_state["settings"]["organizationName"],
                      "issuedAt": issued_at, "issueDate": item.get("issueDate") or issued_at, "status": "VALID"})
