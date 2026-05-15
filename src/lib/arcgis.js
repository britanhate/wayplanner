const ARCGIS_KEY = import.meta.env.VITE_ARCGIS_KEY;
const IS_DEV = import.meta.env.DEV;

if (!ARCGIS_KEY && IS_DEV) {
  console.warn("[ArcGIS] Missing VITE_ARCGIS_KEY. ArcGIS search is disabled.");
}

const BASE_GEOCODE =
  "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

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


const BASE_PLACES = "https://places-api.arcgis.com/arcgis/rest/services/places-service/v1";

export async function searchNearbyPlaces({ lat, lng, radius = 500, category }) {
  requireApiKey();
  const params = new URLSearchParams({
    x: String(lng),
    y: String(lat),
    radius: String(radius),
    f: "json",
    pageSize: "15",
  });
  if (category) params.set("categoriesIds", category);
  const res = await fetch(`${BASE_PLACES}/places/near-point?${params.toString()}`, {
    credentials: "omit",
    headers: { Authorization: `Bearer ${ARCGIS_KEY}` },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Places API error");
  return data.results || data.places || [];
}
