import { useAuth } from "../../lib/AuthContext";

export default function Topbar({ activeTab, onTabChange, onSidebarToggle }) {
  const { user, logout } = useAuth();

  const tabs = [
    { id: "map", label: "Карта", icon: "🗺" },
    { id: "notes", label: "Нотатки", icon: "📝" },
    { id: "finance", label: "Фінанси", icon: "💰" },
  ];

  return (
    <header className="topbar">
      <button className="hamburger-btn" onClick={onSidebarToggle} title="Меню">
        <span className="material-icons">menu</span>
      </button>

      <div className="logo">
        <span className="logo-dot" />
        WayPlanner
      </div>

      <nav className="nav-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
            onClick={() => onTabChange(t.id)}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      <div className="user-badge" style={{ "--user-color": user?.color }}>
        <span className="user-avatar">{user?.avatar}</span>
        <span className="user-name">{user?.name}</span>
        <button className="logout-btn" onClick={logout} title="Вийти">
          <span className="material-icons">logout</span>
        </button>
      </div>
    </header>
  );
}
