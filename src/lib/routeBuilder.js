/**
 * Build route legs for display in route panel
 * @param {Object} from - Starting point
 * @param {Object} to - Ending point
 * @param {number} totalMin - Total time in minutes
 * @param {string} totalKm - Total distance in km
 * @returns {Array} Array of leg objects with icon, color, main, and sub
 */
export function buildLegs(from, to, totalMin, totalKm) {
  const dist = parseFloat(totalKm);
  const legs = [];

  legs.push({
    icon: "🚶",
    color: "#8888aa",
    main: "Вийдіть до зупинки",
    sub: `від «${from.name}», ~3 хв`,
  });

  if (dist > 15) {
    legs.push({
      icon: "🚇",
      color: "#9b59b6",
      main: "Метро / швидкий транспорт",
      sub: `~${Math.round(dist * 0.45)} км · ${Math.round(totalMin * 0.5)} хв`,
    });
    if (dist > 25) {
      legs.push({
        icon: "🚌",
        color: "#e8622a",
        main: "Автобус до пересадки",
        sub: `~${Math.round(dist * 0.3)} км · ${Math.round(totalMin * 0.25)} хв`,
      });
    }
  } else if (dist > 5) {
    legs.push({
      icon: "🚌",
      color: "#e8622a",
      main: "Автобус / тролейбус",
      sub: `~${Math.round(dist * 0.7)} км · ${Math.round(totalMin * 0.6)} хв`,
    });
  } else {
    legs.push({
      icon: "🚃",
      color: "#2abf6e",
      main: "Трамвай / автобус",
      sub: `~${Math.round(dist * 0.7)} км · ${Math.round(totalMin * 0.6)} хв`,
    });
  }

  legs.push({
    icon: "🚶",
    color: "#8888aa",
    main: "Пішки до місця",
    sub: `до «${to.name}», ~3 хв`,
  });

  return legs;
}
