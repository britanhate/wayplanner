import { useMemo, useState } from "react";
import { METRO_MAPS } from "../data";
import MetroMapModal from "./MetroMapModal";

const ZOOM_LEVELS = [1, 1.25, 1.5, 2, 3];

export default function MetroPanel() {
  const [imageErrors, setImageErrors] = useState({});
  const [openedCityId, setOpenedCityId] = useState(null);
  const [scale, setScale] = useState(1);

  const openedCity = useMemo(
    () => METRO_MAPS.find((item) => item.id === openedCityId) || null,
    [openedCityId],
  );

  const hasImage = (id) => !imageErrors[id];

  const handleOpen = (cityId) => {
    setOpenedCityId(cityId);
    setScale(1);
  };

  const closeModal = () => {
    setOpenedCityId(null);
    setScale(1);
  };

  const zoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(scale);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setScale(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const zoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(scale);
    if (currentIndex > 0) {
      setScale(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  return (
    <aside className="sidebar p-panel fade-in metro-panel">
      <div className="section">
        <div className="section-title">Метро</div>
      </div>

      <div className="metro-list">
        {METRO_MAPS.map((item) => (
          <article key={item.id} className="metro-card">
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

            <button
              className="metro-open-btn"
              onClick={() => handleOpen(item.id)}
              disabled={!hasImage(item.id)}
            >
              Відкрити схему
            </button>
          </article>
        ))}
      </div>

      {openedCity && (
        <MetroMapModal
          city={openedCity}
          scale={scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={() => setScale(1)}
          onScaleChange={setScale}
          onClose={closeModal}
        />
      )}
    </aside>
  );
}
