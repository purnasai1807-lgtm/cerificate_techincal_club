#!/usr/bin/env python3
"""Fail-fast production configuration verifier.

This script never prints secret values. It is safe to run in CI/Render/Vercel.
"""
import os
import sys
from urllib.parse import urlparse

REQUIRED = [
    "DATABASE_URL", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD",
    "ADMIN_FULL_NAME", "BREVO_API_KEY", "BREVO_SENDER_EMAIL", "BREVO_SENDER_NAME",
]


def nonempty(name):
    return bool((os.getenv(name) or "").strip())


def valid_email(value):
    return "@" in value and "." in value.rsplit("@", 1)[-1]


def main():
    errors = []
    warnings = []
    for name in REQUIRED:
        if not nonempty(name):
            errors.append(f"Missing required production variable: {name}")

    if os.getenv("REQUIRE_PERSISTENT_STORAGE", "").strip().lower() not in {"1", "true", "yes"}:
        errors.append("REQUIRE_PERSISTENT_STORAGE must be true in production.")

    if nonempty("DATABASE_URL"):
        scheme = urlparse(os.environ["DATABASE_URL"]).scheme
        if scheme not in {"postgres", "postgresql"}:
            errors.append("DATABASE_URL must be a PostgreSQL connection string.")

    if nonempty("ADMIN_EMAIL") and not valid_email(os.environ["ADMIN_EMAIL"].strip()):
        errors.append("ADMIN_EMAIL is not a valid email address.")
    if nonempty("BREVO_SENDER_EMAIL") and not valid_email(os.environ["BREVO_SENDER_EMAIL"].strip()):
        errors.append("BREVO_SENDER_EMAIL is not a valid email address.")

    jwt = os.getenv("JWT_SECRET", "")
    if jwt and len(jwt) < 32:
        warnings.append("JWT_SECRET is shorter than 32 characters; use a long random secret.")
    password = os.getenv("ADMIN_PASSWORD", "")
    if password and len(password) < 12:
        warnings.append("ADMIN_PASSWORD is shorter than 12 characters.")

    cors = os.getenv("CORS_ORIGIN", "")
    if not cors:
        warnings.append("CORS_ORIGIN is not set; configure the exact production frontend origin.")

    if errors:
        print("PRODUCTION CONFIG: FAIL")
        for item in errors:
            print(f"- {item}")
        for item in warnings:
            print(f"WARN: {item}")
        return 1

    print("PRODUCTION CONFIG: PASS")
    print("- PostgreSQL persistence configured")
    print("- Administrator credentials configured")
    print("- Brevo sender configuration present")
    print("- Persistent storage enforcement enabled")
    print("- Secrets were not printed")
    for item in warnings:
        print(f"WARN: {item}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
