export interface AdminDocument {
  id: number;
  filename: string;
  file_size: number;
  file_type: string;
  status: string;
  user_email: string;
  user_id: number;
  created_at: string;
  chunk_count?: number;
}

export interface UseDocumentsParams {
  search: string;
  statusFilter: string;
  typeFilter: string;
  page: number;
  pageSize: number;
}
