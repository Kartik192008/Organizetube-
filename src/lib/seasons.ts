import type { SeasonRow } from '@/types/seasons';
import { SEASON_01 } from '@/lib/season01';

const STORAGE_KEY = 'organizer_seasons';

function readAll(): SeasonRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(seasons: SeasonRow[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seasons));
}

export function fetchSeasons(userId: string | null): SeasonRow[] {
  if (!userId) return [];
  ensureSeason01(userId);
  return readAll().filter((s) => s.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function fetchSeason(id: string, userId: string | null): SeasonRow | null {
  if (!userId) return null;
  return readAll().find((s) => s.id === id && s.user_id === userId) ?? null;
}

export function ensureSeason01(userId: string | null): void {
  if (!userId) return;
  const all = readAll();
  if (all.some((s) => s.id === SEASON_01.id && s.user_id === userId)) return;
  upsertSeason({
    ...SEASON_01,
    user_id: userId,
  });
}

export function upsertSeason(season: Omit<SeasonRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }): SeasonRow {
  const now = new Date().toISOString();
  const id = season.id ?? crypto.randomUUID();
  const existing = readAll().find((s) => s.id === id);
  const row: SeasonRow = {
    id,
    user_id: season.user_id,
    title: season.title,
    theme: season.theme,
    image_url: season.image_url ?? null,
    start_date: season.start_date,
    end_date: season.end_date,
    status: season.status ?? 'active',
    course_ids: season.course_ids ?? [],
    target_lessons: season.target_lessons ?? 0,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  const all = readAll().filter((s) => s.id !== id);
  all.push(row);
  writeAll(all);
  return row;
}

export function deleteSeason(id: string, userId: string | null): void {
  if (!userId) return;
  const all = readAll().filter((s) => !(s.id === id && s.user_id === userId));
  writeAll(all);
}

export function endSeason(id: string, userId: string | null): SeasonRow | null {
  if (!userId) return null;
  const all = readAll();
  const idx = all.findIndex((s) => s.id === id && s.user_id === userId);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], status: 'ended', updated_at: new Date().toISOString() };
  writeAll(all);
  return all[idx];
}

export function checkAutoEnd(seasons: SeasonRow[]): SeasonRow[] {
  const today = new Date().toLocaleDateString('en-CA');
  return seasons.map((s) => {
    if (s.status === 'active' && s.end_date < today) {
      return { ...s, status: 'ended', updated_at: new Date().toISOString() };
    }
    return s;
  });
}
