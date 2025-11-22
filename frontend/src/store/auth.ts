import { create } from 'zustand';
import { authApi } from '@/api/endpoints';
import type { UserResponse } from '@/api/types';

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  setAuth: (token: string, user: UserResponse, remember?: boolean) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  fetchUser: () => Promise<void>;
}

// Try to load from localStorage first, then sessionStorage
const getStoredToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const getStoredUser = (): UserResponse | null => {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStoredToken(),
  user: getStoredUser(),

  setAuth: (token: string, user: UserResponse, remember = false) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));

    // Clear from the other storage
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem('token');
    otherStorage.removeItem('user');

    set({ token, user });
  },

  clearAuth: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  isAuthenticated: () => {
    const state = get();
    return !!state.token && !!state.user;
  },

  fetchUser: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const user = await authApi.me(token);
      // Update user in both storages if exists
      if (localStorage.getItem('token')) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      if (sessionStorage.getItem('token')) {
        sessionStorage.setItem('user', JSON.stringify(user));
      }
      set({ user });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      get().clearAuth();
    }
  },
}));
