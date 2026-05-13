import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/useAuth";

const TABS = [
  { id: "map", label: "Карта", emoji: "🗺️" },
  { id: "notes", label: "Нотатки", emoji: "📓" },
  { id: "finance", label: "Фінанси", emoji: "💸" },
];

export default function Topbar({
  activeTab,
  onTabChange,
  searchOpen,
  onSearchToggle,
}) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [menuOpen]);

  const handleTabSelect = (id) => {
    onTabChange(id);
    setMenuOpen(false);
  };

  return (
    <header className="topbar-ios">
      <div className="topbar-left">
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            className="topbar-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Меню"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                left: 0,
                minWidth: 185,
                background: "rgba(10, 14, 25, 0.97)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
                overflow: "hidden",
                zIndex: 1400,
                animation:
                  "topbar-dropdown-in 0.18s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              {TABS.map((tab, i) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabSelect(tab.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      padding: "13px 16px",
                      background: active
                        ? "rgba(10,132,255,0.12)"
                        : "transparent",
                      border: "none",
                      borderBottom:
                        i < TABS.length - 1
                          ? "0.5px solid rgba(255,255,255,0.05)"
                          : "none",
                      borderLeft: active
                        ? "2px solid #0a84ff"
                        : "2px solid transparent",
                      color: active ? "#fff" : "rgba(255,255,255,0.65)",
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "background 0.12s",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>
                      {tab.emoji}
                    </span>
                    <span style={{ flex: 1 }}>{tab.label}</span>
                    {active && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#0a84ff",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="topbar-brand">
          <div className="brand-dot" />
          <span>WayPlanner</span>
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="topbar-btn"
          onClick={onSearchToggle}
          aria-label="Пошук"
          style={
            searchOpen
              ? {
                  background: "rgba(10,132,255,0.15)",
                  borderRadius: 8,
                  border: "0.5px solid #0a84ff",
                  color: "#0a84ff",
                }
              : {}
          }
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="1.7"
            />
            <path
              d="M16.5 16.5L21 21"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="topbar-user">
          <span className="avatar">{user?.avatar}</span>
          <div className="user-meta">
            <div className="user-name">{user?.name}</div>
            <div className="user-status">online</div>
          </div>
        </div>

        <button className="topbar-btn" onClick={logout} aria-label="Вийти">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
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

      <style>{`
        @keyframes topbar-dropdown-in {
          from { opacity: 0; transform: scale(0.93) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </header>
  );
}
