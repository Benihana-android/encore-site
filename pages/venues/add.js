import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Turnstile from "../../components/Turnstile";

export default function AddVenue() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [capacity, setCapacity] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);

  const submit = async () => {
    if (!name.trim() || !city.trim()) { setError("Add a venue name and city."); return; }
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), city: city.trim(), capacity: capacity.trim() || "—", turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");
      router.push(`/venues/${data.id}${data.matched ? "?matched=1" : ""}`);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="detail-page">
      <Link href="/venues" className="back-btn">← Back</Link>
      <div className="rate-panel">
        <h3 className="rate-heading">Log a venue</h3>
        <input className="text-input" placeholder="Venue name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="text-input" placeholder="City, State" value={city} onChange={(e) => setCity(e.target.value)} />
        <input className="text-input" placeholder="Capacity (optional)" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        <Turnstile onVerify={setTurnstileToken} />
        {error && <p className="error-note">{error}</p>}
        <button className="post-btn" style={{ background: "#2DD4BF" }} onClick={submit} disabled={saving}>
          {saving ? "Saving…" : "Continue to rate it"}
        </button>
      </div>
    </div>
  );
}
