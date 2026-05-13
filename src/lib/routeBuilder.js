/**
 * Build route legs from real ArcGIS directions data.
 * Falls back to synthetic legs if directions are empty.
 */

// ── ArcGIS maneuver type → emoji + transport guess ──
const MANEUVER_MAP = {
  // Driving turns
  1:  { icon: "↗️",  color: "#8888aa" }, // esriDMTStraight
  2:  { icon: "↰",   color: "#8888aa" }, // esriDMTBearLeft
  3:  { icon: "↱",   color: "#8888aa" }, // esriDMTBearRight
  4:  { icon: "⬅️",  color: "#8888aa" }, // esriDMTTurnLeft
  5:  { icon: "➡️",  color: "#8888aa" }, // esriDMTTurnRight
  6:  { icon: "↩️",  color: "#8888aa" }, // esriDMTSharpLeft
  7:  { icon: "↪️",  color: "#8888aa" }, // esriDMTSharpRight
  8:  { icon: "🔄",  color: "#8888aa" }, // esriDMTUTurn
  9:  { icon: "🚗",  color: "#8888aa" }, // esriDMTFerry
  10: { icon: "🔃",  color: "#8888aa" }, // esriDMTRoundabout
  17: { icon: "🏁",  color: "#30d158" }, // esriDMTStop
  18: { icon: "🏁",  color: "#30d158" }, // esriDMTDestination
  19: { icon: "🚩",  color: "#0a84ff" }, // esriDMTTripItem
  20: { icon: "🔴",  color: "#ff453a" }, // esriDMTEndOfFerry
};

// Keywords in direction text → transit icon
function guessTransitIcon(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("metro") || t.includes("métro") || t.includes("м."))
    return { icon: "🚇", color: "#0a84ff" };
  if (t.includes("rer") || t.includes("train") || t.includes("поїзд") || t.includes("електричка"))
    return { icon: "🚆", color: "#9b59b6" };
  if (t.includes("tram") || t.includes("трамвай"))
    return { icon: "🚃", color: "#2abf6e" };
  if (t.includes("bus") || t.includes("автобус") || t.includes("тролейбус"))
    return { icon: "🚌", color: "#e8622a" };
  if (t.includes("walk") || t.includes("пішки") || t.includes("пройти") || t.includes("йти"))
    return { icon: "🚶", color: "#8888aa" };
  if (t.includes("ferry") || t.includes("паром"))
    return { icon: "⛴️", color: "#0a84ff" };
  return null;
}

/**
 * Convert real ArcGIS directions into display legs.
 * @param {Array} directions - data.directions[0].features from buildRoute
 * @param {Object} from      - { name }
 * @param {Object} to        - { name }
 */
function legsFromDirections(directions, from, to) {
  if (!directions || directions.length === 0) return null;

  // Filter out degenerate steps (0 distance AND 0 time AND generic text)
  const steps = directions.filter((f) => {
    const a = f.attributes || {};
    return a.text && a.text.trim().length > 0;
  });

  if (steps.length === 0) return null;

  return steps.map((f, i) => {
    const a = f.attributes || {};
    const text = a.text || "";
    const minutes = a.time != null ? Math.round(a.time) : null;
    const km = a.length != null ? parseFloat(a.length).toFixed(1) : null;

    // Build sub line
    const parts = [];
    if (minutes != null && minutes > 0) parts.push(`~${minutes} хв`);
    if (km != null && parseFloat(km) > 0) parts.push(`~${km} км`);
    const sub = parts.join(" · ") || null;

    // Icon: prefer transit keyword, fall back to maneuver type
    const transitGuess = guessTransitIcon(text);
    const maneuverInfo = MANEUVER_MAP[a.maneuverType] || { icon: "📍", color: "#8888aa" };
    const { icon, color } = transitGuess || maneuverInfo;

    // First step: label with origin name
    // Last step: label with destination name
    let main = text;
    if (i === 0) main = `🚩 Старт: ${from.name}`;
    if (i === steps.length - 1) main = `🏁 Прибуття: ${to.name}`;

    return { icon, color, main, sub };
  });
}

// ── Fallback synthetic legs (when ArcGIS gives no directions) ──

const METRO_LINES = ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12","M13","M14"];
const BUS_LINES   = ["21","29","38","42","63","69","72","73","80","85","91","95","96"];
const RER_LINES   = ["RER A","RER B","RER C","RER D","RER E"];

