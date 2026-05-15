import CalciteIcon from "../../../shared/ui/CalciteIcon";

export default function NearbyPlacesPanel({
  category,
  onCategoryChange,
  categories,
  loading,
  places,
  onAdd,
  onClose,
}) {
  return (
    <section className="nearby-panel p-panel fade-in">
      <div className="route-panel-header">
        <span className="rp-title">Що поруч?</span>
        <button className="rp-icon-btn" onClick={onClose} aria-label="Закрити nearby places">
          <CalciteIcon name="close" size={14} />
        </button>
      </div>
      <div className="nearby-chips">
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`badge pressable ${category === item.id ? "badge-secondary" : "badge"}`}
            onClick={() => onCategoryChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <div className="nearby-empty">Пошук місць поруч...</div>}
      {!loading && !places.length && <div className="nearby-empty">Поруч нічого не знайдено.</div>}

      {!loading && places.length > 0 && (
        <div className="nearby-list">
          {places.map((place) => (
            <article className="nearby-card" key={place.id}>
              <div className="nearby-title">{place.name}</div>
              <div className="nearby-meta">{place.category} • {place.distanceText}</div>
              {place.address && <div className="nearby-addr">{place.address}</div>}
              {place.openingHours && <div className="nearby-addr">{place.openingHours}</div>}
              {place.rating ? <div className="nearby-addr">★ {place.rating}</div> : null}
              <button type="button" className="metro-open-btn" onClick={() => onAdd(place)}>
                Додати в точки
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
