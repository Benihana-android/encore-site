import Link from "next/link";
import TicketCard from "../components/TicketCard";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { CONCERT_CATS, VENUE_CATS, averageScores, overallAverage, fmtDate } from "../lib/categories";

export async function getServerSideProps() {
  const { data: concerts } = await supabaseAdmin
    .from("concerts")
    .select("id, artist, event_date, venues(name)")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: venues } = await supabaseAdmin
    .from("venues")
    .select("id, name, city, capacity")
    .order("created_at", { ascending: false })
    .limit(6);

  const concertIds = (concerts || []).map((c) => c.id);
  const venueIds = (venues || []).map((v) => v.id);

  const { data: cReviews } = concertIds.length
    ? await supabaseAdmin.from("concert_reviews").select("concert_id, scores").in("concert_id", concertIds)
    : { data: [] };
  const { data: vReviews } = venueIds.length
    ? await supabaseAdmin.from("venue_reviews").select("venue_id, scores").in("venue_id", venueIds)
    : { data: [] };

  const concertsOut = (concerts || []).map((c) => ({
    id: c.id,
    artist: c.artist,
    venueName: c.venues?.name || "—",
    date: c.event_date,
    avg: overallAverage(averageScores((cReviews || []).filter((r) => r.concert_id === c.id), CONCERT_CATS)),
  }));

  const venuesOut = (venues || []).map((v) => ({
    id: v.id,
    name: v.name,
    city: v.city,
    capacity: v.capacity,
    avg: overallAverage(averageScores((vReviews || []).filter((r) => r.venue_id === v.id), VENUE_CATS)),
  }));

  return { props: { concerts: concertsOut, venues: venuesOut } };
}

export default function Home({ concerts, venues }) {
  return (
    <>
      <div className="hero">
        <div className="hero-eyebrow">rate the night — rank the room</div>
        <h1>ENCORE</h1>
        <p className="tagline">Score the show and the space separately. Vocals aren't the venue's job — sound quality isn't the band's.</p>
        <div className="hero-cta-row">
          <Link href="/concerts" className="cta-btn amber">Browse concerts</Link>
          <Link href="/venues" className="cta-btn teal">Browse venues</Link>
          <Link href="/concerts/near" className="cta-btn teal" style={{ borderColor: "#FFB627", color: "#FFB627" }}>Find shows near me</Link>
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2>Recent shows</h2><span>{concerts.length} logged</span></div>
        <div className="card-grid">
          {concerts.map((c) => (
            <TicketCard key={c.id} href={`/concerts/${c.id}`} kind="concert" title={c.artist} sub={c.venueName} meta={fmtDate(c.date)} avg={c.avg} color="#FFB627" />
          ))}
          {concerts.length === 0 && <p className="empty-note">No shows logged yet.</p>}
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2>Top venues</h2><span>{venues.length} logged</span></div>
        <div className="card-grid">
          {venues.map((v) => (
            <TicketCard key={v.id} href={`/venues/${v.id}`} kind="venue" title={v.name} sub={v.city} meta={`cap. ${v.capacity}`} avg={v.avg} color="#2DD4BF" />
          ))}
          {venues.length === 0 && <p className="empty-note">No venues logged yet.</p>}
        </div>
      </div>
    </>
  );
}
