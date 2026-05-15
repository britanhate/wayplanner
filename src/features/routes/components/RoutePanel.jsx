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
          <button
            className="rp-icon-btn"
            aria-label={`Видалити ${label.toLowerCase()}`}
            onClick={() => onRemoveWaypoint(isStart ? 0 : waypoints.length - 1)}
          >
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
      <ol className="rp-steps-flow">
        <li className={start ? "done" : ""}>Оберіть старт</li>
        <li className={destination ? "done" : ""}>Оберіть пункт призначення</li>
        <li className={canOpenRoute ? "done" : ""}>Відкрийте маршрут у Google Maps</li>
      </ol>

      <div className="rp-waypoints">
        {renderPointCard("Старт", start, true)}
        {renderPointCard("Пункт призначення", destination, false)}

        <div className="rp-actions-row">
          <button className={`rp-add-stop-btn ${pickMode ? "active" : ""}`} aria-label="Обрати точки маршруту" onClick={onAddWaypoint}>
            {pickMode ? "Вибір точки..." : "Обрати точки"}
          </button>
          <button className="rp-outline-btn" aria-label="Поміняти точки місцями" onClick={onSwap} disabled={!canSwap}>Поміняти місцями</button>
          <button className="rp-outline-btn" aria-label="Очистити точки маршруту" onClick={onClear} disabled={!canClear}>Очистити</button>
        </div>
      </div>

      {!canOpenRoute && (
        <div className="rp-empty">
          Спочатку оберіть дві точки: старт і пункт призначення.
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
