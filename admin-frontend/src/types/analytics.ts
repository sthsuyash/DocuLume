export interface SystemStats {
  total_users: number;
  active_users: number;
  total_documents: number;
  total_conversations: number;
  total_messages: number;
  total_storage_bytes: number;
  avg_documents_per_user: number;
  avg_conversations_per_user: number;
}

export interface RecentActivity {
  id: number;
  type: 'user_registered' | 'document_uploaded' | 'conversation_started';
  user_email: string;
  description: string;
  created_at: string;
}

export interface TopUser {
  id: number;
  username: string;
  email: string;
  document_count: number;
  conversation_count: number;
}
