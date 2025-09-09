import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '@/types/auth';
import { loginApi, logoutApi, getMeApi } from '@/lib/api/auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const admin = await loginApi(email, password);
        if (!admin.is_admin && !admin.is_superuser) {
          throw new Error('Access denied. Admin privileges required.');
        }
        set({ admin, token: 'cookie-based', isAuthenticated: true });
      },

      logout: async () => {
        try {
          await logoutApi();
        } catch {
          // swallow — cookies cleared regardless
        }
        set({ admin: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        try {
          const admin = await getMeApi();
          if (!admin.is_admin && !admin.is_superuser) {
            set({ admin: null, token: null, isAuthenticated: false });
            return;
          }
          set({ admin, token: 'cookie-based', isAuthenticated: true });
        } catch {
          set({ admin: null, token: null, isAuthenticated: false });
        }
      },
    }),
    { name: 'admin-auth-storage' }
  )
);
