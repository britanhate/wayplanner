import { supabase } from '../../lib/supabase';
import { debugSupabaseFetch } from '../../lib/supabaseDebug';
import type { Point } from '../../shared/types/domain';

const POINT_FIELDS = 'id, name, addr, lat, lng, type, description, comment, estimated_cost, currency, point_date, is_completed, created_by, created_at';

export type PointRow = Point & {
  addr?: string | null;
  description?: string | null;
  comment?: string | null;
  currency?: string | null;
  created_at?: string | null;
};

export const fetchPoints = (tripId?: string | null) =>
  debugSupabaseFetch({
    table: 'points',
    columns: POINT_FIELDS,
    action: 'select',
    query: () => {
      const query = supabase.from('points').select(POINT_FIELDS).order('created_at', { ascending: true });
      return tripId ? query.or(`trip_id.eq.${tripId},trip_id.is.null`) : query;
    },
  });

export const insertPoint = (point: Partial<PointRow>) => supabase.from('points').insert([point]).select('id').single();
export const deletePointById = (id: number) => supabase.from('points').delete().eq('id', id);
export const updatePointById = (id: number, updates: Partial<PointRow>) => supabase.from('points').update(updates).eq('id', id);
