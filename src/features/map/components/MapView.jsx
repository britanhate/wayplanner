import { Suspense, lazy, startTransition, useState, useEffect, useRef, useCallback, useMemo } from "react";
import L from "leaflet";
import "@maptiler/leaflet-maptilersdk";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../../../lib/AuthContext";
import { usePoints } from "../../points/hooks/usePoints";
import { useExpenses } from "../../finance/hooks/useExpenses";
import { supabase } from "../../../lib/supabase";
import { POINT_TYPES } from "../../../lib/constants";
import { createTileLayer, getPointImageSrc } from "../lib/mapUtils";
import SearchBox from "./SearchBox";
import { reverseGeocode, searchNearbyPlaces } from "../../../lib/arcgis";
import PointsSidebar from "../../points/components/PointsSidebar";
import AddPointModal from "../../points/components/AddPointModal";
import EditPointModal from "../../points/components/EditPointModal";
import NearbyPlacesPanel from "./NearbyPlacesPanel";
import { useBottomSheetSwipe } from "../../../shared/hooks/useBottomSheetSwipe";
import "./MapView.css";
import { logSlowInteraction, markPerf, measurePerf } from "../../../shared/lib/perf";
import CalciteIcon from "../../../shared/ui/CalciteIcon";


const NEARBY_CATEGORIES = [
  { id: "restaurants", label: "Ресторани", arcgis: "13065", pointType: "food" },
  { id: "cafes", label: "Кафе", arcgis: "13032", pointType: "food" },
  { id: "bars", label: "Бари", arcgis: "13003", pointType: "food" },
  { id: "museums", label: "Музеї", arcgis: "10027", pointType: "museum" },
  { id: "landmarks", label: "Памʼятки", arcgis: "16000", pointType: "sight" },
  { id: "hotels", label: "Готелі", arcgis: "10001", pointType: "hotel" },
  { id: "shops", label: "Магазини", arcgis: "11000", pointType: "shop" },
];

const RoutePanel = lazy(() => import("../../routes/components/RoutePanel"));
const MetroPanel = lazy(() => import("../../metro/components/MetroPanel"));



