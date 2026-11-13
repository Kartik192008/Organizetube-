import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  CloudUpload,
  FolderPlus,
  ChevronRight,
  Home,
  Settings,
  HardDrive,
  File,
  Folder as FolderIcon,
  Loader2,
  X,
  AlertCircle,
  Menu,
  Search,
  Grid2X2,
  List,
  ArrowUpDown,
  Command,
} from "lucide-react";
import type { Folder, FileItem, AppSettings, StorageStats } from "./types";
import {
  fetchFolders,
  fetchFiles,
  createFolder,
  renameFolder,
  deleteFolder,
  fetchFolderPath,
  uploadFileToTelegram,
  insertFileMetadata,
  deleteFileFromTelegram,
  deleteFileRecord,
  getSettings,
  getStorageStats,
} from "./lib/api";
import { formatBytes } from "./lib/utils";
import GalleryGrid from "./components/GalleryGrid";
import FilePreview from "./components/FilePreview";
import CreateFolderModal from "./components/CreateFolderModal";
import SettingsPanel from "./components/SettingsPanel";

export default function App() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortMode, setSortMode] = useState<"date" | "name" | "size">("date");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check settings on mount
  const checkSettings = useCallback(async () => {
    try {
      const s = await getSettings();
      setSettings(s);
      if (!s.configured) {
        setShowSettings(true);
      }
    } catch (e) {
      console.error("Failed to get settings", e);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const s = await getStorageStats();
      setStats(s);
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, fl, path] = await Promise.all([
        fetchFolders(currentFolderId),
        fetchFiles(currentFolderId),
        fetchFolderPath(currentFolderId),
      ]);
      setFolders(f);
      setFiles(fl);
      setBreadcrumbs(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  useEffect(() => {
    checkSettings();
  }, [checkSettings]);

  useEffect(() => {
    loadData();
    loadStats();
  }, [loadData, loadStats]);

  // ---- Navigation ----
  function navigateToFolder(folderId: string | null) {
    setCurrentFolderId(folderId);
    setSidebarOpen(false);
  }

  function navigateToBreadcrumb(index: number) {
    if (index < 0) {
      setCurrentFolderId(null);
    } else {
      setCurrentFolderId(breadcrumbs[index].id);
    }
  }

  // ---- Folder actions ----
  async function handleCreateFolder(name: string) {
    await createFolder(name, currentFolderId);
    await loadData();
    await loadStats();
  }

  async function handleRenameFolder(folder: Folder, name: string) {
    try {
      await renameFolder(folder.id, name);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to rename folder");
    }
  }

  async function handleDeleteFolder(folder: Folder) {
    if (!confirm(`Delete "${folder.name}" and all its contents? This cannot be undone.`)) return;
    try {
      // Delete all files in this folder from Telegram first
      const subFiles = await fetchFiles(folder.id);
      for (const f of subFiles) {
        if (f.telegram_message_id) {
          try {
            await deleteFileFromTelegram(f.telegram_message_id);
          } catch (e) {
            console.error("Failed to delete from Telegram", e);
          }
        }
        await deleteFileRecord(f.id);
      }
      await deleteFolder(folder.id);
      await loadData();
      await loadStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete folder");
    }
  }

  // ---- File upload ----
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (settings && !settings.configured) {
      setShowSettings(true);
      e.target.value = "";
      return;
    }

    setUploading(true);
    setError(null);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadProgress(
        `Uploading ${i + 1} of ${selectedFiles.length}: ${file.name}`
      );
      try {
        const uploadResult = await uploadFileToTelegram(file);
        await insertFileMetadata(file, currentFolderId, uploadResult);
      } catch (err) {
        setError(
          `Failed to upload "${file.name}": ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    setUploading(false);
    setUploadProgress("");
    e.target.value = "";
    await loadData();
    await loadStats();
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  // ---- Drag and drop ----
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    if (settings && !settings.configured) {
      setShowSettings(true);
      return;
    }

    setUploading(true);
    setError(null);

    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];
      setUploadProgress(`Uploading ${i + 1} of ${droppedFiles.length}: ${file.name}`);
      try {
        const uploadResult = await uploadFileToTelegram(file);
        await insertFileMetadata(file, currentFolderId, uploadResult);
      } catch (err) {
        setError(
          `Failed to upload "${file.name}": ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    setUploading(false);
    setUploadProgress("");
    await loadData();
    await loadStats();
  }

  // ---- File delete from preview ----
  async function handleFileDeleted(fileId: string) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    await loadStats();
  }

  // ---- Sidebar data ----
  const rootFolders = folders;
  const visibleFiles = useMemo(() => {
    const filtered = search.trim()
      ? files.filter((file) => file.name.toLowerCase().includes(search.trim().toLowerCase()))
      : files;
    return [...filtered].sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "size") return b.size_bytes - a.size_bytes;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [files, search, sortMode]);

  return (
    <div
      className="min-h-screen bg-transparent"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Upload overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-40 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="text-center text-white">
            <CloudUpload className="w-16 h-16 mx-auto mb-4 animate-bounce" />
            <p className="text-2xl font-bold">Drop files to upload</p>
            <p className="text-white/60 mt-1">They'll be stored in Telegram</p>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="fixed bottom-6 right-6 z-40 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 min-w-[300px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-gray-900 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Uploading...</p>
              <p className="text-xs text-gray-500 truncate">{uploadProgress}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 right-6 z-40 bg-white rounded-xl shadow-2xl border border-red-200 p-4 min-w-[300px] max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Something went wrong</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-zinc-100 border-r border-zinc-200 z-30 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/15">
              <CloudUpload className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Telegram Gallery</h1>
              <p className="text-[11px] text-slate-500">Unlimited file storage</p>
            </div>
          </div>
        </div>

        <div className="p-3">
          <button
            onClick={() => navigateToFolder(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              currentFolderId === null
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            <Home className="w-4 h-4" />
            All Files
          </button>

          {rootFolders.length > 0 && (
            <div className="mt-4">
              <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Folders
              </p>
              {rootFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => navigateToFolder(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    currentFolderId === folder.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                  }`}
                >
                  <FolderIcon className="w-4 h-4 text-amber-500" />
                  <span className="truncate text-left">{folder.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Storage stats */}
        {stats && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-slate-400">Storage Used</span>
            </div>
            <div className="mb-3 flex h-1.5 gap-1 overflow-hidden rounded-full bg-zinc-200"><span className="w-[52%] rounded-full bg-cyan-400" /><span className="w-[28%] rounded-full bg-teal-500" /><span className="w-[20%] rounded-full bg-amber-400" /></div>
            <p className="text-2xl font-bold text-slate-900 font-mono">{formatBytes(stats.total_size_bytes)}</p>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <File className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-slate-500">{stats.file_count} {stats.file_count === 1 ? "file" : "files"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FolderIcon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-slate-500">{stats.folder_count} {stats.folder_count === 1 ? "folder" : "folders"}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
              <button
                onClick={() => navigateToFolder(null)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition flex-shrink-0"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </button>
              {breadcrumbs.map((folder, i) => (
                <div key={folder.id} className="flex items-center gap-1 flex-shrink-0">
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                  <button
                    onClick={() => navigateToBreadcrumb(i)}
                    className={`px-2 py-1 rounded-lg text-sm transition truncate ${
                      i === breadcrumbs.length - 1
                        ? "font-semibold text-gray-900"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {folder.name}
                  </button>
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div title="Your Telegram bot is ready to receive files" className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Connected</div>
              <button
                onClick={() => setShowCreateFolder(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Folder</span>
              </button>
              <button
                onClick={handleUploadClick}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg sm:px-4"
              >
                <CloudUpload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-slate-950">My Photos</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-10 min-w-[220px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 shadow-sm focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-500/10">
                <Search className="h-4 w-4" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search files" className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
                <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:flex"><Command className="h-3 w-3" /> K</span>
              </label>
              <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <button aria-label="Grid view" onClick={() => setViewMode("grid")} className={`rounded-lg p-2 transition ${viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700"}`}><Grid2X2 className="h-4 w-4" /></button>
                <button aria-label="List view" onClick={() => setViewMode("list")} className={`rounded-lg p-2 transition ${viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700"}`}><List className="h-4 w-4" /></button>
              </div>
              <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm">
                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value as "date" | "name" | "size")} className="bg-transparent outline-none"><option value="date">Recent</option><option value="name">Name</option><option value="size">Size</option></select>
              </label>
            </div>
          </div>
          <GalleryGrid
            folders={folders}
            files={visibleFiles}
            viewMode={viewMode}
            loading={loading}
            onFolderClick={(f) => navigateToFolder(f.id)}
            onFileClick={(i) => setPreviewIndex(i)}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
          />
        </main>
      </div>

      {/* Modals */}
      {previewIndex !== null && files[previewIndex] && (
        <FilePreview
          files={files}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onDeleted={handleFileDeleted}
        />
      )}

      {showCreateFolder && (
        <CreateFolderModal
          onClose={() => setShowCreateFolder(false)}
          onCreate={handleCreateFolder}
        />
      )}

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onSaved={async () => {
            setShowSettings(false);
            await checkSettings();
            await loadData();
          }}
        />
      )}
    </div>
  );
}
