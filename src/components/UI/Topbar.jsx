import CalciteIcon from "../../shared/ui/CalciteIcon";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import "./topbar.css";

const TABS = [
  { id: "map", label: "Карта", icon: <CalciteIcon name="globe" /> },
  { id: "finance", label: "Фінанси", icon: <CalciteIcon name="coin" /> },
];
const MAP_STYLES = [
  { id: "standard", label: "Standard" },
  { id: "dark", label: "Dark (OSM)" },
  { id: "streets-v12", label: "Streets" },
  { id: "outdoors-v12", label: "Outdoor" },
  { id: "light-v11", label: "Light" },
  { id: "dark-v11", label: "Dark" },
  { id: "satellite-streets-v12", label: "Satellite" },
  { id: "navigation-day-v1", label: "Nav Light" },
  { id: "navigation-night-v1", label: "Nav Dark" },
];

const dropdownStyle = { position: "absolute", top: "calc(100% + 10px)", left: 0, minWidth: 185, background: "rgba(10, 14, 25, 0.97)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.55)", overflow: "hidden", zIndex: 1400 };
const getItemStyle = (active, isLast) => ({ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 16px", background: active ? "rgba(10,132,255,0.12)" : "transparent", border: "none", borderBottom: isLast ? "none" : "0.5px solid rgba(255,255,255,0.05)", color: active ? "#fff" : "rgba(255,255,255,0.65)", cursor: "pointer", textAlign: "left" });

export default function Topbar({ activeTab, onTabChange, searchOpen, onSearchToggle, mapStyle, onMapStyleChange, trips = [], activeTrip, onTripChange, onTripCreate, onTripRename, tripsError }) {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const menuRef = useRef(null);
  const styleRef = useRef(null);

  const handleCreateTrip = async () => {
    const name = window.prompt("Назва подорожі", "My Trip");
    if (!name?.trim()) return;
    try { await onTripCreate?.(name.trim()); } catch (e) { alert("Не вдалося створити trip"); }
  };
  const handleRenameTrip = async () => {
    if (!activeTrip) return;
    const name = window.prompt("Нова назва", activeTrip.name);
    if (!name?.trim()) return;
    try { await onTripRename?.(activeTrip.id, name.trim()); } catch { alert("Не вдалося перейменувати trip"); }
  };

  useEffect(() => {
    const handler = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (styleOpen && styleRef.current && !styleRef.current.contains(e.target)) setStyleOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, [menuOpen, styleOpen]);

  return (
    <header className="topbar-ios">
      <div className="topbar-left">
        <div className="pos-relative" ref={menuRef}>
          <button className="topbar-btn pressable" onClick={() => { setMenuOpen((v) => !v); setStyleOpen(false); }} aria-label="Меню"><CalciteIcon name="menu" size={20} /></button>
          {menuOpen && <div className="topbar-dropdown" style={dropdownStyle}>{TABS.map((tab, i) => <button key={tab.id} onClick={() => { onTabChange(tab.id); setMenuOpen(false); }} style={getItemStyle(activeTab === tab.id, i === TABS.length - 1)}><span>{tab.icon}</span><span style={{ flex: 1 }}>{tab.label}</span></button>)}</div>}
        </div>
        <div className="topbar-brand"><div className="brand-dot" /><span>WayPlanner</span></div>
      </div>

      <div className="topbar-trip">
        <select className="topbar-trip-select" value={activeTrip?.id || ""} onChange={(e) => onTripChange?.(trips.find((t) => t.id === e.target.value) || null)}>
          {!trips.length && <option value="">My Trip</option>}
          {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}
        </select>
        <button className="topbar-btn pressable" onClick={handleCreateTrip} title="Create trip"><CalciteIcon name="plus" size={18} /></button>
        <button className="topbar-btn pressable" onClick={handleRenameTrip} title="Rename trip" disabled={!activeTrip}><CalciteIcon name="pencil" size={16} /></button>
      </div>

      <div className="topbar-right">
        {activeTab === "map" && <>
          <div className="pos-relative" ref={styleRef}>
            <button className={`topbar-btn ${styleOpen ? "topbar-btn-active" : ""}`} onClick={() => { setStyleOpen((v) => !v); setMenuOpen(false); }} aria-label="Стиль карти"><CalciteIcon name="globe" size={20} /></button>
            {styleOpen && <div className="topbar-dropdown" style={{ ...dropdownStyle, left: "auto", right: 0 }}>{MAP_STYLES.map((s, i) => <button key={s.id} onClick={() => { onMapStyleChange?.(s.id); setStyleOpen(false); }} style={getItemStyle(mapStyle === s.id, i === MAP_STYLES.length - 1)}><span style={{ flex: 1 }}>{s.label}</span></button>)}</div>}
          </div>
          <button className={`topbar-btn pressable ${searchOpen ? "topbar-btn-active" : ""}`} onClick={onSearchToggle} aria-label="Пошук"><CalciteIcon name="search" size={19} /></button>
        </>}
        <button className="topbar-btn pressable" onClick={logout} aria-label="Вийти"><CalciteIcon name="logout" size={19} /></button>
      </div>
      {tripsError ? <div className="topbar-trip-error">{tripsError}</div> : null}
    </header>
  );
}
