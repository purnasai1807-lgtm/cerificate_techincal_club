import { CertificateStatus, EligibilityStatus, Participant } from '../types';
import { apiClient, ApiResponse } from './client';
import { store } from './store';

export interface ParticipantFilterOptions {
  search?: string;
  eligibility?: EligibilityStatus | 'ALL';
  certificateStatus?: CertificateStatus | 'ALL';
  department?: string;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

function normalizeParticipantsResponse(payload: any): PaginatedResult<Participant> {
  const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
  const pagination = payload?.pagination ?? {};
  const total = Number(payload?.total ?? pagination.total ?? items.length ?? 0);
  const limit = Number(payload?.limit ?? pagination.limit ?? 15);
  const page = Number(payload?.page ?? pagination.page ?? 1);
  const totalPages = Number(payload?.totalPages ?? pagination.totalPages ?? (total > 0 ? Math.ceil(total / Math.max(limit, 1)) : 0));

  return {
    items,
    total,
    totalPages,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export const participantsService = {
  async getParticipants(options: ParticipantFilterOptions = {}): Promise<ApiResponse<PaginatedResult<Participant>>> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value === undefined || value === 'ALL') return;
      const queryKey = key === 'pageSize' ? 'limit' : key;
      params.set(queryKey, String(value));
    });

    const response = await apiClient(`/participants?${params.toString()}`);
    if (response?.success && response?.data) {
      return { ...response, data: normalizeParticipantsResponse(response.data) };
    }
    return response as ApiResponse<PaginatedResult<Participant>>;
  },


  async getAllParticipants(options: Omit<ParticipantFilterOptions, 'page' | 'limit' | 'pageSize'> = {}): Promise<Participant[]> {
    const first = await this.getParticipants({ ...options, page: 1, limit: 100 });
    if (!first.success || !first.data) throw new Error(first.error?.message || 'Failed to load participants.');
    const all = [...first.data.items];
    for (let page = 2; page <= first.data.totalPages; page += 1) {
      const res = await this.getParticipants({ ...options, page, limit: 100 });
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to load participants.');
      all.push(...res.data.items);
    }
    return all;
  },

  getParticipantById(id: string): Promise<ApiResponse<Participant>> {
    return apiClient(`/participants/${id}`);
  },

  async bulkDeleteParticipants(ids: string[]): Promise<ApiResponse<{ deleted: boolean; participantsDeleted: number; certificatesDeleted: number; emailLogsDeleted: number }>> {
    if (!ids.length) {
      return { success: false, data: { deleted: false, participantsDeleted: 0, certificatesDeleted: 0, emailLogsDeleted: 0 }, message: 'No participants selected.' };
    }
    return apiClient('/participants/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  async deleteAllParticipants(): Promise<ApiResponse<{ deleted: boolean; participantsDeleted: number; certificatesDeleted: number; emailLogsDeleted: number }>> {
    return apiClient('/participants/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ deleteAll: true }),
    });
  },

  async deleteParticipant(id: string): Promise<ApiResponse<{ deleted: boolean; participantId: string; certificatesDeleted: number }>> {
    return apiClient(`/participants/${id}`, { method: 'DELETE' });
  },
};
