import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { id } = req.query;
  const { scores, name, review_text } = req.body;
  if (!review_text?.trim() || !scores) return res.status(400).json({ error: "scores and review_text required" });

  const { error } = await supabaseAdmin.from("venue_reviews").insert({
    venue_id: id,
    reviewer_name: name || "anonymous",
    scores,
    review_text: review_text.trim(),
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
