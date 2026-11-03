import { BookOpen, Clock, Flame } from 'lucide-react';
import type { LibraryStats } from '@/lib/stats';
import { formatMinutes } from '@/lib/format';

type StatsStripProps = {
  stats: LibraryStats;
};

export default function StatsStrip({ stats }: StatsStripProps) {
  const items = [
    {
      icon: Flame,
      value: `${stats.streakDays}`,
      label: 'day streak',
    },
    {
      icon: Clock,
      value: formatMinutes(stats.minutesThisWeek),
      label: 'studied this week',
    },
    {
      icon: BookOpen,
      value: `${stats.activeCourses}`,
      label: stats.activeCourses === 1 ? 'course active' : 'courses active',
    },
  ];

  return (
    <section
      aria-label="Study summary"
      className="grid grid-cols-1 divide-y divide-primary-200 border-b border-primary-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
    >
      {items.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex items-center gap-4 py-5 sm:px-6 first:sm:pl-0 last:sm:pr-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent-50 text-accent-600">
            <Icon className="h-5 w-5" />
          </span>
          <p className="flex items-baseline gap-2">
            <span className="font-display text-4xl leading-none text-primary-900">{value}</span>
            <span className="text-sm font-semibold text-primary-600">{label}</span>
          </p>
        </div>
      ))}
    </section>
  );
}
