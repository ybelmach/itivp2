// Мини-график по точкам истории метрик (inline SVG, без библиотек)
export default function Sparkline({ points, field, unit, label, color = 'var(--accent)' }) {
  const values = points.map((p) => p[field]);
  if (values.length < 2) return <div className="spark-empty muted small">{label}: данные копятся (точка раз в 10 с)</div>;

  const W = 300;
  const H = 70;
  const max = Math.max(...values) * 1.1 || 1;
  const step = W / (values.length - 1);
  const coords = values.map((v, i) => `${(i * step).toFixed(1)},${(H - (v / max) * H).toFixed(1)}`);
  const last = values[values.length - 1];

  return (
    <figure className="spark">
      <figcaption>
        <span>{label}</span>
        <b>{last} {unit}</b>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${label}: последние ${values.length} точек, сейчас ${last} ${unit}`}>
        <polyline points={`0,${H} ${coords.join(' ')} ${W},${H}`} fill={color} fillOpacity="0.12" stroke="none" />
        <polyline points={coords.join(' ')} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="spark-scale muted small"><span>−{Math.round(((values.length - 1) * 10) / 60)} мин</span><span>max {Math.round(Math.max(...values) * 10) / 10}</span><span>сейчас</span></div>
    </figure>
  );
}
