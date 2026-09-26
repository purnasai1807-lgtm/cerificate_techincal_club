import io
import json
import os
import tempfile
import unittest
from pathlib import Path

from reportlab.pdfgen import canvas


class CertificatePortalTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data_dir = tempfile.TemporaryDirectory()
        os.environ.update({
            "CERTIFICATE_DATA_DIR": cls.data_dir.name,
            "ADMIN_EMAIL": "admin@example.test",
            "ADMIN_PASSWORD": "test-password",
            "ADMIN_FULL_NAME": "Test Administrator",
            "JWT_SECRET": "test-secret",
            "SMTP_HOST": "",
            "SMTP_USERNAME": "",
            "SMTP_PASSWORD": "",
        })
        from backend.app import app

        cls.client = app.test_client()

    def setUp(self):
        import backend.certificate_api as cert_api
        cert_api.portal_state = cert_api._default_state()
        cert_api._save_state()

    @classmethod
    def tearDownClass(cls):
        cls.data_dir.cleanup()

    def api_data(self, response, expected_status=200):
        self.assertEqual(response.status_code, expected_status, response.get_json())
        payload = response.get_json()
        self.assertTrue(payload["success"], payload)
        return payload.get("data")

    def login(self):
        data = self.api_data(self.client.post(
            "/api/v1/auth/login",
            json={"email": "admin@example.test", "password": "test-password"},
        ))
        return {"Authorization": f"Bearer {data['accessToken']}"}

    @staticmethod
    def template_pdf():
        output = io.BytesIO()
        document = canvas.Canvas(output, pagesize=(842, 595))
        document.drawString(20, 570, "Certificate template")
        document.save()
        output.seek(0)
        return output

    def test_health_reports_ready_configuration_without_secrets(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200, response.get_json())
        payload = response.get_json()
        self.assertTrue(payload["ready"])
        self.assertIn("checks", payload)
        self.assertNotIn("password", json.dumps(payload).lower())

    def test_unauthenticated_private_routes_are_rejected(self):
        response = self.client.get("/api/v1/dashboard/stats")
        self.assertEqual(response.status_code, 401)
        response = self.client.get("/api/v1/templates/template-missing")
        self.assertEqual(response.status_code, 401)

    def test_import_generate_verify_and_record_email_failure(self):
        headers = self.login()
        self.api_data(self.client.put(
            "/api/v1/settings",
            headers=headers,
            json={
                "eventName": "Test Event",
                "organizationName": "Test Organization",
                "issueDate": "2026-09-25",
            },
        ))

        template = self.api_data(self.client.post(
            "/api/v1/templates",
            headers=headers,
            data={
                "name": "Test Template",
                "file": (self.template_pdf(), "template.pdf"),
            },
            content_type="multipart/form-data",
        ), expected_status=201)
        template_id = template["id"]
        configured_fields = [{
            "key": "NAME",
            "xPercent": 50,
            "yPercent": 50,
            "fontSize": 24,
            "fontFamily": "Cinzel",
            "fontStyle": "bold",
            "color": "#123456",
            "textAlign": "center",
            "visible": True,
        }]
        self.api_data(self.client.put(
            f"/api/v1/templates/{template_id}/fields",
            headers=headers,
            json={"fields": configured_fields},
        ))
        saved_template = self.api_data(self.client.get(
            f"/api/v1/templates/{template_id}", headers=headers
        ))
        self.assertEqual(saved_template["fields"], configured_fields)

        attendance = (
            b"Name,Email,Student ID,Roll No,Check-in,Check-out\n"
            b"Ada Lovelace,ada@example.test,STU-1,ROLL-1,09:00,17:00\n"
        )
        imported = self.api_data(self.client.post(
            "/api/v1/imports",
            headers=headers,
            data={"file": (io.BytesIO(attendance), "attendance.csv")},
            content_type="multipart/form-data",
        ), expected_status=201)
        import_id = imported["importId"]
        validation = self.api_data(self.client.post(
            f"/api/v1/imports/{import_id}/validate",
            headers=headers,
            json={},
        ))
        self.assertEqual(validation["eligibleRecords"], 1)
        confirmed = self.api_data(self.client.post(
            f"/api/v1/imports/{import_id}/confirm",
            headers=headers,
            json={},
        ))
        self.assertEqual(confirmed["certificateRequestsCreated"], 1)

        certificate = self.api_data(self.client.get(
            "/api/v1/certificates", headers=headers
        ))["items"][0]
        certificate_id = certificate["id"]
        self.api_data(self.client.post(
            f"/api/v1/certificates/{certificate_id}/approve",
            headers=headers,
            json={"comment": "approved"},
        ))
        generated = self.api_data(self.client.post(
            f"/api/v1/certificates/{certificate_id}/generate",
            headers=headers,
        ))
        self.assertEqual(generated["status"], "GENERATED")
        generated_file = self.client.get(
            f"/api/v1/jobs/{generated['jobId']}/file", headers=headers
        )
        self.assertEqual(generated_file.status_code, 200)
        generated_file.close()

        verification = self.api_data(self.client.get(
            f"/api/v1/public/certificates/{certificate['certificateId']}/verify"
        ))
        self.assertTrue(verification["valid"])
        self.assertEqual(verification["name"], "Ada Lovelace")

        delivery = self.api_data(self.client.post(
            f"/api/v1/certificates/{certificate_id}/send",
            headers=headers,
        ))
        self.assertEqual(delivery["status"], "FAILED")
        logs = self.api_data(self.client.get("/api/v1/emails", headers=headers))
        self.assertEqual(logs["items"][0]["status"], "FAILED")

    def test_participants_endpoint_returns_paginated_payload(self):
        headers = self.login()
        attendance = (
            b"Name,Email,Student ID,Roll No,Check-in,Check-out\n"
            b"Alan Turing,alan@example.test,STU-77,ROLL-77,09:00,17:00\n"
        )
        imported = self.api_data(self.client.post(
            "/api/v1/imports",
            headers=headers,
            data={"file": (io.BytesIO(attendance), "attendance.csv")},
            content_type="multipart/form-data",
        ), expected_status=201)
        import_id = imported["importId"]
        self.api_data(self.client.post(
            f"/api/v1/imports/{import_id}/validate",
            headers=headers,
            json={},
        ))
        self.api_data(self.client.post(
            f"/api/v1/imports/{import_id}/confirm",
            headers=headers,
            json={},
        ))

        participants = self.api_data(self.client.get(
            "/api/v1/participants",
            headers=headers,
        ))
        self.assertIn("total", participants)
        self.assertTrue(any(p["rollNumber"] == "ROLL-77" for p in participants["items"]))

    def test_confirm_import_auto_validates_pending_job(self):
        headers = self.login()
        attendance = (
            b"Name,Email,Student ID,Roll No,Check-in,Check-out\n"
            b"Grace Hopper,grace@example.test,STU-42,ROLL-42,09:00,17:00\n"
        )
        imported = self.api_data(self.client.post(
            "/api/v1/imports",
            headers=headers,
            data={"file": (io.BytesIO(attendance), "attendance.csv")},
            content_type="multipart/form-data",
        ), expected_status=201)
        import_id = imported["importId"]

        confirmed = self.api_data(self.client.post(
            f"/api/v1/imports/{import_id}/confirm",
            headers=headers,
            json={},
        ))
        self.assertEqual(confirmed["participantsCreated"], 1)

        participants = self.api_data(self.client.get(
            "/api/v1/participants",
            headers=headers,
        ))
        self.assertTrue(any(p["rollNumber"] == "ROLL-42" for p in participants["items"]))

    def test_lookup_and_approve_by_participant_identifier(self):
        headers = self.login()
        self.api_data(self.client.put(
            "/api/v1/settings",
            headers=headers,
            json={
                "eventName": "Test Event",
                "organizationName": "Test Organization",
                "issueDate": "2026-09-25",
            },
        ))

        attendance = (
            b"Name,Email,Student ID,Roll No,Check-in,Check-out\n"
            b"Grace Hopper,grace@example.test,STU-42,ROLL-42,09:00,17:00\n"
        )
        imported = self.api_data(self.client.post(
            "/api/v1/imports",
            headers=headers,
            data={"file": (io.BytesIO(attendance), "attendance.csv")},
            content_type="multipart/form-data",
        ), expected_status=201)
        import_id = imported["importId"]
        self.api_data(self.client.post(
            f"/api/v1/imports/{import_id}/validate",
            headers=headers,
            json={},
        ))
        self.api_data(self.client.post(
            f"/api/v1/imports/{import_id}/confirm",
            headers=headers,
            json={},
        ))

        lookup = self.api_data(self.client.get(
            "/api/v1/certificates/ROLL-42",
            headers=headers,
        ))
        self.assertEqual(lookup["participant"]["rollNumber"], "ROLL-42")
        self.assertEqual(lookup["status"], "PENDING")

        approved = self.api_data(self.client.post(
            "/api/v1/certificates/ROLL-42/approve",
            headers=headers,
            json={"comment": "looks good"},
        ))
        self.assertEqual(approved["status"], "APPROVED")
        self.assertEqual(approved["participantRollNumber"], "ROLL-42")

    def test_large_csv_preview_keeps_every_record_and_original_file(self):
        headers = b"Name,Email,Student ID,Roll No,Check-in,Check-out\n"
        rows = b"".join(
            f"Student {i},student{i}@example.test,STU-{i},ROLL-{i},09:00,17:00\n".encode()
            for i in range(1, 151)
        )
        response = self.client.post(
            "/api/v1/imports",
            headers=self.login(),
            data={"file": (io.BytesIO(headers + rows), "large-attendance.csv")},
            content_type="multipart/form-data",
        )
        imported = self.api_data(response, expected_status=201)
        import_id = imported["importId"]
        preview = self.api_data(self.client.get(f"/api/v1/imports/{import_id}/preview", headers=self.login()))
        self.assertEqual(len(preview["records"]), 150)
        self.assertEqual(preview["records"][0]["Name"], "Student 1")
        self.assertEqual(preview["records"][-1]["Name"], "Student 150")
        original = self.client.get(f"/api/v1/imports/{import_id}/file", headers=self.login())
        self.assertEqual(original.status_code, 200)
        self.assertEqual(original.data, headers + rows)

    def test_email_subject_and_rendered_body_are_persisted_on_failure(self):
        headers = self.login()
        self.api_data(self.client.put("/api/v1/settings", headers=headers, json={
            "eventName": "Real Event",
            "organizationName": "Real Organization",
            "issueDate": "2026-09-26",
            "emailSubject": "Certificate for {{NAME}}",
            "emailBodyTemplate": "Hello {{NAME}},\nYour certificate is {{CERTIFICATE_ID}} for {{EVENT_NAME}}.",
        }))
        attendance = b"Name,Email,Student ID,Roll No,Check-in,Check-out\nReal Student,student@example.test,STU-1,ROLL-1,09:00,17:00\n"
        imported = self.api_data(self.client.post("/api/v1/imports", headers=headers, data={"file": (io.BytesIO(attendance), "attendance.csv")}, content_type="multipart/form-data"), expected_status=201)
        import_id = imported["importId"]
        self.api_data(self.client.post(f"/api/v1/imports/{import_id}/validate", headers=headers, json={}))
        self.api_data(self.client.post(f"/api/v1/imports/{import_id}/confirm", headers=headers, json={}))
        cert = self.api_data(self.client.get("/api/v1/certificates", headers=headers))["items"][0]
        self.api_data(self.client.post(f"/api/v1/certificates/{cert['id']}/approve", headers=headers, json={}))
        self.api_data(self.client.post(f"/api/v1/certificates/{cert['id']}/generate", headers=headers))
        self.client.post(f"/api/v1/certificates/{cert['id']}/send", headers=headers)
        logs = self.api_data(self.client.get("/api/v1/emails", headers=headers))
        self.assertEqual(logs["items"][0]["subject"], "Certificate for Real Student")
        self.assertIn(cert["certificateId"], logs["items"][0]["body"])
        self.assertIn("Real Event", logs["items"][0]["body"])


if __name__ == "__main__":
    unittest.main()
