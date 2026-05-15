import type { RouteLeg } from "../../../shared/types/domain";

const transitIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <rect x="3" y="3" width="18" height="13" rx="3"/>
  <path d="M3 10h18M8 16l-2 5M16 16l2 5M12 16v5"/>
</svg>`;


const walkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="13" cy="4" r="2"/>
  <path d="M10 22l1.5-7L9 13l2-6"/>
  <path d="M14.5 22l-1-5 2.5-3"/>
  <path d="M7 13.5l2-1.5 3 1 2-1.5"/>
</svg>`;

const walkTransitIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="7" cy="6" r="2"/>
  <path d="M5.5 12L7 8l2.5 1.5"/>
  <path d="M8 12l2 3"/>
  <rect x="13" y="5" width="8" height="7" rx="1.5"/>
  <path d="M13 9h8"/>
</svg>`;

export const TRAVEL_MODES = [
  { id: 3, icon: transitIcon, label: "Транзит" },
  { id: 2, icon: walkIcon, label: "Пішки" },
  { id: 4, icon: walkTransitIcon, label: "Пішки + транзит" },
];

export function summarizeRoute(result: { legs?: RouteLeg[] } | null) {
  if (!result?.legs?.length) return null;
  return result.legs.reduce(
    (acc, leg) => ({
      dur: acc.dur + (leg.totalDurSec || 0),
      dist: acc.dist + (leg.totalDistM || 0),
    }),
    { dur: 0, dist: 0 },
  );
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h} год ${m} хв` : `${m} хв`;
}

export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} км` : `${meters} м`;
}
