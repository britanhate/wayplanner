export default function BottomNav({ activeTab, onTabChange }) {
  const items = [
    { id: "map", label: "Карта", icon: "M3 10h4l2-2 4 4 6-6" },
    {
      id: "notes",
      label: "Нотатки",
      icon: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    },
    {
      id: "finance",
      label: "Фінанси",
      icon: "M12 8c-1.1 0-2 .9-2 2v6h4v-6c0-1.1-.9-2-2-2z",
    },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="glass-panel px-3 py-2 flex items-center gap-3 rounded-apple-2xl">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onTabChange(it.id)}
            className={`btn-ghost ${activeTab === it.id ? "text-white" : "text-white/60"}`}
            aria-pressed={activeTab === it.id}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d={it.icon}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="sr-only sm:not-sr-only ml-2 text-sm">
              {it.label}
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
}
