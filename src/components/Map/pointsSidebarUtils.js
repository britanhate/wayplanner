import { USERS } from "../../lib/constants";

export function getUserInfo(userId) {
  return USERS.find((u) => u.id === userId) || {
    name: userId,
    color: "#8888aa",
    avatar: "👤",
  };
}

export function filterAndSortPoints(points, selectedType, showCompleted, sortBy) {
  let result = [...points];

  if (selectedType !== "all") {
    result = result.filter((p) => p.type === selectedType);
  }

  if (!showCompleted) {
    result = result.filter((p) => !p.is_completed);
  }

  result.sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(a.point_date || 0) - new Date(b.point_date || 0);
      case "cost":
        return (a.estimated_cost || 0) - (b.estimated_cost || 0);
      case "creator":
        return getUserInfo(a.created_by).name.localeCompare(getUserInfo(b.created_by).name, "uk");
      case "name":
      default:
        return a.name.localeCompare(b.name, "uk");
    }
  });

  return result;
}
