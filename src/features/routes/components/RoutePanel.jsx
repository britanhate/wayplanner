import "./RoutePanel.css";

export default function RoutePanel({
  routePoints,
  activeRouteIndex,
  onPickRoutePoint,
  onAddPoint,
  onRemovePoint,
  onBuild,
  building,
  onClear,
  onClose,
  showHeader = true,
}) {
  const hasEnoughPoints = routePoints.length >= 2;
  const canOpenRoute = Boolean(routePoints[0] && routePoints[routePoints.length - 1]);
  const canClear = routePoints.some(Boolean);

  const getLabel = (index) => {
    if (index === 0) return "Старт";
    if (index === routePoints.length - 1) return "Фініш";
    return "Точка";
  };

  const getIndicator = (index) => {
    if (index === 0) return "○";
    if (index === routePoints.length - 1) return "◎";
    return "●";
  };

  return (
    <div className="route-panel p-panel fade-in">
      {showHeader && (
        <div className="route-panel-header">
          <span className="rp-title">Маршрут</span>
          <button
            className="rp-icon-btn btn btn-icon"
            aria-label="Закрити маршрут"
            onClick={onClose}
          >
            <calcite-icon icon="x" scale="m" />
          </button>
        </div>
      )}
      <div className="rp-pick-hint">Оберіть старт, точки маршруту та фініш.</div>
      <div className="rp-waypoints">
        {routePoints.map((point, index) => {
          const removable = routePoints.length > 2 && index !== 0 && index !== routePoints.length - 1;
          return (
            <div className="rp-flow-row" key={`route-point-${index}`}>
              <div className="rp-flow-col">
                <span className="rp-flow-indicator">{getIndicator(index)}</span>
                {index < routePoints.length - 1 && <span className="rp-flow-line" />}
              </div>
              <button
                type="button"
                className={`rp-point-card ${index === 0 ? "start" : index === routePoints.length - 1 ? "destination" : "waypoint"} ${activeRouteIndex === index ? "is-active" : ""}`}
                onClick={() => onPickRoutePoint(index)}
              >
                <div className="rp-point-head"><span className="rp-point-label">{getLabel(index)}</span></div>
                <div className={`rp-point-value ${!point ? "is-empty" : ""}`}>{point?.name || `Оберіть: ${getLabel(index).toLowerCase()}`}</div>
              </button>
              {removable && <button type="button" className="rp-remove-btn btn btn-icon" aria-label="Видалити точку" onClick={() => onRemovePoint(index)}>−</button>}
            </div>
          );
        })}
      </div>
      <div className="rp-actions-row">
        <button type="button" className="rp-add-point-btn btn btn-secondary" onClick={onAddPoint}>+ Додати точку</button>
        <button type="button" className="btn btn-ghost rp-clear-route-btn" onClick={onClear} disabled={!canClear}>
          Очистити маршрут
        </button>
      </div>
      {!canOpenRoute && <div className="rp-empty">Спочатку оберіть щонайменше старт і фініш.</div>}
      <button className="rp-build-btn btn btn-primary" onClick={onBuild} disabled={building || !canOpenRoute || !hasEnoughPoints}>{building ? "Відкриваємо..." : "Відкрити маршрут у Google Maps"}</button>
      <div className="rp-google-hint">Маршрут громадським транспортом відкриється в Google Maps</div>
    </div>
  );
}
