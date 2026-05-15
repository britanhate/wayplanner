import { supabase } from "./supabase";

export async function fetchDirections(waypoints, travelMode = 3) {
  const { data, error } = await supabase.functions.invoke("directions", {
    body: {
      waypoints,
      travel_mode: travelMode,
    },
  });

  if (error) throw error;
  return data;
}

const TYPE_COLORS = {
  walk: "#8e8e93",
  bus: "#ff8a00",
  metro: "#0a84ff",
  subway: "#0a84ff",
  train: "#9b59b6",
  tram: "#2abf6e",
  car: "#4b5563",
  transit: "#0a84ff",
  unknown: "#6366f1",
};

function normalizeType(mode) {
  const value = (mode || "").toLowerCase();
  if (["walk", "walking", "foot"].includes(value)) return "walk";
  if (["bus"].includes(value)) return "bus";
  if (["metro", "subway", "underground"].includes(value)) return "metro";
  if (["train", "rail"].includes(value)) return "train";
  if (["tram", "streetcar"].includes(value)) return "tram";
  if (["car", "driving"].includes(value)) return "car";
  if (["transit", "public_transport"].includes(value)) return "transit";
  return "unknown";
}

export function parseLeg(leg) {
  const best = leg?.best;
  if (!best) return null;

  const segments = (best.trips || []).map((trip, idx) => {
    const type = normalizeType(trip.travel_mode);

    return {
      id: `${leg?.from?.id || "from"}-${leg?.to?.id || "to"}-${idx}`,
      type,
      instruction: trip.title || trip.description || "Крок маршруту",
      fromName: trip.start_stop?.name || leg?.from?.name || "",
      toName: trip.end_stop?.name || leg?.to?.name || "",
      lineName: trip.line_name || trip.title || "",
      lineNumber: trip.line_number || trip.route_number || "",
      headsign: trip.headsign || trip.direction || "",
      distanceText: trip.formatted_distance || "",
      durationText: trip.formatted_duration || "",
      stopsCount: Array.isArray(trip.stops) ? trip.stops.length : null,
      polyline: trip.polyline || trip.geometry?.coordinates || null,
      color: trip.color || TYPE_COLORS[type] || TYPE_COLORS.unknown,
      operator: trip.service_run_by?.name || null,
    };
  });

  return {
    totalDurFmt: best.formatted_duration || "",
    totalDistFmt: best.formatted_distance || "",
    totalDurSec: best.duration || 0,
    totalDistM: best.distance || 0,
    via: best.via || "",
    segments,
    steps: segments,
  };
}
