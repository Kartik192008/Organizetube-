import { useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import ErrorNotice from '@/components/ErrorNotice';
import LessonPlayer from '@/components/LessonPlayer';
import LessonProgressModal from '@/components/LessonProgressModal';
import ProgressBar from '@/components/ProgressBar';
import { completeLesson, reopenLesson, saveLessonProgress } from '@/lib/library';
import { lessonPercent, lessonStatusText } from '@/lib/lessonProgress';
import type { CourseRow, LessonRow } from '@/types/library';

type LessonWatchViewProps = {
  course: CourseRow;
  lessons: LessonRow[];
  lessonId: string;
  onSelectLesson: (lessonId: string) => void;
  onBack: () => void;
  onChanged: () => Promise<void>;
};

export default function LessonWatchView({
  course,
  lessons,
  lessonId,
  onSelectLesson,
  onBack,
  onChanged,
}: LessonWatchViewProps) {
  const lesson = lessons.find((item) => item.id === lessonId);
  const trackedWatched = useRef(lesson?.watched_seconds ?? 0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);

  if (!lesson) return null;

  const index = lessons.indexOf(lesson);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];

  const handlePlayerProgress = (durationSeconds: number, watchedSeconds: number, ended: boolean) => {
    saveQueue.current = saveQueue.current
      .then(async () => {
        const before = trackedWatched.current;
        const after = Math.max(before, watchedSeconds);
        if (!ended && after === before && durationSeconds === lesson.duration_seconds) return;
        trackedWatched.current = after;
        await saveLessonProgress({ ...lesson, watched_seconds: before }, durationSeconds, after);
        setSaveError(null);
        await onChanged();
      })
      .catch((err: unknown) => {
        setSaveError(err instanceof Error ? err.message : 'Could not save your progress.');
      });
  };

  const handleToggleFinished = async () => {
    setBusy(true);
    setSaveError(null);
    try {
      if (lesson.completed) await reopenLesson(lesson);
      else await completeLesson(lesson);
      await onChanged();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const handleManualProgress = async (durationSeconds: number, watchedSeconds: number) => {
    await saveLessonProgress(lesson, durationSeconds, watchedSeconds);
    trackedWatched.current = watchedSeconds;
    setProgressOpen(false);
    await onChanged();
  };

  return (
    <div className="animate-fade-up">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex max-w-full items-center gap-2 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-900"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        <span className="truncate">Back to {course.title}</span>
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="aspect-video w-full overflow-hidden border-2 border-primary-900">
            <LessonPlayer
              videoId={lesson.youtube_id}
              startSeconds={lesson.watched_seconds}
              onProgress={handlePlayerProgress}
            />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
              Lesson {index + 1} of {lessons.length}
            </p>
            <h1 className="text-3xl text-primary-900 sm:text-4xl">{lesson.title}</h1>
            <ProgressBar percent={lessonPercent(lesson)} size="lg" />
            <p className="text-sm font-semibold text-primary-500">{lessonStatusText(lesson)}</p>
          </div>

          {saveError && <ErrorNotice message={saveError} />}

          <div className="flex flex-wrap items-center gap-3 border-t-2 border-primary-900 pt-6">
            <button
              type="button"
              onClick={handleToggleFinished}
              disabled={busy}
              aria-pressed={lesson.completed}
              className={`flex h-11 items-center gap-2 border-2 px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${
                lesson.completed
                  ? 'border-accent-500 bg-accent-500 text-white hover:bg-accent-600'
                  : 'border-primary-900 text-primary-900 hover:bg-primary-900 hover:text-surface'
              }`}
            >
              <Check className="h-4 w-4" strokeWidth={3} />
              {lesson.completed ? 'Finished' : 'Mark as finished'}
            </button>
            <button
              type="button"
              onClick={() => setProgressOpen(true)}
              className="flex h-11 items-center gap-2 border-2 border-primary-900 px-4 text-sm font-semibold text-primary-900 transition-colors hover:bg-primary-900 hover:text-surface"
            >
              <Clock className="h-4 w-4" />
              Update progress
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => previous && onSelectLesson(previous.id)}
                disabled={!previous}
                aria-label="Previous lesson"
                className="flex h-11 w-11 items-center justify-center border-2 border-primary-900 text-primary-900 transition-colors hover:bg-primary-100 disabled:border-primary-200 disabled:text-primary-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => next && onSelectLesson(next.id)}
                disabled={!next}
                aria-label="Next lesson"
                className="flex h-11 w-11 items-center justify-center border-2 border-primary-900 text-primary-900 transition-colors hover:bg-primary-100 disabled:border-primary-200 disabled:text-primary-300"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-primary-500">Your progress saves automatically while you watch.</p>
        </div>

        <aside className="flex min-w-0 flex-col gap-3">
          <h2 className="text-2xl text-primary-900">Course lessons</h2>
          <ol className="max-h-[70vh] divide-y divide-primary-200 overflow-y-auto border-2 border-primary-900">
            {lessons.map((item, position) => {
              const active = item.id === lesson.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectLesson(item.id)}
                    aria-current={active ? 'true' : undefined}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      active ? 'bg-accent-50' : 'bg-surface hover:bg-primary-50'
                    }`}
                  >
                    <span className="w-6 shrink-0 font-display text-lg text-primary-400">
                      {position + 1}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${
                        active ? 'font-semibold text-primary-900' : 'text-primary-700'
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.completed ? (
                      <Check className="h-4 w-4 shrink-0 text-accent-600" strokeWidth={3} />
                    ) : (
                      <span className="shrink-0 text-xs font-semibold text-primary-500">
                        {lessonPercent(item)}%
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      {progressOpen && (
        <LessonProgressModal
          lesson={lesson}
          onSave={handleManualProgress}
          onClose={() => setProgressOpen(false)}
        />
      )}
    </div>
  );
}
