import { supabaseAdmin } from "./supabaseAdmin";

function hasRealTicketmasterKey() {
  const key = process.env.TICKETMASTER_API_KEY;
  return key && key !== "pending" && key.length > 5;
}

// Adds/updates venues + concerts + starting prices in Supabase based on
// real Ticketmaster results for a zip code or city. Safe to call often -
// it upserts rather than duplicating (same artist+venue+date match used
// everywhere else in the app).
export async function discoverNearby(query) {
  if (!hasRealTicketmasterKey()) return { discovered: 0 };

  const isZip = /^\d{5}$/.test(query.trim());
  const locationParam = isZip
    ? `postalCode=${encodeURIComponent(query.trim())}&radius=50&unit=miles`
    : `city=${encodeURIComponent(query.trim())}`;

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TICKETMASTER_API_KEY}&classificationName=music&${locationParam}&size=20`;

  let events = [];
  try {
    const res = await fetch(url);
    if (!res.ok) return { discovered: 0 };
    const data = await res.json();
    events = data._embedded?.events || [];
  } catch (e) {
    return { discovered: 0 };
  }

  let discovered = 0;

  for (const event of events) {
    const artist = event._embedded?.attractions?.[0]?.name || event.name;
    const venueData = event._embedded?.venues?.[0];
    if (!venueData) continue;

    const eventDate = event.dates?.start?.localDate;
    if (!eventDate) continue;

    const venueName = venueData.name;
    const venueCity = venueData.city?.name && venueData.state?.stateCode
      ? `${venueData.city.name}, ${venueData.state.stateCode}`
      : venueData.city?.name || "—";
    const lat = venueData.location?.latitude ? parseFloat(venueData.location.latitude) : null;
    const lon = venueData.location?.longitude ? parseFloat(venueData.location.longitude) : null;

    // Find or create the venue
    let venueId;
    const { data: existingVenue } = await supabaseAdmin
      .from("venues")
      .select("id")
      .ilike("name", venueName)
      .ilike("city", venueCity);

    if (existingVenue && existingVenue.length > 0) {
      venueId = existingVenue[0].id;
    } else {
      const { data: newVenue, error: venueErr } = await supabaseAdmin
        .from("venues")
        .insert({ name: venueName, city: venueCity, capacity: "—", latitude: lat, longitude: lon })
        .select()
        .single();
      if (venueErr) continue;
      venueId = newVenue.id;
    }

    // Find or create the concert
    const { data: existingConcert } = await supabaseAdmin
      .from("concerts")
      .select("id")
      .ilike("artist", artist)
      .eq("venue_id", venueId)
      .eq("event_date", eventDate);

    let concertId;
    if (existingConcert && existingConcert.length > 0) {
      concertId = existingConcert[0].id;
    } else {
      const { data: newConcert, error: concertErr } = await supabaseAdmin
        .from("concerts")
        .insert({ artist, venue_id: venueId, event_date: eventDate, ticketmaster_id: event.id })
        .select()
        .single();
      if (concertErr) continue;
      concertId = newConcert.id;
      discovered++;
    }

    // Add current price, if Ticketmaster provided one
    if (event.priceRanges?.length) {
      const range = event.priceRanges[0];
      await supabaseAdmin.from("ticket_prices").insert({
        concert_id: concertId,
        source: "ticketmaster",
        min_price: range.min,
        max_price: range.max,
        currency: range.currency,
        buy_url: event.url,
      });
    }
  }

  return { discovered };
}
