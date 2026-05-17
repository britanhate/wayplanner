import { useState } from "react";
import { POINT_TYPES, CURRENCIES } from "../../../lib/constants";
import CalciteIcon from "../../../shared/ui/CalciteIcon";
import { PLACE_TYPE_ICONS } from "../../../lib/calciteIcons";

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

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (!files) return;

    for (let file of files) {
      if (!file.type.startsWith("image/")) continue;

      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments((prev) => [
          ...prev,
          { data: event.target.result, name: file.name, type: file.type },
        ]);
      };
      reader.readAsDataURL(file);
    }

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
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal-box scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Нова точка</div>
          <button className="modal-close btn btn-icon" onClick={onClose}><CalciteIcon name="close" size={20} /></button>
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
            <div className="field-addr"><CalciteIcon name="pin" size={16} /> {geocoded.addr}</div>
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
                <CalciteIcon name={PLACE_TYPE_ICONS[key] || "pin"} size={16} /> {t.label}
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
            <div className="flex-1">
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
            <div className="flex-1">
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

          <label className="field-label">Фото</label>
          <label className="file-upload-btn">
            <CalciteIcon name="add" size={16} /> Вибрати фото
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
            />
          </label>

          {attachments.length > 0 && (
            <div className="attachments-grid">
              {attachments.map((att, idx) => (
                <div key={idx} className="attachment-thumb-wrap">
                  <img
                    className="attachment-thumb"
                    src={att.data}
                    alt={att.name}
                  />
                  <button
                    className="attachment-remove"
                    onClick={() => handleRemoveAttachment(idx)}
                  ><CalciteIcon name="close" size={16} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="check-row" onClick={() => setIsCompleted((v) => !v)}>
            <input
              type="checkbox"
              id="isCompleted"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <label htmlFor="isCompleted">Завдання виконано</label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Скасувати</button>
          <button
            className="btn btn-primary"
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