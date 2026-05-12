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
    <aside className="sidebar p-panel">
      <div className="section">
        <div className="section-title">Точки на карті</div>

        <div className="flex gap-2 overflow-x-auto py-2 ">
          <button
            className={`badge ${selectedType === "all" ? "badge-secondary" : "badge"}`}
            onClick={() => setSelectedType("all")}
          >
            Всі
          </button>

          {Object.entries(POINT_TYPES).map(([key, type]) => (
            <button
              key={key}
              className={`badge ${selectedType === key ? "badge-secondary" : "badge"}`}
              onClick={() => setSelectedType(key)}
            >
              <span className="mr-2">{type.emoji}</span>
              <span className="hidden sm:inline">{type.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-section">
          <div className="flex gap-2">
            <button
              className={`btn-ghost ${sortBy === "name" ? "text-white" : "text-white/60"}`}
              onClick={() => setSortBy("name")}
            >
              Назва
            </button>
            <button
              className={`btn-ghost ${sortBy === "date" ? "text-white" : "text-white/60"}`}
              onClick={() => setSortBy("date")}
            >
              Дата
            </button>
            <button
              className={`btn-ghost ${sortBy === "cost" ? "text-white" : "text-white/60"}`}
              onClick={() => setSortBy("cost")}
            >
              Ціна
            </button>
          </div>

          <button
            className={`btn-ghost ${showCompleted ? "text-white" : "text-white/60"}`}
            onClick={() => setShowCompleted((prev) => !prev)}
            title={showCompleted ? "Приховати виконані" : "Показати виконані"}
          >
            {showCompleted ? "☑" : "☐"}
          </button>
        </div>
      </div>

      <div className="mt-section space-y-3">
        {!filteredPoints.length ? (
          <div className="text-small text-gray-400">
            Немає точок для відображення
          </div>
        ) : (
          filteredPoints.map((p) => {
            const t = POINT_TYPES[p.type] || POINT_TYPES.sight;
            const creator = getUserInfo(p.created_by);
            // const isRouteFrom = routeFrom?.id === p.id;

            return (
              <div
                key={p.id}
                className={`list-item flex items-center gap-3 ${p.is_completed ? "opacity-disabled" : ""}`}
                onClick={() => (routeMode ? onRouteToggle(p) : onFly(p))}
              >
                <div
                  className="w-10 h-10 rounded-full flex-center"
                  style={{ background: t.color + "22" }}
                >
                  <span className="text-lg">
                    {p.is_completed ? "✓" : t.emoji}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-small text-gray-400 truncate-lines-2">
                    <span style={{ color: creator.color }}>
                      {creator.avatar} {creator.name}
                    </span>
                    {p.estimated_cost
                      ? ` · ${p.estimated_cost} ${p.currency}`
                      : ""}
                    {p.point_date
                      ? ` · 📅 ${new Date(p.point_date).toLocaleDateString("uk-UA")}`
                      : ""}
                  </div>
                  {p.comment && (
                    <div className="text-small text-gray-400">
                      "{p.comment}"
                    </div>
                  )}
                </div>

                {p.created_by === user?.id && (
                  <div className="flex items-center gap-2">
                    <button
                      className={`btn-ghost ${p.is_completed ? "text-white" : "text-white/60"}`}
                      title={p.is_completed ? "Не виконано" : "Виконано"}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompleted && onToggleCompleted(p);
                      }}
                    >
                      ✓
                    </button>

                    <button
                      className="btn-ghost"
                      title="Редагувати"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(p);
                      }}
                    >
                      ✏️
                    </button>

                    <button
                      className="btn-ghost"
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
    </aside>
  );
}
