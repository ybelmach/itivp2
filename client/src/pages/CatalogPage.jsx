import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useFavorites } from '../hooks/useFavorites';
import MaterialCard from '../components/MaterialCard';
import Pagination from '../components/Pagination';
import { EmptyState, ErrorMessage, SkeletonList } from '../components/States';
import { TYPE_LABELS } from '../utils/format';

const PAGE_SIZE = 9;

// Каталог материалов. Фильтры хранятся в URL: ссылкой с фильтрами можно поделиться,
// а кнопка «назад» возвращает предыдущее состояние.
export default function CatalogPage({ mine = false }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || '';
  const sort = params.get('sort') || '-createdAt';
  const page = Number(params.get('page')) || 1;

  // Поле поиска обновляется сразу, а запрос уходит через 400 мс после последнего нажатия
  const [searchInput, setSearchInput] = useState(params.get('search') || '');
  const search = useDebouncedValue(searchInput.trim(), 400);

  const updateParams = useCallback((patch) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(patch)) {
        if (value === '' || value == null || (key === 'page' && value === 1)) next.delete(key);
        else next.set(key, String(value));
      }
      return next;
    }, { replace: true });
  }, [setParams]);

  useEffect(() => {
    if (search !== (params.get('search') || '')) updateParams({ search, page: 1 });
  }, [search, params, updateParams]);

  const listParams = {
    type, sort, page, limit: PAGE_SIZE, search: params.get('search') || '', ownerId: mine ? user?.id : undefined,
  };

  // keepPreviousData: при смене страницы старый список остаётся на экране, пока грузится новый
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['materials', listParams],
    queryFn: ({ signal }) => materialsApi.list(listParams, signal),
    placeholderData: keepPreviousData,
    enabled: !mine || Boolean(user),
  });

  const stats = useQuery({ queryKey: ['materials', 'stats'], queryFn: materialsApi.stats, enabled: !mine });
  const favorites = useFavorites();
  const { mutate: toggleFavorite } = favorites.toggle;

  const handleToggleFavorite = useCallback(
    (id, favorite) => toggleFavorite({ id, favorite }),
    [toggleFavorite],
  );

  // Детальная страница загружается заранее при наведении на ссылку
  const prefetch = useCallback((id) => {
    queryClient.prefetchQuery({
      queryKey: ['material', String(id)],
      queryFn: ({ signal }) => materialsApi.get(id, signal),
      staleTime: 30_000,
    });
  }, [queryClient]);

  const hasFilters = Boolean(type || params.get('search'));

  return (
    <section>
      <div className="page-head">
        <h1>{mine ? 'Мои материалы' : 'Каталог учебных материалов'}</h1>
        {user && <Link to="/materials/new" className="btn btn-primary">+ Добавить материал</Link>}
      </div>

      {!mine && stats.data && (
        <div className="stats">
          <div className="stat"><b>{stats.data.total}</b><span>всего</span></div>
          {Object.entries(stats.data.byType).map(([t, n]) => (
            <button
              key={t}
              type="button"
              className={`stat stat-btn ${type === t ? 'stat-active' : ''}`}
              onClick={() => updateParams({ type: type === t ? '' : t, page: 1 })}
            >
              <b>{n}</b><span>{TYPE_LABELS[t].toLowerCase()}</span>
            </button>
          ))}
        </div>
      )}

      <div className="filters">
        <input
          type="search"
          className="input grow"
          placeholder="Поиск по названию, автору, описанию или тегу"
          aria-label="Поиск"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select className="input" aria-label="Тип" value={type} onChange={(e) => updateParams({ type: e.target.value, page: 1 })}>
          <option value="">Все типы</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="input" aria-label="Сортировка" value={sort} onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}>
          <option value="-createdAt">Сначала новые</option>
          <option value="createdAt">Сначала старые</option>
          <option value="title">По названию А→Я</option>
          <option value="-title">По названию Я→А</option>
        </select>
      </div>

      {isPending && <SkeletonList />}
      {isError && <ErrorMessage message={getErrorMessage(error, 'Не удалось загрузить материалы')} onRetry={refetch} />}
      {data && data.data.length === 0 && (
        <EmptyState title={hasFilters ? 'Ничего не найдено' : 'Материалов пока нет'}>
          {hasFilters
            ? <button type="button" className="btn" onClick={() => { setSearchInput(''); updateParams({ type: '', search: '', page: 1 }); }}>Сбросить фильтры</button>
            : user && <Link to="/materials/new" className="btn btn-primary">Добавить первый материал</Link>}
        </EmptyState>
      )}
      {data && data.data.length > 0 && (
        <>
          <p className="muted small">Найдено: {data.total}{isFetching ? ' · обновление…' : ''}</p>
          <div className={`grid ${isFetching ? 'fetching' : ''}`}>
            {data.data.map((m) => (
              <MaterialCard
                key={m.id}
                material={m}
                isFavorite={favorites.ids.has(m.id)}
                onToggleFavorite={user ? handleToggleFavorite : undefined}
                onPrefetch={prefetch}
              />
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={(p) => { updateParams({ page: p }); window.scrollTo(0, 0); }} />
        </>
      )}
    </section>
  );
}
