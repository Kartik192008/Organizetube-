import { useEffect, useState } from "react";
import {
  Loader2,
  X,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  File,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
import type { FileItem } from "../types";
import {
  getDownloadUrl,
  deleteFileFromTelegram,
  deleteFileRecord,
  forwardFileToTelegram,
} from "../lib/api";
import {
  formatBytes,
  formatDate,
  getFileExtension,
  isImageFile,
  isVideoFile,
  isAudioFile,
  isPdfFile,
  isTextFile,
} from "../lib/utils";

interface FilePreviewProps {
  files: FileItem[];
  initialIndex: number;
  onClose: () => void;
  onDeleted: (fileId: string) => void;
}

function getFileIcon(mime: string, className = "w-6 h-6") {
  if (isImageFile(mime)) return <ImageIcon className={className} />;
  if (isVideoFile(mime)) return <Film className={className} />;
  if (isAudioFile(mime)) return <Music className={className} />;
  if (isPdfFile(mime) || isTextFile(mime)) return <FileText className={className} />;
  return <File className={className} />;
}

export default function FilePreview({
  files,
  initialIndex,
  onClose,
  onDeleted,
}: FilePreviewProps) {
  const [index, setIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [forwarding, setForwarding] = useState(false);

  const file = files[index];

  useEffect(() => {
    setLoading(true);
    setTextContent(null);

    if (file && (isTextFile(file.mime_type) || isPdfFile(file.mime_type)) && file.telegram_file_id) {
      // For text files, fetch the content
      if (isTextFile(file.mime_type)) {
        fetch(getDownloadUrl(file.telegram_file_id))
          .then((r) => r.text())
          .then((text) => {
            setTextContent(text.slice(0, 50000));
            setLoading(false);
          })
          .catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else if (file && !isImageFile(file.mime_type) && !isVideoFile(file.mime_type)) {
      setLoading(false);
    }
  }, [file]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) setIndex(index - 1);
      if (e.key === "ArrowRight" && index < files.length - 1) setIndex(index + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, files.length, onClose]);

  if (!file) return null;

  function handleDelete() {
    if (!file) return;
    setDeleting(true);
    (async () => {
      try {
        if (file.telegram_message_id) {
          await deleteFileFromTelegram(file.telegram_message_id);
        }
        await deleteFileRecord(file.id);
        onDeleted(file.id);
        onClose();
      } catch (e) {
        console.error(e);
        setDeleting(false);
      }
    })();
  }

  async function handleForward() {
    if (!file || !file.telegram_message_id) return;
    setForwarding(true);
    try {
      await forwardFileToTelegram(file.telegram_message_id, file.telegram_chat_id || undefined);
    } catch (e) {
      console.error("Failed to forward to Telegram", e);
    } finally {
      setForwarding(false);
    }
  }

  const downloadUrl = file.telegram_file_id ? getDownloadUrl(file.telegram_file_id) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            {getFileIcon(file.mime_type, "w-5 h-5")}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-white/60">
              {formatBytes(file.size_bytes)} · {formatDate(file.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={file.name}
              className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
          )}
          <button
            onClick={handleForward}
            disabled={forwarding || !file.telegram_message_id}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition disabled:opacity-50 ${
              forwarding ? "bg-white/20" : "bg-white/10 hover:bg-white/20"
            }`}
            title="Forward to Telegram"
          >
            {forwarding ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Share2 className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition disabled:opacity-50"
            title="Delete"
          >
            {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div
        className="flex-1 flex items-center justify-center relative px-4 pb-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nav arrows */}
        {index > 0 && (
          <button
            onClick={() => setIndex(index - 1)}
            className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {index < files.length - 1 && (
          <button
            onClick={() => setIndex(index + 1)}
            className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* File display */}
        <div className="max-w-full max-h-full flex items-center justify-center">
          {isImageFile(file.mime_type) && file.telegram_file_id && (
            <>
              {loading && (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
                </div>
              )}
              <img
                src={getDownloadUrl(file.telegram_file_id)}
                alt={file.name}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
                style={{ display: loading ? "none" : "block" }}
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </>
          )}

          {isVideoFile(file.mime_type) && file.telegram_file_id && (
            <video
              src={getDownloadUrl(file.telegram_file_id)}
              controls
              className="max-w-full max-h-[75vh] rounded-lg"
              onLoadedData={() => setLoading(false)}
            />
          )}

          {isAudioFile(file.mime_type) && file.telegram_file_id && (
            <div className="flex flex-col items-center gap-6 text-white">
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                <Music className="w-10 h-10" />
              </div>
              <p className="text-lg font-medium">{file.name}</p>
              <audio
                src={getDownloadUrl(file.telegram_file_id)}
                controls
                autoPlay
                className="w-full max-w-md"
              />
            </div>
          )}

          {isPdfFile(file.mime_type) && file.telegram_file_id && (
            <iframe
              src={getDownloadUrl(file.telegram_file_id)}
              title={file.name}
              className="w-full max-w-4xl h-[75vh] rounded-lg bg-white"
            />
          )}

          {isTextFile(file.mime_type) && (
            <div className="w-full max-w-3xl max-h-[75vh] overflow-auto rounded-lg bg-white p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : (
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {textContent || "Empty file"}
                </pre>
              )}
            </div>
          )}

          {!isImageFile(file.mime_type) &&
            !isVideoFile(file.mime_type) &&
            !isAudioFile(file.mime_type) &&
            !isPdfFile(file.mime_type) &&
            !isTextFile(file.mime_type) && (
              <div className="flex flex-col items-center gap-4 text-white">
                <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center">
                  {getFileIcon(file.mime_type, "w-10 h-10")}
                </div>
                <p className="text-lg font-medium">{file.name}</p>
                <p className="text-sm text-white/60">
                  {getFileExtension(file.name)} · {formatBytes(file.size_bytes)}
                </p>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={file.name}
                    className="px-6 py-3 bg-white text-gray-900 rounded-xl font-medium hover:bg-white/90 transition flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download File
                  </a>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Thumbnail strip */}
      {files.length > 1 && (
        <div className="px-4 pb-4">
          <div className="flex gap-2 justify-center overflow-x-auto" onClick={(e) => e.stopPropagation()}>
            {files.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setIndex(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                  i === index ? "border-white" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                {f.telegram_thumbnail_file_id ? (
                  <img src={getDownloadUrl(f.telegram_thumbnail_file_id)} alt={f.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/60">
                    {getFileIcon(f.mime_type, "w-5 h-5")}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
