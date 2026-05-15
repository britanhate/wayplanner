import { useState } from "react";
import {
  TRAVEL_MODES,
  summarizeRoute,
  formatDuration,
  formatDistance,
} from "./routePanelUtils";
import "./RoutePanel.css";

const TYPE_ICON = {
  walk: "🚶",
  bus: "🚌",
  metro: "🚇",
  subway: "🚇",
  train: "🚆",
  tram: "🚃",
  car: "🚗",
  transit: "🧭",
  unknown: "📍",
};

export default function RoutePanel({
  waypoints,
  onRemoveWaypoint,
  onAddWaypoint,
  onBuild,
  result,
  building,
  onClose,
  pickMode,
  showHeader = true,
  onSegmentSelect,
  activeSegmentId,
}) {
  const [travelMode, setTravelMode] = useState(3);
  const [minimized, setMinimized] = useState(false);

  const summary = summarizeRoute(result);

  return (
    <div className="route-panel p-panel fade-in">
      {showHeader && <div className="route-panel-header"><span className="rp-title">Маршрут</span><div className="rp-header-actions"><button className="rp-icon-btn" onClick={() => setMinimized((v) => !v)}>{minimized ? "▴" : "▾"}</button><button className="rp-icon-btn" onClick={onClose}>✕</button></div></div>}
      {!minimized && (
        <>
          <div className={`rp-pick-hint ${pickMode ? "active" : ""}`}>{pickMode ? "Оберіть точки у списку нижче або торкніться маркера на мапі." : "Керуй послідовністю точок маршруту вручну."}</div>
          <div className="rp-mode-tabs">{TRAVEL_MODES.map((m) => <button key={m.id} className={`rp-mode-tab ${travelMode === m.id ? "active" : ""}`} onClick={() => setTravelMode(m.id)}><span dangerouslySetInnerHTML={{ __html: m.icon }} /><span>{m.label}</span></button>)}</div>
          <div className="rp-waypoints">{waypoints.map((wp, i) => <div key={wp.id} className="rp-waypoint-row"><div className="rp-wp-dot" /><div className="rp-wp-name">{wp.name}</div><button className="rp-icon-btn" onClick={() => onRemoveWaypoint(i)}>✕</button></div>)}<button className={`rp-add-stop-btn ${pickMode ? "active" : ""}`} onClick={onAddWaypoint}>{pickMode ? "Режим вибору увімкнено" : "Додати точку"}</button></div>
          <button className="rp-build-btn" onClick={() => onBuild(travelMode)} disabled={building || waypoints.length < 2}>{building ? "Будуємо..." : "Знайти маршрут"}</button>

          {result && (
            <div className="rp-results">
              {summary && (
                <div className="rp-summary-bar">
                  <span className="rp-summary-dur">{formatDuration(summary.dur)}</span>
                  <span className="rp-summary-dist">{formatDistance(summary.dist)}</span>
                  <span className="rp-summary-via">Пересадки: {result.transfers ?? 0}</span>
                </div>
              )}
              <div className="rp-steps">
                {result.segments?.map((step, idx) => (
                  <button key={step.id || idx} className={`rp-segment-card ${activeSegmentId === step.id ? "active" : ""}`} onClick={() => onSegmentSelect?.(step)}>
                    <div className="rp-step-line-wrap"><div className="rp-step-dot" style={{ background: step.color || "#0a84ff" }} />{idx < result.segments.length - 1 && <div className="rp-step-line" />}</div>
                    <div className="rp-step-content">
                      <div className="rp-step-main"><span className="rp-step-icon">{TYPE_ICON[step.type] || TYPE_ICON.unknown}</span><div><div className="rp-step-title">{step.instruction || step.lineName || "Крок маршруту"}</div><div className="rp-step-op">{[step.lineNumber || step.lineName, step.headsign].filter(Boolean).join(" · ") || "Дані уточнюються"}</div></div><div className="rp-step-dur">{step.durationText || "—"}</div></div>
                      <div className="rp-stop-row">{step.fromName || "Точка посадки невідома"} → {step.toName || "Точка виходу невідома"}</div>
                      <div className="rp-stop-mid">{step.distanceText || "—"}{step.stopsCount != null ? ` · ${step.stopsCount} зуп.` : ""}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
