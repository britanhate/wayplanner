import { memo, useMemo, useState } from "react";
import { POINT_TYPES } from "../../../lib/constants";
import { filterAndSortPoints, getUserInfo } from "./pointsSidebarUtils";
import { useAuth } from "../../../lib/AuthContext";

// ── SVG іконки ──
const Icons = {
  check: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  edit: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
  checkboxOn: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  checkboxOff: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
    </svg>
  ),
  calendar: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  coin: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
      <line x1="12" y1="6" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="18" />
    </svg>
  ),
  pin: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  route: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 17v-3a6 6 0 016-6h2" />
    </svg>
  ),
  details: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <line x1="12" y1="8" x2="12" y2="8" />
    </svg>
  ),
};

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
              <span className="mr-2">{type.emoji}</span>
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
            {showCompleted ? Icons.checkboxOn : Icons.checkboxOff}
          </button>
        </div>
      </div>

      {/* Список точок */}
      <div className="mt-section space-y-3">
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
                    {p.is_completed ? Icons.check : t.emoji}
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
                      {creator.avatar} {creator.name}
                    </span>
                    <span className="flex items-center gap-1 point-meta-pill">{t.emoji} {t.label}</span>
                    {p.point_date ? (
                      <span className="flex items-center gap-1 point-meta-pill">
                        {Icons.calendar}
                        {new Date(p.point_date).toLocaleDateString("uk-UA")}
                      </span>
                    ) : null}
                    {p.is_completed && <span className="point-meta-pill">✓ Виконано</span>}
                  </div>
                  {p.comment && (
                    <div className="text-small text-gray-400 truncate">
                      "{p.comment}"
                    </div>
                  )}
                  <div className="point-card-actions">
                    <button type="button" className="btn btn-icon btn-ghost point-action-btn" onClick={(e) => { e.stopPropagation(); onNearby?.(p); }} title="Маршрут / Що поруч" aria-label="Маршрут / Що поруч">{Icons.route}</button>
                    {p.created_by === user?.id && (
                      <button type="button" className="btn btn-icon btn-ghost point-action-btn" title="Редагувати" aria-label="Редагувати" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>{Icons.edit}</button>
                    )}
                    <button type="button" className="btn btn-icon btn-ghost point-action-btn" title="Деталі" aria-label="Деталі" onClick={(e) => { e.stopPropagation(); onFly(p); }}>{Icons.details}</button>
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
                    {Icons.check}
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
                      {Icons.close}
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
