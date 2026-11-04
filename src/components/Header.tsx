import { Search, LogOut } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

type HeaderProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onHome: () => void;
  user: { email?: string | null; user_metadata?: { full_name?: string | null; avatar_url?: string | null } } | null;
  onSignOut: () => void;
};

export default function Header({ query, onQueryChange, onHome, user, onSignOut }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-primary-200 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={onHome}
            className="group flex items-center gap-2 transition-opacity hover:opacity-80"
            aria-label="Organizer home"
          >
            <img src="/logo.png" alt="Organizer" className="h-8 w-8 object-contain" />
            <span className="font-display text-2xl leading-none text-primary-900">
              organizer
              <span className="text-accent-500">.</span>
            </span>
          </button>
          <nav className="hidden items-center gap-6 md:flex">
            <button
              type="button"
              onClick={onHome}
              className="border-b-2 border-accent-500 pb-1 text-sm font-semibold text-primary-900"
            >
              Dashboard
            </button>
          </nav>
        </div>

        <div className="flex w-full max-w-xs items-center gap-2">
          <label className="relative w-full">
            <span className="sr-only">Search your courses</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search your courses..."
              className="h-10 w-full border border-primary-200 bg-primary-50 pl-9 pr-3 text-sm text-primary-900 placeholder:text-primary-400 transition-colors focus:border-primary-900 focus:bg-surface focus:outline-none"
            />
          </label>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end gap-1">
                <span className="text-sm font-medium text-primary-900">
                  {user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User'}
                </span>
                <span className="text-xs text-primary-500">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-200 text-primary-600 transition-colors hover:bg-primary-100"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
