import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { verifyTurnstile, getClientIp } from "../../../../lib/verifyTurnstile";
import { checkRateLimit } from "../../../../lib/rateLimit";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { id } = req.query;
  const { scores, name, review_text, turnstileToken } = req.body;
  if (!review_text?.trim() || !scores) return res.status(400).json({ error: "scores and review_text required" });

  const ip = getClientIp(req);

  const humanCheck = await verifyTurnstile(turnstileToken, ip);
  if (!humanCheck) return res.status(400).json({ error: "Bot check failed - please try again." });

  const allowed = await checkRateLimit(ip, "concert_reviews");
  if (!allowed) return res.status(429).json({ error: "Too many reviews from this connection recently - try again later." });

  const { error } = await supabaseAdmin.from("concert_reviews").insert({
    concert_id: id,
    reviewer_name: name || "anonymous",
    scores,
    review_text: review_text.trim(),
    ip_address: ip,
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
