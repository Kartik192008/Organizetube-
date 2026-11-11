import { useMemo, useState } from 'react';
import { ArrowLeft, Clock, Check, ChevronRight, Calendar, FileText } from 'lucide-react';
import { fetchSeasons } from '@/lib/seasons';
import {
  fetchSeason01Targets,
  computeTargetProgress,
  associateCourseWithTarget,
  disassociateCourseFromTarget,
  addCompletedMilestone,
  removeCompletedMilestone,
} from '@/lib/season01';
import type { CourseRow } from '@/types/library';
import type { LessonRow } from '@/types/library';
import type { TargetRow } from '@/types/targets';
import ProgressBar from '@/components/ProgressBar';

type SeasonDetailsProps = {
  userId: string | null;
  courses: CourseRow[];
  lessons: LessonRow[];
  onBack: () => void;
};

export default function SeasonDetails({ userId, courses, lessons, onBack }: SeasonDetailsProps) {
  const seasons = fetchSeasons(userId);
  const season = seasons.find((s) => s.id === 'season-01');

  const [targets] = useState<TargetRow[]>(() => (userId ? fetchSeason01Targets() : []));

  const lessonMap = useMemo(
    () => lessons.map((l) => ({ course_id: l.course_id, completed: l.completed })),
    [lessons],
  );

  const targetProgress = useMemo(
    () => targets.map((t) => computeTargetProgress(t, lessonMap)),
    [targets, lessonMap],
  );

  const totalMilestones = targetProgress.reduce((sum, t) => sum + t.totalMilestones, 0);
  const completedMilestones = targetProgress.reduce((sum, t) => sum + t.completedMilestones, 0);
  const overallPercent = totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);

  const handleToggleMilestone = (targetId: string, title: string, completed: boolean) => {
    if (completed) removeCompletedMilestone(targetId, title);
    else addCompletedMilestone(targetId, title);
  };

  const handleAssociateCourse = (courseId: string, targetId: string) => {
    associateCourseWithTarget(courseId, targetId);
  };

  const handleDisassociateCourse = (courseId: string, targetId: string) => {
    disassociateCourseFromTarget(courseId, targetId);
  };

  if (!season) return null;

  return (
    <div className="animate-fade-up space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Season header */}
      <div className="border-2 border-primary-900 rounded-xl bg-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-primary-200 text-xs font-semibold text-primary-600">
                Season 01
              </span>
              <span className="text-xs text-primary-400">18&ndash;19 &bull; Foundation Year</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display text-primary-900 leading-none tracking-tight">
              {season.title}
            </h1>
            <p className="mt-2 text-sm text-primary-500 italic">
              {season.theme}
            </p>
          </div>
          <div className="text-right sm:text-left">
            <div className="text-sm text-primary-600">
              <Clock className="h-4 w-4 inline mr-1" />
              {new Date(season.start_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} &ndash;
              {new Date(season.end_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
            <div className="mt-2 text-sm font-semibold text-primary-900">
              {overallPercent}% complete
            </div>
            <div className="mt-3">
              <ProgressBar percent={overallPercent} size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Targets */}
      <div>
        <h2 className="text-2xl font-display text-primary-900 mb-6">Targets</h2>
        <div className="space-y-4">
          {targetProgress.map(({ target, percent, completedMilestones, totalMilestones }) => {
            const associatedCourses = courses.filter((c) => target.course_ids.includes(c.id));
            return (
              <div
                key={target.id}
                className="border-2 border-primary-900 rounded-xl bg-surface p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-accent-600">
                        {target.category}
                      </span>
                      {target.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-100 text-accent-700 text-xs font-semibold">
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-display text-primary-900 leading-none">{target.title}</h3>
                    <p className="mt-1 text-sm text-primary-600">{target.objective}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary-900">{percent}%</div>
                    <div className="mt-2">
                      <ProgressBar percent={percent} size="md" />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-500 mb-2">
                    Description
                  </p>
                  <p className="text-sm text-primary-600 leading-relaxed">{target.description}</p>
                </div>

                {/* Milestones */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                      Milestones
                    </span>
                    <span className="text-xs text-primary-400">
                      {completedMilestones}/{totalMilestones}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {target.milestones.map((milestone: string) => {
                      const done = target.completed_milestone_titles.includes(milestone);
                      return (
                        <li
                          key={milestone}
                          className="flex items-center gap-2"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleMilestone(target.id, milestone, done)}
                            aria-pressed={done}
                            className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                              done
                                ? 'border-accent-500 bg-accent-500 text-white'
                                : 'border-primary-200 text-primary-400 hover:border-primary-900'
                            }`}
                          >
                            {done ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M1 12h22M12 1v22"
                                />
                              </svg>
                            )}
                          </button>
                          <span
                            className={`text-sm leading-none transition-colors ${
                              done
                                ? 'text-primary-400 line-through'
                                : 'text-primary-700'
                            }`}
                          >
                            {milestone}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Associated courses */}
                <div className="pt-4 border-t border-primary-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                      Associated courses
                    </span>
                  </div>
                  {associatedCourses.length === 0 ? (
                    <p className="text-xs text-primary-400 italic">
                      No courses linked to this target yet.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {associatedCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded border border-primary-100 bg-primary-50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm text-primary-900 truncate">{course.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDisassociateCourse(course.id, target.id)}
                            className="flex h-6 w-6 items-center justify-center border border-primary-200 rounded text-primary-400 hover:text-error-600 transition-colors"
                            aria-label={`Remove ${course.title} from ${target.title}`}
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary-500 block mb-1">
                      Link a course
                    </span>
                    <div className="flex gap-2">
                      {courses
                        .filter((c) => !target.course_ids.includes(c.id))
                        .map((course) => (
                          <button
                            key={course.id}
                            type="button"
                            onClick={() => handleAssociateCourse(course.id, target.id)}
                            className="flex h-8 items-center gap-1.5 rounded border border-primary-200 bg-surface px-2 py-1 text-xs text-primary-600 font-semibold transition-colors hover:bg-primary-50 hover:border-primary-900 hover:text-primary-900"
                          >
                            <span>+</span> {course.title}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress overview */}
      <div className="grid gap-6 sm:grid-cols-3">
        {targetProgress.map(({ target, percent }) => (
          <div key={target.id} className="border-2 border-primary-200 rounded-xl bg-surface p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                {target.title}
              </span>
              <span className="text-sm font-semibold text-primary-900">{percent}%</span>
            </div>
            <div className="w-full bg-primary-100 rounded-full h-2">
              <div className="h-2 bg-accent-500 rounded-full" style={{ width: `${percent}%` }} />
            </div>
          </div>
        ))}
        <div className="col-span-3 sm:col-span-1 border-2 border-primary-200 rounded-xl bg-surface p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
              Overall season
            </span>
            <span className="text-sm font-semibold text-primary-900">{overallPercent}%</span>
          </div>
          <div className="w-full bg-primary-100 rounded-full h-2">
            <div className="h-2 bg-accent-500 rounded-full" style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Notes and reflections */}
      <div className="border-2 border-primary-200 rounded-xl bg-surface p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-accent-600 shrink-0" />
          <h3 className="text-xl font-display text-primary-900">Notes and reflections</h3>
        </div>
        <p className="text-sm text-primary-500 mb-4">
          Capture monthly reflections and notes tied to Season 01 targets. This section is a placeholder
          for your notes integration.
        </p>
        <div className="h-32 border-2 border-dashed border-primary-200 rounded-lg flex items-center justify-center text-primary-400">
          Monthly review entries appear here
        </div>
      </div>

      {/* Monthly review */}
      <div className="border-2 border-primary-200 rounded-xl bg-surface p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-accent-600 shrink-0" />
          <h3 className="text-xl font-display text-primary-900">Monthly review</h3>
        </div>
        <p className="text-sm text-primary-500 mb-4">
          Review your progress each month across the three targets of Season 01.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { month: 'Nov 2026', focus: 'Build Knowledge' },
            { month: 'Dec 2026', focus: 'Develop Skills' },
            { month: 'Jan 2027', focus: 'Create Value & Build Capital' },
          ].map((item) => (
            <div
              key={item.month}
              className="border border-primary-200 rounded-lg p-4"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-primary-500 mb-1">
                {item.month}
              </div>
              <div className="text-sm text-primary-600 mb-2">
                Focus: {item.focus}
              </div>
              <button
                type="button"
                className="flex h-8 items-center justify-center gap-1 border border-primary-200 rounded text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                Review
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
