import { useState, useEffect } from "react";
import Topbar from "../components/UI/Topbar";
import MapView from "../components/Map/MapView";
import NotesView from "../components/Notes/NotesView";
import FinanceView from "../components/Finance/FinanceView";

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "map";
  });
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Закриваємо пошук при переключенні вкладки
    setSearchOpen(false);
  };

  return (
    <div className="app-shell">
      <Topbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchOpen={searchOpen}
        onSearchToggle={() => setSearchOpen((v) => !v)}
      />

      <div className="app-content">
        {activeTab === "map" && (
          <MapView
            searchOpen={searchOpen}
            onSearchClose={() => setSearchOpen(false)}
          />
        )}
        {activeTab === "notes" && (
          <NotesView />
        )}
        {activeTab === "finance" && (
          <FinanceView />
        )}
      </div>
    </div>
  );
}