import { ArrowLeft } from 'lucide-react';

type OkSchoolViewProps = {
  onBack: () => void;
};

export default function OkSchoolView({ onBack }: OkSchoolViewProps) {
  return (
    <div className="animate-fade-up space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="border-2 border-primary-900 rounded-xl bg-surface p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-display text-primary-900 leading-none tracking-tight">
          OkSchool
        </h1>
        <p className="mt-2 text-sm text-primary-500">
          OkSchool integration coming soon.
        </p>
      </div>
    </div>
  );
}
