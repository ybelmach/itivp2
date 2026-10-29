import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';

// Избранное текущего пользователя и переключатель «в избранном / нет»
export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: favoritesApi.list,
    enabled: Boolean(user),
  });

  const ids = new Set((query.data?.data ?? []).map((m) => m.id));

  const toggle = useMutation({
    mutationFn: ({ id, favorite }) => (favorite ? favoritesApi.remove(id) : favoritesApi.add(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  return { ...query, ids, toggle };
}
