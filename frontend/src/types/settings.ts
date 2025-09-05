export interface Preferences {
  theme: "light" | "dark";
  language: string;
  use_streaming: boolean;
  use_hybrid_search: boolean;
  use_rag_by_default: boolean;
  results_per_page: number;
  notifications_document_ready: boolean;
  notifications_email: boolean;
}

export const PREF_DEFAULTS: Preferences = {
  theme: "light",
  language: "en",
  use_streaming: true,
  use_hybrid_search: false,
  use_rag_by_default: false,
  results_per_page: 20,
  notifications_document_ready: true,
  notifications_email: true,
};

export interface Session {
  id: number;
  device_info?: string;
  ip_address?: string;
  last_used_at: string;
  is_active: boolean;
}

export interface AuditEntry {
  id: number;
  event: string;
  target?: string;
  ip_address?: string;
  created_at: string;
}
