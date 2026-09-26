import { EmailLog } from '../types';
import { apiClient, ApiResponse } from './client';

export interface EmailJobStatusResponse {
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'SENT' | 'FAILED';
  recipient: string;
  sentAt?: string;
}

export const emailsService = {
  async getEmailLogs(): Promise<ApiResponse<EmailLog[]>> {
    const response = await apiClient<{ items: EmailLog[] }>('/emails');
    return { ...response, data: response.data?.items || [] };
  },

  getEmailJobStatus(emailJobId: string): Promise<ApiResponse<EmailJobStatusResponse>> {
    return apiClient(`/email-jobs/${emailJobId}`);
  },

  retryEmail(emailJobId: string): Promise<ApiResponse<EmailLog>> {
    return apiClient(`/email-jobs/${emailJobId}/retry`, { method: 'POST' });
  },
};
