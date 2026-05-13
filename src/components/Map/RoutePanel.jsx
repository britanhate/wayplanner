import { useMemo, useState } from "react";

const TRAVEL_MODES = [
  { id: 3, icon: "🚌", label: "Транзит" },
  { id: 2, icon: "🚶", label: "Пішки" },
];

export default function RoutePanel({
  waypoints,
  buildState,
  pickTarget,
  onPickStart,
  onPickFinish,
  onPickStop,
  onRemoveWaypoint,
  onBuild,
  onClose,
  onMinimize,
  minimized,
  result,
  building,
}) {
  const [travelMode, setTravelMode] = useState(3);
  const [openLeg, setOpenLeg] = useState(null);

  const startPoint = waypoints[0] || null;
  const finishPoint = waypoints.length > 1 ? waypoints[waypoints.length - 1] : null;
  const stops = waypoints.length > 2 ? waypoints.slice(1, -1) : [];

  const summary = useMemo(() => {
    if (!result?.legs?.length) return null;
    return result.legs.reduce(
      (acc, leg) => ({ dur: acc.dur + (leg.totalDurSec || 0), dist: acc.dist + (leg.totalDistM || 0) }),
      { dur: 0, dist: 0 },
    );
  }, [result]);

  const fmtDur = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return h > 0 ? `${h} год ${m} хв` : `${m} хв`;
  };

  return (
    <div className="route-panel route-panel-inline">
      <div className="route-panel-header">
        <span className="rp-title">🗺️ Маршрут</span>
        <div className="rp-header-actions">
          <button className="rp-icon-btn" onClick={onMinimize}>{minimized ? "▲" : "—"}</button>
          <button className="rp-icon-btn" onClick={onClose}>×</button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="rp-mode-tabs">
            {TRAVEL_MODES.map((m) => (
              <button key={m.id} className={`rp-mode-tab ${travelMode === m.id ? "active" : ""}`} onClick={() => setTravelMode(m.id)}>
                <span>{m.icon}</span><span>{m.label}</span>
              </button>
            ))}
          </div>

          <div className="rp-select-grid">
            <button className={`rp-select-btn ${pickTarget === "start" ? "active" : ""}`} onClick={onPickStart}>
              <span>Старт</span><strong>{startPoint?.name || "Обрати"}</strong>
            </button>
            <button className={`rp-select-btn ${pickTarget === "finish" ? "active" : ""}`} onClick={onPickFinish}>
              <span>Фініш</span><strong>{finishPoint?.name || "Обрати"}</strong>
            </button>
          </div>

          <button className={`rp-add-stop-btn ${pickTarget === "stop" ? "active" : ""}`} onClick={onPickStop}>
            + Додати зупинку
          </button>

          {!!stops.length && (
            <div className="rp-stops-list">
              {stops.map((wp, i) => (
                <div key={wp.id} className="rp-stop-chip">• {wp.name}<button onClick={() => onRemoveWaypoint(i + 1)}>×</button></div>
              ))}
            </div>
          )}

          <button className="rp-build-btn" disabled={building || !startPoint || !finishPoint} onClick={() => onBuild(travelMode)}>
            {building ? "⏳ Будуємо..." : "Створити маршрут"}
          </button>

          {buildState === "pick" && <div className="rp-pick-hint active">Оберіть точку зі списку нижче.</div>}

          {result && (
            <div className="rp-results">
              {summary && <div className="rp-summary-bar"><span>{fmtDur(summary.dur)}</span><span>{Math.round(summary.dist / 1000)} км</span></div>}
              {result.legs.map((leg, li) => (
                <div key={li} className="rp-leg">
                  <div className="rp-leg-header" onClick={() => setOpenLeg(openLeg === li ? null : li)}>
                    <div className="rp-leg-route"><span>{leg.from.name}</span><span>→</span><span>{leg.to.name}</span></div>
                    <div className="rp-leg-meta"><span>{leg.totalDurFmt}</span><span className="rp-leg-dist">{leg.totalDistFmt}</span></div>
                  </div>
                  {openLeg === li && <div className="rp-steps">{leg.steps.map((s, i) => <div key={i} className="rp-step">{s.icon} {s.lineName}</div>)}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
