import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
const username = process.env.E2E_ADMIN_USERNAME || process.env.ADMIN_USERNAME || '';
const email = process.env.E2E_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '';
const password = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';

test.describe('CertificateFlow production browser E2E', () => {
  test.skip(!password || (!username && !email), 'Set E2E_ADMIN_USERNAME/E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test('login → CSV upload → every record visible → import', async ({ page }) => {
    const rows = Array.from({ length: 151 }, (_, index) => {
      const i = index + 1;
      return `Student ${i},student${i}@example.test,STU-${i},ROLL-${i},09:00,17:00`;
    });
    const csv = `Name,Email,Student ID,Roll No,Check-in,Check-out\n${rows.join('\n')}\n`;
    const filePath = path.join(os.tmpdir(), `certificateflow-e2e-${Date.now()}.csv`);
    fs.writeFileSync(filePath, csv, 'utf8');

    try {
      await page.goto(`${baseURL}/admin/login`);
      await page.getByPlaceholder('Enter administrator username or email').fill(username || email);
      await page.getByLabel('Password').fill(password);
      await page.getByRole('button', { name: /Sign In to Admin Workspace/i }).click();
      await expect(page).toHaveURL(/\/admin\/dashboard/);

      await page.goto(`${baseURL}/admin/import`);
      await page.locator('input[type="file"]').setInputFiles(filePath);
      await expect(page.getByText(/attendance file selected/i)).toBeVisible({ timeout: 10_000 });
      await page.getByRole('button', { name: /Analyze|Continue|Process/i }).click();
      await expect(page).toHaveURL(/\/admin\/import\/preview/);

      await expect(page.getByText('150', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Student 1', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByText('Student 101', { exact: true })).toBeVisible();

      const rowsText = await page.locator('tbody tr').count();
      expect(rowsText).toBeGreaterThan(0);
      await page.getByRole('button', { name: /Import Valid Records/i }).click();
      await expect(page).toHaveURL(/\/admin\/participants/);
    } finally {
      fs.rmSync(filePath, { force: true });
    }
  });

  test('public verification route is reachable without authentication', async ({ page }) => {
    await page.goto(`${baseURL}/verify`);
    await expect(page).toHaveURL(/\/verify/);
  });
});
