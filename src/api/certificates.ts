import { Certificate, CertificateStatus } from '../types';
import { apiClient, ApiResponse } from './client';

export interface CertificateFilterOptions {
  status?: CertificateStatus | 'ALL';
  search?: string;
  templateId?: string;
  page?: number;
  limit?: number;
}

export interface BulkApproveResponse {
  total: number;
  approved: number;
  approvedCount: number;
  failed: number;
  results: { id: string; status: 'APPROVED' | 'FAILED'; reason?: string }[];
}

const query = (options: CertificateFilterOptions) => {
  const params = new URLSearchParams();
  Object.entries(options || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== 'ALL') params.set(key, String(value));
  });
  return params.toString();
};

export const certificatesService = {
  getCertificates(options: CertificateFilterOptions = {}) {
    return apiClient<{
      items: Certificate[];
      total: number;
      countsByStatus: Record<string, number>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/certificates?${query(options)}`);
  },

  getCertificateById(id: string): Promise<ApiResponse<Certificate>> {
    return apiClient(`/certificates/${id}`);
  },

  approveCertificate(id: string, comment?: string) {
    return apiClient<Certificate>(`/certificates/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment: comment || '' }),
    });
  },

  rejectCertificate(id: string, reason: string) {
    return apiClient<Certificate>(`/certificates/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  bulkApproveCertificates(certificateIds: string[]) {
    return apiClient<BulkApproveResponse>('/certificates/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ certificateIds }),
    });
  },

  retryCertificate(id: string) {
    return apiClient<Certificate>(`/certificates/${id}/generate`, { method: 'POST' });
  },

  generateCertificate(id: string) {
    return apiClient<Certificate>(`/certificates/${id}/generate`, { method: 'POST' });
  },

  sendCertificate(id: string) {
    return apiClient<Certificate>(`/certificates/${id}/send`, { method: 'POST' });
  },

  downloadBulkZip(certificateIds: string[]) {
    return apiClient<{ count: number; filename: string }>('/certificates/bulk-generate', {
      method: 'POST',
      body: JSON.stringify({ certificateIds }),
    });
  },

  approveAndDispatchByIdentifier(identifier: string, _overrideIneligibility = false) {
    return apiClient<{ participant: any; certificate: Certificate; sentToEmail: string }>(
      `/certificates/lookup/${encodeURIComponent(identifier)}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );
  },

  findByIdentifier(identifier: string, _email?: string) {
    return apiClient<{ participant: any; certificate: Certificate }>(
      `/certificates/lookup/${encodeURIComponent(identifier)}`,
    );
  },
};
