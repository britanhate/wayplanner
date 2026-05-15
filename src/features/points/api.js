import { supabase } from '../../lib/supabase';

const POINT_FIELDS = 'id, name, addr, lat, lng, type, description, comment, estimated_cost, currency, point_date, is_completed, created_by, created_at';
export const fetchPoints = () => supabase.from('points').select(POINT_FIELDS).order('created_at', { ascending: true });
export const insertPoint = (point) => supabase.from('points').insert([point]).select('id').single();
export const deletePointById = (id) => supabase.from('points').delete().eq('id', id);
export const updatePointById = (id, updates) => supabase.from('points').update(updates).eq('id', id);
