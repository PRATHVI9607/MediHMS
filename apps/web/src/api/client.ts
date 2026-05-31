import axios, { AxiosError } from 'axios';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/components/ui/Toaster';

export const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

// Attach JWT
api.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface ApiErrorShape {
  code: string;
  message: string;
  detail?: string;
}

// Normalize errors + auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ error?: ApiErrorShape }>) => {
    const status = error.response?.status;
    const apiError: ApiErrorShape = error.response?.data?.error ?? {
      code: 'NETWORK',
      message: error.message || 'Network error — is the API running?',
    };
    if (status === 401 && useAppStore.getState().token) {
      useAppStore.getState().logout();
      toast.error('Session expired. Please sign in again.');
    }
    return Promise.reject(apiError);
  }
);

// Helpers that unwrap the standard envelope
export async function getData<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get(url, { params });
  return res.data.data as T;
}

export async function getList<T>(url: string, params?: Record<string, unknown>) {
  const res = await api.get(url, { params });
  return { data: res.data.data as T[], meta: res.data.meta as { total: number; page: number; limit: number } };
}
