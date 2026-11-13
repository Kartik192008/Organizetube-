export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  file_count?: number;
  total_size_bytes?: number;
}

export interface FileItem {
  id: string;
  folder_id: string | null;
  name: string;
  mime_type: string;
  size_bytes: number;
  telegram_message_id: number | null;
  telegram_chat_id: string | null;
  file_unique_id: string | null;
  telegram_file_id: string | null;
  telegram_thumbnail_file_id: string | null;
  created_at: string;
}

export interface AppSettings {
  configured: boolean;
  has_token: boolean;
  chat_id: string | null;
}

export interface UploadResponse {
  success: boolean;
  message_id: number;
  chat_id: string;
  file_id: string | null;
  file_unique_id: string | null;
  telegram_file_id: string | null;
  telegram_thumbnail_file_id: string | null;
}

export interface StorageStats {
  file_count: number;
  folder_count: number;
  total_size_bytes: number;
}
