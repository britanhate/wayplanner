import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { fetchNotesByUser, insertNote, updateNoteById, deleteNoteById } from '../api'

export function useNotes(userId) {
  const [notes, setNotes] = useState([])

  useEffect(() => {
    if (!userId) return
    fetchNotesByUser(userId)
      .then(({ data }) => setNotes(data || []))

    const channel = supabase
      .channel('notes-changes-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes',
        filter: `created_by=eq.${userId}` },
        () => {
          fetchNotesByUser(userId)
            .then(({ data }) => setNotes(data || []))
        })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  const addNote = async ({ title, body, userId }) => {
    const { error } = await insertNote({ title, body, userId })
    if (error) throw error
  }

  const updateNote = async (id, { title, body }) => {
    const { error } = await updateNoteById(id, { title, body })
    if (error) throw error
  }

  const deleteNote = async (id) => {
    const { error } = await deleteNoteById(id)
    if (error) throw error
  }

  return { notes, addNote, updateNote, deleteNote }
}
