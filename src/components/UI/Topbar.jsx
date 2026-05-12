import { useAuth } from "../../lib/AuthContext";

export default function Topbar({
  activeTab,
  onSidebarToggle,
}) {
  const { user, logout } = useAuth();

  return (
    <header className="topbar-ios">
      <div className="topbar-left">
        {activeTab === "map" && (
          <button
            className="topbar-btn"
            onClick={onSidebarToggle}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        <div className="topbar-brand">
          <div className="brand-dot" />
          <span>WayPlanner</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-user">
          <span className="avatar">{user?.avatar}</span>

          <div className="user-meta">
            <div className="user-name">
              {user?.name}
            </div>

            <div className="user-status">
              online
            </div>
          </div>
        </div>

        <button
          className="topbar-btn"
          onClick={logout}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M16 17l5-5-5-5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 12H9"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <path
              d="M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}