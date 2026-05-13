import { useState } from "react";

export default function RoutePanel({ result, onClose }) {
  const [isMinimized, setIsMinimized] = useState(false);
  if (!result) return null;

  const { from, to, totalMin, totalKm, legs } = result;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const timeStr = h > 0 ? `${h}г ${m}хв` : `${m} хв`;

  return (
    <div
      className="route-panel"
      style={{ maxHeight: isMinimized ? "auto" : "100%" }}
    >
      <div className="route-panel-header">
        <span>🚌 Маршрут</span>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Розгорнути" : "Згорнути"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            {isMinimized ? "▲" : "▼"}
          </button>
          <button onClick={onClose}>×</button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="route-summary">
            <div className="route-stat">
              <div className="route-stat-val">{timeStr}</div>
              <div className="route-stat-label">Час</div>
            </div>
            <div className="route-stat">
              <div className="route-stat-val">{totalKm}</div>
              <div className="route-stat-label">км</div>
            </div>
          </div>

          <div className="route-from-to">
            {from.name} → {to.name}
          </div>

          <div className="route-legs">
            {legs.map((leg, i) => (
              <div key={i} className="leg-item">
                <div
                  className="leg-icon"
                  style={{ background: leg.color + "22" }}
                >
                  {leg.icon}
                </div>
                <div className="leg-info">
                  <div className="leg-main">{leg.main}</div>
                  {leg.sub && <div className="leg-sub">{leg.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
