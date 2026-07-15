export const CONCERT_CATS = [
  { key: "performance", label: "Overall Performance" },
  { key: "vocals", label: "Vocals" },
  { key: "band", label: "Band / Musicianship" },
  { key: "beats", label: "Beats & Energy" },
  { key: "lightshow", label: "Light Show" },
];

export const VENUE_CATS = [
  { key: "sound", label: "Sound Quality" },
  { key: "access", label: "Ease of Access" },
  { key: "seating", label: "Seating / Sightlines" },
  { key: "staff", label: "Staff & Service" },
  { key: "vibe", label: "Overall Vibe" },
];

// reviews: array of rows with a `scores` jsonb column, e.g. { performance: 9, vocals: 8, ... }
export function averageScores(reviews, cats) {
  const out = {};
  cats.forEach((c) => {
    const vals = reviews.map((r) => r.scores?.[c.key]).filter((v) => typeof v === "number");
    out[c.key] = vals.length
      ? { avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length }
      : { avg: 0, count: 0 };
  });
  return out;
}

export function overallAverage(categories) {
  const vals = Object.values(categories).filter((c) => c.count > 0).map((c) => c.avg);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