export default function MapView({ searchOpen, onSearchClose, mapStyle }) {
  const { user } = useAuth();
  const { points, loading: pointsLoading, deletePoint, updatePoint } = usePoints();
  const { addExpense, deleteExpense, updateExpense, deleteExpenseByPointId } = useExpenses({ enabled: false });

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const routeLayers = useRef([]);
  const previewMarkerRef = useRef(null);
  const previewCloseByActionRef = useRef(false);
  const previewCloseByRenderRef = useRef(false);
  const tileLayerRef = useRef(null);
  const pointIconCacheRef = useRef(new Map());
  const userLocationMarkerRef = useRef(null);
  const userAccuracyCircleRef = useRef(null);
  const nearbyMarkersLayerRef = useRef(null);
  const nearbyMarkersRef = useRef(new Map());
  const reverseGeocodeRequestRef = useRef(0);


  const {
    snap,
    setSnap,
    sheetRef,
    scrollRef,
    onDragAreaPointerDown,
    onScrollPointerDown,
    sheetStyle,
  } = useBottomSheetSwipe("collapsed");

  const [pendingPos, setPendingPos] = useState(null);
  const [geocoded, setGeocoded] = useState(null);
  const [previewPos, setPreviewPos] = useState(null);
  const [editingPoint, setEditingPoint] = useState(null);
  const [metroPanelOpen, setMetroPanelOpen] = useState(false);

  const [routePanelOpen, setRoutePanelOpen] = useState(false);
  const [routePoints, setRoutePoints] = useState([null, null]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(null);
  const [routeBuilding, setRouteBuilding] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [uiMessage, setUiMessage] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [selectedPointId, setSelectedPointId] = useState(null);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyCategory, setNearbyCategory] = useState(NEARBY_CATEGORIES[0].id);
  const [nearbyAnchor, setNearbyAnchor] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedNearbyPlace, setSelectedNearbyPlace] = useState(null);

  // ── Ініціалізація карти ──
  // ── Ініціалізація карти ──
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [50.4501, 30.5234],
      zoom: 12,
      zoomControl: false, // Це ви вже маєте
      attributionControl: false, // Видаляє текст знизу справа
      boxZoom: false, // Вимикає зайві рамки
      doubleClickZoom: false,
      closePopupOnClick: false,
    });
    if (map.attributionControl) {
      map.attributionControl.setPrefix(false);
    }
    mapInstance.current = map;
    nearbyMarkersLayerRef.current = L.layerGroup().addTo(map);

    // Клік по карті — ставимо прев'ю
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      startTransition(() => {
        setPreviewPos({ lat, lng });
      });
      const requestId = ++reverseGeocodeRequestRef.current;
      (async () => {
        try {
          const place = await reverseGeocode(lat, lng);
          if (requestId !== reverseGeocodeRequestRef.current) return;
          startTransition(() => {
            setGeocoded(place);
          });
        } catch {
          if (requestId !== reverseGeocodeRequestRef.current) return;
          startTransition(() => {
            setGeocoded({
              name: "Обране місце",
              addr: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            });
          });
        }
      })();
    });

    // ВАЖЛИВО: Видаляємо дані прев'ю, коли попап закривається (хрестиком або кліком мимо)
    // Але якщо попап закрито дією "Додати точку" або "Що поруч?", ми не очищаємо
    // preview/ geocoded одразу — це дозволяє модалці отримати дані.
    map.on("popupclose", (e) => {
      // Перевіряємо, чи це саме прев'ю-маркер закрив свій попап
      if (!previewMarkerRef.current || e.popup !== previewMarkerRef.current.getPopup()) return;
      if (previewCloseByRenderRef.current) {
        previewCloseByRenderRef.current = false;
        return;
      }
      if (previewCloseByActionRef.current) {
        // закриття ініційовано дією з попапу — зберігаємо стан до появи модалки
        previewCloseByActionRef.current = false;
        return;
      }
      setPreviewPos(null);
      setGeocoded(null);
    });

    // Закриття по Esc
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setPreviewPos(null);
        setGeocoded(null);
        map.closePopup();
      }
    };
    window.addEventListener("keydown", handleEsc);

    tileLayerRef.current = createTileLayer("standard").addTo(map);
    map.whenReady(() => {
      markPerf("map_ready");
      measurePerf("startup_to_map_ready", "app_start", "map_ready");
    });

    return () => {
      window.removeEventListener("keydown", handleEsc);
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // ── Зміна стилю карти ──
  useEffect(() => {
    if (!pointsLoading) {
      markPerf("points_loaded");
      measurePerf("startup_to_points_loaded", "app_start", "points_loaded");
    }

    if (!mapInstance.current) return;

    if (tileLayerRef.current) {
      mapInstance.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = createTileLayer(mapStyle || "standard").addTo(
      mapInstance.current,
    );
  }, [mapStyle, pointsLoading]);

  const getMarkerIcon = useCallback((type, isWaypoint) => {
    const key = `${type}:${isWaypoint ? "1" : "0"}`;
    const cached = pointIconCacheRef.current.get(key);
    if (cached) return cached;
    const t = POINT_TYPES[type] || POINT_TYPES.sight;
    const icon = L.divIcon({
      html: `<div class="wp-marker ${isWaypoint ? "wp-marker-from" : ""}" style="background:${t.color}dd"><calcite-icon icon="${t.icon || "pin"}" scale="m"></calcite-icon></div>`,
      className: "wp-marker-wrap",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });
    pointIconCacheRef.current.set(key, icon);
    return icon;
  }, []);


  const openNearbyForPoint = useCallback((point) => {
    if (!point) return;
    setMetroPanelOpen(false);
    setRoutePanelOpen(false);
    setActiveRouteIndex(null);
    startTransition(() => {
      setNearbyAnchor({ lat: point.lat, lng: point.lng });
      setNearbyCategory(NEARBY_CATEGORIES[0].id);
      setNearbyOpen(true);
      setSnap("expanded");
    });
  }, [setSnap]);

  const handleOpenNearbyFromPoint = useCallback(
    (pointId) => {
      const point = points.find((point) => String(point.id) === String(pointId));
      if (!point) return;
      openNearbyForPoint(point);
    },
    [openNearbyForPoint, points],
  );

  const attachPopupHandlers = useCallback(
    (popupElement, { pointId, previewPos }) => {
      if (!popupElement || popupElement.dataset.popupActionsBound === "1") return;
      popupElement.dataset.popupActionsBound = "1";

      popupElement.addEventListener("click", (event) => {
        const target = event.target.closest(
          ".open-nearby-from-point, .open-nearby-from-preview, .add-preview-point",
        );
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();

        if (target.classList.contains("open-nearby-from-point")) {
          handleOpenNearbyFromPoint(pointId);
          return;
        }

        if (target.classList.contains("open-nearby-from-preview")) {
          if (previewPos) {
            openNearbyForPoint({ lat: previewPos.lat, lng: previewPos.lng });
            previewMarkerRef.current?.closePopup();
          }
          return;
        }

        if (target.classList.contains("add-preview-point")) {
          if (previewPos) {
            setPendingPos(previewPos);
            previewMarkerRef.current?.closePopup();
          }
        }
      });
    },
    [handleOpenNearbyFromPoint, openNearbyForPoint],
  );

  const pointPopupMap = useMemo(
    () =>
      new Map(
        points.map((p) => {
          const t = POINT_TYPES[p.type] || POINT_TYPES.sight;
          const imgSrc = getPointImageSrc(p.attachments);
          const popup = `<div class="ios-card">${imgSrc ? `<div class="ios-card-media"><img src="${imgSrc}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>` : ""}<div class="ios-card-content"><div class="ios-title">${p.name}</div><div class="ios-subtitle"><calcite-icon icon="${t.icon || "pin"}" scale="s"></calcite-icon> ${t.label}</div>${p.addr ? `<div class="ios-line"><calcite-icon icon="pin" scale="s"></calcite-icon> ${p.addr}</div>` : ""}${p.description ? `<div class="ios-desc">${p.description}</div>` : ""}${p.estimated_cost ? `<div class="ios-price"><calcite-icon icon="credit-card" scale="s"></calcite-icon> ${p.estimated_cost} ${p.currency}</div>` : ""}<button data-point-id="${p.id}" class="nearby-trigger-btn open-nearby-from-point"><calcite-icon icon="search" scale="s"></calcite-icon> Що поруч</button></div></div>`;
          return [p.id, popup];
        }),
      ),
    [points],
  );


  // ── Markers ──
  useEffect(() => {
    if (!pointsLoading) {
      markPerf("points_loaded");
      measurePerf("startup_to_points_loaded", "app_start", "points_loaded");
    }

    if (!mapInstance.current) return;
    const nextIds = new Set(points.map((p) => p.id));

    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!nextIds.has(id)) {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    points.forEach((p) => {
      const isWaypoint = routePoints.some((rp) => rp?.id === p.id);
      const icon = getMarkerIcon(p.type, isWaypoint);
      const popup = pointPopupMap.get(p.id);
      const existing = markersRef.current[p.id];
      if (!existing) {
        const marker = L.marker([p.lat, p.lng], { icon }).addTo(mapInstance.current);
        marker.bindPopup(popup);
        marker.on("popupopen", (event) => {
          attachPopupHandlers(event.popup?.getElement(), { pointId: p.id });
        });
        markersRef.current[p.id] = marker;
        return;
      }

      existing.setLatLng([p.lat, p.lng]);
      existing.setIcon(icon);
      if (existing.getPopup()?.getContent() !== popup) {
        existing.setPopupContent(popup);
      }
    });
  }, [points, pointsLoading, routePoints, pointPopupMap, getMarkerIcon, attachPopupHandlers]);

  // ── Preview marker ──
  // ── Preview marker ──
  const getPreviewPopupContent = useCallback((position, place) => `
    <div class="ios-card">
      <div class="ios-card-content">
        <div class="ios-title">${place?.name || "Знайдене місце"}</div>
        ${place?.addr ? `<div class="ios-popup-addr">${place.addr}</div>` : ""}
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button onclick="window.__addPreviewPoint(); event.stopPropagation();" class="add-preview-btn">+ Додати точку</button>
          <button onclick="window.__openNearbyFromPreview(); event.stopPropagation();" class="nearby-trigger-btn">Що поруч</button>
        </div>
      </div>
    </div>`, []);

  useEffect(() => {
    if (previewMarkerRef.current) {
      previewMarkerRef.current.remove();
      previewMarkerRef.current = null;
    }
    delete window.__addPreviewPoint;
    delete window.__openNearbyFromPreview;
    if (!previewPos || !mapInstance.current) return;

    const icon = L.divIcon({
      html: `<div class="wp-marker" style="background:#0a84ffdd;border:3px solid #0a84ff"><calcite-icon icon="pin" scale="m"></calcite-icon></div>`,
      className: "wp-marker-wrap",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });

    const popup = getPreviewPopupContent(previewPos, geocoded);

    const marker = L.marker([previewPos.lat, previewPos.lng], { icon })
      .addTo(mapInstance.current)
      .bindPopup(popup, { autoClose: false }) // autoClose: false дозволяє нам контролювати процес
      .openPopup();

    previewMarkerRef.current = marker;

    window.__addPreviewPoint = () => {
      setPendingPos(previewPos);
      // При кліку на "Додати" ми не обнуляємо previewPos відразу,
      // щоб модалка бачила координати — позначаємо, що закриття попапу
      // ініційовано дією з попапу, щоб обробник popupclose не очищував стан.
      previewCloseByActionRef.current = true;
      marker.closePopup();
    };

    window.__openNearbyFromPreview = () => {
      previewCloseByActionRef.current = true;
      openNearbyForPoint({ lat: previewPos.lat, lng: previewPos.lng });
      marker.closePopup();
    };

    return () => {
      if (previewMarkerRef.current) {
        previewMarkerRef.current.remove();
        previewMarkerRef.current = null;
      }
      delete window.__addPreviewPoint;
      delete window.__openNearbyFromPreview;
    };
  // NOTE: this effect should only recreate the preview marker when coordinates change.
  // Geocoded text updates are handled in the separate popup-content effect below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewPos, openNearbyForPoint, getPreviewPopupContent]);

  useEffect(() => {
    const marker = previewMarkerRef.current;
    if (!marker || !previewPos) return;
    const popup = marker.getPopup();
    if (!popup) return;
    marker.setPopupContent(getPreviewPopupContent(previewPos, geocoded));
    if (!marker.isPopupOpen()) {
      marker.openPopup();
    }
  }, [geocoded, previewPos, getPreviewPopupContent]);

  // ── Helpers ──
  const flyTo = useCallback((p) => {
    setSelectedPointId(p.id);
    mapInstance.current?.flyTo([p.lat, p.lng], 15, { duration: 0.8 });
    markersRef.current[p.id]?.openPopup();
  }, []);

  const handleGeocodeResult = (result) => {
    setPreviewPos({ lat: result.lat, lng: result.lng });
    setGeocoded(result);
    setPendingPos(null);
    mapInstance.current?.flyTo([result.lat, result.lng], 15, { duration: 0.9 });
    onSearchClose?.();
    setSnap("expanded");
  };


  useEffect(() => {
    if (!locationMessage) return undefined;
    const timeoutId = window.setTimeout(() => setLocationMessage(""), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [locationMessage]);
  useEffect(() => {
    if (!uiMessage) return undefined;
    const timeoutId = window.setTimeout(() => setUiMessage(""), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [uiMessage]);
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLocateUser = useCallback(() => {
    if (!mapInstance.current) return;

    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const latLng = [latitude, longitude];

        if (!userLocationMarkerRef.current) {
          const locationIcon = L.divIcon({
            html: '<span class="my-location-dot"></span>',
            className: 'my-location-marker-wrap',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          userLocationMarkerRef.current = L.marker(latLng, { icon: locationIcon }).addTo(mapInstance.current);
        } else {
          userLocationMarkerRef.current.setLatLng(latLng);
        }

        if (!userAccuracyCircleRef.current) {
          userAccuracyCircleRef.current = L.circle(latLng, {
            radius: accuracy || 35,
            color: '#0a84ff',
            fillColor: '#0a84ff',
            fillOpacity: 0.14,
            weight: 1.5,
            interactive: false,
          }).addTo(mapInstance.current);
        } else {
          userAccuracyCircleRef.current.setLatLng(latLng);
          userAccuracyCircleRef.current.setRadius(accuracy || 35);
        }

        mapInstance.current.flyTo(latLng, 15, { duration: 0.8 });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage("Location permission denied");
          return;
        }
        if (error.code === error.TIMEOUT) {
          setLocationMessage("Location request timed out");
          return;
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationMessage("Location unavailable right now");
          return;
        }
        setLocationMessage("Unable to get current location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);

  const clearRouteLines = useCallback(() => {
    routeLayers.current.forEach((l) => l.remove());
    routeLayers.current = [];
  }, []);
  // ── Route logic ──
  const fitToWaypoints = useCallback((selection = routePoints) => {
    if (!mapInstance.current || selection.length < 2 || !selection[0] || !selection[selection.length - 1]) return;
    mapInstance.current.fitBounds(L.latLngBounds([[selection[0].lat, selection[0].lng], [selection[selection.length - 1].lat, selection[selection.length - 1].lng]]).pad(0.22));
  }, [routePoints]);

  const startRouteMode = () => {
    if (points.length < 2) {
      setUiMessage("Додайте щонайменше 2 точки, щоб побудувати маршрут.");
      return;
    }
    setRoutePoints([null, null]);
    setRoutePanelOpen(true);
    clearRouteLines();
    setActiveRouteIndex(null);
  };


  const handleBuildRoute = async () => {
    const start = routePoints[0];
    const destination = routePoints[routePoints.length - 1];
    if (!start || !destination) return;

    setRouteBuilding(true);
    try {
      const origin = `${start.lat},${start.lng}`;
      const target = `${destination.lat},${destination.lng}`;
      const waypoints = routePoints.slice(1, -1).filter(Boolean).map((point) => `${point.lat},${point.lng}`);
      const query = new URLSearchParams({ api: "1", origin, destination: target, travelmode: "transit" });
      if (waypoints.length) query.set("waypoints", waypoints.join("|"));
      const url = `https://www.google.com/maps/dir/?${query.toString()}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setRouteBuilding(false);
    }
  };

  const handleRoutePointPick = useCallback((p) => {
    if (activeRouteIndex === null) {
      flyTo(p);
      return;
    }
    const wp = { id: p.id, name: p.name, lat: p.lat, lng: p.lng };
    setRoutePoints((prev) => {
      const next = prev.map((point, index) => (index === activeRouteIndex ? wp : point));
      if (next[0] && next[next.length - 1]) setTimeout(() => fitToWaypoints(next), 0);
      return next;
    });
    setActiveRouteIndex(null);
  }, [activeRouteIndex, fitToWaypoints, flyTo]);

  const syncPointExpense = async ({ pointId, pointName, estimatedCost, currency }) => {
    const normalizedAmount = Number(estimatedCost);
    const hasCost = Number.isFinite(normalizedAmount) && normalizedAmount > 0;

    const { data: pointExpenses, error: loadExpenseError } = await supabase
      .from("expenses")
      .select("id")
      .eq("point_id", pointId)
      .order("created_at", { ascending: true });

    if (loadExpenseError) throw loadExpenseError;

    const expensesForPoint = pointExpenses || [];

    if (!hasCost) {
      if (expensesForPoint.length) {
        await deleteExpenseByPointId(pointId);
      }
      return;
    }

    const payload = {
      name: `${pointName}`,
      amount: normalizedAmount,
      currency,
      category: "Місце",
    };

    if (!expensesForPoint.length) {
      await addExpense({
        ...payload,
        created_by: user.id,
        point_id: pointId,
      });
      return;
    }

    const [firstExpense, ...duplicates] = expensesForPoint;
    await updateExpense(firstExpense.id, payload);

    if (duplicates.length) {
      await Promise.all(duplicates.map((expense) => deleteExpense(expense.id)));
    }
  };

  const handleDeletePoint = useCallback(async (pointId) => {
    try {
      await deleteExpenseByPointId(pointId);
      await deletePoint(pointId);
      setUiMessage("Точку видалено.");
    } catch (e) {
      console.error(e);
      setUiMessage("Не вдалося видалити точку.");
    }
  }, [deleteExpenseByPointId, deletePoint]);

  const handleSavePoint = async (data) => {
    try {
      const { data: inserted, error } = await supabase
        .from("points")
        .insert([{ ...data, created_by: user.id }])
        .select()
        .single();
      if (error) throw error;
      await syncPointExpense({
        pointId: inserted.id,
        pointName: data.name,
        estimatedCost: data.estimated_cost,
        currency: data.currency,
      });
      setPendingPos(null);
      setGeocoded(null);
      setPreviewPos(null);
      setUiMessage("Точку збережено.");
    } catch (e) {
      console.error(e);
      setUiMessage("Помилка збереження точки.");
    }
  };

  const handleEditPoint = async (data) => {
    try {
      const pointId = editingPoint.id;
      await updatePoint(pointId, data);
      await syncPointExpense({
        pointId,
        pointName: data.name,
        estimatedCost: data.estimated_cost,
        currency: data.currency,
      });
      setEditingPoint(null);
      setUiMessage("Зміни точки збережено.");
    } catch (e) {
      console.error(e);
      setUiMessage("Не вдалося зберегти зміни.");
    }
  };

  const handleToggleCompleted = useCallback(async (point) => {
    const startedAt = performance.now();
    try {
      await updatePoint(point.id, { is_completed: !point.is_completed });
    } catch (e) {
      console.error(e);
    } finally {
      logSlowInteraction("point_toggle_completed", startedAt);
    }
  }, [updatePoint]);

  const highlightNearbyMarker = useCallback((placeId) => {
    nearbyMarkersRef.current.forEach((marker, id) => {
      const isSelected = id === placeId;
      marker.setStyle({
        radius: isSelected ? 8 : 5,
        color: isSelected ? "#0a84ff" : "#7ec8ff",
        weight: isSelected ? 2 : 1,
        fillOpacity: isSelected ? 1 : 0.85,
      });
    });
  }, []);

  const clearNearbyMarkers = useCallback(() => {
    nearbyMarkersRef.current.clear();
    nearbyMarkersLayerRef.current?.clearLayers();
  }, []);

  const runNearbySearch = useCallback(async (categoryId, anchor) => {
    if (!anchor) return;
    const category = NEARBY_CATEGORIES.find((item) => item.id === categoryId) || NEARBY_CATEGORIES[0];
    setNearbyLoading(true);
    setSelectedNearbyPlace(null);
    try {
      const results = await searchNearbyPlaces({ lat: anchor.lat, lng: anchor.lng, radius: 500, category: category.arcgis });
      const normalized = results.map((item, idx) => {
        const dist = Number(item.distance || 0);
        const distanceText = dist >= 1000 ? `${(dist / 1000).toFixed(1)} км` : `${Math.round(dist)} м`;
        return {
          id: item.placeId || item.id || `${item.name}-${idx}`,
          name: item.name || "Без назви",
          category: item.categories?.[0]?.label || category.label,
          lat: item.location?.y || item.y,
          lng: item.location?.x || item.x,
          address: item.address?.formattedAddress || item.address?.address || item.address,
          distance: dist,
          distanceText,
          rating: item.rating,
          openingHours: item.openingHours?.text,
          pointType: category.pointType,
        };
      }).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

      // sort by distance
      normalized.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setNearbyPlaces(normalized);
      clearNearbyMarkers();

      normalized.forEach((place) => {
        const marker = L.circleMarker([place.lat, place.lng], {
          radius: 5,
          color: "#7ec8ff",
          weight: 1,
          fillOpacity: 0.85,
        }).addTo(nearbyMarkersLayerRef.current);

        marker.on("click", (e) => {
          if (e?.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
          setSelectedNearbyPlace(place);
          highlightNearbyMarker(place.id);
          try {
            mapInstance.current?.flyTo([place.lat, place.lng], 16, { duration: 0.5 });
          } catch {
            // ignore if map not available
          }
        });

        nearbyMarkersRef.current.set(place.id, marker);
      });
    } catch {
      setNearbyPlaces([]);
      setSelectedNearbyPlace(null);
      setUiMessage("Не вдалося завантажити місця поруч.");
    } finally {
      setNearbyLoading(false);
    }
  }, [clearNearbyMarkers, highlightNearbyMarker]);

  useEffect(() => {
    if (!nearbyOpen || !nearbyAnchor) return;
    const timer = window.setTimeout(() => {
      runNearbySearch(nearbyCategory, nearbyAnchor);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [nearbyOpen, nearbyCategory, nearbyAnchor, runNearbySearch]);

  const closeNearbySilent = () => {
    setNearbyOpen(false);
    setNearbyPlaces([]);
    setSelectedNearbyPlace(null);
    clearNearbyMarkers();
  };

  const handleCloseNearby = () => {
    closeNearbySilent();
    setSnap("collapsed");
  };

  const handleSelectNearbyPlace = useCallback((place) => {
    setSelectedNearbyPlace(place);
    highlightNearbyMarker(place.id);
    try {
      mapInstance.current?.flyTo([place.lat, place.lng], 16, { duration: 0.5 });
    } catch {
      // ignore flyTo errors when map is not ready
    }
  }, [highlightNearbyMarker]);

  const handleAddNearbyPoint = async (place) => {
    await handleSavePoint({
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      type: place.pointType,
      addr: place.address || "",
      description: [place.category, place.openingHours].filter(Boolean).join(" • "),
      estimated_cost: null,
      currency: "EUR",
      attachments: [],
      point_date: null,
      comment: "",
      is_completed: false,
    });
    // close nearby UI and clear markers after adding
    setNearbyOpen(false);
    setNearbyPlaces([]);
    setSelectedNearbyPlace(null);
    clearNearbyMarkers();
    setSnap("collapsed");
  };

  const closeRouteMode = () => {
    setRoutePanelOpen(false);
    clearRouteLines();
    setActiveRouteIndex(null);
  };

  const handleAddRoutePoint = () => {
    setRoutePoints((prev) => {
      return [...prev, null];
    });
  };

  const handleRemoveRoutePoint = (removeIndex) => {
    setRoutePoints((prev) => prev.filter((_, index) => index !== removeIndex));
    setActiveRouteIndex((prev) => (prev === removeIndex ? null : prev));
  };

  const handleClearRoutePoints = () => {
    setRoutePoints([null, null]);
    setActiveRouteIndex(null);
  };

  const openRouteMode = () => {
    closeNearbySilent();
    setMetroPanelOpen(false);
    startRouteMode();
    setSnap("expanded");
  };

  const toggleMetroPanel = () => {
    const startedAt = performance.now();
    setMetroPanelOpen((prev) => {
      const next = !prev;
      if (next) {
        closeRouteMode();
        closeNearbySilent();
        setSnap("expanded");
      }
      return next;
    });
    logSlowInteraction("metro_panel_toggle", startedAt);
  };

  const snapClass = snap === "expanded" ? "sheet-expanded" : "sheet-collapsed";

  const baseSidebar = useMemo(
    () => (
      <PointsSidebar
        points={points}
        onFly={flyTo}
        onDelete={handleDeletePoint}
        onEdit={(p) => setEditingPoint(p)}
        onToggleCompleted={handleToggleCompleted}
        routeMode={false}
        routeFrom={null}
        onRouteToggle={handleRoutePointPick}
        selectedPointId={selectedPointId}
        onNearby={openNearbyForPoint}
      />
    ),
    [flyTo, handleDeletePoint, handleRoutePointPick, handleToggleCompleted, openNearbyForPoint, points, selectedPointId],
  );

  const routePickSidebar = useMemo(
    () => (
      <PointsSidebar
        points={points}
        onFly={flyTo}
        onDelete={handleDeletePoint}
        onEdit={(p) => setEditingPoint(p)}
        onToggleCompleted={handleToggleCompleted}
        routeMode={true}
        routeFrom={null}
        onRouteToggle={handleRoutePointPick}
        selectedPointId={selectedPointId}
        onNearby={openNearbyForPoint}
      />
    ),
    [flyTo, handleDeletePoint, handleRoutePointPick, handleToggleCompleted, openNearbyForPoint, points, selectedPointId],
  );

  const renderContent = () => {
    if (metroPanelOpen) {
      return (
        <Suspense fallback={<div className="p-panel fade-in">Завантаження метро...</div>}>
          <MetroPanel />
        </Suspense>
      );
    }
    if (routePanelOpen && activeRouteIndex !== null) {
      return routePickSidebar;
    }
    if (routePanelOpen) {
      return (
        <Suspense fallback={<div className="p-panel fade-in">Завантаження маршруту...</div>}>
          <RoutePanel
          routePoints={routePoints}
          activeRouteIndex={activeRouteIndex}
          onPickRoutePoint={setActiveRouteIndex}
          onAddPoint={handleAddRoutePoint}
          onRemovePoint={handleRemoveRoutePoint}
          onBuild={handleBuildRoute}
          building={routeBuilding}
          showHeader={false}
          onClear={handleClearRoutePoints}
          onClose={closeRouteMode}
          />
        </Suspense>
      );
    }
    return baseSidebar;
  };

  return (
    <div className="map-view">
      {searchOpen && (
        <div className="map-search-overlay">
          <SearchBox onResult={handleGeocodeResult} shouldFocus />
          
        </div>
      )}

      <div className="map-sidebar slide-left">
        {searchOpen && (
          <div className="map-search-desktop-wrap">
            <SearchBox onResult={handleGeocodeResult} shouldFocus />
          </div>
        )}

        <div className="sidebar-section">
          <button
            className={`route-btn btn btn-secondary ${routePanelOpen ? "active" : ""}`}
            onClick={routePanelOpen ? closeRouteMode : openRouteMode}
          >
            <span className="flex items-center gap-2">
              {routePanelOpen ? <CalciteIcon name="x" size={16} /> : <CalciteIcon name="tour" size={16} />} 
              {routePanelOpen ? "Закрити" : "Маршрут"}
            </span>
          </button>
          <button
            className={`route-btn btn btn-secondary ${metroPanelOpen ? "active" : ""}`}
            onClick={toggleMetroPanel}
          >
            <span className="flex items-center gap-2">
              {metroPanelOpen ? <CalciteIcon name="x" size={16} /> : <CalciteIcon name="bus" size={16} />} 
              Метро
            </span>
          </button>
        </div>

        {routePanelOpen && activeRouteIndex !== null && (
          <div className="route-pick-wrap-top fade-in">
            <div className="rp-pick-hint active rp-pick-hint-row">
              <span className="flex items-center gap-2">
                <CalciteIcon name="locator" size={16} /> Виберіть точку маршруту
              </span>
              <button
                className="rp-icon-btn btn btn-icon"
                onClick={() => setActiveRouteIndex(null)}
              >
                <CalciteIcon name="arrow-left" size={16} />
              </button>
            </div>
          </div>
        )}

        {nearbyOpen && !routePanelOpen && !metroPanelOpen && (
          <NearbyPlacesPanel
            category={nearbyCategory}
            onCategoryChange={setNearbyCategory}
            categories={NEARBY_CATEGORIES}
            loading={nearbyLoading}
            places={nearbyPlaces}
            onAdd={handleAddNearbyPoint}
            onClose={handleCloseNearby}
            selectedPlace={selectedNearbyPlace}
            onSelectPlace={handleSelectNearbyPlace}
            onBackToList={() => setSelectedNearbyPlace(null)}
          />
        )}
      </div>

      <div className="map-wrap">
        <div ref={mapRef} className="leaflet-map" />
        <button
          type="button"
          className="my-location-btn btn btn-icon"
          onClick={handleLocateUser}
          aria-label="Center map on my location"
          title="My location"
        >
          <CalciteIcon name="gpsOn" size={20} />
        </button>
      </div>

      {locationMessage && <div className="map-toast">{locationMessage}</div>}
      {uiMessage && <div className="map-toast map-toast-secondary">{uiMessage}</div>}
      {isOffline && <div className="map-toast map-toast-info">Офлайн режим: частина дій синхронізується після підключення.</div>}

      <div ref={sheetRef} className={`map-sheet ${snapClass} slide-up`} style={sheetStyle}>
        <div className="sheet-drag-area" onPointerDown={onDragAreaPointerDown}>
          <div className="sheet-handle-wrap">
            <div className="sheet-handle" />
          </div>

          <div className="sheet-actions">
          <button
          className={`sheet-action-btn btn btn-secondary ${routePanelOpen ? "active" : ""}`}
            onClick={routePanelOpen ? closeRouteMode : openRouteMode}
          >
            <span className="flex items-center gap-2">
              {routePanelOpen ? <CalciteIcon name="x" size={16} /> : <CalciteIcon name="tour" size={16} />}  Маршрут
            </span>
          </button>
          <button
            className={`sheet-action-btn btn btn-secondary ${metroPanelOpen ? "active" : ""}`}
            onClick={toggleMetroPanel}
          >
            <span className="flex items-center gap-2">{metroPanelOpen ? <CalciteIcon name="x" size={16} /> : <CalciteIcon name="bus" size={16} />}  Метро</span>
          </button>
          </div>
        </div>

        {routePanelOpen && activeRouteIndex !== null && (
          <div className="route-pick-wrap-bottom fade-in">
            <div className="rp-pick-hint active rp-pick-hint-row">
              <span className="flex items-center gap-2">
                <CalciteIcon name="locator" size={16} /> Виберіть точку маршруту
              </span>
              <button
                className="rp-icon-btn btn btn-icon"
                onClick={() => setActiveRouteIndex(null)}
              >
                <CalciteIcon name="arrow-left" size={16} />
              </button>
            </div>
          </div>
        )}

        <div
          ref={scrollRef}
          className="sheet-scroll fade-in"
          onPointerDown={onScrollPointerDown}
        >
          {nearbyOpen && !routePanelOpen && !metroPanelOpen ? (
            <NearbyPlacesPanel
              category={nearbyCategory}
              onCategoryChange={setNearbyCategory}
              categories={NEARBY_CATEGORIES}
              loading={nearbyLoading}
              places={nearbyPlaces}
              onAdd={handleAddNearbyPoint}
              onClose={handleCloseNearby}
              selectedPlace={selectedNearbyPlace}
              onSelectPlace={handleSelectNearbyPlace}
              onBackToList={() => setSelectedNearbyPlace(null)}
            />
          ) : renderContent()}
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
