import { memo } from 'react';
import { Link } from 'react-router';
import { TYPE_LABELS, formatDate } from '../utils/format';

// memo: карточка не перерисовывается, пока не изменились её данные или флаг избранного
function MaterialCard({ material, isFavorite, onToggleFavorite, onPrefetch }) {
  return (
    <article className="card">
      <div className="card-head">
        <span className={`badge badge-${material.type}`}>{TYPE_LABELS[material.type]}</span>
        {onToggleFavorite && (
          <button
            type="button"
            className={`fav ${isFavorite ? 'fav-on' : ''}`}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            onClick={() => onToggleFavorite(material.id, isFavorite)}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        )}
      </div>
      <h3 className="card-title">
        <Link to={`/materials/${material.id}`} onMouseEnter={() => onPrefetch?.(material.id)} onFocus={() => onPrefetch?.(material.id)}>
          {material.title}
        </Link>
      </h3>
      <p className="muted">{material.subject} · {material.author}</p>
      {material.description && <p className="card-desc">{material.description}</p>}
      <div className="tags">
        {material.tags.map((tag) => <span key={tag} className="tag">#{tag}</span>)}
      </div>
      <p className="muted small">Добавлено {formatDate(material.createdAt)}</p>
    </article>
  );
}

export default memo(MaterialCard);
