const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;

export const API_BASE_URL = (viteEnv?.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  code: string;
  details?: Record<string, unknown>;
  status?: number;

  constructor(message: string, code = 'API_ERROR', status?: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('cf_auth_token');
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem('cf_auth_token', token);
  else localStorage.removeItem('cf_auth_token');
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

  try {
    const response = await fetch(endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    const data = await response.json().catch(() => null);
    if (response.status === 401) {
      setAuthToken(null);
      if (!window.location.pathname.includes('/login')) window.location.href = '/admin/login?session_expired=1';
    }
    if (!response.ok) {
      throw new ApiError(
        data?.error?.message || data?.message || `Request failed with status ${response.status}`,
        data?.error?.code || 'HTTP_ERROR',
        response.status,
        data?.error?.details,
      );
    }
    return data as ApiResponse<T>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Backend connection unavailable.', 'NETWORK_ERROR', 0);
  }
}
