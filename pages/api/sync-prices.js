import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Loose matching: same artist name and same calendar date is
// treated as the same show. Venue name comparison is fuzzy
// (substring, case-insensitive) since ticket sites format
// venue names slightly differently than we might.
function namesMatch(a, b) {
  const norm = (s) => (s || "").toLowerCase().trim();
  return norm(a).includes(norm(b)) || norm(b).includes(norm(a));
}

async function fetchTicketmasterPrice(artist, venueName, eventDate) {
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TICKETMASTER_API_KEY}&keyword=${encodeURIComponent(artist)}&startDateTime=${eventDate}T00:00:00Z&endDateTime=${eventDate}T23:59:59Z`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const events = data._embedded?.events || [];
  const match = events.find((e) => {
    const venue = e._embedded?.venues?.[0]?.name;
    return namesMatch(venue, venueName);
  });
  if (!match || !match.priceRanges?.length) return null;
  const range = match.priceRanges[0];
  return {
    source: "ticketmaster",
    min_price: range.min,
    max_price: range.max,
    currency: range.currency,
    buy_url: match.url,
    external_id: match.id,
  };
}

async function fetchSeatGeekPrice(artist, venueName, eventDate) {
  const url = `https://api.seatgeek.com/2/events?client_id=${process.env.SEATGEEK_CLIENT_ID}&client_secret=${process.env.SEATGEEK_CLIENT_SECRET}&q=${encodeURIComponent(artist)}&datetime_local.gte=${eventDate}T00:00:00&datetime_local.lte=${eventDate}T23:59:59`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const events = data.events || [];
  const match = events.find((e) => namesMatch(e.venue?.name, venueName));
  if (!match || !match.stats) return null;
  return {
    source: "seatgeek",
    min_price: match.stats.lowest_price,
    max_price: match.stats.highest_price,
    currency: "USD",
    buy_url: match.url,
    external_id: String(match.id),
  };
}

export default async function handler(req, res) {
  // Vercel signs its own cron requests with this header - reject
  // anyone else trying to hit this URL directly.
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: concerts, error } = await supabase
    .from("concerts")
    .select("id, artist, event_date, venues(name)")
    .gte("event_date", today);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const results = [];

  for (const concert of concerts) {
    const venueName = concert.venues?.name || "";
    const [tm, sg] = await Promise.all([
      fetchTicketmasterPrice(concert.artist, venueName, concert.event_date).catch(() => null),
      fetchSeatGeekPrice(concert.artist, venueName, concert.event_date).catch(() => null),
    ]);

    for (const priceData of [tm, sg]) {
      if (!priceData) continue;
      await supabase.from("ticket_prices").insert({
        concert_id: concert.id,
        source: priceData.source,
        min_price: priceData.min_price,
        max_price: priceData.max_price,
        currency: priceData.currency,
        buy_url: priceData.buy_url,
      });
      results.push({ concert: concert.artist, source: priceData.source });
    }
  }

  return res.status(200).json({ checked: concerts.length, updated: results.length, results });
}
