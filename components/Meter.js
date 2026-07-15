const BAR_PATTERN = [42, 68, 50, 82, 58, 74, 46, 64, 78, 52];

export function Meter({ score, color = "#FFB627" }) {
  if (score === null) return <span className="no-rating-tag">no ratings yet</span>;
  const filled = Math.round(score);
  return (
    <div className="meter-row" style={{ height: 24 }}>
      {BAR_PATTERN.map((h, i) => (
        <div key={i} className="meter-bar" style={{ height: `${h}%`, background: i < filled ? color : "#2a2a33" }} />
      ))}
    </div>
  );
}

export function CategoryRow({ label, data, color }) {
  const score = data.count > 0 ? data.avg : null;
  return (
    <div className="cat-row">
      <div className="cat-label">{label}</div>
      <div className="cat-meter">
        <Meter score={score} color={color} />
        <span className="cat-score">{score !== null ? score.toFixed(1) : "—"}</span>
      </div>
    </div>
  );
}
