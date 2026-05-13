import { useState } from "react";

const TRAVEL_MODES = [
  { id: 3, icon: "🚌", label: "Транзит" },
  { id: 0, icon: "🚗", label: "Авто" },
  { id: 2, icon: "🚶", label: "Пішки" },
  { id: 1, icon: "🚲", label: "Вело" },
];

export default function RoutePanel({
  waypoints, // [{id, name, lat, lng}, ...]
  onRemoveWaypoint, // (index) => void
  onAddWaypoint, // () => void  — відкрити вибір точки
  onBuild, // (travelMode) => void
  result, // { legs: [{ from, to, totalDurFmt, totalDistFmt, via, steps[] }] }
  building,
  onClose,
  onPickPoint,
}) {
  const [travelMode, setTravelMode] = useState(3);
  const [minimized, setMinimized] = useState(false);
  const [openLeg, setOpenLeg] = useState(null); // index розгорнутого leg

  // ── Загальний час і відстань по всіх legs ──
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
    <div className="route-panel">
      {/* ── Header ── */}
      <div className="route-panel-header">
        <span style={{ fontWeight: 600, fontSize: 14 }}>🗺️ Маршрут</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            className="rp-icon-btn"
            onClick={() => setMinimized((v) => !v)}
          >
            {minimized ? "▲" : "▼"}
          </button>
          <button className="rp-icon-btn" onClick={onClose}>
            ×
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* ── Travel mode tabs ── */}
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

          {/* ── Waypoints list ── */}
          <div className="rp-waypoints">
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
                {waypoints.length > 2 && (
                  <button
                    className="rp-icon-btn"
                    style={{ opacity: 0.5, fontSize: 13 }}
                    onClick={() => onRemoveWaypoint(i)}
                  >
                    ×
                  </button>
                )}
                {/* Connector */}
                {i < waypoints.length - 1 && (
                  <div className="rp-wp-connector" />
                )}
              </div>
            ))}

            {/* Додати проміжну точку */}
            {waypoints.length < 8 && (
              <button className="rp-add-stop-btn" onClick={onAddWaypoint}>
                + Вибрати точку на мапі
              </button>
            )}
          </div>

          {/* ── Build button ── */}
          <button
            className="rp-build-btn"
            onClick={() => onBuild(travelMode)}
            disabled={building || waypoints.length < 2}
          >
            {building ? "⏳ Будуємо..." : "🔍 Знайти маршрут"}
          </button>

          {/* ── Results ── */}
          {result && (
            <div className="rp-results">
              {/* Загальний summary */}
              {summary && (
                <div className="rp-summary-bar">
                  <span className="rp-summary-dur">{fmtDur(summary.dur)}</span>
                  <span className="rp-summary-dist">
                    {fmtDist(summary.dist)}
                  </span>
                  {result.legs[0]?.via && (
                    <span className="rp-summary-via">
                      via {result.legs[0].via}
                    </span>
                  )}
                </div>
              )}

              {/* Legs (між кожними двома точками) */}
              {result.legs.map((leg, li) => (
                <div key={li} className="rp-leg">
                  {/* Leg header — клікабельний для розгортання */}
                  <div
                    className="rp-leg-header"
                    onClick={() => setOpenLeg(openLeg === li ? null : li)}
                  >
                    <div className="rp-leg-route">
                      <span className="rp-leg-from">{leg.from.name}</span>
                      <span className="rp-leg-arrow">→</span>
                      <span className="rp-leg-to">{leg.to.name}</span>
                    </div>
                    <div className="rp-leg-meta">
                      <span>{leg.totalDurFmt}</span>
                      <span style={{ opacity: 0.5 }}>{leg.totalDistFmt}</span>
                      <span style={{ opacity: 0.4, fontSize: 12 }}>
                        {openLeg === li ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {/* Steps (розгорнуто) */}
                  {openLeg === li && (
                    <div className="rp-steps">
                      {leg.steps.map((step, si) => (
                        <div key={si} className="rp-step">
                          {/* Вертикальна лінія */}
                          <div className="rp-step-line-wrap">
                            <div
                              className="rp-step-dot"
                              style={{ background: step.color }}
                            />
                            {si < leg.steps.length - 1 && (
                              <div
                                className="rp-step-line"
                                style={{ background: step.color + "55" }}
                              />
                            )}
                          </div>

                          {/* Контент */}
                          <div className="rp-step-content">
                            <div className="rp-step-main">
                              <span className="rp-step-icon">{step.icon}</span>
                              <div>
                                <div className="rp-step-title">
                                  {step.lineName}
                                </div>
                                {step.operator && (
                                  <div className="rp-step-op">
                                    {step.operator}
                                  </div>
                                )}
                              </div>
                              <div className="rp-step-dur">{step.durFmt}</div>
                            </div>

                            {/* Board / Alight */}
                            {(step.boardAt || step.alightAt) && (
                              <div className="rp-step-stops">
                                {step.boardAt && (
                                  <div className="rp-stop-row">
                                    <span className="rp-stop-dot green" />
                                    <span>{step.boardAt}</span>
                                  </div>
                                )}
                                {step.stops > 0 && (
                                  <div className="rp-stop-mid">
                                    ↕ {step.stops} зупин. · {step.distFmt}
                                  </div>
                                )}
                                {step.alightAt && (
                                  <div className="rp-stop-row">
                                    <span className="rp-stop-dot red" />
                                    <span>{step.alightAt}</span>
                                  </div>
                                )}
                              </div>
                            )}
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
