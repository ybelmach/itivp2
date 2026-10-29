import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/roles';
import { useFavorites } from '../hooks/useFavorites';
import { ErrorMessage, Spinner } from '../components/States';
import { TYPE_LABELS, formatDate } from '../utils/format';

export default function MaterialPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const favorites = useFavorites();

  const { data: material, isPending, isError, error, refetch } = useQuery({
    queryKey: ['material', id],
    queryFn: ({ signal }) => materialsApi.get(id, signal),
  });

  const remove = useMutation({
    mutationFn: () => materialsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.removeQueries({ queryKey: ['material', id] });
      navigate('/', { replace: true });
    },
  });

  if (isPending) return <Spinner />;
  if (isError) {
    const notFound = error.response?.status === 404 || error.response?.status === 400;
    return (
      <ErrorMessage
        message={notFound ? 'Материал не найден' : getErrorMessage(error)}
        onRetry={notFound ? undefined : refetch}
      />
    );
  }

  const canEdit = user && (material.ownerId === user.id || hasRole(user, 'moderator'));
  const canDelete = hasRole(user, 'admin');
  const isFavorite = favorites.ids.has(material.id);

  const handleDelete = () => {
    if (window.confirm(`Удалить «${material.title}»?`)) remove.mutate();
  };

  return (
    <article className="detail">
      <Link to="/" className="muted small">← К каталогу</Link>
      <div className="detail-head">
        <span className={`badge badge-${material.type}`}>{TYPE_LABELS[material.type]}</span>
        <h1>{material.title}</h1>
      </div>
      <dl className="props">
        <dt>Предмет</dt><dd>{material.subject}</dd>
        <dt>Автор</dt><dd>{material.author}</dd>
        <dt>Загрузил</dt><dd>{material.owner?.email ?? '—'}</dd>
        <dt>Добавлено</dt><dd>{formatDate(material.createdAt)}</dd>
        {material.updatedAt !== material.createdAt && (<><dt>Изменено</dt><dd>{formatDate(material.updatedAt)}</dd></>)}
      </dl>
      {material.description && <p className="detail-desc">{material.description}</p>}
      {material.tags.length > 0 && (
        <div className="tags">{material.tags.map((t) => <span key={t} className="tag">#{t}</span>)}</div>
      )}
      <div className="actions">
        <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Открыть файл ↗</a>
        {user && (
          <button
            type="button"
            className="btn"
            disabled={favorites.toggle.isPending}
            onClick={() => favorites.toggle.mutate({ id: material.id, favorite: isFavorite })}
          >
            {isFavorite ? '★ В избранном' : '☆ В избранное'}
          </button>
        )}
        {canEdit && <Link to={`/materials/${material.id}/edit`} className="btn">Редактировать</Link>}
        {canDelete && (
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={remove.isPending}>
            {remove.isPending ? 'Удаление…' : 'Удалить'}
          </button>
        )}
      </div>
      {remove.isError && <ErrorMessage message={getErrorMessage(remove.error)} />}
    </article>
  );
}
