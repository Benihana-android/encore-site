import Link from "next/link";
import { CategoryRow } from "../../components/Meter";
import RatingForm from "../../components/RatingForm";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { CONCERT_CATS, averageScores, fmtDate } from "../../lib/categories";

export async function getServerSideProps({ params }) {
  const { data: concert } = await supabaseAdmin
    .from("concerts")
    .select("id, artist, event_date, venues(id, name)")
    .eq("id", params.id)
    .single();

  if (!concert) return { notFound: true };

  const { data: reviews } = await supabaseAdmin
    .from("concert_reviews")
    .select("id, reviewer_name, review_text, scores, created_at")
    .eq("concert_id", params.id)
    .order("created_at", { ascending: false });

  const { data: prices } = await supabaseAdmin
    .from("ticket_prices")
    .select("source, min_price, max_price, currency, buy_url, fetched_at")
    .eq("concert_id", params.id)
    .order("fetched_at", { ascending: false });

  const latestBySource = {};
  (prices || []).forEach((p) => {
    if (!latestBySource[p.source]) latestBySource[p.source] = p;
  });

  return {
    props: {
      concert: {
        id: concert.id,
        artist: concert.artist,
        date: concert.event_date,
        venue: concert.venues,
      },
      reviews: reviews || [],
      prices: Object.values(latestBySource),
    },
  };
}

export default function ConcertDetail({ concert, reviews, prices }) {
  const categories = averageScores(reviews, CONCERT_CATS);
  return (
    <div className="detail-page">
      <Link href="/concerts" className="back-btn">← Back</Link>
      <div className="detail-hero" style={{ background: "linear-gradient(135deg,#3a2a1a,#0b0b0f)" }}>
        <span className="detail-kind" style={{ color: "#FFB627" }}>LIVE REVIEW</span>
        <h1>{concert.artist}</h1>
        <p className="detail-sub">{concert.venue?.name || "Unknown venue"} — {fmtDate(concert.date)}</p>
      </div>

      <div className="price-block">
        <h3 className="rate-heading">Ticket prices</h3>
        {prices.length === 0 && <p className="no-price-note">No pricing data yet — check back once ticket sources are connected.</p>}
        {prices.map((p) => (
          <div className="price-row" key={p.source}>
            <span className="price-source">{p.source}</span>
            <span className="price-value">{p.currency || "$"}{p.min_price}–{p.max_price}</span>
            {p.buy_url && <a className="buy-link" href={p.buy_url} target="_blank" rel="noreferrer">View tickets →</a>}
          </div>
        ))}
      </div>

      <div className="cats-block">
        {CONCERT_CATS.map((c) => <CategoryRow key={c.key} label={c.label} data={categories[c.key]} color="#FFB627" />)}
      </div>

      <RatingForm cats={CONCERT_CATS} color="#FFB627" kindLabel="show" postUrl={`/api/concerts/${concert.id}/reviews`} />

      <div className="reviews-block">
        <h3 className="rate-heading">Reviews ({reviews.length})</h3>
        {reviews.length === 0 && <p className="empty-note">No reviews yet — be the first to weigh in.</p>}
        {reviews.map((r) => (
          <div className="review-card" key={r.id}>
            <span className="review-name">{r.reviewer_name || "anonymous"}</span>
            <p className="review-text">{r.review_text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
