import { useMemo, useState } from "react";
import { POINT_TYPES } from "../../lib/constants";
import { filterAndSortPoints, getUserInfo } from "./pointsSidebarUtils";
import { useAuth } from "../../lib/AuthContext";

export default function PointsSidebar({
  points,
  onFly,
  onDelete,
  onEdit,
  onToggleCompleted,
  routeMode,

  onRouteToggle,
}) {
  const { user } = useAuth();

  const [selectedType, setSelectedType] = useState("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortBy, setSortBy] = useState("name");

  const filteredPoints = useMemo(
    () => filterAndSortPoints(points, selectedType, showCompleted, sortBy),
    [points, selectedType, showCompleted, sortBy],
  );

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
