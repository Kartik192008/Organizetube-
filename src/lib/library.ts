import { supabase } from '@/lib/supabase';
import { toDateKey } from '@/lib/dates';
import type {
  CourseRow,
  ImportResult,
  Library,
  LessonRow,
  StudySessionRow,
} from '@/types/library';

export async function fetchLibrary(): Promise<Library> {
  const [courses, lessons, sessions] = await Promise.all([
    supabase.from('courses').select('*').order('created_at', { ascending: false }),
    supabase.from('lessons').select('*').order('position', { ascending: true }),
    supabase.from('study_sessions').select('*').order('created_at', { ascending: false }),
  ]);

  if (courses.error) throw new Error(courses.error.message);
  if (lessons.error) throw new Error(lessons.error.message);
  if (sessions.error) throw new Error(sessions.error.message);

  return {
    courses: (courses.data ?? []) as CourseRow[],
    lessons: (lessons.data ?? []) as LessonRow[],
    sessions: (sessions.data ?? []) as StudySessionRow[],
  };
}

export async function saveImportedCourse(source: string, result: ImportResult): Promise<void> {
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: result.title,
      source_url: source,
      source_kind: result.kind,
      thumbnail_url: result.thumbnailUrl,
    })
    .select('id')
    .single();

  if (courseError || !course) throw new Error('Could not save the course. Please try again.');

  const { error: lessonsError } = await supabase.from('lessons').insert(
    result.lessons.map((lesson, index) => ({
      course_id: course.id,
      youtube_id: lesson.youtubeId,
      title: lesson.title,
      position: index,
    })),
  );

  if (lessonsError) {
    await supabase.from('courses').delete().eq('id', course.id);
    throw new Error('Could not save the videos. Please try again.');
  }
}

export async function completeLesson(lesson: LessonRow): Promise<void> {
  const duration = lesson.duration_seconds;
  const watched = duration ?? lesson.watched_seconds;

  if (duration !== null) await logStudyTime(lesson, duration - lesson.watched_seconds);

  const { error } = await supabase
    .from('lessons')
    .update({ completed: true, completed_at: new Date().toISOString(), watched_seconds: watched })
    .eq('id', lesson.id);
  if (error) throw new Error('Could not mark the video as complete. Please try again.');
}

export async function saveLessonProgress(
  lesson: LessonRow,
  durationSeconds: number,
  watchedSeconds: number,
): Promise<void> {
  await logStudyTime(lesson, watchedSeconds - lesson.watched_seconds);

  const reachedEnd = watchedSeconds >= durationSeconds;
  const completed = lesson.completed || reachedEnd;
  const { error } = await supabase
    .from('lessons')
    .update({
      duration_seconds: durationSeconds,
      watched_seconds: watchedSeconds,
      completed,
      completed_at: lesson.completed_at ?? (completed ? new Date().toISOString() : null),
    })
    .eq('id', lesson.id);
  if (error) throw new Error('Could not save your progress. Please try again.');
}

async function logStudyTime(lesson: LessonRow, seconds: number): Promise<void> {
  if (seconds <= 0) return;
  const { error } = await supabase.from('study_sessions').insert({
    course_id: lesson.course_id,
    lesson_id: lesson.id,
    minutes: Math.max(1, Math.round(seconds / 60)),
    studied_on: toDateKey(new Date()),
  });
  if (error) throw new Error('Could not log your study time. Please try again.');
}


export async function reopenLesson(lesson: LessonRow): Promise<void> {
  const { error } = await supabase
    .from('lessons')
    .update({ completed: false, completed_at: null })
    .eq('id', lesson.id);
  if (error) throw new Error('Could not update the video. Please try again.');
}

export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) throw new Error('Could not delete the course. Please try again.');
}
