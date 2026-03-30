import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true, // Send httpOnly cookies automatically
});

// Response interceptor — handle 401 refresh via cookie
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token is sent automatically via httpOnly cookie
        const { data } = await axios.post<
          ApiResponse<{ accessToken: string; refreshToken: string }>
        >(`${API_URL}/auth/refresh`, {}, { withCredentials: true });

        if (data.success && data.data) {
          return api(originalRequest);
        }
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// Helper to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse | undefined;
    return data?.error?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
