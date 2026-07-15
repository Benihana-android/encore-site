// Zip codes (5-digit US): Zippopotam.us - free, no key, no rate limit concerns for our volume.
// City/region names: OpenStreetMap's Nominatim - free, no key, but asks for a
// descriptive User-Agent and reasonable request volume (fine for user-triggered searches).

export async function geocodeLocation(query) {
  const q = (query || "").trim();
  if (!q) return null;

  if (/^\d{5}$/.test(q)) {
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${q}`);
      if (res.ok) {
        const data = await res.json();
        const place = data.places?.[0];
        if (place) {
          return {
            lat: parseFloat(place.latitude),
            lon: parseFloat(place.longitude),
            label: `${place["place name"]}, ${place["state abbreviation"]}`,
          };
        }
      }
    } catch (e) {
      // fall through to city search below
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=us`,
      { headers: { "User-Agent": "EncoreApp/1.0 (concert rating site)" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), label: data[0].display_name };
  } catch (e) {
    return null;
  }
}
