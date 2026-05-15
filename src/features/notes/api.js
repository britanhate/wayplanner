import { supabase } from '../../lib/supabase';
const NOTE_FIELDS='id, title, body, created_by, created_at';
export const fetchNotesByUser = (userId)=> supabase.from('notes').select(NOTE_FIELDS).eq('created_by',userId).order('created_at',{ascending:false});
export const insertNote = ({title,body,userId})=>supabase.from('notes').insert([{title,body,created_by:userId}]);
export const updateNoteById = (id, {title,body})=>supabase.from('notes').update({title,body}).eq('id',id);
export const deleteNoteById = (id)=>supabase.from('notes').delete().eq('id',id);
