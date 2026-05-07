export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav-item ${activeTab === "map" ? "active" : ""}`}
        onClick={() => onTabChange("map")}
        title="Карта"
      >
        <span className="material-icons">map</span>
        <span className="bottom-nav-label">Карта</span>
      </button>
      <button
        className={`bottom-nav-item ${activeTab === "notes" ? "active" : ""}`}
        onClick={() => onTabChange("notes")}
        title="Нотатки"
      >
        <span className="material-icons">note</span>
        <span className="bottom-nav-label">Нотатки</span>
      </button>
      <button
        className={`bottom-nav-item ${activeTab === "finance" ? "active" : ""}`}
        onClick={() => onTabChange("finance")}
        title="Фінанси"
      >
        <span className="material-icons">attach_money</span>
        <span className="bottom-nav-label">Фінанси</span>
      </button>
    </nav>
  );
}
