import {
  Folder as FolderIcon,
  MoreVertical,
  Pencil,
  Trash2,
  File as FileIcon,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  Loader2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Folder, FileItem } from "../types";
import { getDownloadUrl } from "../lib/api";
import {
  formatBytes,
  getFileExtension,
  isImageFile,
  isVideoFile,
  isAudioFile,
  isPdfFile,
  isTextFile,
} from "../lib/utils";

function getFileIcon(mime: string, className = "w-6 h-6") {
  if (isImageFile(mime)) return <ImageIcon className={className} />;
  if (isVideoFile(mime)) return <Film className={className} />;
  if (isAudioFile(mime)) return <Music className={className} />;
  if (isPdfFile(mime) || isTextFile(mime)) return <FileText className={className} />;
  return <FileIcon className={className} />;
}

interface GalleryGridProps {
  folders: Folder[];
  files: FileItem[];
  loading: boolean;
  viewMode: "grid" | "list";
  onFolderClick: (folder: Folder) => void;
  onFileClick: (index: number) => void;
  onRenameFolder: (folder: Folder, name: string) => void;
  onDeleteFolder: (folder: Folder) => void;
}

export default function GalleryGrid({
  folders,
  files,
  loading,
  viewMode,
  onFolderClick,
  onFileClick,
  onRenameFolder,
  onDeleteFolder,
}: GalleryGridProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleRenameSubmit(folder: Folder) {
    if (renameValue.trim()) {
      onRenameFolder(folder, renameValue.trim());
    }
    setRenaming(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="gallery-rise relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-cyan-100/60 blur-3xl" />
        <div className="relative mx-auto flex max-w-md flex-col items-center">
          <div className="soft-pulse mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-950 text-cyan-300 shadow-xl shadow-slate-900/20">
            <FolderIcon className="h-9 w-9" />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Ready when you are</p>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">Your gallery starts here</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">Drop photos, documents, videos, or audio into this space and keep everything beautifully organized.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-rise space-y-7">
      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Folders</h2>
            <span className="text-xs text-slate-400">{folders.length} {folders.length === 1 ? "folder" : "folders"}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]"
                onClick={() => onFolderClick(folder)}
              >
                <div className="flex min-h-[142px] flex-col items-center justify-center p-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-2 group-hover:bg-amber-100 transition">
                    <FolderIcon className="w-6 h-6 text-amber-500" />
                  </div>
                  {renaming === folder.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSubmit(folder);
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      onBlur={() => handleRenameSubmit(folder)}
                      autoFocus
                      className="w-full text-center text-sm font-medium text-gray-900 border border-gray-300 rounded px-1 py-0.5 outline-none focus:border-gray-900"
                    />
                  ) : (
                    <>
                      <p className="w-full truncate text-sm font-semibold text-slate-800">{folder.name}</p>
                      <p className="mt-1 text-[11px] font-mono text-slate-400">
                        {folder.file_count ?? 0} {folder.file_count === 1 ? "file" : "files"} · {formatBytes(folder.total_size_bytes ?? 0)}
                      </p>
                    </>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === folder.id ? null : folder.id);
                  }}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 flex items-center justify-center transition"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>

                {menuOpen === folder.id && (
                  <div
                    ref={menuRef}
                    className="absolute top-8 right-1.5 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[140px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setRenaming(folder.id);
                        setRenameValue(folder.name);
                        setMenuOpen(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        onDeleteFolder(folder);
                        setMenuOpen(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {files.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Recent Files</h2>
            <span className="text-xs text-slate-400">{files.length} {files.length === 1 ? "item" : "items"}</span>
          </div>
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "space-y-2"}>
            {files.map((file, i) => (
              <div
                key={file.id}
                onClick={() => onFileClick(i)}
                className={`${viewMode === "grid" ? "group relative overflow-hidden rounded-2xl" : "group flex items-center gap-4 rounded-2xl"} border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_16px_32px_rgba(15,23,42,0.10)] cursor-pointer`}
              >
                {/* Thumbnail / Preview */}
                <div className={`${viewMode === "grid" ? "relative aspect-square" : "relative h-16 w-16 shrink-0 rounded-xl"} overflow-hidden bg-slate-100/80 flex items-center justify-center`}>
                  {file.telegram_thumbnail_file_id ? (
                    <img
                      src={getDownloadUrl(file.telegram_thumbnail_file_id)}
                      alt={file.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : file.telegram_file_id && isImageFile(file.mime_type) ? (
                    <img
                      src={getDownloadUrl(file.telegram_file_id)}
                      alt={file.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-gray-500 transition">
                        {getFileIcon(file.mime_type, "w-6 h-6")}
                      </div>
                    </div>
                  )}

                  {/* Extension badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold backdrop-blur-sm">
                    {getFileExtension(file.name)}
                  </div>
                </div>

                {/* File info */}
                <div className={`${viewMode === "grid" ? "border-t border-slate-100 p-3" : "min-w-0 flex-1 p-3"}`}>
                  <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                  <p className="mt-1 font-mono text-xs text-slate-400">{formatBytes(file.size_bytes)} · {new Date(file.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
