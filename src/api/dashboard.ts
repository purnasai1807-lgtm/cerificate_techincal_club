import { DashboardStats } from '../types';
import { apiClient, ApiResponse } from './client';

export const dashboardService = {
  getStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient('/dashboard/stats');
  },
};
