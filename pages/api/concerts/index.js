import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { geocodeLocation } from "../../../lib/geocode";
import { verifyTurnstile, getClientIp } from "../../../lib/verifyTurnstile";
import { checkRateLimit } from "../../../lib/rateLimit";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("concerts")
      .select("id, artist, event_date, venues(name)")
      .order("event_date", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { artist, date, venueMode, venueId, newVenueName, newVenueCity, turnstileToken } = req.body;
    if (!artist?.trim() || !date) return res.status(400).json({ error: "artist and date required" });

    const ip = getClientIp(req);
    const humanCheck = await verifyTurnstile(turnstileToken, ip);
    if (!humanCheck) return res.status(400).json({ error: "Bot check failed - please try again." });

    const allowed = await checkRateLimit(ip, "concerts");
    if (!allowed) return res.status(429).json({ error: "Too many submissions from this connection recently - try again later." });

    let finalVenueId = venueId;

    if (venueMode === "new") {
      if (!newVenueName?.trim()) return res.status(400).json({ error: "venue name required" });
      const { data: existingVenue } = await supabaseAdmin
        .from("venues")
        .select("id")
        .ilike("name", newVenueName.trim())
        .ilike("city", newVenueCity?.trim() || "");

      if (existingVenue && existingVenue.length > 0) {
        finalVenueId = existingVenue[0].id;
      } else {
        const geo = await geocodeLocation(newVenueCity?.trim() || "").catch(() => null);
        const { data: venue, error: venueErr } = await supabaseAdmin
          .from("venues")
          .insert({
            name: newVenueName.trim(),
            city: newVenueCity?.trim() || "—",
            capacity: "—",
            latitude: geo?.lat ?? null,
            longitude: geo?.lon ?? null,
          })
          .select()
          .single();
        if (venueErr) return res.status(500).json({ error: venueErr.message });
        finalVenueId = venue.id;
      }
    }

    if (!finalVenueId) return res.status(400).json({ error: "venue required" });

    // Duplicate check: same artist (case-insensitive) + same venue + same date
    const { data: existingConcert } = await supabaseAdmin
      .from("concerts")
      .select("id")
      .ilike("artist", artist.trim())
      .eq("venue_id", finalVenueId)
      .eq("event_date", date);

    if (existingConcert && existingConcert.length > 0) {
      return res.status(200).json({ id: existingConcert[0].id, matched: true });
    }

    const { data: concert, error } = await supabaseAdmin
      .from("concerts")
      .insert({ artist: artist.trim(), venue_id: finalVenueId, event_date: date, ip_address: ip })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ id: concert.id, matched: false });
  }

  return res.status(405).end();
}
