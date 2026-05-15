import { useState } from "react";
import "./RoutePanel.css";

export default function RoutePanel({
  waypoints,
  onRemoveWaypoint,
  onAddWaypoint,
  onBuild,
  building,
  onClose,
  pickMode,
  showHeader = true,
}) {
  const [minimized, setMinimized] = useState(false);
  const start = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const canOpenRoute = waypoints.length >= 2;

  return (
    <div className="route-panel p-panel fade-in">
      {showHeader && <div className="route-panel-header"><span className="rp-title">Маршрут</span><div className="rp-header-actions"><button className="rp-icon-btn" onClick={() => setMinimized((v) => !v)}>{minimized ? "▴" : "▾"}</button><button className="rp-icon-btn" onClick={onClose}>✕</button></div></div>}
      {!minimized && (
        <>
          <div className={`rp-pick-hint ${pickMode ? "active" : ""}`}>{pickMode ? "Оберіть точки у списку нижче або торкніться маркера на мапі." : "Вкажіть старт і пункт призначення, щоб відкрити маршрут у Google Maps."}</div>
          <div className="rp-waypoints">
            <div className="rp-waypoint-row"><div className="rp-wp-dot" /><div className="rp-wp-name">Старт: {start?.name || "не обрано"}</div>{start && <button className="rp-icon-btn" onClick={() => onRemoveWaypoint(0)}>✕</button>}</div>
            <div className="rp-waypoint-row"><div className="rp-wp-dot" /><div className="rp-wp-name">Фініш: {destination?.name || "не обрано"}</div>{destination && waypoints.length > 1 && <button className="rp-icon-btn" onClick={() => onRemoveWaypoint(waypoints.length - 1)}>✕</button>}</div>
            <button className={`rp-add-stop-btn ${pickMode ? "active" : ""}`} onClick={onAddWaypoint}>{pickMode ? "Режим вибору увімкнено" : "Обрати точки"}</button>
          </div>
          {!canOpenRoute && <div className="rp-empty" style={{ margin: "0 12px 12px" }}>Оберіть старт і фініш у списку точок, щоб побудувати маршрут у Google Maps.</div>}
          <button className="rp-build-btn" onClick={onBuild} disabled={building || !canOpenRoute}>{building ? "Відкриваємо..." : "Відкрити маршрут у Google Maps"}</button>
        </>
      )}
    </div>
  );
}
