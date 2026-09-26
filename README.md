# CertificateFlow portal

This application imports real attendance data, calculates eligibility, configures certificate templates, generates personalized certificates, records email delivery, and exposes public verification.

## Run Locally

**Prerequisites:** Node.js and Python 3.10+

1. Install frontend dependencies: `npm install`.
2. Install Python dependencies: `py -3 -m pip install -r requirements.txt`.
3. Configure `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_FULL_NAME` privately. For production, also configure a managed PostgreSQL `DATABASE_URL`; production persistence is required and the server will not silently fall back to temporary local storage.
4. Start the API: `py -3 backend/app.py` (default `http://localhost:8000`).
5. Start the frontend in a second terminal: `npm run dev`.
6. For real certificate delivery, configure either `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` (and optionally `BREVO_SENDER_NAME`) to send via Brevo's HTTP API, or `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM` for plain SMTP. Brevo is tried first when configured; SMTP is the fallback.

The certificate API is under `/api/v1`. No demo username, password, participant, certificate, or email success state is rendered or committed.

## Verification

Run the backend workflow tests:

```powershell
py -m unittest discover -s tests -v
```

The tests use an isolated temporary data directory and do not modify production data.

## Public deployment

The repository includes `Dockerfile` and `render.yaml` for a single-service Render deployment. In Render, choose **New > Blueprint**, connect this repository, and create the service from `render.yaml`. Set the private `ADMIN_EMAIL`, `ADMIN_PASSWORD`, email-provider values, and a managed PostgreSQL `DATABASE_URL`. The production configuration requires persistent PostgreSQL storage so uploaded attendance files, templates, certificates, participants, and email logs survive restarts and redeploys. Render will provide the public HTTPS URL after the first successful deploy.
