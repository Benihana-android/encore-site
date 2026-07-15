import Link from "next/link";
import TicketCard from "../../components/TicketCard";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { CONCERT_CATS, averageScores, overallAverage, fmtDate } from "../../lib/categories";

export async function getServerSideProps() {
  const { data: concerts } = await supabaseAdmin
    .from("concerts")
    .select("id, artist, event_date, venues(name)")
    .order("event_date", { ascending: false });

  const ids = (concerts || []).map((c) => c.id);
  const { data: reviews } = ids.length
    ? await supabaseAdmin.from("concert_reviews").select("concert_id, scores").in("concert_id", ids)
    : { data: [] };

  const out = (concerts || []).map((c) => ({
    id: c.id,
    artist: c.artist,
    venueName: c.venues?.name || "—",
    date: c.event_date,
    avg: overallAverage(averageScores((reviews || []).filter((r) => r.concert_id === c.id), CONCERT_CATS)),
  }));

  return { props: { concerts: out } };
}

export default function ConcertsIndex({ concerts }) {
  return (
    <div className="section">
      <div className="section-head">
        <h2>All concerts</h2>
        <div className="head-right"><span>{concerts.length} logged</span><Link href="/concerts/add" className="small-add-btn">+ Log a show</Link></div>
      </div>
      <div className="card-grid">
        {concerts.map((c) => (
          <TicketCard key={c.id} href={`/concerts/${c.id}`} kind="concert" title={c.artist} sub={c.venueName} meta={fmtDate(c.date)} avg={c.avg} color="#FFB627" />
        ))}
        {concerts.length === 0 && <p className="empty-note">No shows logged yet — be the first.</p>}
      </div>
    </div>
  );
}
