import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_admin?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  oauthLogin: (provider: string, code: string, redirectUri: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Server sets httpOnly cookies automatically
        await apiClient.post('/auth/login', { email, password });

        // Fetch user info (cookies sent automatically)
        const userResponse = await apiClient.get('/auth/me');
        set({
          token: 'cookie-based', // Token is in httpOnly cookie, not accessible
          user: userResponse.data,
          isAuthenticated: true,
        });
      },

      oauthLogin: async (provider: string, code: string, redirectUri: string) => {
        // Server sets httpOnly cookies automatically
        await apiClient.post(
          `/auth/oauth/${provider}/callback`,
          null,
          {
            params: {
              code,
              redirect_uri: redirectUri,
            },
          }
        );

        // Fetch user info (cookies sent automatically)
        const userResponse = await apiClient.get('/auth/me');
        set({
          token: 'cookie-based',
          user: userResponse.data,
          isAuthenticated: true,
        });
      },

      register: async (data: RegisterData) => {
        await apiClient.post('/auth/register', data);
      },

      logout: async () => {
        try {
          // Call backend to clear cookies
          await apiClient.post('/auth/logout');
        } catch (error) {
          // Even if logout fails, clear local state
          console.error('Logout error:', error);
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      setToken: (token: string) => {
        // Tokens are in httpOnly cookies, this is for backward compatibility
        set({ token: 'cookie-based', isAuthenticated: true });
      },

      checkAuth: async () => {
        try {
          // Try to fetch user info (cookies sent automatically)
          const userResponse = await apiClient.get('/auth/me');
          set({
            token: 'cookie-based',
            user: userResponse.data,
            isAuthenticated: true,
          });
        } catch (error) {
          // If auth check fails, clear auth state
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
