import { Play, Search } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

type HeaderProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onHome: () => void;
};

export default function Header({ query, onQueryChange, onHome }: HeaderProps) {
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
            <span className="flex h-8 w-8 items-center justify-center bg-accent-500 text-white">
              <Play className="h-4 w-4 fill-current" />
            </span>
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
      </div>
    </header>
  );
}
