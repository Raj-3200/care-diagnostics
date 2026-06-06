import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

// Direct backend URL — works cross-domain because backend uses SameSite=None; Secure cookies
// NEXT_PUBLIC_BACKEND_URL is available in both browser and server (Next.js NEXT_PUBLIC_ prefix)
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${BACKEND}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true, // Required for cross-domain httpOnly cookies (SameSite=None)
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
        await axios.post(
          `${BACKEND}/api/v1/auth/refresh`,
          {},
          { withCredentials: true },
        );
        return api(originalRequest);
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
