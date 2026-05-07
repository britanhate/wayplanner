import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useNotes(userId) {
  const [notes, setNotes] = useState([])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('notes')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setNotes(data || []))

    const channel = supabase
      .channel('notes-changes-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes',
        filter: `created_by=eq.${userId}` },
        () => {
          supabase.from('notes').select('*').eq('created_by', userId)
            .order('created_at', { ascending: false })
            .then(({ data }) => setNotes(data || []))
        })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  const addNote = async ({ title, body, userId }) => {
    const { error } = await supabase.from('notes').insert([{
      title, body, created_by: userId,
    }])
    if (error) throw error
  }

  const updateNote = async (id, { title, body }) => {
    const { error } = await supabase.from('notes').update({ title, body }).eq('id', id)
    if (error) throw error
  }

  const deleteNote = async (id) => {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) throw error
  }

  return { notes, addNote, updateNote, deleteNote }
}
