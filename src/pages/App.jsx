import { useState, useEffect } from "react";
import Topbar from "../components/UI/Topbar";
import MapView from "../components/Map/MapView";
import NotesView from "../components/Notes/NotesView";
import FinanceView from "../components/Finance/FinanceView";

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    // При першому завантаженні читаємо з localStorage
    const saved = localStorage.getItem("activeTab");
    return saved || "map";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Зберігаємо активну вкладку при змісені
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "linear-gradient(180deg, #05060a, #0b1220)",
        // iOS Safari fix
        height: "100%",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Topbar floats on top — NO layout space consumed */}
      <Topbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Content fills entire screen — topbar overlays it */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
        }}
      >
        {activeTab === "map" && (
          <MapView onSidebarClose={() => setSidebarOpen(false)} />
        )}
        {activeTab === "notes" && (
          <NotesView
            sidebarOpen={sidebarOpen}
            onSidebarClose={() => setSidebarOpen(false)}
          />
        )}
        {activeTab === "finance" && (
          <FinanceView
            sidebarOpen={sidebarOpen}
            onSidebarClose={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
