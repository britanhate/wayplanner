import { Suspense, lazy, useState, useEffect } from "react";
import Topbar from "../components/UI/Topbar";
import PwaStatus from "../components/UI/PwaStatus";
import MapView from "../features/map/components/MapView";
import "./App.css";
import { logSlowInteraction } from "../shared/lib/perf";

const FinanceView = lazy(() => import("../features/finance/components/FinanceView"));

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
    const startedAt = performance.now();
    setActiveTab(tab);
    setSearchOpen(false);
    logSlowInteraction(`tab_switch_${tab}`, startedAt);
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
      <PwaStatus />
      <div className="app-content">
        <div className="tab-view fade-in">
          {activeTab === "map" && (
            <MapView
              searchOpen={searchOpen}
              onSearchClose={() => setSearchOpen(false)}
              mapStyle={mapStyle}
            />
          )}
          {activeTab === "finance" && (
            <Suspense fallback={<div className="p-panel fade-in">Завантаження фінансів...</div>}>
              <FinanceView />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
