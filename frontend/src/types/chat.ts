export interface SourceDetail {
  chunk_id: string;
  filename: string;
  page_number?: number;
  score: number;
  document_id?: number;
}

export interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  source_details?: SourceDetail[];
  prompt_tokens?: number;
  completion_tokens?: number;
  estimated_cost_usd?: number;
  feedback?: "up" | "down" | null;
  is_edited?: boolean;
}

export interface Conversation {
  id: number;
  title: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}
