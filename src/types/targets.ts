export type TargetStatus = 'active' | 'completed' | 'ended';

export type TargetRow = {
  id: string;
  season_id: string;
  title: string;
  objective: string;
  description: string;
  category: string;
  milestones: string[];
  completed_milestone_titles: string[];
  course_ids: string[];
  note_ids: string[];
  project_ids: string[];
  status: TargetStatus;
  created_at: string;
  updated_at: string;
};

export type TargetProgress = {
  target: TargetRow;
  totalMilestones: number;
  completedMilestones: number;
  percent: number;
  courseProgress: { completed: number; total: number; percent: number };
};
