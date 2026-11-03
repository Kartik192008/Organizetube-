import { addDays, startOfWeek, toDateKey } from '@/lib/dates';
import type { CourseRow, Library, LessonRow } from '@/types/library';

export type CourseProgress = { completed: number; total: number; percent: number };

export function courseProgress(lessons: LessonRow[]): CourseProgress {
  const total = lessons.length;
  const completed = lessons.filter((lesson) => lesson.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export function groupLessonsByCourse(lessons: LessonRow[]): Map<string, LessonRow[]> {
  const grouped = new Map<string, LessonRow[]>();
  for (const lesson of lessons) {
    const list = grouped.get(lesson.course_id) ?? [];
    list.push(lesson);
    grouped.set(lesson.course_id, list);
  }
  return grouped;
}

export type LibraryStats = {
  streakDays: number;
  minutesThisWeek: number;
  activeCourses: number;
};

export function computeStats(library: Library, today: Date = new Date()): LibraryStats {
  const studiedDays = new Set(library.sessions.map((session) => session.studied_on));

  let cursor = today;
  if (!studiedDays.has(toDateKey(cursor))) cursor = addDays(cursor, -1);
  let streakDays = 0;
  while (studiedDays.has(toDateKey(cursor))) {
    streakDays += 1;
    cursor = addDays(cursor, -1);
  }

  const weekStart = toDateKey(startOfWeek(today));
  const minutesThisWeek = library.sessions
    .filter((session) => session.studied_on >= weekStart)
    .reduce((sum, session) => sum + session.minutes, 0);

  const lessonsByCourse = groupLessonsByCourse(library.lessons);
  const activeCourses = library.courses.filter((course: CourseRow) => {
    const lessons = lessonsByCourse.get(course.id) ?? [];
    return lessons.some((lesson) => !lesson.completed);
  }).length;

  return { streakDays, minutesThisWeek, activeCourses };
}
