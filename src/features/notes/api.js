import { supabase } from '../../lib/supabase';
import { debugSupabaseFetch } from '../../lib/supabaseDebug';
const NOTE_FIELDS='id, title, body, created_by, created_at, updated_at';
export const fetchNotesByUser = (userId, { from = 0, to = 29 } = {}) =>
  debugSupabaseFetch({
    table: 'notes',
    columns: NOTE_FIELDS,
    action: 'select',
    query: () => supabase.from('notes').select(NOTE_FIELDS).eq('created_by', userId).order('created_at', { ascending: false }).range(from, to),
  });
export const insertNote = ({title,body,userId})=>supabase.from('notes').insert([{title,body,created_by:userId}]).select('id, title, body, created_by, created_at, updated_at');
export const updateNoteById = (id, {title,body})=>supabase.from('notes').update({title,body}).eq('id',id);
export const deleteNoteById = (id)=>supabase.from('notes').delete().eq('id',id);
