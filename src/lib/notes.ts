import { supabase } from '@/lib/supabase';
import type { NoteRow } from '@/types/notes';

export async function fetchNotes(): Promise<NoteRow[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('note_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as NoteRow[];
}

export async function upsertNote(note_date: string, content: string, userId: string): Promise<NoteRow> {
  const { data, error } = await supabase
    .from('notes')
    .upsert({ note_date, content, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id,note_date' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as NoteRow;
}

export async function deleteNote(note_date: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('note_date', note_date);
  if (error) throw new Error(error.message);
}
