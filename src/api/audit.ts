import { AuditLog } from '../types';
import { apiClient, ApiResponse } from './client';

export const auditService = {
  async getAuditLogs(): Promise<ApiResponse<AuditLog[]>> {
    const response = await apiClient<{ items: AuditLog[] }>('/audit');
    return { ...response, data: response.data?.items || [] };
  },
};
