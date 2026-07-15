import Link from "next/link";

export default function TicketCard({ href, kind, title, sub, meta, avg, color }) {
  return (
    <Link href={href} className="ticket-card" style={{ background: "linear-gradient(135deg,#1a1a22,#0b0b0f)" }}>
      <div className="ticket-top">
        <span className="ticket-kind" style={{ color }}>{kind === "concert" ? "SHOW" : "VENUE"}</span>
        <span className="ticket-score" style={{ color }}>{avg !== null ? avg.toFixed(1) : "NEW"}</span>
      </div>
      <div className="ticket-title">{title}</div>
      <div className="ticket-sub">{sub}</div>
      <div className="ticket-notch left" />
      <div className="ticket-notch right" />
      <div className="ticket-perf" />
      <div className="ticket-meta">{meta}</div>
    </Link>
  );
}
