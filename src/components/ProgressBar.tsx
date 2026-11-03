type ProgressBarProps = {
  percent: number;
  label?: string;
  size?: 'md' | 'lg';
};

export default function ProgressBar({ percent, label, size = 'md' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`relative flex-1 overflow-hidden bg-primary-100 ${size === 'lg' ? 'h-4' : 'h-3'}`}
      >
        <div
          className="h-full bg-accent-500 transition-[width] duration-700 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="min-w-[3rem] text-right font-display text-xl leading-none text-primary-900">
        {label ?? `${clamped}%`}
      </span>
    </div>
  );
}
