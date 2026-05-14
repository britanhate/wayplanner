const transitIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <rect x="3" y="3" width="18" height="13" rx="3"/>
  <path d="M3 10h18M8 16l-2 5M16 16l2 5M12 16v5"/>
</svg>`;

const carIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
  <circle cx="7.5" cy="17" r="2.5"/><circle cx="16.5" cy="17" r="2.5"/>
</svg>`;

const walkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="13" cy="4" r="2"/>
  <path d="M10 22l1.5-7L9 13l2-6"/>
  <path d="M14.5 22l-1-5 2.5-3"/>
  <path d="M7 13.5l2-1.5 3 1 2-1.5"/>
</svg>`;

const bikeIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
  <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 3"/>
  <path d="M6 17.5l3.5-7 2.5 4H18l-3-7.5"/>
</svg>`;

export const TRAVEL_MODES = [
  { id: 3, icon: transitIcon, label: "Транзит" },
  { id: 0, icon: carIcon,     label: "Авто"   },
  { id: 2, icon: walkIcon,    label: "Пішки"  },
  { id: 1, icon: bikeIcon,    label: "Вело"   },
];

export function summarizeRoute(result) {
  if (!result?.legs?.length) return null;
  return result.legs.reduce(
    (acc, leg) => ({
      dur:  acc.dur  + (leg.totalDurSec || 0),
      dist: acc.dist + (leg.totalDistM  || 0),
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
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} км`
    : `${meters} м`;
}