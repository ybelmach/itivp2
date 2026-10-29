import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { EmptyState, ErrorMessage, Spinner } from '../components/States';
import { formatDateTime } from '../utils/format';

export default function AuditLogPage() {
  const { data, isPending, isError, error, refetch } = useQuery({ queryKey: ['audit-log'], queryFn: usersApi.auditLog });

  if (isPending) return <Spinner />;
  if (isError) return <ErrorMessage message={getErrorMessage(error)} onRetry={refetch} />;

  return (
    <section>
      <div className="page-head">
        <h1>Журнал аудита</h1>
        <button type="button" className="btn" onClick={() => refetch()}>Обновить</button>
      </div>
      <p className="muted small">Последние 100 действий администраторов и модераторов</p>
      {data.count === 0 ? <EmptyState title="Записей пока нет" /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Время</th><th>Кто</th><th>Действие</th><th>Объект</th><th>Код</th><th>IP</th></tr>
            </thead>
            <tbody>
              {data.data.map((e) => (
                <tr key={e.id}>
                  <td className="nowrap">{formatDateTime(e.createdAt)}</td>
                  <td>{e.actorEmail}<br /><span className="muted small">{e.actorRole}</span></td>
                  <td><code>{e.action}</code></td>
                  <td>{e.targetType}{e.targetId ? ` #${e.targetId}` : ''}</td>
                  <td><span className={`status status-${String(e.details?.status)[0]}xx`}>{e.details?.status}</span></td>
                  <td className="muted small">{e.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
