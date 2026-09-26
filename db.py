"""Postgres-backed storage for the certificate portal.

This replaces the previous JSON-on-disk state and uploaded template / generated
PDF files with a small Neon/Postgres schema. If no database connection string is
configured, the project falls back to the legacy local filesystem layout so the
application still works in development and local tests.
"""

from __future__ import annotations

import json
import os
import re
from contextlib import contextmanager
from pathlib import Path

try:
    import psycopg2
    import psycopg2.extras
except ModuleNotFoundError:  # pragma: no cover - local fallback for tests/dev
    psycopg2 = None
    psycopg2_extras = None

_ROOT = Path(__file__).resolve().parent
_FALLBACK_DIR = Path(os.getenv("CERTIFICATE_DATA_DIR", str(_ROOT / "data" / "certificate-portal")))
if not _FALLBACK_DIR.is_absolute():
    _FALLBACK_DIR = _ROOT / _FALLBACK_DIR
_FALLBACK_STATE_PATH = _FALLBACK_DIR / "state.json"
_FALLBACK_FILES_DIR = _FALLBACK_DIR / "files"
_FALLBACK_METADATA_PATH = _FALLBACK_DIR / "files.json"

_DDL = """
CREATE TABLE IF NOT EXISTS certificate_portal_state (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certificate_portal_files (
    key TEXT PRIMARY KEY,
    filename TEXT,
    content_type TEXT,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""

_STATE_KEY = "portal_state"
_initialized = False


def _dsn():
    for name in (
        "DATABASE_URL",
        "POSTGRES_URL",
        "POSTGRES_URL_NON_POOLING",
        "POSTGRES_PRISMA_URL",
        "NEON_DATABASE_URL",
    ):
        value = os.getenv(name)
        if value:
            return value
    return None


def _fallback_init():
    _FALLBACK_DIR.mkdir(parents=True, exist_ok=True)
    _FALLBACK_FILES_DIR.mkdir(parents=True, exist_ok=True)
    if not _FALLBACK_METADATA_PATH.exists():
        _FALLBACK_METADATA_PATH.write_text("{}", encoding="utf-8")


def _fallback_load_metadata():
    _fallback_init()
    try:
        raw = _FALLBACK_METADATA_PATH.read_text(encoding="utf-8")
        return json.loads(raw) if raw.strip() else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _fallback_write_metadata(metadata):
    _fallback_init()
    _FALLBACK_METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")


@contextmanager

def _connect():
    dsn = _dsn()
    if not dsn:
        raise RuntimeError("No Postgres connection string found.")
    conn = psycopg2.connect(dsn)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# NOTE: this guard is intentionally kept local so the API can continue working in
# local and test environments without a configured database.

def _use_postgres():
    dsn = _dsn()
    require_persistent = os.getenv("REQUIRE_PERSISTENT_STORAGE", "").strip().lower() in {"1", "true", "yes"}
    if require_persistent and not dsn:
        raise RuntimeError(
            "Persistent storage is required but DATABASE_URL is not configured. "
            "Configure a managed PostgreSQL DATABASE_URL before using the production portal."
        )
    if dsn and psycopg2 is None:
        raise RuntimeError("DATABASE_URL is configured but psycopg2 is not installed.")
    return dsn is not None


def init():
    """Create the tables if they do not exist yet."""
    global _initialized
    if _initialized or not _use_postgres():
        return
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(_DDL)
    _initialized = True


def load_state():
    """Return the saved state dict, or None if nothing has been saved yet."""
    if not _use_postgres():
        _fallback_init()
        if not _FALLBACK_STATE_PATH.exists():
            return None
        try:
            return json.loads(_FALLBACK_STATE_PATH.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None
    init()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT value FROM certificate_portal_state WHERE key = %s",
                (_STATE_KEY,),
            )
            row = cur.fetchone()
    return row[0] if row else None


def save_state(state):
    if not _use_postgres():
        _fallback_init()
        _FALLBACK_STATE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")
        return
    init()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO certificate_portal_state (key, value, updated_at)
                VALUES (%s, %s, now())
                ON CONFLICT (key) DO UPDATE
                    SET value = EXCLUDED.value, updated_at = now()
                """,
                (_STATE_KEY, psycopg2.extras.Json(state)),
            )


def save_file(key, filename, data, content_type=None):
    """Store (or replace) the bytes for ``key``."""
    if not _use_postgres():
        _fallback_init()
        metadata = _fallback_load_metadata()
        safe = re.sub(r"[^A-Za-z0-9_.-]", "_", str(key))
        target = _FALLBACK_FILES_DIR / f"{safe}.bin"
        target.write_bytes(data)
        metadata[str(key)] = {
            "filename": filename,
            "content_type": content_type,
            "path": target.name,
        }
        _fallback_write_metadata(metadata)
        return
    init()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO certificate_portal_files (key, filename, content_type, data, created_at)
                VALUES (%s, %s, %s, %s, now())
                ON CONFLICT (key) DO UPDATE
                    SET filename = EXCLUDED.filename,
                        content_type = EXCLUDED.content_type,
                        data = EXCLUDED.data,
                        created_at = now()
                """,
                (str(key), filename, content_type, psycopg2.Binary(data)),
            )


def load_file(key):
    """Return {"filename", "content_type", "data"} for ``key``, or None."""
    if not _use_postgres():
        _fallback_init()
        metadata = _fallback_load_metadata()
        record = metadata.get(str(key))
        if not record:
            return None
        path = _FALLBACK_FILES_DIR / record["path"]
        if not path.exists():
            return None
        return {
            "filename": record.get("filename"),
            "content_type": record.get("content_type"),
            "data": path.read_bytes(),
        }
    init()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT filename, content_type, data FROM certificate_portal_files WHERE key = %s",
                (str(key),),
            )
            row = cur.fetchone()
    if row is None:
        return None
    filename, content_type, data = row
    return {"filename": filename, "content_type": content_type, "data": bytes(data)}


def delete_file(key):
    if not _use_postgres():
        _fallback_init()
        metadata = _fallback_load_metadata()
        record = metadata.pop(str(key), None)
        if record:
            target = _FALLBACK_FILES_DIR / record.get("path", "")
            if target.exists():
                target.unlink()
        _fallback_write_metadata(metadata)
        return
    init()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM certificate_portal_files WHERE key = %s", (str(key),))


def healthcheck():
    """Check that the configured persistent database is reachable."""
    if not _use_postgres():
        return {"persistent": False, "database": "filesystem"}
    init()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
    return {"persistent": True, "database": "postgresql"}
