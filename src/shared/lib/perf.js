const IS_DEV = import.meta.env.DEV;

const seen = new Set();

export function markPerf(name) {
  if (!IS_DEV || typeof performance === "undefined") return;
  if (seen.has(name)) return;
  performance.mark(name);
  seen.add(name);
}

export function measurePerf(name, startMark, endMark) {
  if (!IS_DEV || typeof performance === "undefined") return;
  if (!seen.has(startMark) || !seen.has(endMark) || seen.has(name)) return;

  try {
    performance.measure(name, startMark, endMark);
    const entry = performance.getEntriesByName(name).at(-1);
    if (entry) {
      console.log(`[perf] ${name}: ${entry.duration.toFixed(1)}ms`);
    }
    seen.add(name);
  } catch {
    // ignore invalid mark states in development
  }
}
