import { useState } from "react";
import { METRO_MAPS } from "./metroMaps";

export default function MetroPanel() {
  const [selectedId, setSelectedId] = useState(METRO_MAPS[0].id);
  const [imageErrors, setImageErrors] = useState({});

  const selected = METRO_MAPS.find((item) => item.id === selectedId) || METRO_MAPS[0];

  const hasImage = (id) => !imageErrors[id];

  return (
    <aside className="sidebar p-panel fade-in metro-panel">
      <div className="section">
        <div className="section-title">Метро</div>
      </div>

      <div className="metro-selected-preview">
        <div className="metro-selected-title">{selected.name} Metro</div>
        {hasImage(selected.id) ? (
          <img
            src={selected.image}
            alt={`${selected.name} metro map`}
            className="metro-preview-large"
            onError={() => setImageErrors((prev) => ({ ...prev, [selected.id]: true }))}
          />
        ) : (
          <div className="metro-preview-fallback">Схема метро ще не додана</div>
        )}
      </div>

      <div className="metro-list">
        {METRO_MAPS.map((item) => (
          <button
            key={item.id}
            className={`metro-card ${selectedId === item.id ? "active" : ""}`}
            onClick={() => setSelectedId(item.id)}
          >
            <div className="metro-card-title">{item.name} Metro</div>
            {hasImage(item.id) ? (
              <img
                src={item.image}
                alt={`${item.name} metro thumbnail`}
                className="metro-thumb"
                onError={() => setImageErrors((prev) => ({ ...prev, [item.id]: true }))}
              />
            ) : (
              <div className="metro-thumb metro-thumb-fallback">Схема метро ще не додана</div>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
