import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Trash2 } from 'lucide-react';
import ErrorNotice from '@/components/ErrorNotice';
import ProgressBar from '@/components/ProgressBar';
import { completeLesson, deleteCourse, reopenLesson } from '@/lib/library';
import { pluralize } from '@/lib/format';
import { lessonPercent, lessonStatusText } from '@/lib/lessonProgress';
import type { CourseProgress } from '@/lib/stats';
import type { CourseRow, LessonRow } from '@/types/library';

type CourseDetailViewProps = {
  course: CourseRow;
  lessons: LessonRow[];
  progress: CourseProgress;
  onBack: () => void;
  onWatch: (lessonId: string) => void;
  onChanged: () => Promise<void>;
  onDeleted: () => Promise<void>;
};

export default function CourseDetailView({
  course,
  lessons,
  progress,
  onBack,
  onWatch,
  onChanged,
  onDeleted,
}: CourseDetailViewProps) {
  const [busyLessonId, setBusyLessonId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextUpId = lessons.find((lesson) => !lesson.completed)?.id ?? null;
  const isPlaylist = course.source_kind === 'playlist';

  const handleToggle = async (lesson: LessonRow) => {
    setBusyLessonId(lesson.id);
    setError(null);
    try {
      if (lesson.completed) await reopenLesson(lesson);
      else await completeLesson(lesson);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusyLessonId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteCourse(course.id);
      await onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-900"
      >
        <ArrowLeft className="h-4 w-4" />
        All courses
      </button>

      <section className="grid gap-8 border-b-2 border-primary-900 pb-8 lg:grid-cols-[360px_1fr] lg:gap-12">
        <div className="aspect-video w-full overflow-hidden border-2 border-primary-900 bg-primary-100">
          {course.thumbnail_url && (
            <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="flex flex-col gap-5">
          <span className="w-fit bg-primary-900 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-surface">
            {isPlaylist ? 'Playlist' : 'Video'}
          </span>
          <h1 className="text-4xl text-primary-900 sm:text-5xl">{course.title}</h1>

          <p className="flex items-baseline gap-3">
            <span className="font-display text-6xl leading-none text-primary-900">
              {progress.completed}
              <span className="text-primary-400">/{progress.total}</span>
            </span>
            <span className="text-sm font-semibold text-primary-600">
              {pluralize(progress.completed, 'video')} completed
            </span>
          </p>

          <ProgressBar percent={progress.percent} size="lg" />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={course.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center gap-2 border-2 border-primary-900 px-4 text-sm font-semibold text-primary-900 transition-colors hover:bg-primary-900 hover:text-surface"
            >
              Open on YouTube
              <ArrowUpRight className="h-4 w-4" />
            </a>

            {confirmingDelete ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-error-700">Delete this course?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="h-11 bg-error-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-error-700 disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="h-11 px-4 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-900"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex h-11 items-center gap-2 px-4 text-sm font-semibold text-primary-500 transition-colors hover:text-error-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete course
              </button>
            )}
          </div>

          {error && <ErrorNotice message={error} />}
        </div>
      </section>

      <section className="pt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-3xl text-primary-900">Lessons</h2>
          <p className="text-sm text-primary-500">Select a video to watch it here</p>
        </div>

        <ol className="divide-y divide-primary-200 border-2 border-primary-900">
          {lessons.map((lesson, index) => {
            const isNext = lesson.id === nextUpId;
            const isBusy = busyLessonId === lesson.id;
            return (
              <li
                key={lesson.id}
                className={`flex items-center gap-4 px-4 py-4 transition-colors hover:bg-primary-50 ${
                  isNext ? 'bg-accent-50' : 'bg-surface'
                }`}
              >
                <span className="w-8 shrink-0 text-center font-display text-xl text-primary-400">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onWatch(lesson.id)}
                  className="hidden aspect-video w-28 shrink-0 overflow-hidden border border-primary-200 transition-opacity hover:opacity-80 md:block"
                  aria-label={`Watch ${lesson.title}`}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${lesson.youtube_id}/mqdefault.jpg`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onWatch(lesson.id)}
                      className={`min-w-0 truncate text-left text-base hover:text-accent-600 ${
                        lesson.completed ? 'text-primary-400 line-through' : 'font-semibold text-primary-900'
                      }`}
                    >
                      {lesson.title}
                    </button>
                    {isNext && (
                      <span className="bg-accent-500 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                        Next up
                      </span>
                    )}
                  </div>
                  <ProgressBar percent={lessonPercent(lesson)} />
                  <p className="text-xs font-semibold text-primary-500">{lessonStatusText(lesson)}</p>
                </div>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleToggle(lesson)}
                  aria-label={lesson.completed ? `Mark "${lesson.title}" as not finished` : `Mark "${lesson.title}" as finished`}
                  aria-pressed={lesson.completed}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 transition-colors disabled:opacity-50 ${
                    lesson.completed
                      ? 'border-accent-500 bg-accent-500 text-white hover:bg-accent-600'
                      : 'border-primary-900 text-transparent hover:bg-primary-100'
                  }`}
                >
                  <Check className="h-5 w-5" strokeWidth={3} />
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
