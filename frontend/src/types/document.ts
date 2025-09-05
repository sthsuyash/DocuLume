export interface Document {
  id: number;
  original_filename: string;
  file_size: number;
  file_type: string;
  status: string;
  page_count: number;
  chunk_count: number;
  created_at: string;
  tags?: string[];
  summary?: string;
  expires_at?: string;
}

export interface Collection {
  id: number;
  name: string;
  description?: string;
  document_count: number;
  document_ids: number[];
}

export interface Chunk {
  id: number;
  chunk_id: string;
  content: string;
  page_number?: number;
  chunk_index: number;
}

export interface ShareEntry {
  id: number;
  collection_id: number;
  shared_with_email: string;
  permission: string;
  accepted: boolean;
  created_at: string;
}
