import { useState } from "react";
import { POINT_TYPES, CURRENCIES } from "../../lib/constants";

export default function AddPointModal({ position, geocoded, onSave, onClose }) {
  const [name, setName] = useState(geocoded?.name || "");
  const [type, setType] = useState("sight");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [comment, setComment] = useState("");
  const [pointDate, setPointDate] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");

  const handleAddAttachment = () => {
    if (newAttachmentUrl.trim()) {
      setAttachments([
        ...attachments,
        {
          url: newAttachmentUrl.trim(),
          name: newAttachmentUrl.split("/").pop(),
        },
      ]);
      setNewAttachmentUrl("");
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files) return;

    for (let file of files) {
      // Only accept image files
      if (!file.type.startsWith("image/")) {
        alert("Будь ласка, виберіть тільки зображення");
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        setAttachments([
          ...attachments,
          {
            data: base64,
            name: file.name,
            type: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    // Reset file input
    e.target.value = "";
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      type,
      description: description.trim(),
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
      currency,
      comment: comment.trim(),
      point_date: pointDate || null,
      is_completed: isCompleted,
      attachments,
      lat: position.lat,
      lng: position.lng,
      addr: geocoded?.addr || null,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Нова точка</div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <label className="field-label">Назва *</label>
          <input
            className="field-inp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Назва місця..."
            autoFocus
          />

          {geocoded?.addr && (
            <div className="field-addr">📍 {geocoded.addr}</div>
          )}

          <label className="field-label">Тип</label>
          <div className="type-row">
            {Object.entries(POINT_TYPES).map(([key, t]) => (
              <button
                key={key}
                className={`type-chip ${type === key ? "selected" : ""}`}
                style={{ "--type-color": t.color }}
                onClick={() => setType(key)}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          <label className="field-label">Опис місця</label>
          <input
            className="field-inp"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Коротко про місце..."
          />

          <div className="field-row">
            <div style={{ flex: 1 }}>
              <label className="field-label">Дата</label>
              <input
                className="field-inp"
                type="date"
                value={pointDate}
                onChange={(e) => setPointDate(e.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div style={{ flex: 1 }}>
              <label className="field-label">Орієнтовна вартість</label>
              <input
                className="field-inp"
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="field-label">Валюта</label>
              <select
                className="field-sel"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="field-label">Коментар</label>
          <textarea
            className="field-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Додаткові нотатки..."
            rows={2}
          />

          <label className="field-label" style={{ marginTop: "12px" }}>
            � Фото
          </label>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              style={{
                flex: 1,
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            />
          </div>

          <label className="field-label">📎 URL приложення (опційно)</label>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <input
              type="text"
              className="field-inp"
              value={newAttachmentUrl}
              onChange={(e) => setNewAttachmentUrl(e.target.value)}
              placeholder="https://example.com/file.pdf"
              onKeyPress={(e) => e.key === "Enter" && handleAddAttachment()}
              style={{ margin: 0 }}
            />
            <button
              type="button"
              onClick={handleAddAttachment}
              style={{
                padding: "8px 14px",
                background: "#2a7de8",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              +
            </button>
          </div>

          {attachments.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}
              >
                {attachments.length} файл/файлів додано
              </div>
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px",
                    background: "#f2f2f7",
                    borderRadius: "6px",
                    marginBottom: "6px",
                    fontSize: "13px",
                  }}
                >
                  {att.type && att.type.startsWith("image/") ? (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "white",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={att.data || att.url}
                        alt={att.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "#ddd",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                      }}
                    >
                      📄
                    </div>
                  )}
                  <span style={{ flex: 1, wordBreak: "break-all" }}>
                    {att.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    style={{
                      background: "#ff3b30",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <input
              type="checkbox"
              id="isCompleted"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              style={{ cursor: "pointer", width: "18px", height: "18px" }}
            />
            <label
              htmlFor="isCompleted"
              style={{
                cursor: "pointer",
                margin: 0,
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              ✓ Завдання виконано
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Скасувати
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Додати точку
          </button>
        </div>
      </div>
    </div>
  );
}
