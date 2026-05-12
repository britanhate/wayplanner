export default function BottomNav({ activeTab, onTabChange }) {
  const items = [
    { id: "map", label: "Карта", icon: "M3 10h4l2-2 4 4 6-6" },
    { id: "notes", label: "Нотатки", icon: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" },
    { id: "finance", label: "Фінанси", icon: "M12 8c-1.1 0-2 .9-2 2v6h4v-6c0-1.1-.9-2-2-2z" },
  ];

  return (
    <nav className="bottom-nav-wrap">
      <div className="bottom-nav-pill">
        {items.map((it) => {
          const active = activeTab === it.id;

          return (
            <button
              key={it.id}
              onClick={() => onTabChange(it.id)}
              className={`bottom-nav-item ${active ? "active" : ""}`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d={it.icon}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="bottom-nav-label">{it.label}</div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}