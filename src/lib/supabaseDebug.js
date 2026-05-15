const isDev = import.meta.env.DEV;
const debugEnabled = import.meta.env.VITE_SUPABASE_DEBUG_QUERIES === 'true';

export async function debugSupabaseFetch({ table, columns, action = 'select', query }) {
  if (!isDev || !debugEnabled) {
    return query();
  }

  const started = performance.now();
  try {
    const result = await query();
    const elapsedMs = Math.round((performance.now() - started) * 10) / 10;
    console.info(
      `[Supabase Debug] ${action.toUpperCase()} ${table} | columns: ${columns || '-'} | ~${elapsedMs}ms`,
    );
    return result;
  } catch (error) {
    const elapsedMs = Math.round((performance.now() - started) * 10) / 10;
    console.warn(
      `[Supabase Debug] ${action.toUpperCase()} ${table} failed | columns: ${columns || '-'} | ~${elapsedMs}ms`,
    );
    throw error;
  }
}
