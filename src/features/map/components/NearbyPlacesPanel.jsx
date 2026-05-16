import CalciteIcon from "../../../shared/ui/CalciteIcon";

import { useEffect, useRef } from "react";

export default function NearbyPlacesPanel({
  category,
  onCategoryChange,
  categories,
  loading,
  places,
  onAdd,
  onClose,
  selectedPlace,
  onSelectPlace,
  onBackToList,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!selectedPlace || !listRef.current) return;
    const el = document.getElementById(`nearby-${selectedPlace.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedPlace]);
  return (
    <section className="nearby-panel p-panel fade-in">
      <div className="route-panel-header">
        <span className="rp-title">Що поруч?</span>
        <button className="rp-icon-btn btn btn-icon" onClick={onClose} aria-label="Закрити nearby places">
          <CalciteIcon name="close" size={14} />
        </button>
      </div>
        <div className="nearby-list" ref={listRef}>
          {places.map((place) => (
            <article className="nearby-card" id={`nearby-${place.id}`} key={place.id}>
              <div className="nearby-title">{place.name}</div>
              <div className="nearby-meta">{place.category} • {place.distanceText}</div>
              {place.address && <div className="nearby-addr">{place.address}</div>}
              <button type="button" className="metro-open-btn btn btn-primary" onClick={() => onAdd(place)}>
                Додати точку
              </button>
            </article>
          ))}
        </div>

      {loading && <div className="nearby-empty">Пошук місць поруч...</div>}
      {!loading && !places.length && <div className="nearby-empty">Поруч нічого не знайдено.</div>}

      {!loading && selectedPlace && (
        <article className="nearby-card nearby-card-selected">
          <div className="nearby-title">{selectedPlace.name}</div>
          <div className="nearby-meta">{selectedPlace.category} • {selectedPlace.distanceText}</div>
          {selectedPlace.address && <div className="nearby-addr">{selectedPlace.address}</div>}
          {selectedPlace.openingHours && <div className="nearby-addr">{selectedPlace.openingHours}</div>}
          {selectedPlace.rating ? <div className="nearby-addr">★ {selectedPlace.rating}</div> : null}
          <div className="nearby-actions-row">
            <button type="button" className="rp-icon-btn btn btn-icon" onClick={onBackToList} aria-label="Назад до списку">
              <CalciteIcon name="arrowLeft" size={14} />
            </button>
            <button type="button" className="metro-open-btn btn btn-primary" onClick={() => onAdd(selectedPlace)}>
              Додати в точки
            </button>
          </div>
        </article>
      )}

      {!loading && places.length > 0 && !selectedPlace && (
        <div className="nearby-list">
          {places.map((place) => (
            <article className="nearby-card" key={place.id}>
              <div className="nearby-title">{place.name}</div>
              <div className="nearby-meta">{place.category} • {place.distanceText}</div>
              {place.address && <div className="nearby-addr">{place.address}</div>}
              <button type="button" className="metro-open-btn btn btn-primary" onClick={() => onAdd(place)}>
                Додати точку
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
