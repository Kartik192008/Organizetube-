export type SourceKind = 'video' | 'playlist';

export type CourseRow = {
  id: string;
  user_id: string | null;
  title: string;
  source_url: string;
  source_kind: SourceKind;
  thumbnail_url: string | null;
  created_at: string;
};

export type LessonRow = {
  id: string;
  user_id: string | null;
  course_id: string;
  youtube_id: string;
  title: string;
  position: number;
  completed: boolean;
  completed_at: string | null;
  duration_seconds: number | null;
  watched_seconds: number;
};

export type StudySessionRow = {
  id: string;
  user_id: string | null;
  course_id: string;
  lesson_id: string | null;
  minutes: number;
  studied_on: string;
};

export type Library = {
  courses: CourseRow[];
  lessons: LessonRow[];
  sessions: StudySessionRow[];
};

export type ImportedLesson = { youtubeId: string; title: string };

export type ImportResult = {
  kind: SourceKind;
  title: string;
  thumbnailUrl: string;
  lessons: ImportedLesson[];
};
