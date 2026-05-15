import { USERS } from "../../../lib/constants";
import type { Point, UserProfile } from "../../../shared/types/domain";

const unknownAvatarSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</svg>`;

export function getUserInfo(userId: string | null | undefined): UserProfile {
  return (
    USERS.find((u) => u.id === userId) || {
      id: userId || "unknown",
      name: userId || "Unknown user",
      email: "",
      color: "#8888aa",
      avatar: unknownAvatarSvg,
    }
  );
}

export function filterAndSortPoints(
  points: Point[],
  selectedType: string,
  showCompleted: boolean,
  sortBy: string,
): Point[] {
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
        return new Date(a.point_date || 0).getTime() - new Date(b.point_date || 0).getTime();
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
