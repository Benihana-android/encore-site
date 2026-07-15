import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import TicketCard from "../../components/TicketCard";
import { fmtDate } from "../../lib/categories";

export default function NearYou() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [origin, setOrigin] = useState("");
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const runSearch = async (q) => {
    if (!q.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/nearby?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setOrigin(data.origin);
      setResults(data.results);
      setStatus("done");
    } catch (e) {
      setErrorMsg(e.message);
      setStatus("error");
    }
  };

  // Support /concerts/near?q=90210 as a shareable/prefilled link
  useEffect(() => {
    if (router.query.q) {
      setInput(router.query.q.toString());
      runSearch(router.query.q.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.q]);

  return (
    <div className="section">
      <div className="section-head"><h2>Shows near you</h2></div>

      <div className="rate-panel" style={{ maxWidth: 480, margin: "0 auto 30px" }}>
        <input
          className="text-input"
          placeholder="Zip code or city (e.g. 78701 or Austin, TX)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch(input)}
          style={{ marginTop: 0 }}
        />
        <button className="post-btn" style={{ background: "#FFB627", width: "100%" }} onClick={() => runSearch(input)} disabled={status === "loading"}>
          {status === "loading" ? "Searching…" : "Find shows"}
        </button>
        {status === "error" && <p className="error-note">{errorMsg}</p>}
      </div>

      {status === "done" && (
        <>
          <p style={{ textAlign: "center", color: "#ACAAB4", fontSize: 13, marginBottom: 24 }}>
            Showing results near {origin}
          </p>
          <div className="card-grid">
            {results.map((c) => (
              <TicketCard
                key={c.id}
                href={`/concerts/${c.id}`}
                kind="concert"
                title={c.artist}
                sub={`${c.venueName} — ${c.venueCity}`}
                meta={`${c.distanceMiles} mi away — ${fmtDate(c.date)}`}
                avg={c.avg}
                color="#FFB627"
              />
            ))}
            {results.length === 0 && <p className="empty-note">No upcoming shows found near that location yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}
