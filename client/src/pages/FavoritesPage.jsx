import { useCallback } from 'react';
import { Link } from 'react-router';
import { getErrorMessage } from '../api/client';
import { useFavorites } from '../hooks/useFavorites';
import MaterialCard from '../components/MaterialCard';
import { EmptyState, ErrorMessage, SkeletonList } from '../components/States';

export default function FavoritesPage() {
  const favorites = useFavorites();
  const { mutate } = favorites.toggle;
  const toggle = useCallback((id, favorite) => mutate({ id, favorite }), [mutate]);

  return (
    <section>
      <h1>Избранное</h1>
      {favorites.isPending && <SkeletonList count={3} />}
      {favorites.isError && <ErrorMessage message={getErrorMessage(favorites.error)} onRetry={favorites.refetch} />}
      {favorites.data?.data.length === 0 && (
        <EmptyState title="В избранном пока ничего нет">
          <p className="muted">Отмечайте материалы звёздочкой в <Link to="/">каталоге</Link>.</p>
        </EmptyState>
      )}
      {favorites.data?.data.length > 0 && (
        <div className="grid">
          {favorites.data.data.map((m) => (
            <MaterialCard key={m.id} material={m} isFavorite onToggleFavorite={toggle} />
          ))}
        </div>
      )}
    </section>
  );
}
