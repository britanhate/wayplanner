import { useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { useNotes } from "../../hooks/useNotes";

export default function NotesView() {
  const { user } = useAuth();
  const { notes, addNote, updateNote, deleteNote } = useNotes(user?.id);
  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [listOpen, setListOpen] = useState(false);

  const handleNew = async () => {
    const n = await addNote({ title: "", body: "", userId: user.id });
    if (n) {
      setActiveId(n.id);
      setTitle("");
      setBody("");
      setListOpen(false);
    }
  };

  const handleSelect = (n) => {
    setActiveId(n.id);
    setTitle(n.title || "");
    setBody(n.body || "");
    setListOpen(false);
  };

  const handleUpdate = async (field, val) => {
    if (!activeId) return;
    if (field === "title") setTitle(val);
    else setBody(val);
    await updateNote(activeId, {
      title: field === "title" ? val : title,
      body: field === "body" ? val : body,
    });
  };

  const handleDelete = async () => {
    if (!activeId) return;
    await deleteNote(activeId);
    setActiveId(null);
    setTitle("");
    setBody("");
  };

  const preview = (text) => {
    const lines = (text || "").split("\n").filter((l) => l.trim());
    return lines[0] || "Порожня нотатка";
  };

  return (
    <div className="notes-view">
      <aside className={`notes-list-panel ${listOpen ? "open" : ""}`}>
        <div className="notes-list-header">
          <span className="section-title" style={{ margin: 0 }}>Нотатки</span>
          <button className="btn-ghost" onClick={handleNew}>+ Нова</button>
        </div>
        <div className="notes-list-scroll">
          {!notes.length ? (
            <div className="notes-empty-hint">Натисніть «+ Нова»</div>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                className={`note-item ${n.id === activeId ? "active" : ""}`}
                onClick={() => handleSelect(n)}
              >
                <div className="note-item-title">{n.title || "Без заголовку"}</div>
                <div className="note-item-preview">{preview(n.body)}</div>
                <div className="note-item-date">
                  {new Date(n.created_at).toLocaleDateString("uk-UA")}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <div className="notes-editor">
        <button
          className="notes-list-toggle"
          onClick={() => setListOpen((v) => !v)}
          aria-label="Список нотаток"
        >
          ☰
        </button>

        {!activeId ? (
          <div className="notes-placeholder">
            <div className="notes-placeholder-icon">📓</div>
            <div className="notes-placeholder-text">Оберіть або створіть нотатку</div>
            <button className="btn-primary" onClick={handleNew} style={{ marginTop: 16 }}>
              + Нова нотатка
            </button>
          </div>
        ) : (
          <>
            <div className="note-editor-header">
              <input
                className="note-title-inp"
                value={title}
                onChange={(e) => handleUpdate("title", e.target.value)}
                placeholder="Заголовок..."
              />
              <button className="note-del-btn" onClick={handleDelete}>🗑</button>
            </div>
            <textarea
              className="note-body-inp"
              value={body}
              onChange={(e) => handleUpdate("body", e.target.value)}
              placeholder="Пишіть тут свої плани, ідеї, списки..."
            />
          </>
        )}
      </div>

      {listOpen && (
        <div className="notes-overlay" onClick={() => setListOpen(false)} />
      )}
    </div>
  );
}