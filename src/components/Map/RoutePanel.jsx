import { useState } from "react";
import {
  TRAVEL_MODES,
  summarizeRoute,
  formatDuration,
  formatDistance,
} from "./routePanelUtils";

const Icons = {
  chevronUp: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  chevronDown: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  close: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  arrow: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  plus: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  checkCircle: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  search: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  ),
  loader: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  map: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
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
}) {
  const [travelMode, setTravelMode] = useState(3);
  const [minimized, setMinimized] = useState(false);
  const [openLeg, setOpenLeg] = useState(null);

  const summary = summarizeRoute(result);

  return (
    <div className="route-panel p-panel">
      {showHeader && (
        <div className="route-panel-header">
          <span className="rp-title flex items-center gap-2">
            {Icons.map} Маршрут
          </span>
          <div className="rp-header-actions">
            <button
              className="rp-icon-btn"
              onClick={() => setMinimized((v) => !v)}
            >
              {minimized ? Icons.chevronUp : Icons.chevronDown}
            </button>
            <button className="rp-icon-btn" onClick={onClose}>
              {Icons.close}
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

          {/* Режим транспорту */}
          <div className="rp-mode-tabs">
            {TRAVEL_MODES.map((m) => (
              <button
                key={m.id}
                className={`rp-mode-tab ${travelMode === m.id ? "active" : ""}`}
                onClick={() => setTravelMode(m.id)}
              >
                <span dangerouslySetInnerHTML={{ __html: m.icon }} />
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Точки маршруту */}
          <div className="rp-waypoints">
            {!waypoints.length && (
              <div className="rp-empty">
                Поки немає точок. Натисни «+ Додати точку».
              </div>
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
                <button
                  className="rp-icon-btn rp-remove-btn"
                  onClick={() => onRemoveWaypoint(i)}
                >
                  {Icons.close}
                </button>
                {i < waypoints.length - 1 && (
                  <div className="rp-wp-connector" />
                )}
              </div>
            ))}

            {waypoints.length < 8 && (
              <button
                className={`rp-add-stop-btn ${pickMode ? "active" : ""}`}
                onClick={onAddWaypoint}
              >
                <span className="flex items-center gap-2">
                  {pickMode ? Icons.checkCircle : Icons.plus}
                  {pickMode
                    ? "Режим вибору увімкнено"
                    : "Додати точку до маршруту"}
                </span>
              </button>
            )}
          </div>

          {/* Кнопка побудови */}
          <div className="rp-actions-row">
            <button
              className="rp-build-btn flex items-center justify-center gap-2"
              onClick={() => onBuild(travelMode)}
              disabled={building || waypoints.length < 2}
            >
              {building ? (
                <>
                  <span
                    style={{
                      animation: "spin 1s linear infinite",
                      display: "inline-flex",
                    }}
                  >
                    {Icons.loader}
                  </span>{" "}
                  Будуємо...
                </>
              ) : (
                <>{Icons.search} Знайти маршрут</>
              )}
            </button>
          </div>

          {/* Результат */}
          {result && (
            <div className="rp-results">
              {summary && (
                <div className="rp-summary-bar">
                  <span className="rp-summary-dur">
                    {formatDuration(summary.dur)}
                  </span>
                  <span className="rp-summary-dist">
                    {formatDistance(summary.dist)}
                  </span>
                  {result.legs[0]?.via && (
                    <span className="rp-summary-via">
                      via {result.legs[0].via}
                    </span>
                  )}
                </div>
              )}

              {result.legs.map((leg, li) => (
                <div key={li} className="rp-leg">
                  <div
                    className="rp-leg-header"
                    onClick={() => setOpenLeg(openLeg === li ? null : li)}
                  >
                    <div className="rp-leg-route">
                      <span className="rp-leg-from">{leg.from.name}</span>
                      <span className="rp-leg-arrow">{Icons.arrow}</span>
                      <span className="rp-leg-to">{leg.to.name}</span>
                    </div>
                    <div className="rp-leg-meta">
                      <span>{leg.totalDurFmt}</span>
                      <span className="rp-leg-dist">{leg.totalDistFmt}</span>
                      <span className="rp-leg-expand">
                        {openLeg === li ? Icons.chevronUp : Icons.chevronDown}
                      </span>
                    </div>
                  </div>

                  {openLeg === li && (
                    <div className="rp-steps">
                      {leg.steps.map((step, si) => (
                        <div key={si} className="rp-step">
                          <div className="rp-step-line-wrap">
                            <div
                              className="rp-step-dot"
                              style={{ background: step.color }}
                            />
                            {si < leg.steps.length - 1 && (
                              <div
                                className="rp-step-line"
                                style={{ background: `${step.color}55` }}
                              />
                            )}
                          </div>
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

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
