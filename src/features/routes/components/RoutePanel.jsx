import "./RoutePanel.css";

export default function RoutePanel({
  waypoints,
  onRemoveWaypoint,
  onAddWaypoint,
  onOpenGoogleMaps,
  onClose,
  pickMode,
  showHeader = true,
}) {
  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];

  return (
    <div className="route-panel p-panel fade-in">
      {showHeader && <div className="route-panel-header"><span className="rp-title">Маршрут</span><div className="rp-header-actions"><button className="rp-icon-btn" onClick={onClose}>✕</button></div></div>}
      <div className={`rp-pick-hint ${pickMode ? "active" : ""}`}>{pickMode ? "Оберіть точки у списку нижче або торкніться маркера на мапі." : "Оберіть старт і фініш для відкриття маршруту в Google Maps."}</div>
      <div className="rp-waypoints">{waypoints.map((wp, i) => <div key={wp.id} className="rp-waypoint-row"><div className="rp-wp-dot" /><div className="rp-wp-name">{wp.name}</div><button className="rp-icon-btn" onClick={() => onRemoveWaypoint(i)}>✕</button></div>)}<button className={`rp-add-stop-btn ${pickMode ? "active" : ""}`} onClick={onAddWaypoint}>{pickMode ? "Режим вибору увімкнено" : "Додати точку"}</button></div>
      <div className="rp-results">
        {origin && destination && origin.id !== destination.id ? (
          <button className="rp-build-btn" onClick={onOpenGoogleMaps}>Відкрити маршрут у Google Maps</button>
        ) : (
          <div className="rp-stop-row">Оберіть різні точки старту та призначення для маршруту.</div>
        )}
      </div>
    </div>
  );
}
