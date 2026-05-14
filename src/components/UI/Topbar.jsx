import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";

const TabIcons = {
  map: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  notes: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  finance: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

const StyleIcons = {
  standard: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  dark: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  streets: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
  outdoor: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 17l4-8 4 5 3-3 4 6H3z" />
      <circle cx="18" cy="6" r="2" />
    </svg>
  ),
  light: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  satellite: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  nav: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  ),
};

const TABS = [
  { id: "map", label: "Карта", icon: TabIcons.map },
  { id: "notes", label: "Нотатки", icon: TabIcons.notes },
  { id: "finance", label: "Фінанси", icon: TabIcons.finance },
];

const MAP_STYLES = [
  { id: "standard", label: "Standard", icon: StyleIcons.standard },
  { id: "dark", label: "Dark (OSM)", icon: StyleIcons.dark },
  { id: "streets-v12", label: "Streets", icon: StyleIcons.streets },
  { id: "outdoors-v12", label: "Outdoor", icon: StyleIcons.outdoor },
  { id: "light-v11", label: "Light", icon: StyleIcons.light },
  { id: "dark-v11", label: "Dark", icon: StyleIcons.dark },
  {
    id: "satellite-streets-v12",
    label: "Satellite",
    icon: StyleIcons.satellite,
  },
  { id: "navigation-day-v1", label: "Nav Light", icon: StyleIcons.nav },
  { id: "navigation-night-v1", label: "Nav Dark", icon: StyleIcons.nav },
];

const dropdownStyle = {
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
  animation: "topbar-dropdown-in 0.18s cubic-bezier(0.34,1.56,0.64,1)",
};

const getItemStyle = (active, isLast) => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "13px 16px",
  background: active ? "rgba(10,132,255,0.12)" : "transparent",
  border: "none",
  borderBottom: isLast ? "none" : "0.5px solid rgba(255,255,255,0.05)",
  borderLeft: active ? "2px solid #0a84ff" : "2px solid transparent",
  color: active ? "#fff" : "rgba(255,255,255,0.65)",
  fontSize: 14,
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
  transition: "background 0.12s",
  WebkitTapHighlightColor: "transparent",
});

export default function Topbar({
  activeTab,
  onTabChange,
  searchOpen,
  onSearchToggle,
  mapStyle,
  onMapStyleChange,
}) {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const menuRef = useRef(null);
  const styleRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
      if (styleOpen && styleRef.current && !styleRef.current.contains(e.target))
        setStyleOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [menuOpen, styleOpen]);

  return (
    <header className="topbar-ios">
      <div className="topbar-left">
        <div className="pos-relative" ref={menuRef}>
          <button
            className="topbar-btn"
            onClick={() => {
              setMenuOpen((v) => !v);
              setStyleOpen(false);
            }}
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
            <div className="topbar-dropdown" style={dropdownStyle}>
              {TABS.map((tab, i) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setMenuOpen(false);
                  }}
                  style={getItemStyle(
                    activeTab === tab.id,
                    i === TABS.length - 1,
                  )}
                >
                  <span style={{ display: "flex", alignItems: "center" }}>
                    {tab.icon}
                  </span>
                  <span style={{ flex: 1 }}>{tab.label}</span>
                  {activeTab === tab.id && (
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
              ))}
            </div>
          )}
        </div>

        <div className="topbar-brand">
          <div className="brand-dot" />
          <span>WayPlanner</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Стилі карти */}
        <div className="pos-relative" ref={styleRef}>
          <button
            className={`topbar-btn ${styleOpen ? "topbar-btn-active" : ""}`}
            onClick={() => {
              setStyleOpen((v) => !v);
              setMenuOpen(false);
            }}
            aria-label="Стиль карти"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </button>

          {styleOpen && (
            <div
              className="topbar-dropdown"
              style={{ ...dropdownStyle, left: "auto", right: 0 }}
            >
              {MAP_STYLES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onMapStyleChange?.(s.id);
                    setStyleOpen(false);
                  }}
                  style={getItemStyle(
                    mapStyle === s.id,
                    i === MAP_STYLES.length - 1,
                  )}
                >
                  <span style={{ display: "flex", alignItems: "center" }}>
                    {s.icon}
                  </span>
                  <span style={{ flex: 1 }}>{s.label}</span>
                  {mapStyle === s.id && (
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
              ))}
            </div>
          )}
        </div>

        {/* Пошук */}
        <button
          className={`topbar-btn ${searchOpen ? "topbar-btn-active" : ""}`}
          onClick={onSearchToggle}
          aria-label="Пошук"
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

        {/* Вихід */}
        <button className="topbar-btn" onClick={logout} aria-label="Вийти">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path
              d="M16 17l5-5-5-5M21 12H9M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes topbar-dropdown-in {
          from { opacity: 0; transform: scale(0.93) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </header>
  );
}
