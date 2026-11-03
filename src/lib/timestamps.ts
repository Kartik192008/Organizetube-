export function parseTimestamp(input: string): number | null {
  const parts = input.trim().split(':');
  if (parts.length === 0 || parts.length > 3) return null;
  if (parts.some((part) => !/^\d+$/.test(part))) return null;
  const numbers = parts.map(Number);
  if (numbers.slice(1).some((value) => value >= 60)) return null;
  return numbers.reduce((total, value) => total * 60 + value, 0);
}

export function formatTimestamp(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const ss = String(secs).padStart(2, '0');
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`;
  return `${minutes}:${ss}`;
}
