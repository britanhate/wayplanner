import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Point } from '../../../shared/types/domain';
import { fetchPoints, insertPoint, deletePointById, updatePointById } from '../api';

type UsePointsResult = {
  points: Point[];
  loading: boolean;
  addPoint: (point: Partial<Point>) => Promise<void>;
  deletePoint: (id: number) => Promise<void>;
  updatePoint: (id: number, updates: Partial<Point>) => Promise<void>;
};

export function usePoints(tripId?: string | null): UsePointsResult {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoints(tripId).then(({ data }) => {
      setPoints((data as Point[]) || []);
      setLoading(false);
    });

    const channel = supabase
      .channel('points-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'points' }, payload =>
        setPoints(prev => [...prev, payload.new as Point]),
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'points' }, payload =>
        setPoints(prev => prev.filter(p => p.id !== payload.old.id)),
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'points' }, payload =>
        setPoints(prev => prev.map(p => (p.id === payload.new.id ? (payload.new as Point) : p))),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  const addPoint = async (point: Partial<Point>) => {
    const { error } = await insertPoint(point);
    if (error) throw error;
  };

  const deletePoint = async (id: number) => {
    const { error } = await deletePointById(id);
    if (error) throw error;
  };

  const updatePoint = async (id: number, updates: Partial<Point>) => {
    const { error } = await updatePointById(id, updates);
    if (error) throw error;
  };

  return { points, loading, addPoint, deletePoint, updatePoint };
}
