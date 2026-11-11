import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Clock, Edit2, Image, Play, Plus, Target, Trash2, X } from 'lucide-react';
import { fetchSeasons, upsertSeason, deleteSeason, endSeason, checkAutoEnd } from '@/lib/seasons';
import type { SeasonRow, SeasonStatus } from '@/types/seasons';
import type { CourseRow } from '@/types/library';
import type { LessonRow } from '@/types/library';

type SeasonsViewProps = {
  userId: string | null;
  courses: CourseRow[];
  lessons: LessonRow[];
  onBack: () => void;
};

type SeasonProgress = {
  season: SeasonRow;
  totalLessons: number;
  completedLessons: number;
  percent: number;
};

function computeSeasonProgress(season: SeasonRow, courses: CourseRow[], lessons: LessonRow[]): SeasonProgress {
  const seasonCourses = courses.filter((c) => season.course_ids.includes(c.id));
  const seasonLessons = lessons.filter((l) => seasonCourses.some((c) => c.id === l.course_id));
  const completed = seasonLessons.filter((l) => l.completed).length;
  const total = seasonLessons.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { season, totalLessons: total, completedLessons: completed, percent };
}

export default function SeasonsView({ userId, courses, lessons, onBack }: SeasonsViewProps) {
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    theme: '',
    image_url: '',
    start_date: '',
    end_date: '',
    target_lessons: '',
    course_ids: '' as string[],
  });

  const loadSeasons = useCallback(() => {
    if (!userId) {
      setSeasons([]);
      return;
    }
    const raw = fetchSeasons(userId);
    setSeasons(checkAutoEnd(raw));
  }, [userId]);

  const activeSeasons = useMemo(() => seasons.filter((s) => s.status === 'active'), [seasons]);
  const endedSeasons = useMemo(() => seasons.filter((s) => s.status !== 'active'), [seasons]);

  const progressBySeason = useMemo(
    () =>
      Object.fromEntries(
        seasons.map((s) => [s.id, computeSeasonProgress(s, courses, lessons)])
      ),
    [seasons, courses, lessons]
  );

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const end = new Date(form.end_date);
      const start = new Date(form.start_date);
      if (isNaN(end.getTime()) || isNaN(start.getTime())) {
        alert('Please select valid start and end dates.');
        setSaving(false);
        return;
      }
      if (end < start) {
        alert('End date must be after start date.');
        setSaving(false);
        return;
      }
      const payload = {
        id: editingId ?? undefined,
        user_id: userId,
        title: form.title.trim(),
        theme: form.theme.trim(),
        image_url: form.image_url.trim() || null,
        start_date: form.start_date,
        end_date: form.end_date,
        status: 'active' as SeasonStatus,
        course_ids: form.course_ids,
        target_lessons: Number(form.target_lessons) || 0,
      };
      upsertSeason(payload);
      setMode('list');
      setEditingId(null);
      setForm({ title: '', theme: '', image_url: '', start_date: '', end_date: '', target_lessons: '', course_ids: [] });
      loadSeasons();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save season.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this season?')) return;
    deleteSeason(id, userId);
    loadSeasons();
  };

  const handleEnd = (id: string) => {
    endSeason(id, userId);
    loadSeasons();
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm({ title: '', theme: '', image_url: '', start_date: '', end_date: '', target_lessons: '', course_ids: [] });
    setMode('create');
  };

  const handleEdit = (season: SeasonRow) => {
    setEditingId(season.id);
    setForm({
      title: season.title,
      theme: season.theme,
      image_url: season.image_url ?? '',
      start_date: season.start_date,
      end_date: season.end_date,
      target_lessons: String(season.target_lessons),
      course_ids: season.course_ids,
    });
    setMode('edit');
  };

  const handleView = (season: SeasonRow) => {
    setViewingId(season.id);
    setMode('detail');
  };

  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="animate-fade-up">
        <button
          type="button"
          onClick={() => {
            setMode('list');
            setEditingId(null);
          }}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {mode === 'create' ? 'Back to Seasons' : 'Back to Season'}
        </button>

        <div className="mb-8 flex items-center gap-3">
          {mode === 'create' ? (
            <Plus className="h-8 w-8 text-accent-500" />
          ) : (
            <Edit2 className="h-8 w-8 text-accent-500" />
          )}
          <h1 className="text-4xl text-primary-900 sm:text-5xl">
            {mode === 'create' ? 'New Season' : 'Edit Season'}
          </h1>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="max-w-2xl space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-1">Season Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Winter 2026"
                className="w-full h-10 border-2 border-primary-200 rounded-lg p-3 text-primary-900 focus:border-primary-900 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="block text-sm font-semibold text-primary-900 mb-1">Target Lessons</label>
              <input
                type="number"
                value={form.target_lessons}
                onChange={(e) => setForm({ ...form, target_lessons: e.target.value })}
                placeholder="0"
                className="w-full h-10 border-2 border-primary-200 rounded-lg p-3 text-primary-900 focus:border-primary-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary-900 mb-1">Theme / About</label>
            <textarea
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
              placeholder="Describe the focus and goals of this season..."
              rows={3}
              className="w-full border-2 border-primary-200 rounded-lg p-3 text-primary-900 focus:border-primary-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary-900 mb-1">Cover Image URL</label>
            <input
              type="text"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
              className="w-full h-10 border-2 border-primary-200 rounded-lg p-3 text-primary-900 focus:border-primary-900 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full h-10 border-2 border-primary-200 rounded-lg p-3 text-primary-900 focus:border-primary-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-1">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full h-10 border-2 border-primary-200 rounded-lg p-3 text-primary-900 focus:border-primary-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary-900 mb-1">Select Courses</label>
            <div className="grid gap-3 max-h-64 overflow-y-auto border-2 border-primary-200 rounded-lg p-3 bg-primary-50">
              {courses.map((course) => {
                const selected = form.course_ids.includes(course.id);
                return (
                  <label
                    key={course.id}
                    className={`flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer ${
                      selected
                        ? 'border-accent-500 bg-accent-50'
                        : 'border-primary-200 hover:border-primary-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        setForm({
                          ...form,
                          course_ids: selected
                            ? form.course_ids.filter((id) => id !== course.id)
                            : [...form.course_ids, course.id],
                        })
                      }
                      className="h-4 w-4 text-accent-500 border-primary-300 rounded focus:ring-accent-500"
                    />
                    <span className="text-sm text-primary-900">{course.title}</span>
                  </label>
                );
              })}
            </div>
            {courses.length === 0 && (
              <p className="text-xs text-primary-400 italic">No courses available. Add courses from Dashboard first.</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('list');
                setEditingId(null);
              }}
              disabled={saving}
              className="flex-1 h-10 px-4 border-2 border-primary-200 rounded-lg text-primary-600 font-semibold hover:bg-primary-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="flex-1 h-10 px-4 rounded-lg bg-accent-500 text-white font-semibold disabled:opacity-50 hover:bg-accent-600 disabled:hover:bg-accent-600 transition-colors"
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Season' : 'Save Season'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === 'detail') {
    const season = seasons.find((s) => s.id === viewingId);
    if (!season) {
      setMode('list');
      return null;
    }
    const progress = progressBySeason[season.id];

    return (
      <div className="animate-fade-up">
        <button
          type="button"
          onClick={() => {
            setMode('list');
            setViewingId(null);
          }}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Seasons
        </button>

        <div className="mb-6 flex items-start gap-4">
          {season.image_url ? (
            <img
              src={season.image_url}
              alt=""
              className="h-32 w-32 object-cover rounded-lg border-2 border-primary-200"
            />
          ) : (
            <div className="h-32 w-32 flex items-center justify-center rounded-lg border-2 border-primary-200 bg-primary-50 text-primary-400">
              <Calendar className="h-10 w-10" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl text-primary-900">{season.title}</h1>
              {season.status === 'ended' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-error-100 text-error-600">
                  Ended
                </span>
              )}
              {season.status === 'completed' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-accent-100 text-accent-700">
                  Completed
                </span>
              )}
            </div>
            <p className="text-sm text-primary-600">{season.theme || 'No theme set.'}</p>
            <div className="mt-4 flex gap-6 text-sm">
              <div className="flex items-center gap-1 text-primary-500">
                <Clock className="h-4 w-4" />
                <span>{new Date(season.start_date).toLocaleDateString()}</span>
                <span className="mx-1 text-primary-300">to</span>
                <span>{new Date(season.end_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1 text-primary-500">
                <Target className="h-4 w-4" />
                <span>{progress.completedLessons}/{progress.totalLessons} lessons ({progress.percent}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {season.course_ids.length === 0 ? (
            <div className="col-span-3 border-2 border-dashed border-primary-300 rounded-xl p-16 text-center">
              <div className="text-primary-400 mb-2">
                <Calendar className="h-8 w-8" />
              </div>
              <p className="text-primary-500">No courses added to this season yet.</p>
            </div>
          ) : (
            season.course_ids.map((courseId) => {
              const course = courses.find((c) => c.id === courseId);
              if (!course) return null;
              const courseLessons = lessons.filter((l) => l.course_id === courseId);
              const completed = courseLessons.filter((l) => l.completed).length;
              const total = courseLessons.length;
              const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
              return (
                <button
                  key={course.id}
                  type="button"
                  className="group flex h-full flex-col border-2 border-primary-900 bg-surface text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#FF5A1F]"
                >
                  <div className="relative aspect-video w-full overflow-hidden border-b-2 border-primary-900 bg-primary-100">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-primary-400">
                        <Play className="h-10 w-10" />
                      </div>
                    )}
                    {total > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 bg-accent-500 text-white px-3 py-1 rounded-lg shadow-lg">
                          <Play className="h-4 w-4" />
                          <span className="text-sm font-semibold">{percent}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h3 className="line-clamp-2 text-xl text-primary-900">{course.title}</h3>
                    <p className="text-sm text-primary-600">
                      {completed}/{total} lessons completed
                    </p>
                    <div className="mt-auto pt-2">
                      <div className="w-full bg-primary-100 rounded-full h-2">
                        <div className="h-2 bg-accent-500 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-500 mt-1">
                        {percent === 100 ? 'Finished' : 'In progress'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {season.status === 'active' && (
          <div className="mt-8">
            <button
              type="button"
              onClick={() => handleEnd(season.id)}
              className="h-11 px-6 border-2 border-error-500 text-error-500 font-semibold rounded-lg hover:bg-error-50 transition-colors"
            >
              End Season
            </button>
          </div>
        )}
      </div>
    );
  }

  // List mode
  return (
    <div className="animate-fade-up">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-accent-500" />
          <h1 className="text-4xl text-primary-900 sm:text-5xl">Seasons</h1>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="flex h-10 items-center gap-2 bg-accent-500 px-4 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-[4px_4px_0_0_#0A0A0A]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          New Season
        </button>
      </div>

      {seasons.length === 0 && (
        <div className="border-2 border-dashed border-primary-300 rounded-xl p-16 text-center">
          <div className="text-primary-400 mb-4">
            <Calendar className="h-10 w-10" />
          </div>
          <h3 className="text-xl text-primary-900 mb-2">No seasons yet</h3>
          <p className="text-sm text-primary-500">
            Create a season to group your courses with a target date and theme.
          </p>
        </div>
      )}

      {activeSeasons.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-600" />
            Active Seasons
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeSeasons.map((season) => {
              const progress = progressBySeason[season.id];
              const daysLeft = Math.ceil(
                (new Date(season.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <button
                  key={season.id}
                  type="button"
                  onClick={() => handleView(season)}
                  className="group relative flex h-full flex-col border-2 border-primary-900 bg-surface text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#FF5A1F]"
                >
                  {season.image_url ? (
                    <img
                      src={season.image_url}
                      alt=""
                      className="aspect-video w-full object-cover border-b-2 border-primary-900"
                    />
                  ) : (
                    <div className="aspect-video w-full flex items-center justify-center border-b-2 border-primary-900 bg-primary-100 text-primary-400">
                      <Calendar className="h-10 w-10" />
                    </div>
                  )}
                  <div className="flex-1 flex-col gap-3 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="line-clamp-1 text-xl font-semibold text-primary-900">{season.title}</h3>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleEdit(season); }}
                        className="p-1.5 text-primary-400 hover:text-accent-500 transition-colors"
                        aria-label="Edit season"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="line-clamp-2 text-sm text-primary-600">{season.theme || 'No theme set.'}</p>
                    <div className="mt-auto pt-2 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-primary-500">
                          {new Date(season.start_date).toLocaleDateString()} &rarr;
                          {new Date(season.end_date).toLocaleDateString()}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            daysLeft < 0 ? 'text-error-600' : daysLeft <= 7 ? 'text-accent-600' : 'text-primary-600'
                          }`}
                        >
                          {daysLeft < 0 ? 'Ended' : daysLeft === 0 ? 'Ends today' : `${daysLeft} days left`}
                        </span>
                      </div>
                      {progress.totalLessons > 0 && (
                        <>
                          <div className="w-full bg-primary-100 rounded-full h-1.5">
                            <div className="h-1.5 bg-accent-500 rounded-full" style={{ width: `${progress.percent}%` }} />
                          </div>
                          <p className="text-xs text-primary-500">
                            {progress.completedLessons}/{progress.totalLessons} lessons
                          </p>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleView(season); }}
                        className="flex-1 h-8 px-3 border-2 border-primary-200 rounded text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        View
                      </button>
                      {daysLeft < 0 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleEnd(season.id); }}
                          className="h-8 px-3 border-2 border-error-500 rounded text-xs font-semibold text-error-500 hover:bg-error-50 transition-colors"
                        >
                          End
                        </button>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {endedSeasons.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <X className="h-5 w-5 text-primary-500" />
            Completed & Ended Seasons
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {endedSeasons.map((season) => {
              const progress = progressBySeason[season.id];
              return (
                <button
                  key={season.id}
                  type="button"
                  onClick={() => handleView(season)}
                  className="group relative flex h-full flex-col border-2 border-primary-200 bg-surface/50 text-left transition-colors hover:border-primary-300 opacity-90"
                >
                  {season.image_url ? (
                    <img
                      src={season.image_url}
                      alt=""
                      className="aspect-video w-full object-cover border-b-2 border-primary-200"
                    />
                  ) : (
                    <div className="aspect-video w-full flex items-center justify-center border-b-2 border-primary-200 bg-primary-50 text-primary-300">
                      <Calendar className="h-10 w-10 opacity-50" />
                    </div>
                  )}
                  <div className="flex-1 flex-col gap-3 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="line-clamp-1 text-lg font-semibold text-primary-900 group-hover:text-accent-600 transition-colors">
                        {season.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-primary-100 text-primary-500">
                        {season.status === 'ended' ? 'Ended' : 'Completed'}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm text-primary-500">{season.theme || 'No theme set.'}</p>
                    <div className="mt-auto pt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs text-primary-400">
                        <span>
                          {new Date(season.start_date).toLocaleDateString()} &rarr;
                          {new Date(season.end_date).toLocaleDateString()}
                        </span>
                        <span>{progress.percent}%</span>
                      </div>
                      <div className="w-full bg-primary-100 rounded-full h-1.5">
                        <div className="h-1.5 bg-accent-500 rounded-full" style={{ width: `${progress.percent}%` }} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleView(season); }}
                      className="mt-2 h-8 w-full border-2 border-primary-200 rounded text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
