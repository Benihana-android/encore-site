import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { geocodeLocation } from "../../lib/geocode";

// Visit this URL once in your browser after deploying (e.g.
// https://getanencore.com/api/backfill-geo) to add coordinates to any
// venues that were created before "near me" search existed. Safe to
// run more than once - it skips venues that already have coordinates.
export default async function handler(req, res) {
  const { data: venues, error } = await supabaseAdmin
    .from("venues")
    .select("id, city")
    .is("latitude", null);

  if (error) return res.status(500).json({ error: error.message });

  const updated = [];
  for (const v of venues || []) {
    const geo = await geocodeLocation(v.city).catch(() => null);
    if (geo) {
      await supabaseAdmin.from("venues").update({ latitude: geo.lat, longitude: geo.lon }).eq("id", v.id);
      updated.push(v.city);
    }
    // Be polite to the free geocoding service - small delay between requests
    await new Promise((r) => setTimeout(r, 1100));
  }

  return res.status(200).json({ checked: (venues || []).length, updated: updated.length, updatedCities: updated });
}
