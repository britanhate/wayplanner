import { useState, useEffect, useRef, useCallback } from "react";
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
  const metroLayersRef = useRef([]);
  const metroDataRef = useRef(null);
  const previewMarkerRef = useRef(null);

  // Bottom-sheet drag
  const dragStartY = useRef(null);
  const [snap, setSnap] = useState("peek"); // "peek" | "half" | "full"

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

  // Sync external toggle (hamburger) → sheet
  useEffect(() => {
    if (sidebarOpen) setSnap("half");
  }, [sidebarOpen]);

  useEffect(() => {
    if (snap === "peek") onSidebarClose?.();
  }, [snap]);

  // ── Drag handlers ──
  const onTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e) => {
    if (dragStartY.current === null) return;

    const dy = dragStartY.current - e.changedTouches[0].clientY;

    if (dy > 40) {
      setSnap((s) => (s === "peek" ? "half" : "full"));
    }

    if (dy < -40) {
      setSnap((s) => (s === "full" ? "half" : "peek"));
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
      .forEach((edge) => {
        try {
          const coords = edge.geometry.coordinates.map((c) => [c[1], c[0]]);

          if (coords.length > 1) {
            const pl = L.polyline(coords, {
              color: "#0400f8",
              weight: 3,
              opacity: 0.75,
            }).addTo(mapInstance.current);

            metroLayersRef.current.push(pl);
          }
        } catch {}
      });
  }, [clearMetro]);

  // ── Init map ──
  useEffect(() => {
    if (mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([48.8566, 2.3522], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(mapInstance.current);

    mapInstance.current.on("click", (e) => {
      if (routeModeRef.current) return;

      setPreviewPos(null);
      setGeocoded(null);

      setPendingPos({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
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
    const handleResize = () => {
      mapInstance.current?.invalidateSize();
    };

    const timeout = setTimeout(() => {
      handleResize();
    }, 350);

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !metroDataLoaded) return;

    if (showMetro) {
      renderMetro();
    } else {
      clearMetro();
    }

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
        html: `
          <div
            class="wp-marker ${isFrom ? "wp-marker-from" : ""}"
            style="background:${t.color}dd"
          >
            ${t.emoji}
          </div>
        `,
        className: "wp-marker-wrap",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const img = Array.isArray(p.attachments)
        ? p.attachments.find(
            (x) => typeof x === "string" && x.startsWith("http"),
          )
        : null;

      const popup = `
  <div class="ios-card">

    ${
      img
        ? `
      <div class="ios-card-media">
        <img src="${img}" />
      </div>
    `
        : ""
    }

    <div class="ios-card-content">

      <div class="ios-title-row">
        <div class="ios-title">${p.name}</div>
      </div>

      <div class="ios-subtitle">
        ${t.emoji} ${t.label}
      </div>

      ${p.addr ? `<div class="ios-line">📍 ${p.addr}</div>` : ""}

      ${p.description ? `<div class="ios-desc">${p.description}</div>` : ""}

      ${
        p.estimated_cost
          ? `<div class="ios-price">💰 ${p.estimated_cost} ${p.currency}</div>`
          : ""
      }

    </div>
  </div>
`;

      const m = L.marker([p.lat, p.lng], {
        icon,
      }).addTo(mapInstance.current);

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
      html: `
        <div
          class="wp-marker"
          style="background:#0a84ffdd;border:3px solid #0a84ff"
        >
          📍
        </div>
      `,
      className: "wp-marker-wrap",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });

    const popup = `
      <div class="popup-card">
        <div class="popup-title">
          ${geocoded?.name || "Знайдене місце"}
        </div>

        ${
          geocoded?.addr
            ? `<div class="popup-addr">📍 ${geocoded.addr}</div>`
            : ""
        }

        <button
          onclick="window.__addPreviewPoint()"
          style="
            margin-top:8px;
            width:100%;
            padding:8px;
            background:#0a84ff;
            border:none;
            border-radius:10px;
            color:#fff;
            font-size:13px;
            font-weight:600;
            cursor:pointer;
          "
        >
          + Додати точку
        </button>
      </div>
    `;

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
    setPreviewPos({
      lat: result.lat,
      lng: result.lng,
    });

    setGeocoded(result);
    setPendingPos(null);

    mapInstance.current?.flyTo([result.lat, result.lng], 15, { duration: 0.9 });

    setSnap("peek");
  };

  const handleSavePoint = async (data) => {
    try {
      const { data: inserted, error } = await supabase
        .from("points")
        .insert([
          {
            ...data,
            created_by: user.id,
          },
        ])
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
          {
            color: "#2a7de8",
            weight: 4,
            opacity: 0.8,
          },
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

    setRouteMode(true);
    setRouteStep(1);
    setRouteFrom(null);
  };

  const handleToggleCompleted = async (point) => {
    try {
      await updatePoint(point.id, {
        is_completed: !point.is_completed,
      });
    } catch {}
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

  const snapClass =
    snap === "full"
      ? "sheet-full"
      : snap === "half"
        ? "sheet-half"
        : "sheet-peek";

  return (
    <div className="map-view">
      {/* Search floats ON the map */}
      <div className="map-search-overlay">
        <SearchBox onResult={handleGeocodeResult} />
      </div>

      {/* Desktop sidebar */}
      <div className="map-sidebar">
        <div className="sidebar-section">
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

        <PointsSidebar
          points={points}
          onFly={(p) => flyTo(p)}
          onDelete={deletePoint}
          onEdit={(p) => setEditingPoint(p)}
          onToggleCompleted={handleToggleCompleted}
          routeMode={routeMode}
          routeFrom={routeFrom}
          onRouteToggle={handleRoutePointSelect}
        />
      </div>

      {/* Map */}
      <div className="map-wrap">
        <div ref={mapRef} className="leaflet-map" />

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

      {/* Mobile sheet */}
      <div
        className={`map-sheet ${snapClass}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="sheet-handle-wrap">
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
        </div>

        <div className="sheet-scroll">
          <PointsSidebar
            points={points}
            onFly={(p) => {
              flyTo(p);
              setSnap("peek");
            }}
            onDelete={deletePoint}
            onEdit={(p) => {
              setEditingPoint(p);
              setSnap("peek");
            }}
            onToggleCompleted={handleToggleCompleted}
            routeMode={routeMode}
            routeFrom={routeFrom}
            onRouteToggle={handleRoutePointSelect}
          />
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
