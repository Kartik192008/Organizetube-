import { useCallback, useEffect, useState } from 'react';
import { fetchLibrary } from '@/lib/library';
import type { Library } from '@/types/library';

type LibraryState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: Library; error: null }
  | { status: 'error'; data: null; error: string };

export function useLibrary() {
  const [state, setState] = useState<LibraryState>({ status: 'loading', data: null, error: null });

  const refresh = useCallback(async () => {
    try {
      const data = await fetchLibrary();
      setState({ status: 'ready', data, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setState({ status: 'error', data: null, error: message });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
