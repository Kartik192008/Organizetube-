import { useState } from 'react';
import { Plus } from 'lucide-react';
import AddCourseModal from '@/components/AddCourseModal';
import CourseCard from '@/components/CourseCard';
import DonationSection from '@/components/DonationSection';
import StatsStrip from '@/components/StatsStrip';
import type { CourseProgress, LibraryStats } from '@/lib/stats';
import type { CourseRow } from '@/types/library';

type DashboardViewProps = {
  courses: CourseRow[];
  totalCourses: number;
  progressByCourse: Map<string, CourseProgress>;
  stats: LibraryStats;
  onOpenCourse: (courseId: string) => void;
  onCourseSaved: () => Promise<void>;
  userId: string | null;
};

export default function DashboardView({
  courses,
  totalCourses,
  progressByCourse,
  stats,
  onOpenCourse,
  onCourseSaved,
  userId,
}: DashboardViewProps) {
  const [addOpen, setAddOpen] = useState(false);

  const handleSaved = async () => {
    setAddOpen(false);
    await onCourseSaved();
  };

  return (
    <div className="animate-fade-up">
      <StatsStrip stats={stats} />

      <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-5xl text-primary-900 sm:text-6xl">Your Study Hub</h1>
          <p className="text-sm text-primary-500">
            {totalCourses === 0
              ? 'Start by adding a video or playlist.'
              : `${totalCourses} ${totalCourses === 1 ? 'course' : 'courses'} saved`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex h-12 items-center justify-center gap-2 bg-accent-500 px-5 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-[4px_4px_0_0_#0A0A0A]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          Add Course
        </button>
      </div>

      {totalCourses === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} />
      ) : courses.length === 0 ? (
        <p className="border-2 border-dashed border-primary-300 px-6 py-16 text-center text-primary-500">
          No courses match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={progressByCourse.get(course.id) ?? { completed: 0, total: 0, percent: 0 }}
              onOpen={() => onOpenCourse(course.id)}
            />
          ))}
        </div>
      )}

      <DonationSection />

      {addOpen && (
        <AddCourseModal
          onClose={() => setAddOpen(false)}
          onSaved={handleSaved}
          userId={userId}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-start gap-6 border-2 border-primary-900 p-8 sm:p-12">
      <h2 className="text-4xl text-primary-900">Turn a playlist into a plan</h2>
      <p className="max-w-xl text-base leading-relaxed text-primary-600">
        Paste any YouTube video or playlist link. Organizer saves every video in order, so you can
        study through it step by step and watch your streak grow.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="flex h-12 items-center gap-2 bg-accent-500 px-6 font-semibold text-white transition-colors hover:bg-accent-600"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        Add your first course
      </button>
    </div>
  );
}
