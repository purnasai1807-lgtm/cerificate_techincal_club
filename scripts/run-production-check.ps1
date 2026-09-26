$ErrorActionPreference = 'Stop'

Write-Host '== CertificateFlow production verification ==' -ForegroundColor Cyan

py -3 scripts/verify_production.py
if ($LASTEXITCODE -ne 0) { throw 'Production environment verification failed.' }

Write-Host 'Running TypeScript check...' -ForegroundColor Cyan
npm run lint
if ($LASTEXITCODE -ne 0) { throw 'TypeScript check failed.' }

Write-Host 'Running production frontend build...' -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Production frontend build failed.' }

Write-Host 'Running backend workflow tests...' -ForegroundColor Cyan
py -3 -m unittest discover -s tests -v
if ($LASTEXITCODE -ne 0) { throw 'Backend E2E/API tests failed.' }

Write-Host 'Running browser E2E...' -ForegroundColor Cyan
npx playwright test
if ($LASTEXITCODE -ne 0) { throw 'Browser E2E failed.' }

Write-Host 'ALL PRODUCTION CHECKS PASSED' -ForegroundColor Green