function pickLine(seed, arr) { return arr[Math.abs(seed) % arr.length]; }

function nameHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PARIS_STOPS = [
  "Châtelet","République","Nation","Bastille","Opéra","Saint-Lazare",
  "Montparnasse","Gare du Nord","Gare de Lyon","Place d'Italie",
  "Belleville","Oberkampf","Voltaire","Père Lachaise","Gambetta",
  "Porte de Vincennes","Bercy","Bibliothèque F.Mitterrand","Austerlitz","Daumesnil",
];
function synStop(seed) { return PARIS_STOPS[Math.abs(seed) % PARIS_STOPS.length]; }

function _direction(line, seed) {
  const dirs = {
    M1: ["La Défense","Château de Vincennes"],
    M2: ["Porte Dauphine","Nation"],
    M4: ["Montrouge","Clignancourt"],
    M6: ["Charles de Gaulle–Étoile","Nation"],
    M13:["Châtillon–Montrouge","Saint-Denis"],
  };
  return (dirs[line] || ["terminus A","terminus B"])[seed % 2];
}

function syntheticLegs(from, to, totalMin, totalKm) {
  const dist = parseFloat(totalKm);
  const seed = nameHash(from.name + to.name);
  const legs = [];

  const walkMin = Math.min(8, Math.max(2, Math.round(dist * 0.08)));
  legs.push({ icon:"🚶", color:"#8888aa",
    main:"Пішки до зупинки", sub:`від «${from.name}» · ~${walkMin} хв` });

  if (dist > 20) {
    const rer  = pickLine(seed, RER_LINES);
    legs.push({ icon:"🚆", color:"#9b59b6",
      main:`${rer} — сісти на ст. «${synStop(seed)}»`,
      sub:`виїхати «${synStop(seed+7)}» · ~${(dist*0.65).toFixed(1)} км · ${Math.round(totalMin*0.55)} хв` });
    legs.push({ icon:"🚌", color:"#e8622a",
      main:`Автобус ${pickLine(seed+3, BUS_LINES)} від пересадки`,
      sub:`виїхати «${synStop(seed+11)}» · ~${Math.round(totalMin*0.25)} хв` });
  } else if (dist > 8) {
    const metro = pickLine(seed, METRO_LINES);
    legs.push({ icon:"🚇", color:"#0a84ff",
      main:`Метро ${metro} — ст. «${synStop(seed+1)}»`,
      sub:`напрям ${_direction(metro,seed)} · виїхати «${synStop(seed+5)}» · ~${Math.round(totalMin*0.6)} хв` });
    if (dist > 13)
      legs.push({ icon:"🚌", color:"#e8622a",
        main:`Автобус ${pickLine(seed+2, BUS_LINES)}`,
        sub:`виїхати «${synStop(seed+9)}» · ~${Math.round(totalMin*0.2)} хв` });
  } else if (dist > 3) {
    const useTram = seed % 3 === 0;
    const line = useTram ? `T${(seed%4)+1}` : pickLine(seed, BUS_LINES);
    legs.push({ icon: useTram?"🚃":"🚌", color: useTram?"#2abf6e":"#e8622a",
      main:`${useTram?"Трамвай":"Автобус"} ${line} — «${synStop(seed+2)}»`,
      sub:`виїхати «${synStop(seed+6)}» · ~${Math.round(totalMin*0.65)} хв` });
  } else {
    legs.push({ icon:"🚶", color:"#8888aa",
      main:"Пішки весь маршрут", sub:`~${Math.round(totalMin*0.85)} хв` });
  }

  legs.push({ icon:"🚶", color:"#8888aa",
    main:"Пішки до місця призначення", sub:`до «${to.name}» · ~${walkMin} хв` });

  return legs;
}

/**
 * Main export — tries real directions first, falls back to synthetic.
 * @param {Object} from
 * @param {Object} to
 * @param {number} totalMin
 * @param {string} totalKm
 * @param {Array}  directions  - pass res.directions from buildRoute
 */
export function buildLegs(from, to, totalMin, totalKm, directions) {
  const real = legsFromDirections(directions, from, to);
  if (real && real.length > 0) return real;
  return syntheticLegs(from, to, totalMin, totalKm);
}