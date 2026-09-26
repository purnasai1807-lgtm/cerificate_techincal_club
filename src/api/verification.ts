import { apiClient, ApiResponse, API_BASE_URL, getAuthToken } from './client';
import { store } from './store';

export interface VerifiedCertificateData {
  valid: boolean;
  isValid: boolean;
  status: 'VALID' | 'NOT_FOUND';
  certificateId: string;
  name: string;
  recipientName: string;
  eventName: string;
  organization: string;
  issuedAt: string;
  issueDate: string;
}

/**
 * Public Verification API (Section 31 & 45)
 * GET /public/certificates/:certificateId/verify
 */
export async function downloadVerifiedCertificate(certificateId: string) {
  const response = await fetch(`${API_BASE_URL}/public/certificates/${encodeURIComponent(certificateId.trim().toUpperCase())}/file`, {
    headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {},
  });
  if (!response.ok) throw new Error('The issued certificate PDF is not available.');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${certificateId.trim().toUpperCase()}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const verificationService = {
  async verifyCertificate(certificateId: string): Promise<ApiResponse<VerifiedCertificateData>> {
    const cleanId = certificateId.trim().toUpperCase();
    return apiClient<VerifiedCertificateData>(`/public/certificates/${encodeURIComponent(cleanId)}/verify`);
  },
};
