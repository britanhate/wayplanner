import { memo, useMemo, useState } from "react";
import { POINT_TYPES } from "../../../lib/constants";
import CalciteIcon from "../../../shared/ui/CalciteIcon";
import { PLACE_TYPE_ICONS } from "../../../lib/calciteIcons";
import { filterAndSortPoints, getUserInfo } from "./pointsSidebarUtils";
import { useAuth } from "../../../lib/AuthContext";

const iconNameForType = (type) => PLACE_TYPE_ICONS[type] || "pin";

function PointsSidebar({
  points,
  onFly,
  onDelete,
  onEdit,
  onToggleCompleted,
  routeMode,
  onRouteToggle,
  selectedPointId = null,
  onNearby,
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
    <aside className="sidebar p-panel fade-in">
      <div className="section">
        <div className="section-title">Точки на карті</div>

        {/* Фільтр по типу */}
        <div className="flex gap-2 overflow-x-auto py-2">
          <button
            className={`badge pressable ${selectedType === "all" ? "badge-secondary" : "badge"}`}
            onClick={() => setSelectedType("all")}
          >
            Всі
          </button>
          {Object.entries(POINT_TYPES).map(([key, type]) => (
            <button
              key={key}
              className={`badge pressable ${selectedType === key ? "badge-secondary" : "badge"}`}
              onClick={() => setSelectedType(key)}
            >
              <span className="mr-2 inline-flex"><CalciteIcon name={iconNameForType(key)} size={16} /></span>
              <span className="hidden sm:inline">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Сортування */}
        <div className="flex items-center justify-between mt-section">
          <div className="flex gap-2">
            {[
              { id: "name", label: "Назва" },
              { id: "date", label: "Дата" },
              { id: "cost", label: "Ціна" },
            ].map((s) => (
              <button
                key={s.id}
                className={`btn btn-ghost ${sortBy === s.id ? "text-white" : "text-white/60"}`}
                onClick={() => setSortBy(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            className={`btn btn-ghost ${showCompleted ? "text-white" : "text-white/60"}`}
            onClick={() => setShowCompleted((prev) => !prev)}
            title={showCompleted ? "Приховати виконані" : "Показати виконані"}
          >
            <CalciteIcon name={showCompleted ? "check" : "minus"} size={16} />
          </button>
        </div>
      </div>

      {/* Список точок */}
      <div className="mt-section point-cards-list">
        {!filteredPoints.length ? (
          <div className="empty-state-card">
            <div className="empty-state-title">Ще немає точок</div>
            <div className="text-small text-gray-400">
              Додайте першу точку на мапі: натисніть на карту та оберіть “Додати точку”.
            </div>
          </div>
        ) : (
          filteredPoints.map((p) => {
            const t = POINT_TYPES[p.type] || POINT_TYPES.sight;
            const creator = getUserInfo(p.created_by);

            return (
              <div
                key={p.id}
                className={`flex list-item interactive-card fade-in items-center gap-3 point-card-ios ${
                  p.is_completed ? "opacity-disabled" : ""
                } ${selectedPointId === p.id ? "point-selected" : ""}`}
                onClick={() => (routeMode ? onRouteToggle(p) : onFly(p))}
              >
                {/* Іконка типу */}
                <div
                  className="w-12 h-12 rounded-full flex-center shrink-0 point-card-icon"
                  style={{ background: t.color + "22" }}
                >
                  <span
                    className="text-lg"
                    style={{ color: p.is_completed ? "#30d158" : t.color }}
                  >
                    <CalciteIcon name={p.is_completed ? "check" : iconNameForType(p.type)} size={24} />
                  </span>
                </div>

                {/* Інфо */}
                <div className="flex-1 min-w-0">
                  <div className="point-card-title-row">
                    <div className="font-medium truncate point-card-title">{p.name}</div>
                    {p.estimated_cost ? (
                      <span className="point-cost-badge">{p.estimated_cost} {p.currency}</span>
                    ) : null}
                  </div>
                  <div className="text-small text-gray-400 flex items-center gap-2 flex-wrap mt-0.5 point-meta-row">
                    <span className="point-meta-pill point-meta-author" style={{ color: creator.color }}>
                      {creator.name}
                    </span>
                    <span className="flex items-center gap-1 point-meta-pill"><CalciteIcon name={iconNameForType(p.type)} size={16} /> {t.label}</span>
                    {p.point_date ? (
                      <span className="flex items-center gap-1 point-meta-pill">
                        <CalciteIcon name="calendar" size={16} />
                        {new Date(p.point_date).toLocaleDateString("uk-UA")}
                      </span>
                    ) : null}
                    {p.is_completed && <span className="point-meta-pill">Виконано</span>}
                  </div>
                  {p.comment && (
                    <div className="text-small text-gray-400 truncate">
                      "{p.comment}"
                    </div>
                  )}
                  <div className="point-card-actions">
                    <button type="button" className="btn btn-icon btn-ghost point-action-btn" onClick={(e) => { e.stopPropagation(); onNearby?.(p); }} title="Що поруч" aria-label="Що поруч"><CalciteIcon name="search" size={16} /></button>
                    {p.created_by === user?.id && (
                      <button type="button" className="btn btn-icon btn-ghost point-action-btn" title="Редагувати" aria-label="Редагувати" onClick={(e) => { e.stopPropagation(); onEdit(p); }}><CalciteIcon name="pencil" size={16} /></button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className={`btn btn-icon btn-ghost ${
                      p.is_completed
                        ? "text-[#30d158]"
                        : "text-white/40 hover:text-white"
                    }`}
                    title={p.is_completed ? "Не виконано" : "Виконано"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCompleted?.(p);
                    }}
                    title="Що поруч"
                    aria-label="Що поруч"
                  >
                    <CalciteIcon name="check" size={16} />
                  </button>
                  {p.created_by === user?.id && (
                    <button
                      className="btn btn-icon btn-ghost text-white/40 hover:text-red-400"
                      title="Видалити"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(p.id);
                      }}
                    >
                      <CalciteIcon name="trash" size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

export default memo(PointsSidebar);
