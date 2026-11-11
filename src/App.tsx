import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AuthCallback from '@/components/AuthCallback';
import CalendarView from '@/components/CalendarView';
import CourseDetailView from '@/components/CourseDetailView';
import DashboardView from '@/components/DashboardView';
import ErrorNotice from '@/components/ErrorNotice';
import Header from '@/components/Header';
import LessonWatchView from '@/components/LessonWatchView';
import LoginView from '@/components/LoginView';
import OkSchoolView from '@/components/OkSchoolView';
import SeasonDetails from '@/components/SeasonDetails';
import SeasonsView from '@/components/SeasonsView';
import { useLibrary } from '@/hooks/useLibrary';
import { useAuth } from '@/hooks/useAuth';
import { computeStats, courseProgress, groupLessonsByCourse } from '@/lib/stats';

export default function App() {
  const { status: authStatus, user, signInWithGitHub, signInWithGoogle, signOut } = useAuth();
  const { status, data, error, refresh } = useLibrary();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'dashboard' | 'calendar' | 'okschool' | 'season' | 'seasonDetails'>('dashboard');

  const userId = user?.id ?? null;

  const derived = useMemo(() => {
    if (!data) return null;
    const lessonsByCourse = groupLessonsByCourse(data.lessons);
    const progressByCourse = new Map(
      data.courses.map((course) => [
        course.id,
        courseProgress(lessonsByCourse.get(course.id) ?? []),
      ]),
    );
    const search = query.trim().toLowerCase();
    const courses = search
      ? data.courses.filter((course) => course.title.toLowerCase().includes(search))
      : data.courses;
    return {
      lessonsByCourse,
      progressByCourse,
      courses,
      stats: computeStats(data),
    };
  }, [data, query]);

  const selectedCourse = data?.courses.find((course) => course.id === selectedId) ?? null;

  const goHome = () => {
    setSelectedId(null);
    setSelectedLessonId(null);
    setView('dashboard');
  };

  const goCalendar = () => {
    setSelectedId(null);
    setSelectedLessonId(null);
    setView('calendar');
  };

  const goOkSchool = () => {
    setSelectedId(null);
    setSelectedLessonId(null);
    setView('okschool');
  };

  const goSeason = () => {
    setSelectedId(null);
    setSelectedLessonId(null);
    setView('season');
  };

  const goSeasonDetails = () => {
    setSelectedId(null);
    setSelectedLessonId(null);
    setView('seasonDetails');
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    goHome();
  };

  const courseLessons = selectedCourse
    ? (derived?.lessonsByCourse.get(selectedCourse.id) ?? [])
    : [];

  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center gap-3 py-32 text-primary-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-semibold">Signing in...</span>
      </div>
    );
  }

  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  if (authStatus === 'unauthenticated') {
    return <LoginView signInWithGitHub={signInWithGitHub} signInWithGoogle={signInWithGoogle} />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header
        query={query}
        onQueryChange={handleQueryChange}
        onHome={goHome}
        onCalendar={goCalendar}
        onOkSchool={goOkSchool}
        onSeason={goSeason}
        user={user}
        onSignOut={signOut}
      />

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {view === 'calendar' ? (
          <CalendarView userId={userId} onBack={goHome} />
        ) : view === 'okschool' ? (
          <OkSchoolView onBack={goHome} />
        ) : view === 'season' ? (
          <SeasonsView
            userId={userId}
            courses={data?.courses ?? []}
            lessons={data?.lessons ?? []}
            onBack={goHome}
          />
        ) : view === 'seasonDetails' ? (
          <SeasonDetails
            userId={userId}
            courses={data?.courses ?? []}
            lessons={data?.lessons ?? []}
            onBack={goHome}
          />
        ) : (
          <>
            {status === 'loading' && (
              <div className="flex items-center justify-center gap-3 py-32 text-primary-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-semibold">Loading your library...</span>
              </div>
            )}

            {status === 'error' && (
              <div className="mx-auto flex max-w-xl flex-col gap-4 py-24">
                <ErrorNotice message={`We could not load your library. ${error}`} />
                <button
                  type="button"
                  onClick={refresh}
                  className="h-11 w-fit border-2 border-primary-900 px-5 text-sm font-semibold text-primary-900 transition-colors hover:bg-primary-900 hover:text-surface"
                >
                  Try again
                </button>
              </div>
            )}

            {status === 'ready' && data && derived && selectedCourse && selectedLessonId ? (
              <LessonWatchView
                key={selectedLessonId}
                course={selectedCourse}
                lessons={courseLessons}
                lessonId={selectedLessonId}
                onSelectLesson={setSelectedLessonId}
                onBack={() => setSelectedLessonId(null)}
                onChanged={refresh}
              />
            ) : null}

            {status === 'ready' && data && derived && selectedCourse && !selectedLessonId ? (
              <CourseDetailView
                key={selectedCourse.id}
                course={selectedCourse}
                lessons={courseLessons}
                progress={derived.progressByCourse.get(selectedCourse.id) ?? courseProgress([])}
                onBack={goHome}
                onWatch={setSelectedLessonId}
                onChanged={refresh}
                onDeleted={async () => {
                  goHome();
                  await refresh();
                }}
              />
            ) : null}

            {status === 'ready' && data && derived && !selectedCourse && (
              <DashboardView
                courses={derived.courses}
                totalCourses={data.courses.length}
                progressByCourse={derived.progressByCourse}
                stats={derived.stats}
                lessons={data.lessons}
                onOpenCourse={setSelectedId}
                onCourseSaved={refresh}
                userId={userId}
                onViewDetails={goSeasonDetails}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
