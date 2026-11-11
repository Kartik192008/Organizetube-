import type { SeasonRow } from '@/types/seasons';
import type { TargetRow, TargetProgress } from '@/types/targets';

export const SEASON_01_ID = 'season-01';

export const SEASON_01: Omit<SeasonRow, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string } = {
  id: SEASON_01_ID,
  title: 'Season 01 — The Foundation Year',
  theme: 'Build knowledge. Develop skills. Create value. Build capital.',
  image_url: null,
  start_date: '2026-11-01',
  end_date: '2027-11-30',
  status: 'active',
  course_ids: [],
  target_lessons: 0,
};

export const SEASON_01_TARGETS: Omit<TargetRow, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    season_id: SEASON_01_ID,
    title: 'Build Knowledge',
    objective:
      'Acquire foundational knowledge across disciplines to build a strong intellectual base for the years ahead.',
    description:
      'Study core subjects, read foundational texts, and complete knowledge-focused courses to establish a broad understanding.',
    category: 'Knowledge',
    milestones: [
      'Read foundational texts',
      'Complete knowledge courses',
      'Pass knowledge assessments',
    ],
    completed_milestone_titles: [],
    course_ids: [],
    note_ids: [],
    project_ids: [],
    status: 'active',
  },
  {
    season_id: SEASON_01_ID,
    title: 'Develop Skills',
    objective:
      'Build practical, applicable skills that can be applied to real-world projects and professional work.',
    description:
      'Work through tutorials, build practice projects, and demonstrate competency in each skill area.',
    category: 'Skills',
    milestones: [
      'Complete skill tutorials',
      'Build practice projects',
      'Demonstrate skill competency',
    ],
    completed_milestone_titles: [],
    course_ids: [],
    note_ids: [],
    project_ids: [],
    status: 'active',
  },
  {
    season_id: SEASON_01_ID,
    title: 'Create Value & Build Capital',
    objective:
      'Produce tangible value and build capital through creative, entrepreneurial, and value-generating work.',
    description:
      'Launch value projects, build an audience or customer base, and convert effort into measurable capital.',
    category: 'Value & Capital',
    milestones: [
      'Launch first value project',
      'Build an audience or customer base',
      'Generate first revenue',
    ],
    completed_milestone_titles: [],
    course_ids: [],
    note_ids: [],
    project_ids: [],
    status: 'active',
  },
];

const STORAGE_KEY = 'organizer_season_01_targets';

function readAll(): TargetRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(targets: TargetRow[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
}

export function fetchSeason01Targets(): TargetRow[] {
  const existing = readAll();
  if (existing.length > 0) return existing;
  const now = new Date().toISOString();
  const seeded: TargetRow[] = SEASON_01_TARGETS.map((t) => ({
    ...t,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  }));
  writeAll(seeded);
  return seeded;
}

export function upsertTarget(target: Omit<TargetRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }): TargetRow {
  const now = new Date().toISOString();
  const id = target.id ?? crypto.randomUUID();
  const existing = readAll().find((t) => t.id === id);
  const row: TargetRow = {
    id,
    season_id: target.season_id,
    title: target.title,
    objective: target.objective,
    description: target.description,
    category: target.category,
    milestones: target.milestones ?? [],
    completed_milestone_titles: target.completed_milestone_titles ?? [],
    course_ids: target.course_ids ?? [],
    note_ids: target.note_ids ?? [],
    project_ids: target.project_ids ?? [],
    status: target.status ?? 'active',
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  const all = readAll().filter((t) => t.id !== id);
  all.push(row);
  writeAll(all);
  return row;
}

export function addCompletedMilestone(targetId: string, milestoneTitle: string): TargetRow | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === targetId);
  if (idx === -1) return null;
  const target = all[idx];
  if (target.completed_milestone_titles.includes(milestoneTitle)) return target;
  all[idx] = {
    ...target,
    completed_milestone_titles: [...target.completed_milestone_titles, milestoneTitle],
    updated_at: new Date().toISOString(),
  };
  writeAll(all);
  return all[idx];
}

export function removeCompletedMilestone(targetId: string, milestoneTitle: string): TargetRow | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === targetId);
  if (idx === -1) return null;
  const target = all[idx];
  all[idx] = {
    ...target,
    completed_milestone_titles: target.completed_milestone_titles.filter((m) => m !== milestoneTitle),
    updated_at: new Date().toISOString(),
  };
  writeAll(all);
  return all[idx];
}

export function associateCourseWithTarget(courseId: string, targetId: string): void {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === targetId);
  if (idx === -1) return;
  const target = all[idx];
  if (target.course_ids.includes(courseId)) return;
  all[idx] = {
    ...target,
    course_ids: [...target.course_ids, courseId],
    updated_at: new Date().toISOString(),
  };
  writeAll(all);
}

export function disassociateCourseFromTarget(courseId: string, targetId: string): void {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === targetId);
  if (idx === -1) return;
  const target = all[idx];
  all[idx] = {
    ...target,
    course_ids: target.course_ids.filter((id) => id !== courseId),
    updated_at: new Date().toISOString(),
  };
  writeAll(all);
}

export function computeTargetProgress(
  target: TargetRow,
  lessons: { course_id: string; completed: boolean }[],
): TargetProgress {
  const totalMilestones = target.milestones.length;
  const completedMilestones = target.completed_milestone_titles.length;
  const percent =
    totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);

  const targetCourses = target.course_ids;
  const courseLessons = lessons.filter((l) => targetCourses.includes(l.course_id));
  const completed = courseLessons.filter((l) => l.completed).length;
  const total = courseLessons.length;
  const coursePercent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    target,
    totalMilestones,
    completedMilestones,
    percent,
    courseProgress: { completed, total, percent: coursePercent },
  };
}
