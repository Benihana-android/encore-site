import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { geocodeLocation } from "../../../lib/geocode";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin.from("venues").select("*").order("name");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { name, city, capacity } = req.body;
    if (!name?.trim() || !city?.trim()) return res.status(400).json({ error: "name and city required" });

    // Duplicate check: same name + city, case-insensitive
    const { data: existing } = await supabaseAdmin
      .from("venues")
      .select("id, name")
      .ilike("name", name.trim())
      .ilike("city", city.trim());

    if (existing && existing.length > 0) {
      return res.status(200).json({ id: existing[0].id, matched: true });
    }

    // Best-effort geocode - if it fails, the venue still saves, it just
    // won't show up in "near me" searches until re-geocoded later.
    const geo = await geocodeLocation(city.trim()).catch(() => null);

    const { data, error } = await supabaseAdmin
      .from("venues")
      .insert({
        name: name.trim(),
        city: city.trim(),
        capacity: capacity || "—",
        latitude: geo?.lat ?? null,
        longitude: geo?.lon ?? null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ id: data.id, matched: false });
  }

  return res.status(405).end();
}
