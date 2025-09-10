export interface User {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  document_count: number;
  conversation_count: number;
}

export interface UseUsersParams {
  search: string;
  roleFilter: string;
  statusFilter: string;
  page: number;
  pageSize: number;
}
