import { useState, type FormEvent } from 'react';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import ErrorNotice from '@/components/ErrorNotice';
import Modal from '@/components/Modal';
import { importYoutubeLink } from '@/lib/importYoutube';
import { saveImportedCourse } from '@/lib/library';
import { pluralize } from '@/lib/format';
import type { ImportResult } from '@/types/library';

type AddCourseModalProps = {
  onClose: () => void;
  onSaved: () => void;
  userId: string | null;
};

const PREVIEW_LIMIT = 5;

export default function AddCourseModal({ onClose, onSaved, userId }: AddCourseModalProps) {
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<{ source: string; result: ImportResult } | null>(null);
  const [busy, setBusy] = useState<'finding' | 'saving' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFind = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const source = url.trim();
    if (!source) return;
    setBusy('finding');
    setError(null);
    try {
      const result = await importYoutubeLink(source);
      setPreview({ source, result });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setBusy('saving');
    setError(null);
    try {
      await saveImportedCourse(preview.source, preview.result, userId ?? '');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(null);
    }
  };

  return (
    <Modal title="Add a course" onClose={onClose}>
      {!preview ? (
        <form onSubmit={handleFind} className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed text-primary-600">
            Paste a YouTube video link or a playlist link. Organizer pulls in every video so you can
            study them in order and track your progress.
          </p>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              YouTube link
            </span>
            <input
              type="url"
              id="youtube-url"
              name="youtube-url"
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/playlist?list=..."
              disabled={busy !== null}
              className="h-12 border-2 border-primary-900 bg-surface px-4 text-base text-primary-900 placeholder:text-primary-400 focus:outline-none focus:ring-4 focus:ring-accent-200 disabled:opacity-60"
            />
          </label>
          {error && <ErrorNotice message={error} />}
          <button
            type="submit"
            disabled={busy !== null || !url.trim()}
            className="flex h-12 items-center justify-center gap-2 bg-accent-500 font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-primary-200 disabled:text-primary-500"
          >
            {busy === 'finding' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {busy === 'finding' ? 'Finding videos...' : 'Find videos'}
          </button>
        </form>
      ) : (
        <div className="flex animate-fade-up flex-col gap-5">
          <div className="flex gap-4">
            {preview.result.thumbnailUrl && (
              <img
                src={preview.result.thumbnailUrl}
                alt=""
                className="aspect-video w-40 shrink-0 border-2 border-primary-900 object-cover"
              />
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-accent-600">
                {preview.result.kind === 'playlist' ? 'Playlist' : 'Video'} found
              </span>
              <h3 className="text-2xl text-primary-900">{preview.result.title}</h3>
              <p className="text-sm text-primary-600">
                {pluralize(preview.result.lessons.length, 'video')} ready to study
              </p>
            </div>
          </div>

          <ol className="divide-y divide-primary-200 border-2 border-primary-900">
            {preview.result.lessons.slice(0, PREVIEW_LIMIT).map((lesson, index) => (
              <li key={lesson.youtubeId} className="flex gap-3 px-4 py-3 text-sm">
                <span className="w-6 font-display text-base text-primary-400">{index + 1}</span>
                <span className="truncate text-primary-900">{lesson.title}</span>
              </li>
            ))}
            {preview.result.lessons.length > PREVIEW_LIMIT && (
              <li className="px-4 py-3 text-sm text-primary-500">
                and {preview.result.lessons.length - PREVIEW_LIMIT} more
              </li>
            )}
          </ol>

          {error && <ErrorNotice message={error} />}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sticky bottom-0 bg-surface pt-4 -mx-6 px-6 -mb-6 pb-6 border-t border-primary-200">
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setError(null);
              }}
              disabled={busy !== null}
              className="flex h-12 items-center justify-center gap-2 border-2 border-primary-900 px-5 font-semibold text-primary-900 transition-colors hover:bg-primary-100 disabled:opacity-60"
            >
              <ArrowLeft className="h-4 w-4" />
              Use a different link
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy !== null}
              className="flex h-12 items-center justify-center gap-2 bg-accent-500 px-6 font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-60"
            >
              {busy === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy === 'saving' ? 'Saving...' : 'Save to Organizer'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
