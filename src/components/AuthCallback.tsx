import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const completeAuth = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (data.session) {
          window.location.replace('/');
          return;
        }

        // Try to exchange code if present
        const url = `${window.location.search}${window.location.hash}`;
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(url);
        if (exchangeError) {
          // Try one more time with just the URL
          const { error: exchangeError2 } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exchangeError2) throw exchangeError2;
        }
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
