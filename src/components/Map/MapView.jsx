import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../../lib/AuthContext";
import { usePoints } from "../../hooks/usePoints";
import { useExpenses } from "../../hooks/useExpenses";
import { supabase } from "../../lib/supabase";
import { buildRoute } from "../../lib/arcgis";
import { buildLegs } from "../../lib/routeBuilder";
import { POINT_TYPES } from "../../lib/constants";
import SearchBox from "./SearchBox";
import PointsSidebar from "./PointsSidebar";
import AddPointModal from "./AddPointModal";
import EditPointModal from "./EditPointModal";
import { getLineColor } from "../../lib/metroColors";

export default function MapView({ onSidebarClose }) {
  const { user } = useAuth();
  const { points, deletePoint, updatePoint } = usePoints();
  const { addExpense, updateExpense, deleteExpenseByPointId } = useExpenses();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const routeLayers = useRef([]);
  const routeModeRef = useRef(false);
  const metroLayersRef = useRef([]);
  const metroDataRef = useRef(null);
  const previewMarkerRef = useRef(null);
  const SWIPE_THRESHOLD = 60;
  const dragStartY = useRef(null);
  const sidebarScrollRef = useRef(null);
  const [snap, setSnap] = useState("keep");

  const [metroDataLoaded, setMetroDataLoaded] = useState(false);
  const [pendingPos, setPendingPos] = useState(null);
  const [geocoded, setGeocoded] = useState(null);
  const [previewPos, setPreviewPos] = useState(null);
  const [editingPoint, setEditingPoint] = useState(null);
  const [routeMode, setRouteMode] = useState(false);
  const [routeStep, setRouteStep] = useState(0);
  const [routeFrom, setRouteFrom] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [routeBuilding, setRouteBuilding] = useState(false);
  const [showMetro, setShowMetro] = useState(true);
  const [routeMinimized, setRouteMinimized] = useState(false);
  // Mobile: show route detail panel instead of points list
  const [mobileRouteOpen, setMobileRouteOpen] = useState(false);

  useEffect(() => {
    if (snap === "keep") {
      // Скидаємо скрол при закритті сайдбара
      if (sidebarScrollRef.current) {
        sidebarScrollRef.current.scrollTop = 0;
      }
      onSidebarClose?.();
    }
  }, [snap, onSidebarClose]);

  const onTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (dragStartY.current === null) return;

    const dy = dragStartY.current - e.changedTouches[0].clientY;

    // свайп вверх
    if (dy > SWIPE_THRESHOLD) {
      setSnap("full");
    }

    if (dy < -SWIPE_THRESHOLD) {
      setSnap("keep");
    }

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
        const sample = metroDataRef.current.find(
          (f) => f.geometry?.type === "LineString",
        );
        if (sample) {
          console.log("Metro feature properties:", sample.properties);
          console.log(
            "Metro feature keys:",
            Object.keys(sample.properties || {}),
          );
        }

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
    L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(mapInstance.current);
    mapInstance.current.on("click", (e) => {
      if (routeModeRef.current) return;
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
    routeModeRef.current = routeMode;
  }, [routeMode]);

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
      const isFrom = routeFrom?.id === p.id;
      const icon = L.divIcon({
        html: `<div class="wp-marker ${isFrom ? "wp-marker-from" : ""}" style="background:${t.color}dd">${t.emoji}</div>`,
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
  }, [points, routeFrom]);

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
      <div class="popup-card">
        <div class="popup-title">${geocoded?.name || "Знайдене місце"}</div>
        ${geocoded?.addr ? `<div class="popup-addr">📍 ${geocoded.addr}</div>` : ""}
        <button onclick="window.__addPreviewPoint()" style="margin-top:8px;width:100%;padding:8px;background:#0a84ff;border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">+ Додати точку</button>
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
    setSnap("full");
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

  const clearRouteLines = useCallback(() => {
    routeLayers.current.forEach((l) => l.remove());
    routeLayers.current = [];
  }, []);

  const drawRoute = useCallback(
    (paths) => {
      clearRouteLines();
      paths.forEach((path) => {
        const l = L.polyline(
          path.map((c) => [c[1], c[0]]),
          { color: "#2a7de8", weight: 4, opacity: 0.8 },
        ).addTo(mapInstance.current);
        routeLayers.current.push(l);
      });
      if (routeLayers.current.length) {
        mapInstance.current.fitBounds(
          L.featureGroup(routeLayers.current).getBounds().pad(0.15),
        );
      }
    },
    [clearRouteLines],
  );

  const startRouteMode = () => {
    if (points.length < 2) {
      alert("Додайте хоча б 2 точки!");
      return;
    }
    clearRouteLines();
    setRouteResult(null);
    setMobileRouteOpen(false);
    setRouteMode(true);
    setRouteStep(1);
    setRouteFrom(null);
  };

  const handleToggleCompleted = async (point) => {
    try {
      await updatePoint(point.id, { is_completed: !point.is_completed });
    } catch (e) {
      console.error(e);
    }
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
        const legs = buildLegs(
          routeFrom,
          p,
          res.totalMin,
          res.totalKm,
          res.directions,
        );
        setRouteResult({
          from: routeFrom,
          to: p,
          totalMin: res.totalMin,
          totalKm: res.totalKm,
          legs,
        });
        setRouteMinimized(false);
        // Auto-open route detail on mobile
        // setMobileRouteOpen(true);
        setSnap("full");
      } catch (e) {
        alert(e.message);
      }
      setRouteBuilding(false);
      setRouteFrom(null);
    }
  };

  const snapClass = snap === "full" ? "sheet-full" : "sheet-keep";

  // ── Shared route legs renderer ──
  const renderLegs = (legs) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {legs.map((leg, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            padding: "4px 0",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: leg.color + "22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            {leg.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#f0f4ff",
                lineHeight: 1.3,
              }}
            >
              {leg.main}
            </div>
            {leg.sub && (
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 2,
                }}
              >
                {leg.sub}
              </div>
            )}
          </div>
          {/* Connector line except last */}
          {i < legs.length - 1 && (
            <div
              style={{
                position: "absolute",
                left: 27,
                top: 36,
                width: 2,
                height: 10,
                background: "rgba(255,255,255,0.08)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );

  // ── Route summary header ──
  const renderRouteSummary = () => {
    if (!routeResult) return null;
    const h = Math.floor(routeResult.totalMin / 60);
    const m = routeResult.totalMin % 60;
    const timeStr = h > 0 ? `${h}г ${m}хв` : `${m} хв`;
    return (
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: "0.5px solid rgba(255,255,255,0.07)",
        }}
      >
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#0a84ff" }}>
            {timeStr}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            Час
          </div>
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {routeResult.totalKm}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>км</div>
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.4,
            }}
          >
            {routeResult.from.name}
            <br />↓<br />
            {routeResult.to.name}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="map-view">
      {/* Floating search — mobile */}
      <div className="map-search-overlay">
        <SearchBox onResult={handleGeocodeResult} />
      </div>

      {/* ── Desktop sidebar ── */}
      <div className="map-sidebar">
        <div style={{ padding: "12px 12px 0" }}>
          <SearchBox onResult={handleGeocodeResult} />
        </div>

        <div className="sidebar-section" style={{ marginTop: 8 }}>
          <button
            className={`route-btn ${routeMode ? "active" : ""}`}
            onClick={
              routeMode
                ? () => {
                    setRouteMode(false);
                    setRouteStep(0);
                    setRouteFrom(null);
                  }
                : startRouteMode
            }
          >
            {routeBuilding
              ? "⏳ Будуємо..."
              : routeMode
                ? `🔴 ${routeStep === 1 ? "Оберіть старт" : "Оберіть фініш"}`
                : "🚌 Маршрут"}
          </button>
          <button
            className={`route-btn ${showMetro ? "active" : ""}`}
            onClick={() => setShowMetro((v) => !v)}
          >
            {showMetro ? "🚇 Метро (вкл)" : "🚇 Метро (викл)"}
          </button>
        </div>

        {/* Desktop route result */}
        {routeResult && (
          <div
            style={{
              margin: "0 12px 8px",
              borderRadius: 14,
              border: "0.5px solid rgba(255,255,255,0.1)",
              background: "rgba(10,132,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: routeMinimized
                  ? "none"
                  : "0.5px solid rgba(255,255,255,0.07)",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                🚌 {routeResult.from.name} → {routeResult.to.name}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => setRouteMinimized((v) => !v)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: "2px 6px",
                  }}
                >
                  {routeMinimized ? "▼" : "▲"}
                </button>
                <button
                  onClick={() => {
                    setRouteResult(null);
                    clearRouteLines();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    fontSize: 16,
                    padding: "2px 6px",
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            {!routeMinimized && (
              <div
                style={{
                  padding: "10px 14px 14px",
                  maxHeight: 400,
                  overflowY: "auto",
                }}
              >
                {renderRouteSummary()}
                {renderLegs(routeResult.legs)}
              </div>
            )}
          </div>
        )}

        <PointsSidebar
          points={points}
          onFly={flyTo}
          onDelete={deletePoint}
          onEdit={(p) => setEditingPoint(p)}
          onToggleCompleted={handleToggleCompleted}
          routeMode={routeMode}
          routeFrom={routeFrom}
          onRouteToggle={handleRoutePointSelect}
        />
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
            className={`sheet-action-btn ${routeMode ? "active" : ""}`}
            onClick={
              routeMode
                ? () => {
                    setRouteMode(false);
                    setRouteStep(0);
                    setRouteFrom(null);
                  }
                : startRouteMode
            }
          >
            {routeBuilding
              ? "⏳"
              : routeMode
                ? `🔴 ${routeStep === 1 ? "Старт" : "Фініш"}`
                : "🚌 Маршрут"}
          </button>
          <button
            className={`sheet-action-btn ${showMetro ? "active" : ""}`}
            onClick={() => setShowMetro((v) => !v)}
          >
            🚇 Метро
          </button>
          {/* Toggle between route and points list */}
          {routeResult && (
            <button
              className={`sheet-action-btn ${mobileRouteOpen ? "active" : ""}`}
              onClick={() => {
                setMobileRouteOpen((v) => !v);
                setSnap("full");
              }}
            >
              🗺 Деталі
            </button>
          )}
        </div>

        <div className="sheet-scroll" ref={sidebarScrollRef}>
          {/* Mobile: route detail view */}
          {mobileRouteOpen && routeResult ? (
            <div style={{ padding: "0 14px 24px" }}>
              {/* Header with close */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  Деталі маршруту
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => setMobileRouteOpen(false)}
                    style={{
                      border: "none",
                      color: "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      fontSize: 13,
                      padding: "4px 8px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.06)",
                    }}
                  >
                    ← Точки
                  </button>
                  <button
                    onClick={() => {
                      setRouteResult(null);
                      clearRouteLines();
                      setMobileRouteOpen(false);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      fontSize: 18,
                      padding: "0 4px",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {renderRouteSummary()}
              {renderLegs(routeResult.legs)}
            </div>
          ) : (
            /* Normal points list */
            <PointsSidebar
              points={points}
              onFly={(p) => {
                flyTo(p);
              }}
              onDelete={deletePoint}
              onEdit={(p) => {
                setEditingPoint(p);
              }}
              onToggleCompleted={handleToggleCompleted}
              routeMode={routeMode}
              routeFrom={routeFrom}
              onRouteToggle={handleRoutePointSelect}
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
