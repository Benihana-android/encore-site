import Link from "next/link";
import { CategoryRow } from "../../components/Meter";
import RatingForm from "../../components/RatingForm";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { VENUE_CATS, averageScores } from "../../lib/categories";

export async function getServerSideProps({ params }) {
  const { data: venue } = await supabaseAdmin
    .from("venues")
    .select("id, name, city, capacity")
    .eq("id", params.id)
    .single();

  if (!venue) return { notFound: true };

  const { data: reviews } = await supabaseAdmin
    .from("venue_reviews")
    .select("id, reviewer_name, review_text, scores, created_at")
    .eq("venue_id", params.id)
    .order("created_at", { ascending: false });

  return { props: { venue, reviews: reviews || [] } };
}

export default function VenueDetail({ venue, reviews }) {
  const categories = averageScores(reviews, VENUE_CATS);
  return (
    <div className="detail-page">
      <Link href="/venues" className="back-btn">← Back</Link>
      <div className="detail-hero" style={{ background: "linear-gradient(135deg,#0e1c24,#0b0b0f)" }}>
        <span className="detail-kind" style={{ color: "#2DD4BF" }}>VENUE PROFILE</span>
        <h1>{venue.name}</h1>
        <p className="detail-sub">{venue.city} — cap. {venue.capacity}</p>
      </div>

      <div className="cats-block">
        {VENUE_CATS.map((c) => <CategoryRow key={c.key} label={c.label} data={categories[c.key]} color="#2DD4BF" />)}
      </div>

      <RatingForm cats={VENUE_CATS} color="#2DD4BF" kindLabel="venue" postUrl={`/api/venues/${venue.id}/reviews`} />

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
