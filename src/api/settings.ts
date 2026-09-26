import { SystemSettings } from '../types';
import { apiClient, ApiResponse } from './client';

export const settingsService = {
  getSettings(): Promise<ApiResponse<SystemSettings>> {
    return apiClient('/settings');
  },

  updateSettings(updated: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> {
    return apiClient('/settings', { method: 'PUT', body: JSON.stringify(updated) });
  },
};
