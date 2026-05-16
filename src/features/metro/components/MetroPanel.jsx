import { useState } from "react";
import { METRO_MAPS } from "../data";

export default function MetroPanel() {
  const [imageErrors, setImageErrors] = useState({});

  const hasImage = (id) => !imageErrors[id];

  const handleOpen = (cityId) => {
    const selected = METRO_MAPS.find((item) => item.id === cityId);
    if (!selected?.image) return;
    window.open(selected.image, "_blank", "noopener,noreferrer");
  };

  return (
    <aside className="sidebar p-panel fade-in metro-panel">
      <div className="section">
        <div className="section-title">Метро</div>
      </div>

      <div className="metro-list">
        {METRO_MAPS.map((item) => (
          <article
            key={item.id}
            className={`metro-card ${hasImage(item.id) ? "is-clickable" : ""}`}
            onClick={() => hasImage(item.id) && handleOpen(item.id)}
            role={hasImage(item.id) ? "button" : undefined}
            tabIndex={hasImage(item.id) ? 0 : -1}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && hasImage(item.id)) {
                event.preventDefault();
                handleOpen(item.id);
              }
            }}
          >
            <div className="metro-card-title">{item.name}</div>
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

            <div className="metro-open-hint">
              {hasImage(item.id) ? "Натисніть, щоб відкрити схему в новому вікні" : "Схема недоступна"}
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
