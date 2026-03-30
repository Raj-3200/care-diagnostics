'use client';

import { create } from 'zustand';
import api, { getErrorMessage } from '@/lib/api';
import type { User, LoginRequest, LoginResponse, ApiResponse } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (credentials: LoginRequest) => {
    // httpOnly cookies are set by the server response automatically
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    if (data.success && data.data) {
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    }
  },

  logout: () => {
    // Call server to revoke token & clear cookies
    api.post('/auth/logout').catch(() => {});
    set({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/login';
  },

  loadUser: async () => {
    try {
      // Cookie is sent automatically with withCredentials: true
      const { data } = await api.get<ApiResponse<User>>('/auth/me');
      if (data.success && data.data) {
        set({ user: data.data, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
