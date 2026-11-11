export type SeasonStatus = 'active' | 'completed' | 'ended';

export type SeasonRow = {
  id: string;
  user_id: string | null;
  title: string;
  theme: string;
  image_url: string | null;
  start_date: string;
  end_date: string;
  status: SeasonStatus;
  course_ids: string[];
  target_lessons: number;
  created_at: string;
  updated_at: string;
};

export type Season = SeasonRow;
