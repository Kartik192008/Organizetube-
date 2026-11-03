import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import ErrorNotice from '@/components/ErrorNotice';
import Modal from '@/components/Modal';
import { formatTimestamp, parseTimestamp } from '@/lib/timestamps';
import type { LessonRow } from '@/types/library';

type LessonProgressModalProps = {
  lesson: LessonRow;
  onSave: (durationSeconds: number, watchedSeconds: number) => Promise<void>;
  onClose: () => void;
};

export default function LessonProgressModal({ lesson, onSave, onClose }: LessonProgressModalProps) {
  const [watchedInput, setWatchedInput] = useState(formatTimestamp(lesson.watched_seconds));
  const [lengthInput, setLengthInput] = useState(
    lesson.duration_seconds !== null ? formatTimestamp(lesson.duration_seconds) : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watched = parseTimestamp(watchedInput);
  const length = parseTimestamp(lengthInput);
  const validationMessage =
    length === null || length <= 0
      ? 'Enter the full length of the video, for example 12:45.'
      : watched === null
        ? 'Enter the time you have reached, for example 4:30.'
        : watched > length
          ? 'The time you reached cannot be longer than the video.'
          : null;
  const isValid = validationMessage === null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || length === null || watched === null) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(length, watched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSaving(false);
    }
  };

  const percent = isValid && length ? Math.round(((watched ?? 0) / length) * 100) : 0;

  return (
    <Modal title="Update your progress" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <p className="text-sm leading-relaxed text-primary-600">
          Enter the point you have watched up to in{' '}
          <span className="font-semibold text-primary-900">{lesson.title}</span>. The bar shows how
          much is done and how much is left.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Watched up to
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={watchedInput}
              onChange={(event) => setWatchedInput(event.target.value)}
              placeholder="0:00"
              className="h-12 border-2 border-primary-900 px-4 font-display text-2xl text-primary-900 focus:outline-none focus:ring-4 focus:ring-accent-200"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Video length
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={lengthInput}
              onChange={(event) => setLengthInput(event.target.value)}
              placeholder="12:45"
              className="h-12 border-2 border-primary-900 px-4 font-display text-2xl text-primary-900 focus:outline-none focus:ring-4 focus:ring-accent-200"
            />
          </label>
        </div>

        <div className="flex flex-col gap-2 border-2 border-primary-200 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Preview
            </span>
            <span className="font-display text-2xl text-primary-900">{percent}%</span>
          </div>
          <div className="h-3 overflow-hidden bg-primary-100">
            <div
              className="h-full bg-accent-500 transition-[width] duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-sm text-primary-600">
            {isValid && length !== null && watched !== null
              ? `${formatTimestamp(length - watched)} left to finish`
              : validationMessage}
          </p>
        </div>

        {error && <ErrorNotice message={error} />}

        <button
          type="submit"
          disabled={!isValid || saving}
          className="flex h-12 items-center justify-center gap-2 bg-accent-500 font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-primary-200 disabled:text-primary-500"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save progress'}
        </button>
      </form>
    </Modal>
  );
}
