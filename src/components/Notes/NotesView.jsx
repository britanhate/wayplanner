import { useState } from 'react'
import { useAuth } from '../../lib/AuthContext'
import { useNotes } from '../../hooks/useNotes'

export default function NotesView() {
  const { user } = useAuth()
  const { notes, addNote, updateNote, deleteNote } = useNotes(user?.id)
  const [activeId, setActiveId] = useState(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const activeNote = notes.find(n => n.id === activeId)

  const handleNew = async () => {
    await addNote({ title: '', body: '', userId: user.id })
  }

  const handleSelect = (n) => {
    setActiveId(n.id)
    setTitle(n.title || '')
    setBody(n.body || '')
  }

  const handleUpdate = async (field, val) => {
    if (!activeId) return
    if (field === 'title') setTitle(val)
    else setBody(val)
    await updateNote(activeId, {
      title: field === 'title' ? val : title,
      body: field === 'body' ? val : body,
    })
  }

  const handleDelete = async () => {
    if (!activeId) return
    await deleteNote(activeId)
    setActiveId(null)
  }

  return (
    <div className="notes-view">
      <div className="notes-list-panel">
        <div className="notes-list-header">
          <span className="sidebar-section-title" style={{ margin: 0 }}>Нотатки</span>
          <button className="icon-btn" onClick={handleNew}>+ Нова</button>
        </div>
        <div className="notes-list-scroll">
          {!notes.length
            ? <div className="empty-hint">Натисніть "+ Нова"</div>
            : notes.map(n => (
              <div key={n.id}
                className={`note-item ${n.id === activeId ? 'active' : ''}`}
                onClick={() => handleSelect(n)}>
                <div className="note-item-title">{n.title || 'Без заголовку'}</div>
                <div className="note-item-preview">{n.body}</div>
                <div className="note-date">{new Date(n.created_at).toLocaleDateString('uk-UA')}</div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="notes-editor">
        {!activeId
          ? <div className="notes-empty"><span style={{ fontSize: 40, opacity: .3 }}>📓</span><span>Оберіть або створіть нотатку</span></div>
          : <>
            <div className="note-editor-header">
              <input className="note-title-inp" value={title}
                onChange={e => handleUpdate('title', e.target.value)}
                placeholder="Заголовок нотатки..." />
              <button className="note-del-btn" onClick={handleDelete}>🗑</button>
            </div>
            <textarea className="note-body-inp" value={body}
              onChange={e => handleUpdate('body', e.target.value)}
              placeholder="Пишіть тут свої плани, ідеї, списки..." />
          </>
        }
      </div>
    </div>
  )
}
