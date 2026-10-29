// Общие состояния загрузки, ошибки и пустого списка
export function Spinner({ label = 'Загрузка…' }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <p>{message}</p>
      {onRetry && <button type="button" className="btn" onClick={onRetry}>Повторить</button>}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state state-empty">
      <p className="state-title">{title}</p>
      {children}
    </div>
  );
}

export function SkeletonList({ count = 6 }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <div key={i} className="card skeleton" />)}
    </div>
  );
}
