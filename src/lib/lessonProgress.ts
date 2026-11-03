import { formatTimestamp } from '@/lib/timestamps';
import type { LessonRow } from '@/types/library';

export function lessonPercent(lesson: LessonRow): number {
  if (lesson.completed) return 100;
  if (!lesson.duration_seconds) return 0;
  return Math.min(100, Math.round((lesson.watched_seconds / lesson.duration_seconds) * 100));
}

export function lessonStatusText(lesson: LessonRow): string {
  if (lesson.completed) {
    return lesson.duration_seconds
      ? `Finished · ${formatTimestamp(lesson.duration_seconds)} video`
      : 'Finished';
  }
  if (lesson.duration_seconds) {
    const left = lesson.duration_seconds - lesson.watched_seconds;
    return `${formatTimestamp(lesson.watched_seconds)} of ${formatTimestamp(lesson.duration_seconds)} · ${formatTimestamp(left)} left`;
  }
  if (lesson.watched_seconds > 0) {
    return `Watched to ${formatTimestamp(lesson.watched_seconds)}`;
  }
  return 'Not started';
}
