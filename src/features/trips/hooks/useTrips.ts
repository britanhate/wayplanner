import { useCallback, useEffect, useState } from 'react';
import { createTrip, fetchTrips, renameTrip } from '../api';

export type Trip = {
  id: string;
  created_by: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export function useTrips(userId?: string | null) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  const ensureDefaultTrip = useCallback(async () => {
    if (!userId) return null;
    const { data } = await fetchTrips(userId);
    const existing = (data as Trip[]) || [];
    if (existing.length) {
      setTrips(existing);
      setActiveTrip((prev) => prev && existing.find((t) => t.id === prev.id) ? prev : existing[0]);
      return existing[0];
    }
    const { data: created } = await createTrip({ created_by: userId, name: 'My Trip' });
    if (created) {
      setTrips([created as Trip]);
      setActiveTrip(created as Trip);
      return created as Trip;
    }
    return null;
  }, [userId]);

  useEffect(() => {
    ensureDefaultTrip();
  }, [ensureDefaultTrip]);

  const addTrip = async (name: string) => {
    if (!userId || !name.trim()) return;
    const { data, error } = await createTrip({ created_by: userId, name: name.trim() });
    if (error) throw error;
    const next = data as Trip;
    setTrips((prev) => [...prev, next]);
    setActiveTrip(next);
  };

  const updateTripName = async (id: string, name: string) => {
    if (!name.trim()) return;
    const { error } = await renameTrip(id, name.trim());
    if (error) throw error;
    setTrips((prev) => prev.map((trip) => (trip.id === id ? { ...trip, name: name.trim() } : trip)));
    setActiveTrip((prev) => (prev?.id === id ? { ...prev, name: name.trim() } : prev));
  };

  return { trips, activeTrip, setActiveTrip, addTrip, updateTripName, ensureDefaultTrip };
}
