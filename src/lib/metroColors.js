/**
 * Official RATP Paris Métro + RER line colors
 * Data format in metro_paris.geojson: { name: "M10", type: "edge", ... }
 */
export const METRO_LINE_COLORS = {
  // Métro
  M1: "#FFCD00",
  M2: "#003CA6",
  M3: "#837902",
  M3B: "#6EC4E8",
  M4: "#CF009E",
  M5: "#FF7E2E",
  M6: "#6ECA97",
  M7: "#FA9ABA",
  M7B: "#6ECA97",
  M8: "#E19BDF",
  M9: "#B6BD00",
  M10: "#C9910D",
  M11: "#704B1C",
  M12: "#007852",
  M13: "#6EC4E8",
  M14: "#62259D",

  // RER (якщо є в geojson)
  RERA: "#E2231A",
  RERB: "#4B92DB",
  RERC: "#FFCD00",
  RERD: "#00814F",
  RERE: "#6E1E78",
};

/**
 * Extract line key from feature properties.
 * Handles: "M10", "M3B", "RER A", "RERA", "1", "10" etc.
 */
export function guessLineKey(feature) {
  const p = feature.properties || {};

  // Primary: name field like "M10", "M3B", "RER A"
  const name = (p.name || "").toString().trim().toUpperCase();

  if (name) {
    // Already in our format: "M10", "M3B"
    if (METRO_LINE_COLORS[name]) return name;

    // "RER A" → "RERA"
    const rerMatch = name.match(/^RER\s*([A-E])$/);
    if (rerMatch) return "RER" + rerMatch[1];

    // Just a number: "10" → "M10"
    const numMatch = name.match(/^(\d{1,2}B?)$/);
    if (numMatch) return "M" + numMatch[1];

    // "METRO 10" or "LIGNE 10"
    const lineMatch = name.match(/(?:METRO|M|LIGNE|LINE)\s*(\d{1,2}B?)/);
    if (lineMatch) return "M" + lineMatch[1];
  }

  // Fallback: ref or line fields
  const ref = (p.ref || p.line || p.route_ref || "")
    .toString()
    .trim()
    .toUpperCase();
  if (ref && METRO_LINE_COLORS["M" + ref]) return "M" + ref;
  if (ref && METRO_LINE_COLORS[ref]) return ref;

  // colour property directly
  const col = p.colour || p.color;
  if (col) return null; // handled separately

  return null;
}

/**
 * Get display color for a GeoJSON feature.
 */
export function getLineColor(feature) {
  const key = guessLineKey(feature);
  if (key && METRO_LINE_COLORS[key]) return METRO_LINE_COLORS[key];

  // Fallback to property colour
  const p = feature.properties || {};
  const col = p.colour || p.color;
  if (col && /^#[0-9a-fA-F]{3,6}$/.test(col)) return col;

  return "#4444aa"; // neutral fallback
}
