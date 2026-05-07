import { POINT_TYPES, USERS } from "../../lib/constants";
import { useAuth } from "../../lib/AuthContext";

export default function PointsSidebar({
  points,
  onFly,
  onDelete,
  onEdit,
  routeMode,
  routeFrom,
  onRouteToggle,
}) {
  const { user } = useAuth();

  const getUserInfo = (userId) =>
    USERS.find((u) => u.id === userId) || {
      name: userId,
      color: "#8888aa",
      avatar: "👤",
    };

  return (
    <div className="points-sidebar">
      <div className="sidebar-section-title">Точки на карті</div>

      {!points.length ? (
        <div className="empty-hint">Шукайте адресу або клацніть по карті</div>
      ) : (
        points.map((p) => {
          const t = POINT_TYPES[p.type] || POINT_TYPES.sight;
          const creator = getUserInfo(p.created_by);
          const isRouteFrom = routeFrom?.id === p.id;

          return (
            <div
              key={p.id}
              className={`point-item ${isRouteFrom ? "route-from" : ""} ${routeMode ? "route-mode" : ""}`}
              onClick={() => (routeMode ? onRouteToggle(p) : onFly(p))}
            >
              <div
                className="point-badge"
                style={{ background: t.color + "22" }}
              >
                {t.emoji}
              </div>

              <div className="point-info">
                <div className="point-name">{p.name}</div>
                <div className="point-meta">
                  <span style={{ color: creator.color }}>
                    {creator.avatar} {creator.name}
                  </span>
                  {p.estimated_cost && (
                    <span className="point-cost">
                      · {p.estimated_cost} {p.currency}
                    </span>
                  )}
                </div>
                {p.comment && (
                  <div className="point-comment">"{p.comment}"</div>
                )}
              </div>

              {p.created_by === user?.id && (
                <div className="point-actions">
                  <button
                    className="point-edit"
                    title="Редагувати"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(p);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="point-del"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
