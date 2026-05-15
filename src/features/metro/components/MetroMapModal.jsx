import { useEffect, useRef } from "react";
import CalciteIcon from "../../../shared/ui/CalciteIcon";

const ZOOM_LEVELS = [1, 1.25, 1.5, 2, 3];

const getTouchDistance = (touchA, touchB) => {
  const dx = touchA.clientX - touchB.clientX;
  const dy = touchA.clientY - touchB.clientY;
  return Math.hypot(dx, dy);
};

const clampScale = (value) => {
  if (value <= ZOOM_LEVELS[0]) return ZOOM_LEVELS[0];
  if (value >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]) return ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

  return ZOOM_LEVELS.reduce((closest, level) => {
    const currentDiff = Math.abs(level - value);
    const bestDiff = Math.abs(closest - value);
    return currentDiff < bestDiff ? level : closest;
  }, ZOOM_LEVELS[0]);
};

export default function MetroMapModal({
  city,
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onScaleChange,
  onClose,
}) {
  const imageWrapRef = useRef(null);
  const pinchStateRef = useRef({
    startDistance: null,
    startScale: 1,
  });

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    const wrap = imageWrapRef.current;
    if (!wrap) return undefined;

    const onTouchStart = (event) => {
      if (event.touches.length !== 2) return;
      pinchStateRef.current.startDistance = getTouchDistance(event.touches[0], event.touches[1]);
      pinchStateRef.current.startScale = scale;
    };

    const onTouchMove = (event) => {
      if (event.touches.length !== 2 || !pinchStateRef.current.startDistance) return;
      event.preventDefault();

      const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
      const ratio = currentDistance / pinchStateRef.current.startDistance;
      const nextScale = clampScale(pinchStateRef.current.startScale * ratio);
      if (nextScale !== scale) {
        onScaleChange(nextScale);
      }
    };

    const onTouchEnd = () => {
      pinchStateRef.current.startDistance = null;
      pinchStateRef.current.startScale = scale;
    };

    wrap.addEventListener("touchstart", onTouchStart, { passive: true });
    wrap.addEventListener("touchmove", onTouchMove, { passive: false });
    wrap.addEventListener("touchend", onTouchEnd, { passive: true });
    wrap.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      wrap.removeEventListener("touchstart", onTouchStart);
      wrap.removeEventListener("touchmove", onTouchMove);
      wrap.removeEventListener("touchend", onTouchEnd);
      wrap.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [scale, onScaleChange]);

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
          <div className="metro-modal-header-left">
            <button className="metro-modal-close" onClick={onClose} aria-label="Close metro map">
              <CalciteIcon name="close" size={17} />
            </button>
            <div className="metro-modal-title">{city.name} Metro</div>
          </div>
          <div className="metro-modal-controls">
            <button onClick={onZoomIn} disabled={scale === maxScale} aria-label="Zoom in"><CalciteIcon name="add" /></button>
            <button onClick={onZoomOut} disabled={scale === minScale} aria-label="Zoom out"><CalciteIcon name="minus" /></button>
            <button onClick={onResetZoom} disabled={scale === 1} aria-label="Reset zoom"><CalciteIcon name="reset" /></button>
          </div>
        </div>

        <div ref={imageWrapRef} className="metro-modal-image-wrap">
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
