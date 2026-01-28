import { Incident } from "../api/types";

export const typeOf = (inc: Incident) =>
  ((inc.incidentType || inc.incident_type || "Other") as string) || "Other";

export const typeColor = (t: string) => {
  const k = t.toLowerCase();
  if (k.includes("robbery")) return "#ef4444";
  if (k.includes("assault")) return "#f97316";
  if (k.includes("theft")) return "#3b82f6";
  if (k.includes("vandal")) return "#a855f7";
  if (k.includes("drug")) return "#22c55e";
  if (k.includes("intox")) return "#eab308";
  return "#64748b";
};

export const getHighlights = (all: Incident[]) => all.slice(0, 3);

export const getRecentAlerts = (all: Incident[]) => all.slice(0, 3);

export const getTrends = (all: Incident[], userLocation?: string) => {
  const counts = all.reduce<Record<string, { count: number; first: Incident }>>(
    (acc, inc) => {
      const t = typeOf(inc);
      if (!acc[t]) acc[t] = { count: 0, first: inc };
      acc[t].count += 1;
      return acc;
    },
    {}
  );

  const sorted = Object.entries(counts).sort((a, b) => b[1].count - a[1].count);
  const trending = sorted
    .filter(([, v]) => v.count >= 3)
    .slice(0, 2)
    .map(([t, v]) => ({
      id: `trend-${t}`,
      title: `${t} trend at ${userLocation || "your area"}`,
      summary: `${v.count} reports • Recent`,
      primaryIncidentId: v.first.id,
      type: t,
    }));

  if (trending.length > 0) return trending;

  // Fallback: show latest 2 incidents
  return all.slice(0, 2).map((inc) => {
    const t = typeOf(inc);
    return {
      id: inc.id,
      title: inc.title,
      summary: `${userLocation || "Nearby"} • Recent`,
      primaryIncidentId: inc.id,
      type: t,
    };
  });
};
