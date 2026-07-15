import { supabaseAdmin } from "./supabaseAdmin";

// Returns true if this IP is allowed to perform `action` again,
// false if they've hit the limit within the time window.
export async function checkRateLimit(ip, table, limit = 5, windowMinutes = 60) {
  if (!ip || ip === "unknown") return true; // fail open rather than blocking legit users

  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", since);

  if (error) return true; // fail open on error rather than blocking legit users
  return (count || 0) < limit;
}
