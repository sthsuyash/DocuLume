import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

interface Admin {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_admin: boolean;
  is_superuser: boolean;
}

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Server sets httpOnly cookies automatically
        await apiClient.post('/auth/login', { email, password });

        // Fetch admin info (cookies sent automatically)
        const adminResponse = await apiClient.get('/auth/me');
        const admin = adminResponse.data;

        // Verify user is admin
        if (!admin.is_admin && !admin.is_superuser) {
          throw new Error('Access denied. Admin privileges required.');
        }

        set({
          token: 'cookie-based', // Token is in httpOnly cookie
          admin: admin,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        try {
          // Call backend to clear cookies
          await apiClient.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        }
        set({ admin: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        try {
          const response = await apiClient.get('/auth/me');
          const admin = response.data;

          // Verify user is admin
          if (!admin.is_admin && !admin.is_superuser) {
            set({ admin: null, token: null, isAuthenticated: false });
            return;
          }

          set({
            admin: admin,
            token: 'cookie-based',
            isAuthenticated: true,
          });
        } catch (error) {
          set({ admin: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
);
