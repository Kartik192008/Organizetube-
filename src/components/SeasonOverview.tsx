import { useMemo } from 'react';
import { ArrowRight, Target } from 'lucide-react';
import { fetchSeasons } from '@/lib/seasons';
import { fetchSeason01Targets, computeTargetProgress } from '@/lib/season01';
import type { LessonRow } from '@/types/library';
import ProgressBar from '@/components/ProgressBar';

type SeasonOverviewProps = {
  userId: string | null;
  lessons: LessonRow[];
  onViewDetails: () => void;
};

export default function SeasonOverview({ userId, lessons, onViewDetails }: SeasonOverviewProps) {
  const seasons = fetchSeasons(userId);
  const season = seasons.find((s) => s.id === 'season-01');

  const targets = useMemo(() => {
    if (!userId) return [];
    return fetchSeason01Targets();
  }, [userId]);

  const lessonMap = useMemo(
    () =>
      lessons.map((l) => ({ course_id: l.course_id, completed: l.completed })),
    [lessons],
  );

  const targetProgress = useMemo(
    () => targets.map((t) => computeTargetProgress(t, lessonMap)),
    [targets, lessonMap],
  );

  const totalMilestones = targetProgress.reduce((sum, t) => sum + t.totalMilestones, 0);
  const completedMilestones = targetProgress.reduce((sum, t) => sum + t.completedMilestones, 0);
  const overallPercent = totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);

  if (!season) return null;

  return (
    <section
      aria-label="Season overview"
      className="border-2 border-primary-200 rounded-xl bg-surface p-6 sm:p-8"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-accent-600 shrink-0" />
          <div>
            <h2 className="text-2xl font-display text-primary-900 tracking-tight">
              {season.title}
            </h2>
            <p className="text-sm text-primary-500">
              {new Date(season.start_date).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })} &mdash;
              {new Date(season.end_date).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewDetails}
          className="flex h-10 items-center gap-2 border-2 border-primary-900 px-4 font-semibold text-primary-900 transition-colors hover:bg-primary-900 hover:text-surface"
        >
          <ArrowRight className="h-4 w-4" />
          View season
        </button>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-primary-600 italic">
        {season.theme}
      </p>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-primary-900">Overall season progress</span>
          <span className="text-sm font-semibold text-primary-900">{overallPercent}%</span>
        </div>
        <ProgressBar percent={overallPercent} size="lg" />
      </div>

      <div className="space-y-3">
        {targetProgress.map(({ target, percent, completedMilestones, totalMilestones }) => (
          <div
            key={target.id}
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-primary-100 bg-primary-50"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-semibold text-primary-900 truncate">
                {target.title}
              </span>
              <span className="text-xs text-primary-500">{target.category}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ProgressBar percent={percent} size="md" />
              <span className="text-xs font-semibold text-primary-600 min-w-[3.5rem] text-right">
                {completedMilestones}/{totalMilestones}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
