import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/roles';
import { ErrorMessage, Spinner } from '../components/States';
import { ROLE_LABELS, formatDate } from '../utils/format';

// Модератор видит список пользователей, администратор может менять роли и удалять
export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const isAdmin = hasRole(me, 'admin');
  const queryClient = useQueryClient();
  const { data, isPending, isError, error, refetch } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });

  const changeRole = useMutation({
    mutationFn: ({ id, role }) => usersApi.changeRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
  const remove = useMutation({
    mutationFn: (id) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });

  if (isPending) return <Spinner />;
  if (isError) return <ErrorMessage message={getErrorMessage(error)} onRetry={refetch} />;

  const mutationError = changeRole.error || remove.error;

  return (
    <section>
      <h1>Пользователи <span className="muted">({data.count})</span></h1>
      {mutationError && <ErrorMessage message={getErrorMessage(mutationError)} />}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Email</th><th>Роль</th><th>Зарегистрирован</th>{isAdmin && <th />}</tr>
          </thead>
          <tbody>
            {data.data.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}{u.id === me.id && <span className="muted"> (вы)</span>}</td>
                <td>
                  {isAdmin && u.id !== me.id ? (
                    <select
                      className="input input-sm"
                      aria-label={`Роль ${u.email}`}
                      value={u.role}
                      disabled={changeRole.isPending}
                      onChange={(e) => changeRole.mutate({ id: u.id, role: e.target.value })}
                    >
                      {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ) : ROLE_LABELS[u.role]}
                </td>
                <td>{formatDate(u.createdAt)}</td>
                {isAdmin && (
                  <td>
                    {u.id !== me.id && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={remove.isPending}
                        onClick={() => window.confirm(`Удалить ${u.email} вместе с его материалами?`) && remove.mutate(u.id)}
                      >
                        Удалить
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
