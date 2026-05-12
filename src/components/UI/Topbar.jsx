import { useAuth } from "../../lib/AuthContext";

export default function Topbar({ activeTab, onTabChange, onSidebarToggle }) {
  const { user, logout } = useAuth();
  const tabs = [
    { id: "map", label: "Карта", icon: "🗺" },
    { id: "notes", label: "Нотатки", icon: "📝" },
    { id: "finance", label: "Фінанси", icon: "💰" },
  ];
  return (
    <header className="navbar-glass">
      <div className="flex items-center gap-4">
        {activeTab === "map" && (
          <button
            className="btn-icon"
            onClick={onSidebarToggle}
            title="Меню"
            aria-label="Toggle sidebar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <div className="text-sm font-medium">WayPlanner</div>
        </div>
      </div>

      <nav className="flex items-center gap-2 hidden-mobile">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`btn-ghost ${activeTab === t.id ? "text-white/90" : "text-white/60"}`}
            onClick={() => onTabChange(t.id)}
            aria-pressed={activeTab === t.id}
          >
            <span className="mr-2">{t.icon}</span>
            <span className="hidden sm:inline text-sm">{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <div className="user-badge">
          <span className="user-avatar">{user?.avatar}</span>
          <span className="user-name">{user?.name}</span>
        </div>
        <button className="btn-icon" onClick={logout} title="Вийти">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 17l5-5-5-5M21 12H9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
