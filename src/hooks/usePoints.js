import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePoints() {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    supabase
      .from('points')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setPoints(data || [])
        setLoading(false)
      })

    // Real-time subscription
    const channel = supabase
      .channel('points-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'points' },
        payload => setPoints(prev => [...prev, payload.new]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'points' },
        payload => setPoints(prev => prev.filter(p => p.id !== payload.old.id)))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'points' },
        payload => setPoints(prev => prev.map(p => p.id === payload.new.id ? payload.new : p)))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const addPoint = async (point) => {
    const { error } = await supabase.from('points').insert([point])
    if (error) throw error
  }

  const deletePoint = async (id) => {
    const { error } = await supabase.from('points').delete().eq('id', id)
    if (error) throw error
  }

  const updatePoint = async (id, updates) => {
    const { error } = await supabase.from('points').update(updates).eq('id', id)
    if (error) throw error
  }

  return { points, loading, addPoint, deletePoint, updatePoint }
}
