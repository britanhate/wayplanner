import L from "leaflet";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MAPBOX_STYLES = {
  "streets-v12": "mapbox/streets-v12",
  "outdoors-v12": "mapbox/outdoors-v12",
  "light-v11": "mapbox/light-v11",
  "dark-v11": "mapbox/dark-v11",
  "satellite-streets-v12": "mapbox/satellite-streets-v12",
  "navigation-day-v1": "mapbox/navigation-day-v1",
  "navigation-night-v1": "mapbox/navigation-night-v1",
};

export function createTileLayer(style) {
  if (style === "standard") {
    return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    });
  }

  if (style === "dark") {
    return L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { attribution: "&copy; OpenStreetMap &copy; CartoDB" },
    );
  }

  const styleId = MAPBOX_STYLES[style] ?? "mapbox/streets-v12";
  return L.tileLayer(
    `https://api.mapbox.com/styles/v1/${styleId}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
    {
      tileSize: 512,
      zoomOffset: -1,
      attribution: "© <a href='https://www.mapbox.com/'>Mapbox</a> © OpenStreetMap",
    },
  );
}

export function getRouteSegmentStyle(type, active = false) {
  const base = { weight: 5, opacity: active ? 1 : 0.78, dashArray: null };
  if (type === "walk") return { ...base, color: "#8e8e93", dashArray: "6 8", weight: active ? 6 : 4 };
  if (type === "metro" || type === "subway") return { ...base, color: "#0a84ff", weight: active ? 9 : 7 };
  if (type === "bus") return { ...base, color: "#ff8a00" };
  if (type === "train") return { ...base, color: "#9b59b6", weight: active ? 7 : 6 };
  if (type === "tram") return { ...base, color: "#2abf6e" };
  if (type === "car") return { ...base, color: "#4b5563" };
  return { ...base, color: "#6366f1" };
}

export function getPointImageSrc(attachments) {
  const img = Array.isArray(attachments)
    ? attachments.find(
        (x) =>
          (typeof x === "string" && (x.startsWith("http") || x.startsWith("data:"))) ||
          (typeof x === "object" && x.data),
      )
    : null;
  return img ? (typeof img === "string" ? img : img.data) : null;
}
