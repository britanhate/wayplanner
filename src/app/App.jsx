import { useState, useEffect } from "react";
import Topbar from "../components/UI/Topbar";
import MapView from "../features/map/components/MapView";
import NotesView from "../features/notes/components/NotesView";
import FinanceView from "../features/finance/components/FinanceView";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "map";
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapStyle, setMapStyle] = useState(() => {
    return localStorage.getItem("mapStyle") || "standard";
  });

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("mapStyle", mapStyle);
  }, [mapStyle]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchOpen(false);
  };

  return (
    <div className="app-shell">
      <Topbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchOpen={searchOpen}
        onSearchToggle={() => setSearchOpen((v) => !v)}
        mapStyle={mapStyle}
        onMapStyleChange={setMapStyle}
      />
      <div className="app-content">
        <div key={activeTab} className="tab-view fade-in">
          {activeTab === "map" && (
            <MapView
              searchOpen={searchOpen}
              onSearchClose={() => setSearchOpen(false)}
              mapStyle={mapStyle}
            />
          )}
          {activeTab === "notes" && <NotesView />}
          {activeTab === "finance" && <FinanceView />}
        </div>
      </div>
    </div>
  );
}