import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { fetchNotesByUser, insertNote, updateNoteById, deleteNoteById } from '../api'

const PAGE_SIZE = 30

export function useNotes(userId) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const loadNotesPage = useCallback(async (pageToLoad = 0, append = false) => {
    if (!userId) return
    const from = pageToLoad * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data } = await fetchNotesByUser(userId, { from, to })
    const nextData = data || []
    setHasMore(nextData.length === PAGE_SIZE)
    setNotes((prev) => (append ? [...prev, ...nextData] : nextData))
  }, [userId])

  const refresh = useCallback(async () => {
    setLoading(true)
    setPage(0)
    await loadNotesPage(0, false)
    setLoading(false)
  }, [loadNotesPage])

  const loadMore = useCallback(async () => {
    const nextPage = page + 1
    await loadNotesPage(nextPage, true)
    setPage(nextPage)
  }, [loadNotesPage, page])

  useEffect(() => {
    if (!userId) return
    let active = true

    refresh()

    const channel = supabase
      .channel('notes-changes-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes',
        filter: `created_by=eq.${userId}` },
      () => {
        if (active) refresh()
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [userId, refresh])

  const addNote = async ({ title, body, userId }) => {
    const { data, error } = await insertNote({ title, body, userId })
    if (error) throw error
    return data?.[0] || null
  }

  const updateNote = async (id, { title, body }) => {
    const { error } = await updateNoteById(id, { title, body })
    if (error) throw error
  }

  const deleteNote = async (id) => {
    const { error } = await deleteNoteById(id)
    if (error) throw error
  }

  return { notes, loading, hasMore, loadMore, addNote, updateNote, deleteNote }
}
