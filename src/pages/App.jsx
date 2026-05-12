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
    <div className="flex flex-col h-screen w-screen bg-gradient-dark overflow-hidden">
      <Topbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex flex-1 overflow-hidden min-h-0">
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
