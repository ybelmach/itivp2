import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/roles';
import Sparkline from '../components/Sparkline';
import { ErrorMessage, Spinner } from '../components/States';
import { formatDateTime, formatDuration } from '../utils/format';

const REFRESH_MS = 5000;

// Дашборд метрик сервера: опрашивает /api/health и /api/metrics каждые 5 секунд
export default function StatusPage() {
  const { user } = useAuth();
  const health = useQuery({ queryKey: ['health'], queryFn: monitoringApi.health, refetchInterval: REFRESH_MS });
  const metrics = useQuery({ queryKey: ['metrics'], queryFn: monitoringApi.metrics, refetchInterval: REFRESH_MS });

  const ok = health.data?.status === 'ok';
  const m = metrics.data;

  return (
    <section>
      <div className="page-head">
        <h1>Статус и метрики</h1>
        <span className={`pill ${health.isError ? 'pill-down' : ok ? 'pill-up' : 'pill-warn'}`}>
          {health.isPending ? 'проверка…' : health.isError ? 'API недоступен' : ok ? 'Все системы работают' : 'Проблемы с БД'}
        </span>
      </div>
      <p className="muted small">
        Обновление каждые {REFRESH_MS / 1000} с. Внешний мониторинг доступности — UptimeRobot, ошибки — Sentry.
        {m && <> Версия: <code>{m.release.slice(0, 7)}</code>, данные на {formatDateTime(m.timestamp)}.</>}
      </p>

      {metrics.isPending && <Spinner />}
      {metrics.isError && <ErrorMessage message={getErrorMessage(metrics.error, 'Не удалось получить метрики')} onRetry={metrics.refetch} />}

      {m && (
        <>
          <div className="metrics">
            <Metric label="Время работы" value={formatDuration(m.uptimeSeconds)} hint={`с ${formatDateTime(m.startedAt)}`} />
            <Metric label="Память (RSS)" value={`${m.process.memory.rssMb} МБ`} hint={`heap ${m.process.memory.heapUsedMb} / ${m.process.memory.heapTotalMb} МБ`} />
            <Metric label="CPU процесса" value={`${m.process.cpuPercent}%`} hint={`ядер: ${m.system.cpus}, load ${m.system.loadAverage[0]}`} />
            <Metric label="Запросов обработано" value={m.requests.total.toLocaleString('ru-RU')} hint={`сейчас в работе: ${m.requests.inFlight}`} />
            <Metric label="Время ответа" value={`${m.requests.responseTime.avgMs} мс`} hint={`p95 ${m.requests.responseTime.p95Ms} мс`} />
            <Metric label="База данных" value={health.data?.checks?.database?.status === 'up' ? 'доступна' : 'недоступна'} hint={health.data ? `${health.data.checks.database.latencyMs} мс` : ''} />
          </div>

          <div className="charts">
            <Sparkline points={m.history} field="rssMb" unit="МБ" label="Память RSS" />
            <Sparkline points={m.history} field="heapUsedMb" unit="МБ" label="Heap used" color="var(--accent-2)" />
            <Sparkline points={m.history} field="cpuPercent" unit="%" label="CPU" color="var(--warn)" />
          </div>

          <div className="two-cols">
            <div>
              <h2>Ответы по кодам</h2>
              <table className="table">
                <tbody>
                  {Object.entries(m.requests.byStatus).map(([cls, n]) => (
                    <tr key={cls}><td><span className={`status status-${cls}`}>{cls}</span></td><td>{n}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h2>Популярные маршруты</h2>
              <table className="table">
                <tbody>
                  {m.requests.topRoutes.map((r) => (
                    <tr key={r.route}><td><code>{r.route}</code></td><td>{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {hasRole(user, 'admin') && <SentryTest />}
    </section>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="metric">
      <span className="muted small">{label}</span>
      <b>{value}</b>
      {hint && <span className="muted small">{hint}</span>}
    </div>
  );
}

// Кнопки для проверки Sentry: ошибка рендера на клиенте и необработанное исключение на сервере
function SentryTest() {
  const [crash, setCrash] = useState(false);
  const backend = useMutation({ mutationFn: monitoringApi.backendTestError });

  if (crash) throw new Error('Test error: проверка Sentry (frontend)');

  return (
    <div className="panel">
      <h2>Проверка сбора ошибок</h2>
      <p className="muted small">Видно только администратору. Ошибки уйдут в Sentry, а серверная — ещё и в Telegram.</p>
      <div className="actions">
        <button type="button" className="btn" onClick={() => setCrash(true)}>Ошибка на клиенте</button>
        <button type="button" className="btn" onClick={() => backend.mutate()} disabled={backend.isPending}>Ошибка на сервере</button>
      </div>
      {backend.isError && <p className="muted small">Сервер ответил: {getErrorMessage(backend.error)} ({backend.error.response?.status})</p>}
    </div>
  );
}
