import { supabase } from '../../lib/supabase';

export const TRIP_FIELDS = 'id, created_by, name, description, start_date, end_date, created_at, updated_at';

export const fetchTrips = (userId: string) =>
  supabase.from('trips').select(TRIP_FIELDS).eq('created_by', userId).order('created_at', { ascending: true });

export const createTrip = (payload: Record<string, unknown>) =>
  supabase.from('trips').insert([payload]).select(TRIP_FIELDS).single();

export const renameTrip = (id: string, name: string) =>
  supabase.from('trips').update({ name, updated_at: new Date().toISOString() }).eq('id', id);
