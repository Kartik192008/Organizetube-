import { EDGE_FUNCTION_URL, supabase } from "./supabase";
import type { AppSettings, UploadResponse, StorageStats, Folder, FileItem } from "../types";

function getAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    "X-Client-Info": "telegram-gallery",
  };
}

export async function getSettings(): Promise<AppSettings> {
  const res = await fetch(`${EDGE_FUNCTION_URL}?action=settings`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to get settings (${res.status})`);
  }
  return res.json();
}

export async function saveSettings(
  botToken: string,
  chatId: string
): Promise<{ success: boolean; chat_id: string | null }> {
  const res = await fetch(`${EDGE_FUNCTION_URL}/settings`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      telegram_bot_token: botToken,
      telegram_chat_id: chatId,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Failed to save settings (${res.status})`);
  }
  return data;
}

export async function uploadFileToTelegram(
  file: File
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${EDGE_FUNCTION_URL}/upload`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  return data;
}

export async function deleteFileFromTelegram(
  messageId: number
): Promise<void> {
  const res = await fetch(`${EDGE_FUNCTION_URL}/delete`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ message_id: messageId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Delete failed (${res.status})`);
  }
}

export async function forwardFileToTelegram(
  messageId: number,
  fromChatId?: string
): Promise<{ success: boolean; message_id: number; chat_id: string }> {
  const res = await fetch(`${EDGE_FUNCTION_URL}/forward`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ message_id: messageId, from_chat_id: fromChatId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Forward failed (${res.status})`);
  }
  return data;
}

export function getDownloadUrl(fileId: string): string {
  return `${EDGE_FUNCTION_URL}/download?file_id=${encodeURIComponent(fileId)}`;
}

export async function getStorageStats(): Promise<StorageStats> {
  const res = await fetch(`${EDGE_FUNCTION_URL}?action=stats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return { file_count: 0, folder_count: 0, total_size_bytes: 0 };
  }
  return res.json();
}

// ---- Folder operations (direct Supabase) ----

export async function fetchFolders(parentId: string | null): Promise<import("../types").Folder[]> {
  let query = supabase.from("folders").select("*").order("name");
  if (parentId) {
    query = query.eq("parent_id", parentId);
  } else {
    query = query.is("parent_id", null);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const folders = data || [];
  return Promise.all(folders.map(async (folder) => {
    const { data: folderFiles, error: fileError } = await supabase
      .from("files")
      .select("size_bytes")
      .eq("folder_id", folder.id);
    if (fileError) throw new Error(fileError.message);
    return {
      ...folder,
      file_count: folderFiles?.length ?? 0,
      total_size_bytes: (folderFiles || []).reduce((total, file) => total + Number(file.size_bytes || 0), 0),
    };
  }));
}

export async function createFolder(
  name: string,
  parentId: string | null
): Promise<import("../types").Folder> {
  const { data, error } = await supabase
    .from("folders")
    .insert({ name, parent_id: parentId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("folders")
    .update({ name })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- File operations (metadata in Supabase, binary in Telegram) ----

export async function fetchFiles(
  folderId: string | null
): Promise<import("../types").FileItem[]> {
  let query = supabase
    .from("files")
    .select("*")
    .order("created_at", { ascending: false });
  if (folderId) {
    query = query.eq("folder_id", folderId);
  } else {
    query = query.is("folder_id", null);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function insertFileMetadata(
  file: File,
  folderId: string | null,
  uploadResult: UploadResponse
): Promise<import("../types").FileItem> {
  const { data, error } = await supabase
    .from("files")
    .insert({
      folder_id: folderId,
      name: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      telegram_message_id: uploadResult.message_id,
      telegram_chat_id: uploadResult.chat_id,
      file_unique_id: uploadResult.file_unique_id,
      telegram_file_id: uploadResult.telegram_file_id,
      telegram_thumbnail_file_id: uploadResult.telegram_thumbnail_file_id,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteFileRecord(fileId: string): Promise<void> {
  const { error } = await supabase.from("files").delete().eq("id", fileId);
  if (error) throw new Error(error.message);
}

export async function fetchFolderPath(
  folderId: string | null
): Promise<import("../types").Folder[]> {
  if (!folderId) return [];
  const path: import("../types").Folder[] = [];
  let currentId: string | null = folderId;
  while (currentId) {
    const result = await supabase
      .from("folders")
      .select("*")
      .eq("id", currentId)
      .maybeSingle();
    if (result.error || !result.data) break;
    const folder: Folder = result.data;
    path.unshift(folder);
    currentId = folder.parent_id;
  }
  return path;
}
