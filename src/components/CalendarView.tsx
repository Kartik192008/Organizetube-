import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { fetchNotes, upsertNote, deleteNote } from '@/lib/notes';
import type { NoteRow } from '@/types/notes';

type CalendarViewProps = {
  userId: string | null;
  onBack: () => void;
};

export default function CalendarView({ userId, onBack }: CalendarViewProps) {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const data = await fetchNotes();
      setNotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const note = notes.find((n) => n.note_date === selectedDate);
    setContent(note?.content || '');
  }, [selectedDate, notes]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await upsertNote(selectedDate, content.trim(), userId);
      await loadNotes();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDate) return;
    setSaving(true);
    try {
      await deleteNote(selectedDate);
      setContent('');
      await loadNotes();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const noteDates = new Set(notes.map((n) => n.note_date));
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="animate-fade-up">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="mb-8 flex items-center gap-3">
        <CalendarIcon className="h-8 w-8 text-accent-500" />
        <h1 className="text-4xl text-primary-900 sm:text-5xl">Calendar</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="border-2 border-primary-900 p-6">
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="px-3 py-1 text-sm font-semibold text-primary-600 hover:text-primary-900"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold text-primary-900">{monthName}</h2>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="px-3 py-1 text-sm font-semibold text-primary-600 hover:text-primary-900"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-primary-500 py-2">
                {d}
              </div>
            ))}
            {days.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasNote = noteDates.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === today;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative aspect-square flex items-center justify-center text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-accent-500 text-white'
                      : isToday
                      ? 'border-2 border-accent-500 text-primary-900'
                      : 'hover:bg-primary-100 text-primary-900'
                  }`}
                >
                  {day}
                  {hasNote && (
                    <span className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-accent-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-2 border-primary-900 p-6">
          <h2 className="text-xl font-semibold text-primary-900 mb-4">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your notes for this day..."
            className="w-full h-48 border-2 border-primary-200 p-3 text-sm text-primary-900 placeholder:text-primary-400 focus:border-primary-900 focus:outline-none resize-none"
          />
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-10 bg-accent-500 text-white font-semibold hover:bg-accent-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Note'}
            </button>
            {notes.find((n) => n.note_date === selectedDate) && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="h-10 px-4 border-2 border-error-500 text-error-500 font-semibold hover:bg-error-50 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Recent Notes</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {notes.slice(0, 10).map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedDate(note.note_date)}
                  className="w-full text-left border border-primary-200 p-3 hover:bg-primary-50 transition-colors"
                >
                  <div className="text-xs font-semibold text-primary-500 mb-1">
                    {new Date(note.note_date + 'T00:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-sm text-primary-900 line-clamp-2">{note.content}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
