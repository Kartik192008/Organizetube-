import type { ImportResult } from '@/types/library';

const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-youtube`;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isImportResult(value: unknown): value is ImportResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.kind !== 'video' && candidate.kind !== 'playlist') return false;
  if (typeof candidate.title !== 'string' || typeof candidate.thumbnailUrl !== 'string') return false;
  if (!Array.isArray(candidate.lessons) || candidate.lessons.length === 0) return false;
  return candidate.lessons.every(
    (lesson) =>
      lesson &&
      typeof lesson === 'object' &&
      typeof (lesson as Record<string, unknown>).youtubeId === 'string' &&
      typeof (lesson as Record<string, unknown>).title === 'string',
  );
}

export async function importYoutubeLink(url: string): Promise<ImportResult> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ url }),
    });
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : 'The import failed. Please try again.';
    throw new Error(message);
  }

  if (!isImportResult(body)) throw new Error('Unexpected response from the import service.');
  return body;
}
