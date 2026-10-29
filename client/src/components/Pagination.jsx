export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const numbers = Array.from({ length: pages }, (_, i) => i + 1);
  return (
    <nav className="pagination" aria-label="Страницы">
      <button type="button" className="btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>←</button>
      {numbers.map((n) => (
        <button
          key={n}
          type="button"
          className={`btn ${n === page ? 'btn-primary' : ''}`}
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
      <button type="button" className="btn" disabled={page >= pages} onClick={() => onChange(page + 1)}>→</button>
    </nav>
  );
}
