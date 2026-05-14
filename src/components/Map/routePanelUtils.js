export const TRAVEL_MODES = [
  { id: 3, icon: "🚌", label: "Транзит" },
  { id: 0, icon: "🚗", label: "Авто" },
  { id: 2, icon: "🚶", label: "Пішки" },
  { id: 1, icon: "🚲", label: "Вело" },
];

export function summarizeRoute(result) {
  if (!result?.legs?.length) return null;
  return result.legs.reduce(
    (acc, leg) => ({
      dur: acc.dur + (leg.totalDurSec || 0),
      dist: acc.dist + (leg.totalDistM || 0),
    }),
    { dur: 0, dist: 0 },
  );
}

export function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h} год ${m} хв` : `${m} хв`;
}

export function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} км` : `${meters} м`;
}
