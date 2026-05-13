import { useState } from "react";

const TRAVEL_MODES = [
  { id: 3, icon: "🚌", label: "Транзит" },
  { id: 0, icon: "🚗", label: "Авто" },
  { id: 2, icon: "🚶", label: "Пішки" },
  { id: 1, icon: "🚲", label: "Вело" },
];

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
}) {
  const [travelMode, setTravelMode] = useState(3);
  const [minimized, setMinimized] = useState(false);
  const [openLeg, setOpenLeg] = useState(null);

  const summary = result?.legs?.length
    ? result.legs.reduce(
        (acc, leg) => ({
          dur: acc.dur + (leg.totalDurSec || 0),
          dist: acc.dist + (leg.totalDistM || 0),
        }),
        { dur: 0, dist: 0 },
      )
    : null;

  const fmtDur = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return h > 0 ? `${h} год ${m} хв` : `${m} хв`;
  };
  const fmtDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${m} м`);

  return (
    <div className="route-panel p-panel">
      {showHeader && (
        <div className="route-panel-header">
          <span className="rp-title">🗺️ Маршрут</span>
          <div className="rp-header-actions">
            <button className="rp-icon-btn" onClick={() => setMinimized((v) => !v)}>
              {minimized ? "▲" : "▼"}
            </button>
            <button className="rp-icon-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>
      )}

      {!minimized && (
        <>
          <div className={`rp-pick-hint ${pickMode ? "active" : ""}`}>
            {pickMode
              ? "Оберіть точки у списку нижче або торкніться маркера на мапі."
              : "Керуй послідовністю точок маршруту вручну."}
          </div>

          <div className="rp-mode-tabs">
            {TRAVEL_MODES.map((m) => (
              <button
                key={m.id}
                className={`rp-mode-tab ${travelMode === m.id ? "active" : ""}`}
                onClick={() => setTravelMode(m.id)}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <div className="rp-waypoints">
            {!waypoints.length && (
              <div className="rp-empty">Поки немає точок. Натисни «+ Додати точку».</div>
            )}
            {waypoints.map((wp, i) => (
              <div key={wp.id} className="rp-waypoint-row">
                <div
                  className="rp-wp-dot"
                  style={{
                    background:
                      i === 0
                        ? "#30d158"
                        : i === waypoints.length - 1
                          ? "#ff453a"
                          : "#0a84ff",
                  }}
                />
                <div className="rp-wp-name">{wp.name}</div>
                <button className="rp-icon-btn rp-remove-btn" onClick={() => onRemoveWaypoint(i)}>
                  ×
                </button>
                {i < waypoints.length - 1 && <div className="rp-wp-connector" />}
              </div>
            ))}

            {waypoints.length < 8 && (
              <button className={`rp-add-stop-btn ${pickMode ? "active" : ""}`} onClick={onAddWaypoint}>
                {pickMode ? "✅ Режим вибору увімкнено" : "+ Додати точку до маршруту"}
              </button>
            )}
          </div>

          <div className="rp-actions-row">
            <button
              className="rp-build-btn"
              onClick={() => onBuild(travelMode)}
              disabled={building || waypoints.length < 2}
            >
              {building ? "⏳ Будуємо..." : "🔍 Знайти маршрут"}
            </button>
          </div>

          {result && (
            <div className="rp-results">
              {summary && (
                <div className="rp-summary-bar">
                  <span className="rp-summary-dur">{fmtDur(summary.dur)}</span>
                  <span className="rp-summary-dist">{fmtDist(summary.dist)}</span>
                  {result.legs[0]?.via && <span className="rp-summary-via">via {result.legs[0].via}</span>}
                </div>
              )}

              {result.legs.map((leg, li) => (
                <div key={li} className="rp-leg">
                  <div className="rp-leg-header" onClick={() => setOpenLeg(openLeg === li ? null : li)}>
                    <div className="rp-leg-route">
                      <span className="rp-leg-from">{leg.from.name}</span>
                      <span className="rp-leg-arrow">→</span>
                      <span className="rp-leg-to">{leg.to.name}</span>
                    </div>
                    <div className="rp-leg-meta">
                      <span>{leg.totalDurFmt}</span>
                      <span className="rp-leg-dist">{leg.totalDistFmt}</span>
                      <span className="rp-leg-expand">{openLeg === li ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {openLeg === li && (
                    <div className="rp-steps">
                      {leg.steps.map((step, si) => (
                        <div key={si} className="rp-step">
                          <div className="rp-step-line-wrap">
                            <div className="rp-step-dot" style={{ background: step.color }} />
                            {si < leg.steps.length - 1 && (
                              <div className="rp-step-line" style={{ background: `${step.color}55` }} />
                            )}
                          </div>
                          <div className="rp-step-content">
                            <div className="rp-step-main">
                              <span className="rp-step-icon">{step.icon}</span>
                              <div>
                                <div className="rp-step-title">{step.lineName}</div>
                                {step.operator && <div className="rp-step-op">{step.operator}</div>}
                              </div>
                              <div className="rp-step-dur">{step.durFmt}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
