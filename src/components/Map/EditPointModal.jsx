import { useState } from "react";
import { POINT_TYPES, CURRENCIES } from "../../lib/constants";

export default function EditPointModal({ point, onSave, onClose }) {
  const [name, setName] = useState(point.name || "");
  const [type, setType] = useState(point.type || "sight");
  const [description, setDescription] = useState(point.description || "");
  const [estimatedCost, setEstimatedCost] = useState(
    point.estimated_cost || "",
  );
  const [currency, setCurrency] = useState(point.currency || "EUR");
  const [comment, setComment] = useState(point.comment || "");
  const [pointDate, setPointDate] = useState(point.point_date || "");

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
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Редагувати точку</div>
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

          {point.addr && <div className="field-addr">📍 {point.addr}</div>}

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
            Зберегти зміни
          </button>
        </div>
      </div>
    </div>
  );
}
