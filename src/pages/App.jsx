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
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      background: "linear-gradient(180deg, #05060a, #0b1220)",
      height: "100%",
      WebkitOverflowScrolling: "touch",
    }}>
      <Topbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchOpen={searchOpen}
        onSearchToggle={() => setSearchOpen((v) => !v)}
      />

      <div style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}>
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