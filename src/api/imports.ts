import { ColumnMapping, ImportJob, Participant } from '../types';
import { apiClient, ApiResponse, getAuthToken } from './client';

const IMPORT_STORAGE_KEY = 'cf_pending_import_job';

export interface ImportUploadResponse {
  importId: string;
  filename: string;
  fileType: 'CSV' | 'PDF';
  status: 'UPLOADING' | 'UPLOADED' | 'PROCESSING';
}

export interface ImportValidationResponse {
  status: 'VALIDATED';
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  eligibleRecords: number;
  ineligibleRecords: number;
  errors: Array<{ row: number; codes: string[] }>;
}

export interface ImportConfirmResponse {
  importId: string;
  status: 'IMPORTED';
  participantsCreated: number;
  certificateRequestsCreated: number;
  totalImportedRows?: number;
  duplicatesSkipped?: number;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    if (char === '\n' || char === '\r') {
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsvRows(csvText: string): string[][] {
  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (char === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((value) => value !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((value) => value !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function normalizeTimestamp(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  return value;
}

export function parseCsvTextToJob(csvText: string, filename: string): ImportJob {
  const rows = parseCsvRows(csvText);
  if (rows.length === 0) {
    return {
      id: `import_${Date.now()}`,
      filename,
      fileType: filename.toLowerCase().endsWith('.pdf') ? 'pdf' : 'csv',
      fileSize: `${(csvText.length / 1024).toFixed(1)} KB`,
      uploadedAt: new Date().toISOString(),
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      duplicateRecords: 0,
      missingNames: 0,
      missingEmails: 0,
      missingIds: 0,
      missingRollNumbers: 0,
      missingCheckIn: 0,
      missingCheckOut: 0,
      status: 'VALIDATED',
      columns: [],
      records: [],
    };
  }

  const headers = rows[0].map((header) => header.trim());
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim() !== ''));

  const fieldLookup = (row: string[], fieldNames: string[]) => {
    for (const header of headers) {
      if (fieldNames.includes(normalizeHeader(header))) {
        const idx = headers.findIndex((h) => normalizeHeader(h) === normalizeHeader(header));
        return row[idx] ?? '';
      }
    }
    return '';
  };

  const records: Participant[] = dataRows.map((row, index) => {
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, row[headerIndex] ?? '']));
    const name = fieldLookup(row, ['name', 'studentname', 'participantname', 'fullname', 'student']);
    const email = fieldLookup(row, ['email', 'mailid', 'emailaddress']);
    const studentId = fieldLookup(row, ['studentid', 'studentidnumber', 'id', 'studentnumber']);
    const rollNumber = fieldLookup(row, ['rollno', 'rollnumber', 'rollno.', 'studentrollno']);
    const checkIn = normalizeTimestamp(fieldLookup(row, ['entrytime', 'checkin', 'checkintime', 'timein', 'login']));
    const checkOut = normalizeTimestamp(fieldLookup(row, ['exittime', 'checkout', 'checkouttime', 'timeout', 'logout']));

    const finalName = name || record['Name'] || record['Student Name'] || '';
    const finalEmail = email;
    const finalStudentId = studentId;
    const finalRollNumber = rollNumber;

    const eligibility = checkIn && checkOut ? 'ELIGIBLE' : 'NOT_ELIGIBLE';

    return {
      id: `participant_${Date.now()}_${index + 1}`,
      name: finalName,
      email: finalEmail,
      studentId: finalStudentId,
      rollNumber: finalRollNumber,
      checkIn: checkIn,
      checkOut: checkOut,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      eligibility,
      eligibilityReason: eligibility === 'ELIGIBLE' ? 'Both check-in and check-out timestamps present.' : 'Missing required attendance timestamp.',
      certificateStatus: eligibility === 'ELIGIBLE' ? 'PENDING' : 'REJECTED',
    };
  });

  const validRecords = records.filter((item) => item.eligibility === 'ELIGIBLE').length;
  const invalidRecords = records.length - validRecords;

  return {
    id: `import_${Date.now()}`,
    filename,
    fileType: filename.toLowerCase().endsWith('.pdf') ? 'pdf' : 'csv',
    fileSize: `${(csvText.length / 1024).toFixed(1)} KB`,
    uploadedAt: new Date().toISOString(),
    totalRecords: records.length,
    validRecords,
    invalidRecords,
    duplicateRecords: 0,
    missingNames: records.filter((item) => !item.name).length,
    missingEmails: records.filter((item) => !item.email || !item.email.includes('@')).length,
    missingIds: records.filter((item) => !item.studentId).length,
    missingRollNumbers: records.filter((item) => !item.rollNumber).length,
    missingCheckIn: records.filter((item) => !item.checkIn).length,
    missingCheckOut: records.filter((item) => !item.checkOut).length,
    status: 'VALIDATED',
    columns: headers,
    records,
    rawRows: dataRows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))),
  };
}

