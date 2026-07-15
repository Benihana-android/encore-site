import { useState } from "react";
import { useRouter } from "next/router";

export default function RatingForm({ cats, color, kindLabel, postUrl }) {
  const router = useRouter();
  const initial = {};
  cats.forEach((c) => (initial[c.key] = 7));
  const [scores, setScores] = useState(initial);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | posted | error

  const submit = async () => {
    if (!text.trim()) return;
    setStatus("saving");
    try {
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, name: name.trim() || "anonymous", review_text: text.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("posted");
      setText("");
      router.replace(router.asPath); // refresh server-side props so the new average shows
    } catch (e) {
      setStatus("error");
    }
  };

  return (
    <div className="rate-panel">
      <h3 className="rate-heading">Rate this {kindLabel}</h3>
      {cats.map((c) => (
        <div className="fader-row" key={c.key}>
          <div className="fader-label">{c.label}</div>
          <input type="range" min="0" max="10" step="1" value={scores[c.key]}
            onChange={(e) => setScores({ ...scores, [c.key]: Number(e.target.value) })}
            style={{ accentColor: color }} />
          <span className="fader-value" style={{ color }}>{scores[c.key]}</span>
        </div>
      ))}
      <input className="text-input" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea className="text-area" placeholder="What stood out? What didn't?" value={text} onChange={(e) => setText(e.target.value)} rows={3} />
      <button className="post-btn" style={{ background: color }} onClick={submit} disabled={status === "saving"}>
        {status === "posted" ? "Posted ✓" : status === "saving" ? "Posting…" : "Post rating"}
      </button>
      {status === "error" && <p className="error-note">Something went wrong — try again.</p>}
    </div>
  );
}
