import { useState } from "react";
import Topbar from "../components/UI/Topbar";
import BottomNav from "../components/UI/BottomNav";
import MapView from "../components/Map/MapView";
import NotesView from "../components/Notes/NotesView";
import FinanceView from "../components/Finance/FinanceView";

export default function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <Topbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="content">
        {activeTab === "map" && (
          <MapView
            sidebarOpen={sidebarOpen}
            onSidebarClose={() => setSidebarOpen(false)}
          />
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
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