export function getStoredImportJob(): ImportJob | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(IMPORT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ImportJob;
  } catch {
    return null;
  }
}

export function saveStoredImportJob(job: ImportJob | null) {
  if (typeof window === 'undefined') return;

  if (!job) {
    sessionStorage.removeItem(IMPORT_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(IMPORT_STORAGE_KEY, JSON.stringify(job));
}

export const importsService = {
  async uploadAttendance(file: File): Promise<ApiResponse<ImportUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient<ImportUploadResponse>('/imports', {
      method: 'POST',
      body: formData,
    });
    if (response.success && response.data) {
      // Save the server-issued import id immediately. Preview loading must never
      // be allowed to prevent the import from being recoverable after navigation,
      // refresh, or a transient preview request failure.
      const baseJob: ImportJob = {
        id: response.data.importId,
        filename: response.data.filename,
        fileType: response.data.fileType.toLowerCase() === 'pdf' ? 'pdf' : 'csv',
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toISOString(),
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        duplicateRecords: 0,
        missingNames: 0,
        missingEmails: 0,
        missingIds: 0,
        missingRollNumbers: 0,
        missingCheckIn: 0,
        missingCheckOut: 0,
        status: 'UPLOADED',
        columns: [],
        rawRows: [],
        records: [],
      };
      saveStoredImportJob(baseJob);

      // Hydrate the preview when available, but keep the upload recoverable even
      // if this request is temporarily unavailable. The backend remains the
      // source of truth for the actual uploaded bytes and parsed rows.
      try {
        const preview = await this.getImportPreview(response.data.importId);
        if (preview.success && preview.data) {
          saveStoredImportJob({
            ...baseJob,
            columns: preview.data.columns,
            rawRows: preview.data.records,
            totalRecords: preview.data.records.length,
          });
        }
      } catch {
        // Intentionally ignore preview hydration errors here. The import id is
        // already persisted and the preview page will retry from the backend.
      }
    }
    return response;
  },

  async getImportHistory(): Promise<ApiResponse<ImportJob[]>> {
    const response = await apiClient<{ items: ImportJob[] }>('/imports');
    return { ...response, data: response.data?.items || [] };
  },

  async downloadImportFile(importId: string, filename: string): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(`/api/v1/imports/${encodeURIComponent(importId)}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error?.message || 'The saved upload could not be downloaded.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },

  async getImportStatus(importId: string): Promise<ApiResponse<ImportJob>> {
    const response = await apiClient<ImportJob>(`/imports/${importId}`);
    if (response.success && response.data) saveStoredImportJob(response.data);
    return response;
  },

  async getImportPreview(importId: string): Promise<ApiResponse<{ columns: string[]; records: Record<string, string>[] }>> {
    return apiClient(`/imports/${importId}/preview`);
  },

  async submitMapping(importId: string, mapping: Record<string, string>) {
    return apiClient<{ importId: string; status: string; mapping: Record<string, string> }>(
      `/imports/${importId}/mapping`,
      { method: 'POST', body: JSON.stringify({ mapping }) },
    );
  },

  async validateImport(importId: string, mapping: ColumnMapping[]): Promise<ApiResponse<ImportValidationResponse>> {
    const normalizedMapping = mapping.reduce<Record<string, string>>((acc, item) => {
      if (item.mappedField !== 'ignore') acc[item.mappedField] = item.detectedColumn;
      return acc;
    }, {});

    return apiClient<ImportValidationResponse>(`/imports/${importId}/validate`, {
      method: 'POST',
      body: JSON.stringify({ mapping: normalizedMapping }),
    });
  },

  async confirmImport(importId: string, importValidRecordsOnly = true): Promise<ApiResponse<ImportConfirmResponse>> {
    const response = await apiClient<ImportConfirmResponse>(`/imports/${importId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ importValidRecordsOnly }),
    });
    // Keep the server-issued import id available after confirmation so the
    // completed import can still be reopened/downloaded from history.
    if (response.success) {
      const existing = getStoredImportJob();
      if (existing) saveStoredImportJob({ ...existing, status: 'IMPORTED' });
    }
    return response;
  },

  analyzeFile(file: File | string, _onProgress?: (progress: number) => void) {
    if (typeof file === 'string') {
      const stored = getStoredImportJob();
      if (!stored) {
        return Promise.resolve({ success: false, data: null as unknown as ImportJob });
      }
      return Promise.resolve({ success: true, data: stored });
    }

    return this.uploadAttendance(file);
  },

  async commitImport(importId: string, importValidRecordsOnly = true): Promise<ApiResponse<ImportConfirmResponse>> {
    return this.confirmImport(importId, importValidRecordsOnly);
  },
};
