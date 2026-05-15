const ARCGIS_KEY = import.meta.env.VITE_ARCGIS_KEY;
const IS_DEV = import.meta.env.DEV;

if (!ARCGIS_KEY && IS_DEV) {
  console.warn("[ArcGIS] Missing VITE_ARCGIS_KEY. ArcGIS search and routing are disabled.");
}

const BASE_GEOCODE =
  "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";
const BASE_ROUTE =
  "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
const BASE_TRANSIT_ROUTE =
  "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

function requireApiKey() {
  if (!ARCGIS_KEY) throw new Error("ArcGIS key is not configured");
}

export async function suggestAddresses(text) {
  requireApiKey();
  const url = `${BASE_GEOCODE}/suggest?text=${encodeURIComponent(text)}&maxSuggestions=6&f=json&token=${ARCGIS_KEY}`;
  const res = await fetch(url, { credentials: "omit" });
  const data = await res.json();
  return data.suggestions || [];
}

export async function findAddress(text, magicKey = "") {
  requireApiKey();
  let url = `${BASE_GEOCODE}/findAddressCandidates?SingleLine=${encodeURIComponent(text)}&maxLocations=1&outFields=Place_addr,PlaceName&f=json&token=${ARCGIS_KEY}`;
  if (magicKey) url += `&magicKey=${encodeURIComponent(magicKey)}`;
  const res = await fetch(url, { credentials: "omit" });
  const data = await res.json();
  const c = data.candidates?.[0];
  if (!c) throw new Error("Адресу не знайдено");
  return {
    lat: c.location.y,
    lng: c.location.x,
    name: c.attributes?.PlaceName || text,
    addr: c.attributes?.Place_addr || c.address || text,
  };
}

export async function reverseGeocode(lat, lng) {
  requireApiKey();
  const url = `${BASE_GEOCODE}/reverseGeocode?location=${lng},${lat}&f=json&token=${ARCGIS_KEY}`;
  const res = await fetch(url, { credentials: "omit" });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API помилка");
  return {
    name: data.address?.LongLabel || data.address?.Match_addr || "Selected place",
    addr: data.address?.Match_addr || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };
}

export async function buildRoute(from, to) {
  requireApiKey();
  const url = `${BASE_ROUTE}/solve?stops=${from.lng},${from.lat};${to.lng},${to.lat}&returnRoutes=true&returnDirections=true&directionsLanguage=uk&f=json&token=${ARCGIS_KEY}`;
  const res = await fetch(url, { credentials: "omit" });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API помилка");
  const route = data.routes?.features?.[0];
  if (!route) throw new Error("Маршрут не знайдено");
  const attrs = route.attributes || {};
  return {
    totalMin: Math.round(attrs.Total_TravelTime || attrs.Total_Time || 0),
    totalKm: (attrs.Total_Kilometers || 0).toFixed(1),
    paths: route.geometry?.paths || [],
    directions: data.directions?.[0]?.features || [],
  };
}

export async function buildMultiStopRoute(waypoints, mode = "transit") {
  requireApiKey();
  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    throw new Error("At least 2 waypoints are required");
  }

  const stops = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join(";");
  const impedanceAttributeName = mode === "walk" ? "WalkTime" : "PublicTransitTime";
  const restrictionAttributeNames = mode === "walk" ? "[\"Walking\"]" : "[\"Public transportation\"]";

  const url = `${BASE_TRANSIT_ROUTE}/solve?stops=${encodeURIComponent(stops)}&returnRoutes=true&returnDirections=true&returnStops=true&directionsLanguage=uk&f=json&token=${ARCGIS_KEY}&findBestSequence=false&impedanceAttributeName=${encodeURIComponent(impedanceAttributeName)}&restrictionAttributeNames=${encodeURIComponent(restrictionAttributeNames)}`;
  const res = await fetch(url, { credentials: "omit" });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API помилка маршрутизації");
  const route = data.routes?.features?.[0];
  if (!route) throw new Error("Маршрут не знайдено для вибраного режиму");

  const directions = data.directions?.[0]?.features || [];
  const attrs = route.attributes || {};
  const totalMinutes = Math.round(attrs.Total_TravelTime || attrs.Total_Time || 0);
  const totalKm = Number(attrs.Total_Kilometers || 0);

  const segments = directions.map((dir, idx) => {
    const a = dir.attributes || {};
    const text = a.text || "Крок маршруту";
    const lower = String(text).toLowerCase();
    let type = "transit";
    if (lower.includes("walk") || lower.includes("піш") || lower.includes("йти")) type = "walk";
    else if (lower.includes("bus") || lower.includes("автобус")) type = "bus";
    else if (lower.includes("tram") || lower.includes("трам")) type = "tram";
    else if (lower.includes("metro") || lower.includes("subway") || lower.includes("метро")) type = "metro";
    else if (lower.includes("train") || lower.includes("поїзд")) type = "train";

    return {
      id: `arcgis-segment-${idx}`,
      type,
      instruction: text,
      durationText: a.time ? `${Math.round(a.time)} хв` : "—",
      distanceText: a.length ? `${Number(a.length).toFixed(1)} км` : "—",
      fromName: idx === 0 ? waypoints[0]?.name : "",
      toName: idx === directions.length - 1 ? waypoints[waypoints.length - 1]?.name : "",
      stopsCount: null,
      lineName: "",
      headsign: "",
    };
  });

  return {
    totalMin: totalMinutes,
    totalKm,
    paths: route.geometry?.paths || [],
    segments,
    transfers: Math.max(0, segments.filter((s) => s.type !== "walk").length - 1),
  };
}
