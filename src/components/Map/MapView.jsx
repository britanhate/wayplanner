import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../../lib/AuthContext";
import { usePoints } from "../../hooks/usePoints";
import { useExpenses } from "../../hooks/useExpenses";
import { supabase } from "../../lib/supabase";
import { buildRoute } from "../../lib/arcgis";
import { POINT_TYPES } from "../../lib/constants";
import SearchBox from "./SearchBox";
import PointsSidebar from "./PointsSidebar";
import AddPointModal from "./AddPointModal";
import EditPointModal from "./EditPointModal";
import RoutePanel, { buildLegs } from "./RoutePanel";

export default function MapView({ sidebarOpen, onSidebarClose }) {
  const { user } = useAuth();
  const { points, deletePoint, updatePoint } = usePoints();
  const { addExpense, updateExpense, deleteExpenseByPointId } = useExpenses();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const routeLayers = useRef([]);
  const routeModeRef = useRef(false);

  const [pendingPos, setPendingPos] = useState(null);
  const [geocoded, setGeocoded] = useState(null);
  const [editingPoint, setEditingPoint] = useState(null);
  const [routeMode, setRouteMode] = useState(false);
  const [routeStep, setRouteStep] = useState(0); // 1=pick A, 2=pick B
  const [routeFrom, setRouteFrom] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [routeBuilding, setRouteBuilding] = useState(false);

  // Init map
  useEffect(() => {
    if (mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([48.8566, 2.3522], 12);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO",
      maxZoom: 19,
    }).addTo(mapInstance.current);

    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(mapInstance.current);

    mapInstance.current.on("click", (e) => {
      if (routeModeRef.current) return;

      setPendingPos({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });

      setGeocoded(null);
    });
  }, []);

  useEffect(() => {
    routeModeRef.current = routeMode;
  }, [routeMode]);

  // Render markers when points change
  useEffect(() => {
    if (!mapInstance.current) return;
    // Remove old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    points.forEach((p) => {
      const t = POINT_TYPES[p.type] || POINT_TYPES.sight;
      const isFrom = routeFrom?.id === p.id;
      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;border-radius:50%;background:${t.color};display:flex;align-items:center;justify-content:center;font-size:16px;border:${isFrom ? "3px solid #e8622a" : "2px solid white"};box-shadow:0 2px 8px rgba(0,0,0,.25)">${t.emoji}</div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const popupContent = `
        <div style="font-family:sans-serif;min-width:160px">
          <b style="font-size:14px">${p.name}</b>
          <div style="color:#8888aa;font-size:12px;margin:2px 0">${t.emoji} ${t.label}</div>
          ${p.addr ? `<div style="font-size:11px;color:#8888aa">${p.addr}</div>` : ""}
          ${p.description ? `<div style="margin-top:6px;font-size:12px">${p.description}</div>` : ""}
          ${p.estimated_cost ? `<div style="margin-top:4px;font-size:12px;font-weight:500">💰 ${p.estimated_cost} ${p.currency}</div>` : ""}
          ${p.comment ? `<div style="margin-top:4px;font-size:11px;color:#666;font-style:italic">"${p.comment}"</div>` : ""}
        </div>`;

      const m = L.marker([p.lat, p.lng], { icon }).addTo(mapInstance.current);
      m.bindPopup(popupContent);
      markersRef.current[p.id] = m;
    });
  }, [points, routeFrom]);

  const flyTo = (p) => {
    mapInstance.current?.flyTo([p.lat, p.lng], 15, { duration: 0.8 });
    markersRef.current[p.id]?.openPopup();
  };

  const handleGeocodeResult = (result) => {
    setGeocoded(result);
    setPendingPos({ lat: result.lat, lng: result.lng });
    mapInstance.current?.flyTo([result.lat, result.lng], 15, { duration: 0.9 });
  };

  const handleSavePoint = async (data) => {
    try {
      const newPoint = { ...data, created_by: user.id };
      const { data: inserted, error } = await supabase
        .from("points")
        .insert([newPoint])
        .select()
        .single();

      if (error) throw error;

      // Create expense if there's an estimated cost
      if (data.estimated_cost && data.estimated_cost > 0) {
        await addExpense({
          name: `🏷️ ${data.name}`,
          amount: data.estimated_cost,
          category: "Місце",
          currency: data.currency,
          created_by: user.id,
          point_id: inserted.id,
        });
      }

      setPendingPos(null);
      setGeocoded(null);
    } catch (error) {
      console.error("Error saving point:", error);
      alert("Помилка при збереженні точки");
    }
  };

  const handleEditPoint = async (data) => {
    try {
      const pointId = editingPoint.id;
      const oldCost = editingPoint.estimated_cost;

      // Update point
      await updatePoint(pointId, data);

      // Sync expense: if cost changed or added
      if (data.estimated_cost && data.estimated_cost > 0) {
        // Check if expense exists for this point
        const { data: existingExpense } = await supabase
          .from("expenses")
          .select("id")
          .eq("point_id", pointId)
          .single();

        if (existingExpense) {
          // Update existing expense
          await updateExpense(existingExpense.id, {
            name: `🏷️ ${data.name}`,
            amount: data.estimated_cost,
            currency: data.currency,
          });
        } else {
          // Create new expense
          await addExpense({
            name: `🏷️ ${data.name}`,
            amount: data.estimated_cost,
            category: "Місце",
            currency: data.currency,
            created_by: user.id,
            point_id: pointId,
          });
        }
      } else if (oldCost && !data.estimated_cost) {
        // Cost was removed, delete the expense
        await deleteExpenseByPointId(pointId);
      }

      setEditingPoint(null);
    } catch (error) {
      console.error("Error editing point:", error);
      alert("Помилка при редагуванні точки");
    }
  };

  // ROUTE
  const startRouteMode = () => {
    if (points.length < 2) {
      alert("Додайте хоча б 2 точки!");
      return;
    }
    clearRouteLines();
    setRouteResult(null);
    setRouteMode(true);
    setRouteStep(1);
    setRouteFrom(null);
  };

  const handleRoutePointSelect = async (p) => {
    if (routeStep === 1) {
      setRouteFrom(p);
      setRouteStep(2);
    } else if (routeStep === 2) {
      if (p.id === routeFrom.id) {
        alert("Оберіть іншу точку!");
        return;
      }
      setRouteMode(false);
      setRouteStep(0);
      setRouteBuilding(true);
      try {
        const res = await buildRoute(routeFrom, p);
        drawRoute(res.paths);
        setRouteResult({
          from: routeFrom,
          to: p,
          totalMin: res.totalMin,
          totalKm: res.totalKm,
          legs: buildLegs(routeFrom, p, res.totalMin, res.totalKm),
        });
      } catch (e) {
        alert(e.message);
      }
      setRouteBuilding(false);
      setRouteFrom(null);
    }
  };

  const drawRoute = (paths) => {
    clearRouteLines();
    paths.forEach((path) => {
      const l = L.polyline(
        path.map((c) => [c[1], c[0]]),
        { color: "#2a7de8", weight: 4, opacity: 0.8 },
      ).addTo(mapInstance.current);
      routeLayers.current.push(l);
    });
    if (routeLayers.current.length)
      mapInstance.current.fitBounds(
        L.featureGroup(routeLayers.current).getBounds().pad(0.15),
      );
  };

  const clearRouteLines = () => {
    routeLayers.current.forEach((l) => l.remove());
    routeLayers.current = [];
  };

  return (
    <div className="map-view">
      <div className={`map-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-section">
          <SearchBox
            onResult={(result) => {
              handleGeocodeResult(result);
              onSidebarClose();
            }}
          />
        </div>

        <div className="sidebar-section">
          <button
            className={`route-btn ${routeMode ? "active" : ""}`}
            onClick={
              routeMode
                ? () => {
                    setRouteMode(false);
                    setRouteStep(0);
                    setRouteFrom(null);
                    onSidebarClose();
                  }
                : startRouteMode
            }
          >
            {routeBuilding
              ? "⏳ Будуємо..."
              : routeMode
                ? `🔴 ${routeStep === 1 ? "Оберіть старт" : "Оберіть фініш"}`
                : "🚌 Маршрут транспортом"}
          </button>
        </div>

        <PointsSidebar
          points={points}
          onFly={(p) => {
            flyTo(p);
            onSidebarClose();
          }}
          onDelete={deletePoint}
          onEdit={(p) => {
            setEditingPoint(p);
            onSidebarClose();
          }}
          routeMode={routeMode}
          routeFrom={routeFrom}
          onRouteToggle={handleRoutePointSelect}
        />
      </div>

      <div className="map-wrap">
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

        {routeResult && (
          <RoutePanel
            result={routeResult}
            onClose={() => {
              setRouteResult(null);
              clearRouteLines();
            }}
          />
        )}
      </div>

      {pendingPos && (
        <AddPointModal
          position={pendingPos}
          geocoded={geocoded}
          onSave={handleSavePoint}
          onClose={() => {
            setPendingPos(null);
            setGeocoded(null);
          }}
        />
      )}

      {editingPoint && (
        <EditPointModal
          point={editingPoint}
          onSave={handleEditPoint}
          onClose={() => setEditingPoint(null)}
        />
      )}
    </div>
  );
}
