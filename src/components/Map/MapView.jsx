import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "@maptiler/leaflet-maptilersdk";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../../lib/AuthContext";
import { usePoints } from "../../hooks/usePoints";
import { useExpenses } from "../../hooks/useExpenses";
import { supabase } from "../../lib/supabase";
import { fetchDirections, parseLeg } from "../../lib/serpapi";
import { POINT_TYPES } from "../../lib/constants";
import SearchBox from "./SearchBox";
import PointsSidebar from "./PointsSidebar";
import RoutePanel from "./RoutePanel";
import AddPointModal from "./AddPointModal";
import EditPointModal from "./EditPointModal";
import { getLineColor } from "../../lib/metroColors";

export default function MapView({ searchOpen, onSearchClose }) {
  const { user } = useAuth();
  const { points, deletePoint, updatePoint } = usePoints();
  const { addExpense, updateExpense, deleteExpenseByPointId } = useExpenses();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const routeLayers = useRef([]);
  const metroLayersRef = useRef([]);
  const metroDataRef = useRef(null);
  const previewMarkerRef = useRef(null);

  const SWIPE_THRESHOLD = 60;
  const dragStartY = useRef(null);
  const [snap, setSnap] = useState("keep");

  const [metroDataLoaded, setMetroDataLoaded] = useState(false);
  const [pendingPos, setPendingPos] = useState(null);
  const [geocoded, setGeocoded] = useState(null);
  const [previewPos, setPreviewPos] = useState(null);
  const [editingPoint, setEditingPoint] = useState(null);
  const [showMetro, setShowMetro] = useState(true);

  // ── Route state (новий) ──
  const [routePanelOpen,  setRoutePanelOpen]  = useState(false);
  const [routeWaypoints,  setRouteWaypoints]  = useState([]);
  const [routePickTarget, setRoutePickTarget] = useState(null);
  const [routeResult,     setRouteResult]     = useState(null);
  const [routeBuilding,   setRouteBuilding]   = useState(false);

  // ── Swipe ──
  const onTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (dragStartY.current === null) return;
    const dy = dragStartY.current - e.changedTouches[0].clientY;
    if (dy > SWIPE_THRESHOLD) setSnap("full");
    if (dy < -SWIPE_THRESHOLD) setSnap("keep");
    dragStartY.current = null;
  };

  // ── Metro data ──
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/metro_paris.geojson");
        const text = await res.text();
        metroDataRef.current = text
          .trim()
          .split("\n")
          .map((l) => {
            try {
              return JSON.parse(l);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        setMetroDataLoaded(true);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const clearMetro = useCallback(() => {
    metroLayersRef.current.forEach((l) => l.remove());
    metroLayersRef.current = [];
  }, []);

  const renderMetro = useCallback(() => {
    if (!mapInstance.current || !metroDataRef.current) return;
    clearMetro();
    metroDataRef.current
      .filter((f) => f.geometry?.type === "LineString")
      .forEach((feature) => {
        try {
          const coords = feature.geometry.coordinates.map((c) => [c[1], c[0]]);
          if (coords.length < 2) return;
          const color = getLineColor(feature);
          const pl = L.polyline(coords, {
            color,
            weight: 3.5,
            opacity: 0.85,
          }).addTo(mapInstance.current);
          metroLayersRef.current.push(pl);
        } catch (e) {
          console.error(e);
        }
      });
  }, [clearMetro]);

  // ── Init map ──
  useEffect(() => {
    if (mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      tap: false,
    }).setView([48.8566, 2.3522], 12);
    L.tileLayer(
      "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=53DOD0o2wMmfZs5C4sZP",
      {
        tileSize: 512,
        zoomOffset: -1,
        attribution: "© OpenStreetMap contributors",
      },
    ).addTo(mapInstance.current);
    mapInstance.current.on("click", (e) => {
      if (routePickTarget) return;
      setPreviewPos(null);
      setGeocoded(null);
      setPendingPos({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => mapInstance.current?.invalidateSize();
    const t = setTimeout(handleResize, 350);
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !metroDataLoaded) return;
    if (showMetro) renderMetro();
    else clearMetro();
    return () => clearMetro();
  }, [showMetro, metroDataLoaded, renderMetro, clearMetro]);

  // ── Markers ──
  useEffect(() => {
    if (!mapInstance.current) return;
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};
    points.forEach((p) => {
      const t = POINT_TYPES[p.type] || POINT_TYPES.sight;
      const isWaypoint = routeWaypoints.some((w) => w.id === p.id);
      const icon = L.divIcon({
        html: `<div class="wp-marker ${isWaypoint ? "wp-marker-from" : ""}" style="background:${t.color}dd">${t.emoji}</div>`,
        className: "wp-marker-wrap",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });
      const img = Array.isArray(p.attachments)
        ? p.attachments.find(
            (x) =>
              (typeof x === "string" &&
                (x.startsWith("http") || x.startsWith("data:"))) ||
              (typeof x === "object" && x.data),
          )
        : null;
      const imgSrc = img ? (typeof img === "string" ? img : img.data) : null;
      const popup = `
        <div class="ios-card">
          ${imgSrc ? `<div class="ios-card-media"><img src="${imgSrc}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>` : ""}
          <div class="ios-card-content">
            <div class="ios-title">${p.name}</div>
            <div class="ios-subtitle">${t.emoji} ${t.label}</div>
            ${p.addr ? `<div class="ios-line">📍 ${p.addr}</div>` : ""}
            ${p.description ? `<div class="ios-desc">${p.description}</div>` : ""}
            ${p.estimated_cost ? `<div class="ios-price">💰 ${p.estimated_cost} ${p.currency}</div>` : ""}
          </div>
        </div>`;
      const m = L.marker([p.lat, p.lng], { icon }).addTo(mapInstance.current);
      m.bindPopup(popup);
      markersRef.current[p.id] = m;
    });
    return () => {
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};
    };
  }, [points, routeWaypoints]);

  // ── Preview marker ──
  useEffect(() => {
    previewMarkerRef.current?.remove();
    previewMarkerRef.current = null;
    delete window.__addPreviewPoint;
    if (!previewPos || !mapInstance.current) return;
    const icon = L.divIcon({
      html: `<div class="wp-marker" style="background:#0a84ffdd;border:3px solid #0a84ff">📍</div>`,
      className: "wp-marker-wrap",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });
    const popup = `
      <div class="ios-card">
        <div class="ios-card-content">
          <div class="ios-title">${geocoded?.name || "Знайдене місце"}</div>
          ${geocoded?.addr ? `<div class="ios-popup-addr">📍 ${geocoded.addr}</div>` : ""}
          <button onclick="window.__addPreviewPoint()" class="add-preview-btn">+ Додати точку</button>
        </div>
      </div>`;
    const marker = L.marker([previewPos.lat, previewPos.lng], { icon })
      .addTo(mapInstance.current)
      .bindPopup(popup)
      .openPopup();
    previewMarkerRef.current = marker;
    window.__addPreviewPoint = () => {
      setPendingPos(previewPos);
      marker.closePopup();
    };
    return () => {
      previewMarkerRef.current?.remove();
      previewMarkerRef.current = null;
      delete window.__addPreviewPoint;
    };
  }, [previewPos, geocoded]);

  // ── Helpers ──
  const flyTo = (p) => {
    mapInstance.current?.flyTo([p.lat, p.lng], 15, { duration: 0.8 });
    markersRef.current[p.id]?.openPopup();
  };

  const handleGeocodeResult = (result) => {
    setPreviewPos({ lat: result.lat, lng: result.lng });
    setGeocoded(result);
    setPendingPos(null);
    mapInstance.current?.flyTo([result.lat, result.lng], 15, { duration: 0.9 });
    onSearchClose?.();
    setSnap("full");
  };

  const clearRouteLines = useCallback(() => {
    routeLayers.current.forEach((l) => l.remove());
    routeLayers.current = [];
  }, []);

  const drawRouteLegs = useCallback(
    (legs) => {
      clearRouteLines();
      // SerpApi не дає polyline — малюємо пряму лінію між точками як заглушку
      legs.forEach((leg) => {
        const l = L.polyline(
          [
            [leg.from.lat, leg.from.lng],
            [leg.to.lat, leg.to.lng],
          ],
          { color: "#2a7de8", weight: 4, opacity: 0.7, dashArray: "8 6" },
        ).addTo(mapInstance.current);
        routeLayers.current.push(l);
      });
      if (routeLayers.current.length) {
        mapInstance.current.fitBounds(
          L.featureGroup(routeLayers.current).getBounds().pad(0.2),
        );
      }
    },
    [clearRouteLines],
  );

  // ── Route logic ──
  const fitToWaypoints = useCallback(
    (wps = routeWaypoints) => {
      if (!mapInstance.current || wps.length < 2) return;
      const bounds = L.latLngBounds(wps.map((wp) => [wp.lat, wp.lng]));
      mapInstance.current.fitBounds(bounds.pad(0.22));
    },
    [routeWaypoints],
  );

  const startRouteMode = () => {
    if (points.length < 2) {
      alert("Додайте хоча б 2 точки для маршруту");
      return;
    }
    setRouteWaypoints([]);
    setRoutePanelOpen(true);
    setRouteResult(null);
    clearRouteLines();
    setRoutePickTarget("start");
    setSnap("full");
  };

  const startWaypointPicking = () => {
    if (!routeWaypoints.length) setRoutePickTarget("start");
    else if (routeWaypoints.length === 1) setRoutePickTarget("finish");
    else setRoutePickTarget("stop");
    setSnap("full");
  };

  const handleBuildRoute = async (travelMode) => {
    if (routeWaypoints.length < 2) return;
    setRouteBuilding(true);
    try {
      const data = await fetchDirections(routeWaypoints, travelMode);
      const legs = data.legs.map((leg) => {
        const parsed = parseLeg(leg);
        return {
          from: leg.from,
          to: leg.to,
          totalDurFmt: parsed?.totalDurFmt || "—",
          totalDistFmt: parsed?.totalDistFmt || "—",
          totalDurSec: parsed?.totalDurSec || 0,
          totalDistM: parsed?.totalDistM || 0,
          via: parsed?.via || "",
          steps: parsed?.steps || [],
        };
      });
      setRouteResult({ legs });
      drawRouteLegs(legs);
    } catch (e) {
      alert("Помилка маршруту: " + e.message);
    }
    setRouteBuilding(false);
  };

  // Вибір точки зі списку для додавання в маршрут
  const handleRoutePointPick = (p) => {
    if (!routePickTarget) { flyTo(p); return; }
    const wp = { id: p.id, name: p.name, lat: p.lat, lng: p.lng };
    setRouteWaypoints((prev) => {
      let next = prev.filter((item) => item.id !== wp.id);
      if (routePickTarget === "start") {
        const finish = next.length ? next[next.length - 1] : null;
        next = finish && finish.id !== wp.id ? [wp, finish] : [wp];
      } else if (routePickTarget === "finish") {
        const start = next.length ? next[0] : null;
        next = start && start.id !== wp.id ? [start, wp] : [...next, wp];
      } else {
        if (next.length >= 2) next = [...next.slice(0, -1), wp, next[next.length - 1]];
        else next = [...next, wp];
      }
      if (next.length >= 2) setTimeout(() => fitToWaypoints(next), 0);
      return next;
    });
    setRoutePickTarget(null);
  };

  const handleSavePoint = async (data) => {
    try {
      const { data: inserted, error } = await supabase
        .from("points")
        .insert([{ ...data, created_by: user.id }])
        .select()
        .single();
      if (error) throw error;
      if (data.estimated_cost > 0) {
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
      setPreviewPos(null);
    } catch (e) {
      console.error(e);
      alert("Помилка при збереженні");
    }
  };

  const handleEditPoint = async (data) => {
    try {
      const pointId = editingPoint.id;
      await updatePoint(pointId, data);
      if (data.estimated_cost > 0) {
        const { data: ex } = await supabase
          .from("expenses")
          .select("id")
          .eq("point_id", pointId)
          .single();
        if (ex) {
          await updateExpense(ex.id, {
            name: `🏷️ ${data.name}`,
            amount: data.estimated_cost,
            currency: data.currency,
          });
        } else {
          await addExpense({
            name: `🏷️ ${data.name}`,
            amount: data.estimated_cost,
            category: "Місце",
            currency: data.currency,
            created_by: user.id,
            point_id: pointId,
          });
        }
      } else if (editingPoint.estimated_cost && !data.estimated_cost) {
        await deleteExpenseByPointId(pointId);
      }
      setEditingPoint(null);
    } catch (e) {
      console.error(e);
      alert("Помилка при редагуванні");
    }
  };

  const handleToggleCompleted = async (point) => {
    try {
      await updatePoint(point.id, { is_completed: !point.is_completed });
    } catch (e) {
      console.error(e);
    }
  };

  const snapClass = snap === "full" ? "sheet-full" : "sheet-keep";

  return (
    <div className="map-view">
      {/* ── Floating search overlay (mobile) ── */}
      {searchOpen && (
        <div className="map-search-overlay">
          <SearchBox onResult={handleGeocodeResult} />
          <button
            className="search-close-btn"
            onClick={onSearchClose}
            aria-label="Закрити пошук"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <div className="map-sidebar">
        {searchOpen && (
          <div style={{ padding: "12px 12px 0" }}>
            <SearchBox onResult={handleGeocodeResult} />
          </div>
        )}

        <div className="sidebar-section" style={{ marginTop: 8 }}>
          <button
            className={`route-btn ${routePanelOpen ? "active" : ""}`}
            onClick={routePanelOpen
              ? () => { setRoutePanelOpen(false); setRouteResult(null); clearRouteLines(); setRoutePickTarget(null); }
              : startRouteMode}
          >
            {routeBuilding
              ? "⏳ Будуємо..."
              : routePanelOpen
                ? "🔴 Закрити маршрут"
                : "🚌 Маршрут"}
          </button>
          <button
            className={`route-btn ${showMetro ? "active" : ""}`}
            onClick={() => setShowMetro((v) => !v)}
          >
            {showMetro ? "🚇 Метро (вкл)" : "🚇 Метро (викл)"}
          </button>
        </div>

        {routePanelOpen ? (
          routePickTarget ? (
            <PointsSidebar
              points={points}
              onFly={flyTo}
              onDelete={deletePoint}
              onEdit={(p) => setEditingPoint(p)}
              onToggleCompleted={handleToggleCompleted}
              routeMode
              routeFrom={null}
              onRouteToggle={handleRoutePointPick}
            />
          ) : (
            <div style={{ margin: "0 12px 8px" }}>
              <RoutePanel
                waypoints={routeWaypoints}
                onAddWaypoint={startWaypointPicking}
                onRemoveWaypoint={(i) =>
                  setRouteWaypoints((prev) => prev.filter((_, idx) => idx !== i))
                }
                onBuild={handleBuildRoute}
                result={routeResult}
                building={routeBuilding}
                pickMode={false}
                onClose={() => {
                  setRoutePanelOpen(false);
                  setRouteResult(null);
                  clearRouteLines();
                  setRoutePickTarget(null);
                }}
              />
            </div>
          )
        ) : (
          <PointsSidebar
            points={points}
            onFly={flyTo}
            onDelete={deletePoint}
            onEdit={(p) => setEditingPoint(p)}
            onToggleCompleted={handleToggleCompleted}
            routeMode={false}
            routeFrom={null}
            onRouteToggle={handleRoutePointPick}
          />
        )}
      </div>

      {/* ── Map ── */}
      <div className="map-wrap">
        <div ref={mapRef} className="leaflet-map" />
      </div>

      {/* ── Mobile bottom sheet ── */}
      <div className={`map-sheet ${snapClass}`}>
        <div
          className="sheet-handle-wrap"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="sheet-handle" />
        </div>

        <div className="sheet-actions">
          <button
            className={`sheet-action-btn ${routePanelOpen ? "active" : ""}`}
            onClick={routePanelOpen
              ? () => { setRoutePanelOpen(false); setRouteResult(null); clearRouteLines(); setRoutePickTarget(null); }
              : startRouteMode}
          >
            {routeBuilding
              ? "⏳"
              : routePanelOpen
                ? "🔴 Маршрут"
                : "🚌 Маршрут"}
          </button>
          <button
            className={`sheet-action-btn ${showMetro ? "active" : ""}`}
            onClick={() => setShowMetro((v) => !v)}
          >
            🚇 Метро
          </button>
        </div>

        <div className="sheet-scroll">
          {routePanelOpen ? (
            routePickTarget ? (
              <PointsSidebar
                points={points}
                onFly={flyTo}
                onDelete={deletePoint}
                onEdit={(p) => setEditingPoint(p)}
                onToggleCompleted={handleToggleCompleted}
                routeMode
                routeFrom={null}
                onRouteToggle={handleRoutePointPick}
              />
            ) : (
              <div style={{ padding: "0 12px 8px" }}>
                <RoutePanel
                  waypoints={routeWaypoints}
                  onAddWaypoint={startWaypointPicking}
                  onRemoveWaypoint={(i) =>
                    setRouteWaypoints((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  onBuild={handleBuildRoute}
                    result={routeResult}
                  building={routeBuilding}
                  pickMode={false}
                  onClose={() => {
                    setRoutePanelOpen(false);
                    setRouteResult(null);
                    clearRouteLines();
                    setRoutePickTarget(null);
                  }}
                />
              </div>
            )
          ) : (
            <PointsSidebar
              points={points}
              onFly={flyTo}
              onDelete={deletePoint}
              onEdit={(p) => setEditingPoint(p)}
              onToggleCompleted={handleToggleCompleted}
              routeMode={false}
              routeFrom={null}
              onRouteToggle={handleRoutePointPick}
            />
          )}
        </div>
      </div>

      {pendingPos && (
        <AddPointModal
          position={pendingPos}
          geocoded={geocoded}
          onSave={handleSavePoint}
          onClose={() => {
            setPendingPos(null);
            setGeocoded(null);
            setPreviewPos(null);
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
