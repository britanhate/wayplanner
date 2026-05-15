import "./RoutePanel.css";

export default function RoutePanel({
  start,
  destination,
  onPickStart,
  onPickDestination,
  onBuild,
  building,
  pickMode,
  pickTarget,
  onSwap,
  onClear,
  showHeader = true,
}) {
  const canOpenRoute = Boolean(start && destination);
  const canSwap = canOpenRoute;
  const canClear = Boolean(start || destination);
  const isPickingStart = pickMode && pickTarget === "start";
  const isPickingDestination = pickMode && pickTarget === "destination";

  const renderPointCard = (label, point, isStart) => (
    <button
      type="button"
      className={`rp-point-card ${isStart ? "start" : "destination"} ${(pickMode && ((isStart && pickTarget === "start") || (!isStart && pickTarget === "destination"))) ? "is-active" : ""}`}
      onClick={isStart ? onPickStart : onPickDestination}
    >
      <div className="rp-point-head"><span className="rp-point-label">{label}</span></div>
      <div className={`rp-point-value ${!point ? "is-empty" : ""}`}>{point?.name || (isStart ? "Оберіть старт" : "Оберіть пункт призначення")}</div>
    </button>
  );

  return (
    <div className="route-panel p-panel fade-in">
      {showHeader && <div className="route-panel-header"><span className="rp-title">Маршрут</span><button className="rp-icon-btn" aria-label="Очистити маршрут" onClick={onClear} disabled={!canClear}>🗑</button></div>}
      <div className={`rp-pick-hint ${pickMode ? "active" : ""}`}>
        {isPickingStart && "Selecting start"}
        {isPickingDestination && "Selecting destination"}
        {!pickMode && "Оберіть старт і пункт призначення."}
      </div>
      <div className="rp-waypoints">
        {renderPointCard("Старт", start, true)}
        <button className="rp-swap-compact" aria-label="Поміняти місцями" onClick={onSwap} disabled={!canSwap}>⇅</button>
        {renderPointCard("Пункт призначення", destination, false)}
      </div>
      {!canOpenRoute && <div className="rp-empty">Спочатку оберіть дві точки: старт і пункт призначення.</div>}
      <button className="rp-build-btn" onClick={onBuild} disabled={building || !canOpenRoute}>{building ? "Відкриваємо..." : "Відкрити маршрут у Google Maps"}</button>
      <div className="rp-google-hint">Маршрут громадським транспортом відкриється в Google Maps</div>
    </div>
  );
}
