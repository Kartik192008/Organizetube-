import { Play } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { pluralize } from '@/lib/format';
import type { CourseProgress } from '@/lib/stats';
import type { CourseRow } from '@/types/library';

type CourseCardProps = {
  course: CourseRow;
  progress: CourseProgress;
  onOpen: () => void;
};

export default function CourseCard({ course, progress, onOpen }: CourseCardProps) {
  const isComplete = progress.total > 0 && progress.completed === progress.total;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col border-2 border-primary-900 bg-surface text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#FF5A1F] focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-200"
    >
      <div className="relative aspect-video w-full overflow-hidden border-b-2 border-primary-900 bg-primary-100">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary-400">
            <Play className="h-10 w-10" />
          </div>
        )}
        <span className="absolute left-0 top-0 bg-primary-900 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-surface">
          {course.source_kind === 'playlist' ? 'Playlist' : 'Video'}
        </span>
        <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center bg-accent-500 text-white">
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 text-2xl text-primary-900">{course.title}</h3>
        <p className="text-sm text-primary-600">
          {isComplete
            ? `All ${pluralize(progress.total, 'video')} completed`
            : `${progress.completed}/${progress.total} ${progress.total === 1 ? 'video' : 'videos'} completed`}
        </p>
        <div className="mt-auto pt-2">
          <ProgressBar percent={progress.percent} />
        </div>
        {progress.completed > 0 && (
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">
            {isComplete ? 'Finished' : 'In progress'}
          </p>
        )}
      </div>
    </button>
  );
}
