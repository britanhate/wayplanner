import { useEffect } from "react";

const ZOOM_LEVELS = [1, 1.25, 1.5, 2, 3];

export default function MetroMapModal({ city, scale, onZoomIn, onZoomOut, onResetZoom, onClose }) {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!city) return null;

  const minScale = ZOOM_LEVELS[0];
  const maxScale = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

  return (
    <div className="metro-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="metro-modal-viewer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${city.name} metro map viewer`}
      >
        <div className="metro-modal-header">
          <div className="metro-modal-title">{city.name}</div>
          <button className="metro-modal-close" onClick={onClose} aria-label="Close metro map">
            ✕
          </button>
        </div>

        <div className="metro-modal-controls">
          <button onClick={onZoomOut} disabled={scale === minScale}>−</button>
          <button onClick={onZoomIn} disabled={scale === maxScale}>+</button>
          <button onClick={onResetZoom} disabled={scale === 1}>Reset</button>
        </div>

        <div className="metro-modal-image-wrap">
          <img
            src={city.image}
            alt={`${city.name} metro map`}
            className="metro-modal-image"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      </div>
    </div>
  );
}
