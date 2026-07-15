import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { geocodeLocation } from "../../lib/geocode";
import { haversineMiles } from "../../lib/distance";
import { CONCERT_CATS, averageScores, overallAverage } from "../../lib/categories";
import { discoverNearby } from "../../lib/discoverTicketmaster";

export default async function handler(req, res) {
  const query = (req.query.q || "").toString();
  if (!query.trim()) return res.status(400).json({ error: "Enter a zip code or city." });

  // Pull in any real, currently-listed shows from Ticketmaster for this
  // area before searching our own database. No-ops safely if the
  // Ticketmaster key isn't set up yet.
  await discoverNearby(query).catch(() => null);

  const origin = await geocodeLocation(query);
  if (!origin) return res.status(404).json({ error: "Couldn't find that location. Try a different zip code or city." });

  const today = new Date().toISOString().slice(0, 10);

  const { data: concerts, error } = await supabaseAdmin
    .from("concerts")
    .select("id, artist, event_date, venues(id, name, city, latitude, longitude)")
    .gte("event_date", today);

  if (error) return res.status(500).json({ error: error.message });

  const withCoords = (concerts || []).filter((c) => c.venues?.latitude != null && c.venues?.longitude != null);

  const ids = withCoords.map((c) => c.id);
  const { data: reviews } = ids.length
    ? await supabaseAdmin.from("concert_reviews").select("concert_id, scores").in("concert_id", ids)
    : { data: [] };

  const results = withCoords
    .map((c) => {
      const distance = haversineMiles(origin.lat, origin.lon, c.venues.latitude, c.venues.longitude);
      const avg = overallAverage(averageScores((reviews || []).filter((r) => r.concert_id === c.id), CONCERT_CATS));
      return {
        id: c.id,
        artist: c.artist,
        date: c.event_date,
        venueName: c.venues.name,
        venueCity: c.venues.city,
        distanceMiles: Math.round(distance * 10) / 10,
        avg,
      };
    })
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, 40);

  return res.status(200).json({ origin: origin.label, results });
}
