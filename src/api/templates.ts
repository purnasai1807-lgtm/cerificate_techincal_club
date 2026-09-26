import { CertificateTemplate, TemplateFieldConfig } from '../types';
import { apiClient, ApiResponse } from './client';

export const templatesService = {
  getTemplates(): Promise<ApiResponse<CertificateTemplate[]>> {
    return apiClient('/templates');
  },

  getTemplateById(id: string): Promise<ApiResponse<CertificateTemplate>> {
    return apiClient(`/templates/${id}`);
  },

  async uploadTemplate(file: File, customName?: string): Promise<ApiResponse<CertificateTemplate>> {
    const formData = new FormData();
    formData.append('file', file);
    if (customName) formData.append('name', customName);
    return apiClient('/templates', { method: 'POST', body: formData });
  },

  setActiveTemplate(id: string) {
    return apiClient<{ templateId: string; active: boolean }>(`/templates/${id}/activate`, { method: 'POST' });
  },

  updateTemplateFields(templateId: string, fields: TemplateFieldConfig[]) {
    return apiClient<CertificateTemplate>(`/templates/${templateId}/fields`, {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    });
  },

  deleteTemplate(id: string) {
    return apiClient<boolean>(`/templates/${id}`, { method: 'DELETE' });
  },
};
