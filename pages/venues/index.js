import Link from "next/link";
import TicketCard from "../../components/TicketCard";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { VENUE_CATS, averageScores, overallAverage } from "../../lib/categories";

export async function getServerSideProps() {
  const { data: venues } = await supabaseAdmin.from("venues").select("id, name, city, capacity").order("name");

  const ids = (venues || []).map((v) => v.id);
  const { data: reviews } = ids.length
    ? await supabaseAdmin.from("venue_reviews").select("venue_id, scores").in("venue_id", ids)
    : { data: [] };

  const out = (venues || []).map((v) => ({
    id: v.id,
    name: v.name,
    city: v.city,
    capacity: v.capacity,
    avg: overallAverage(averageScores((reviews || []).filter((r) => r.venue_id === v.id), VENUE_CATS)),
  }));

  return { props: { venues: out } };
}

export default function VenuesIndex({ venues }) {
  return (
    <div className="section">
      <div className="section-head">
        <h2>All venues</h2>
        <div className="head-right"><span>{venues.length} logged</span><Link href="/venues/add" className="small-add-btn">+ Log a venue</Link></div>
      </div>
      <div className="card-grid">
        {venues.map((v) => (
          <TicketCard key={v.id} href={`/venues/${v.id}`} kind="venue" title={v.name} sub={v.city} meta={`cap. ${v.capacity}`} avg={v.avg} color="#2DD4BF" />
        ))}
        {venues.length === 0 && <p className="empty-note">No venues logged yet — be the first.</p>}
      </div>
    </div>
  );
}
