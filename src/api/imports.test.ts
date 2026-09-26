import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCsvTextToJob } from './imports';

test('parseCsvTextToJob uses uploaded CSV data instead of mock defaults', () => {
  const csvText = `Name,Email,Student ID,Roll Number,Entry Time,Exit Time
Ava Johnson,ava@example.com,STU-1001,20CS1001,09:05 AM,05:15 PM
Noah Lee,noah@example.com,STU-1002,20CS1002,,`;

  const job = parseCsvTextToJob(csvText, 'attendance.csv');

  assert.equal(job.filename, 'attendance.csv');
  assert.equal(job.totalRecords, 2);
  assert.equal(job.columns[0], 'Name');
  assert.equal(job.records[0].name, 'Ava Johnson');
  assert.equal(job.records[0].email, 'ava@example.com');
  assert.equal(job.records[1].eligibility, 'NOT_ELIGIBLE');
});
