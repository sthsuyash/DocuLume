export interface Admin {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_admin: boolean;
  is_superuser: boolean;
  is_active: boolean;
}

export interface AuthState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
