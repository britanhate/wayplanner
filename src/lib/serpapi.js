import { supabase } from "./supabase";

export async function fetchDirections(
  waypoints,
  travelMode = 3
) {
  const { data, error } =
    await supabase.functions.invoke(
      "directions",
      {
        body: {
          waypoints,
          travel_mode: travelMode,
        },
      }
    );

  if (error) throw error;
  return data;
}

export function parseLeg(leg) {
  const best = leg?.best;
  if (!best) return null;

  const trips = best.trips || [];

  const steps = trips.map((trip) => {
    const mode =
      (trip.travel_mode || "").toLowerCase();

    return {
      lineName: trip.title || "",
      operator:
        trip.service_run_by?.name || null,
      boardAt:
        trip.start_stop?.name || "",
      alightAt:
        trip.end_stop?.name || "",
      stops: (trip.stops || []).length,
      distFmt: trip.formatted_distance || "",
      durFmt: trip.formatted_duration || "",
      mode,
    };
  });

  return {
    totalDurFmt:
      best.formatted_duration || "",
    totalDistFmt:
      best.formatted_distance || "",
    totalDurSec: best.duration || 0,
    totalDistM: best.distance || 0,
    via: best.via || "",
    steps,
  };
}