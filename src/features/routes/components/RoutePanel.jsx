import "./RoutePanel.css";

export default function RoutePanel({
  waypoints,
  onRemoveWaypoint,
  onAddWaypoint,
  onBuild,
  building,
  pickMode,
  pickTarget,
  onSwap,
  onClear,
  showHeader = true,
}) {
  const start = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const canOpenRoute = waypoints.length >= 2;
  const canSwap = waypoints.length >= 2;
  const canClear = waypoints.length > 0;
  const isPickingStart = pickMode && pickTarget === "start";
  const isPickingDestination = pickMode && pickTarget === "finish";

  const renderPointCard = (label, point, isStart) => (
    <div className={`rp-point-card ${isStart ? "start" : "destination"}`}>
      <div className="rp-point-head">
        <span className="rp-point-label">{label}</span>
        {point && (
          <button className="rp-icon-btn" onClick={() => onRemoveWaypoint(isStart ? 0 : waypoints.length - 1)}>
            ✕
          </button>
        )}
      </div>
      <div className={`rp-point-value ${!point ? "is-empty" : ""}`}>{point?.name || "Не обрано"}</div>
    </div>
  );

  return (
    <div className="route-panel p-panel fade-in">
      {showHeader && (
        <div className="route-panel-header">
          <span className="rp-title">Маршрут</span>
        </div>
      )}

      <div className={`rp-pick-hint ${pickMode ? "active" : ""}`}>
        {isPickingStart && "Оберіть стартову точку зі списку."}
        {isPickingDestination && "Оберіть точку призначення зі списку."}
        {!pickMode && "Вкажіть старт і пункт призначення, щоб відкрити маршрут у Google Maps."}
      </div>

      <div className="rp-waypoints">
        {renderPointCard("Старт", start, true)}
        {renderPointCard("Пункт призначення", destination, false)}

        <div className="rp-actions-row">
          <button className={`rp-add-stop-btn ${pickMode ? "active" : ""}`} onClick={onAddWaypoint}>
            {pickMode ? "Вибір точки..." : "Обрати точки"}
          </button>
          <button className="rp-outline-btn" onClick={onSwap} disabled={!canSwap}>Поміняти місцями</button>
          <button className="rp-outline-btn" onClick={onClear} disabled={!canClear}>Очистити</button>
        </div>
      </div>

      {!canOpenRoute && (
        <div className="rp-empty">
          Оберіть старт і фініш у списку точок.
        </div>
      )}

      <button className="rp-build-btn" onClick={onBuild} disabled={building || !canOpenRoute}>
        {building ? "Відкриваємо..." : "Відкрити маршрут у Google Maps"}
      </button>
      <div className="rp-google-hint">
        Маршрут громадським транспортом відкриється в Google Maps
      </div>
    </div>
  );
}
