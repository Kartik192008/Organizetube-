import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const completeAuth = async () => {
      try {
        // Supabase v2 uses PKCE by default; pass both search and hash
        const fullUrl = `${window.location.search}${window.location.hash}`;
        const { error: supabaseError } = await supabase.auth.exchangeCodeForSession(fullUrl);
        if (supabaseError) throw supabaseError;
        window.location.replace('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed.');
      } finally {
        setLoading(false);
      }
    };

    completeAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-primary-600 font-medium">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6">
        <div className="max-w-sm text-center">
          <h2 className="text-xl font-semibold text-primary-900 mb-2">Sign in failed</h2>
          <p className="text-primary-600 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => window.location.replace('/')}
            className="flex h-12 w-full items-center justify-center gap-2 bg-accent-500 px-6 font-semibold text-white transition-colors hover:bg-accent-600"
          >
            Return to home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
