# Production verification checklist

## Required environment

Production must have:

- `DATABASE_URL` pointing to Neon/PostgreSQL
- `REQUIRE_PERSISTENT_STORAGE=true`
- `JWT_SECRET` (long random secret)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_FULL_NAME`
- `ADMIN_EMAIL`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `CORS_ORIGIN` containing the exact deployed frontend origin

Run:

```powershell
py -3 scripts/verify_production.py
```

The command never prints secret values.

## Frontend production build

```powershell
npm ci
npm run lint
npm run build
```

The build must finish without TypeScript or Vite errors and produce `dist/`.

## Browser E2E

Install the browser test runner once:

```powershell
npx playwright install chromium
```

For a deployed environment:

```powershell
$env:E2E_BASE_URL="https://certificateflow-portal.vercel.app"
$env:E2E_ADMIN_USERNAME="your-admin-username"
$env:E2E_ADMIN_EMAIL="your-admin-email"
$env:E2E_ADMIN_PASSWORD="your-admin-password"
npx playwright test
```

The browser suite verifies:

1. administrator login
2. real CSV upload
3. 150-record parsing
4. first-page visibility
5. next-page visibility
6. import confirmation
7. participant page navigation
8. public verification route

Do not point this test at production if you do not want test participants created in the production database. Prefer a separate Preview database for E2E.

## Email E2E

Do not run real certificate email tests against production recipients. Use a dedicated Brevo sender/test database or a mail-capture environment. The backend unit/integration suite verifies rendered email subject/body persistence without requiring an external mail delivery.
