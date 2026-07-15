import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Turnstile from "../../components/Turnstile";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export async function getServerSideProps() {
  const { data: venues } = await supabaseAdmin.from("venues").select("id, name, city").order("name");
  return { props: { venues: venues || [] } };
}

export default function AddConcert({ venues }) {
  const router = useRouter();
  const [artist, setArtist] = useState("");
  const [date, setDate] = useState("");
  const [venueMode, setVenueMode] = useState(venues.length ? "existing" : "new");
  const [venueId, setVenueId] = useState(venues[0]?.id || "");
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueCity, setNewVenueCity] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);

  const submit = async () => {
    if (!artist.trim() || !date) { setError("Add an artist and a date."); return; }
    if (venueMode === "existing" && !venueId) { setError("Pick a venue."); return; }
    if (venueMode === "new" && !newVenueName.trim()) { setError("Name the venue."); return; }
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/concerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist: artist.trim(), date, venueMode, venueId,
          newVenueName: newVenueName.trim(), newVenueCity: newVenueCity.trim(), turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");
      router.push(`/concerts/${data.id}${data.matched ? "?matched=1" : ""}`);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="detail-page">
      <Link href="/concerts" className="back-btn">← Back</Link>
      <div className="rate-panel">
        <h3 className="rate-heading">Log a show</h3>
        <input className="text-input" placeholder="Artist / band" value={artist} onChange={(e) => setArtist(e.target.value)} />
        <input className="text-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="venue-toggle">
          <button className={`toggle-btn ${venueMode === "existing" ? "active" : ""}`} onClick={() => setVenueMode("existing")} disabled={!venues.length}>Existing venue</button>
          <button className={`toggle-btn ${venueMode === "new" ? "active" : ""}`} onClick={() => setVenueMode("new")}>New venue</button>
        </div>
        {venueMode === "existing" ? (
          <select className="text-input" value={venueId} onChange={(e) => setVenueId(e.target.value)}>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.city}</option>)}
          </select>
        ) : (
          <>
            <input className="text-input" placeholder="Venue name" value={newVenueName} onChange={(e) => setNewVenueName(e.target.value)} />
            <input className="text-input" placeholder="City, State" value={newVenueCity} onChange={(e) => setNewVenueCity(e.target.value)} />
          </>
        )}
        <Turnstile onVerify={setTurnstileToken} />
        {error && <p className="error-note">{error}</p>}
        <button className="post-btn" style={{ background: "#FFB627" }} onClick={submit} disabled={saving}>
          {saving ? "Saving…" : "Continue to rate it"}
        </button>
      </div>
    </div>
  );
}
