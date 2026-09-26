import { EventItem, StudentRegistration, User, AnalyticsData, LoadBalancerMetrics, NotificationItem, EventQrInfo, VenueCheckInResult } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const TOKEN_KEY = 'synapse_jwt_token';
const USER_KEY = 'synapse_user_data';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) (headers as Record<string, string>)['Authorization'] = ['Bearer', token].join(' ');
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `HTTP ${response.status} ${response.statusText}`;
    try { const data = await response.json(); if (data.error) errorMsg = data.error; } catch {}
    throw new Error(errorMsg);
  }
  const contentType = response.headers.get('content-type');
  return contentType && contentType.includes('application/json') ? response.json() : response.text() as unknown as T;
}
export const api = {
  async login(usernameOrEmail: string, password: string) {
    const res = await apiFetch<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    authStorage.setToken(res.token);
    authStorage.setUser(res.user);
    return res;
  },

  async registerUser(data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    rollNumber?: string;
    year?: string;
    section?: string;
  }) {
    const res = await apiFetch<{ success: boolean; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    authStorage.setToken(res.token);
    authStorage.setUser(res.user);
    return res;
  },

  async logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore network errors on logout
    } finally {
      authStorage.clear();
    }
  },

  async getMe() {
    return apiFetch<{ user: User }>('/auth/me');
  },

  async getEvents(): Promise<EventItem[]> {
    return apiFetch<EventItem[]>('/events');
  },

  async getEvent(id: string): Promise<EventItem> {
    return apiFetch<EventItem>(`/events/${id}`);
  },

  async createEvent(eventData: Partial<EventItem>): Promise<{ success: boolean; message: string; event: EventItem }> {
    return apiFetch('/admin/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  async updateEvent(id: string, eventData: Partial<EventItem>): Promise<{ success: boolean; message: string; event: EventItem }> {
    return apiFetch(`/api/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  async deleteEvent(id: string): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/admin/events/${id}`, {
      method: 'DELETE',
    });
  },

  async registerForEvent(payload: {
    fullName: string;
    email: string;
    phone: string;
    rollNumber: string;
    year: string;
    section: string;
    eventId: string;
    ticketTier?: string;
    ticketPrice?: number;
    paymentId?: string;
    paymentStatus?: string;
    notes?: string;
  }): Promise<{ success: boolean; registration_id: string; registration: StudentRegistration }> {
    return apiFetch('/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMyRegistrations(): Promise<StudentRegistration[]> {
    return apiFetch<StudentRegistration[]>('/my-registrations');
  },

  async getNotifications(): Promise<NotificationItem[]> {
    return apiFetch<NotificationItem[]>('/notifications');
  },

  async getAdminStudents(params?: {
    search?: string;
    year?: string;
    section?: string;
    eventId?: string;
    sort?: string;
    attended?: string;
  }): Promise<{ total: number; students: StudentRegistration[] }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, v);
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiFetch(`/admin/students${qs}`);
  },

  async toggleCheckIn(studentId: string): Promise<{ success: boolean; attended: boolean; checkInTime?: string }> {
    return apiFetch(`/admin/students/${studentId}/checkin`, {
      method: 'PATCH',
    });
  },

  async deleteStudent(studentId: string): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/admin/students/${studentId}`, {
      method: 'DELETE',
    });
  },

  async getAdminAnalytics(): Promise<AnalyticsData> {
    return apiFetch<AnalyticsData>('/admin/analytics');
  },

  async broadcastNotification(payload: { title: string; message: string; type: 'reminder' | 'update' | 'announcement'; eventId?: string }) {
    return apiFetch('/admin/broadcast-notification', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getDownloadCsvUrl(): Promise<string> {
    const token = authStorage.getToken();
    const res = await fetch(`${API_BASE_URL}/admin/export`, { headers: { Authorization: ['Bearer', token || ''].join(' ') } });
    if (!res.ok) throw new Error('Failed to download CSV');
    return URL.createObjectURL(await res.blob());
  },

  async getLoadMetrics(): Promise<LoadBalancerMetrics> {
    return apiFetch<LoadBalancerMetrics>('/system/load-metrics');
  },
  async simulateLoad(concurrency = 2000): Promise<any> {
    return apiFetch('/system/simulate-load', { method: 'POST', body: JSON.stringify({ concurrency }) });
  },
  async triggerCelebration(payload: { eventId?: string; eventTitle?: string; message?: string }): Promise<{ success: boolean; celebration: any }> {
    return apiFetch<{ success: boolean; celebration: any }>('/celebration', { method: 'POST', body: JSON.stringify(payload) });
  },
  async getCurrentCelebration(): Promise<{ active: boolean; celebration: any | null; remainingMs?: number }> {
    return apiFetch<{ active: boolean; celebration: any | null; remainingMs?: number }>('/celebration/current');
  },
  async stopCelebration(): Promise<{ success: boolean; message?: string }> {
    return apiFetch<{ success: boolean; message?: string }>('/celebration', { method: 'DELETE' });
  },
  async getEventQrInfo(eventId: string): Promise<EventQrInfo> {
    return apiFetch<EventQrInfo>(`/events/${eventId}/qr-info`);
  },
  async refreshEventVenueToken(eventId: string): Promise<{ success: boolean; eventId: string; token: string; message?: string }> {
    return apiFetch<{ success: boolean; eventId: string; token: string; message?: string }>(`/events/${eventId}/refresh-token`, { method: 'POST' });
  },
  async venueCheckIn(eventId: string, identifier: string, token?: string): Promise<VenueCheckInResult> {
    return apiFetch<VenueCheckInResult>(`/events/${eventId}/venue-checkin`, {
      method: 'POST',
      body: JSON.stringify({ identifier, token }),
    });
  },
};
