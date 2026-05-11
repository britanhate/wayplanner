import { POINT_TYPES, USERS } from "../../lib/constants";
import { useAuth } from "../../lib/AuthContext";

export default function PointsSidebar({
  points,
  onFly,
  onDelete,
  onEdit,
  onToggleCompleted,
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
        points
          .sort((a, b) => a.name.localeCompare(b.name, "uk"))
          .map((p) => {
            const t = POINT_TYPES[p.type] || POINT_TYPES.sight;
            const creator = getUserInfo(p.created_by);
            const isRouteFrom = routeFrom?.id === p.id;

            return (
              <div
                key={p.id}
                className={`point-item ${isRouteFrom ? "route-from" : ""} ${routeMode ? "route-mode" : ""} ${p.is_completed ? "completed" : ""}`}
                onClick={() => (routeMode ? onRouteToggle(p) : onFly(p))}
              >
                <div
                  className="point-badge"
                  style={{
                    background: t.color + "22",
                    textDecoration: p.is_completed ? "line-through" : "none",
                    opacity: p.is_completed ? 0.5 : 1,
                  }}
                >
                  {p.is_completed ? "✓" : t.emoji}
                </div>

                <div
                  className="point-info"
                  style={{ opacity: p.is_completed ? 0.6 : 1 }}
                >
                  <div
                    className="point-name"
                    style={{
                      textDecoration: p.is_completed ? "line-through" : "none",
                    }}
                  >
                    {p.name}
                  </div>
                  <div className="point-meta">
                    <span style={{ color: creator.color }}>
                      {creator.avatar} {creator.name}
                    </span>
                    {p.estimated_cost && (
                      <span className="point-cost">
                        · {p.estimated_cost} {p.currency}
                      </span>
                    )}
                    {p.point_date && (
                      <span className="point-date">
                        · 📅{" "}
                        {new Date(p.point_date).toLocaleDateString("uk-UA")}
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
                      className="point-check"
                      title={p.is_completed ? "Не виконано" : "Виконано"}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompleted && onToggleCompleted(p);
                      }}
                      style={{ opacity: p.is_completed ? 1 : 0.5 }}
                    >
                      ✓
                    </button>
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
