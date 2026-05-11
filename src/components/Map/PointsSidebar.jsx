import { useMemo, useState } from "react";
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

  const [selectedType, setSelectedType] = useState("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortBy, setSortBy] = useState("name");

  const getUserInfo = (userId) =>
    USERS.find((u) => u.id === userId) || {
      name: userId,
      color: "#8888aa",
      avatar: "👤",
    };

  const filteredPoints = useMemo(() => {
    let result = [...points];

    // Фільтр по категорії
    if (selectedType !== "all") {
      result = result.filter((p) => p.type === selectedType);
    }

    // Показ / приховування виконаних
    if (!showCompleted) {
      result = result.filter((p) => !p.is_completed);
    }

    // Сортування
    result.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.point_date || 0) - new Date(b.point_date || 0);

        case "cost":
          return (a.estimated_cost || 0) - (b.estimated_cost || 0);

        case "creator":
          return getUserInfo(a.created_by).name.localeCompare(
            getUserInfo(b.created_by).name,
            "uk",
          );

        case "name":
        default:
          return a.name.localeCompare(b.name, "uk");
      }
    });

    return result;
  }, [points, selectedType, showCompleted, sortBy]);

  return (
    <div className="points-sidebar">
      <div className="sidebar-section-title">Точки на карті</div>

      <div className="sidebar-controls">
        <div className="filter-scroll">
          <button
            className={`filter-chip ${selectedType === "all" ? "active" : ""}`}
            onClick={() => setSelectedType("all")}
          >
            Всі
          </button>

          {Object.entries(POINT_TYPES).map(([key, type]) => (
            <button
              key={key}
              className={`filter-chip ${selectedType === key ? "active" : ""}`}
              onClick={() => setSelectedType(key)}
            >
              {type.emoji} {type.label}
            </button>
          ))}
        </div>

        <div className="bottom-controls">
          <div className="sort-row">
            <button
              className={`sort-chip ${sortBy === "name" ? "active" : ""}`}
              onClick={() => setSortBy("name")}
            >
              Назва
            </button>

            <button
              className={`sort-chip ${sortBy === "date" ? "active" : ""}`}
              onClick={() => setSortBy("date")}
            >
              Дата
            </button>

            <button
              className={`sort-chip ${sortBy === "cost" ? "active" : ""}`}
              onClick={() => setSortBy("cost")}
            >
              Ціна
            </button>
          </div>

          <button
            className={`toggle-chip ${showCompleted ? "active" : ""}`}
            onClick={() => setShowCompleted((prev) => !prev)}
            title={showCompleted ? "Приховати виконані" : "Показати виконані"}
          >
            {showCompleted ? "☑" : "☐ "}
          </button>
        </div>
      </div>

      {!filteredPoints.length ? (
        <div className="empty-hint">Немає точок для відображення</div>
      ) : (
        filteredPoints.map((p) => {
          const t = POINT_TYPES[p.type] || POINT_TYPES.sight;
          const creator = getUserInfo(p.created_by);
          const isRouteFrom = routeFrom?.id === p.id;

          return (
            <div
              key={p.id}
              className={`point-item ${
                isRouteFrom ? "route-from" : ""
              } ${routeMode ? "route-mode" : ""} ${
                p.is_completed ? "completed" : ""
              }`}
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
                style={{
                  opacity: p.is_completed ? 0.6 : 1,
                }}
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
                      · 📅 {new Date(p.point_date).toLocaleDateString("uk-UA")}
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
                    style={{
                      opacity: p.is_completed ? 1 : 0.5,
                    }}
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
