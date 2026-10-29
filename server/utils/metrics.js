const os = require('os');

// Метрики процесса в памяти. Сбрасываются при перезапуске сервера.
const startedAt = Date.now();
const counters = {
  total: 0,
  inFlight: 0,
  byStatus: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
  byMethod: {},
  byRoute: {},
};

// Последние 500 длительностей ответа — для среднего и 95-го перцентиля
const DURATIONS_LIMIT = 500;
const durations = [];

// История памяти и CPU: точка раз в 10 секунд, последние 10 минут
const HISTORY_INTERVAL_MS = 10_000;
const HISTORY_LIMIT = 60;
const history = [];

let lastCpu = process.cpuUsage();
let lastCpuAt = process.hrtime.bigint();

// Загрузка CPU процессом (в % от одного ядра) с момента прошлого вызова
function cpuPercent() {
  const now = process.hrtime.bigint();
  const usage = process.cpuUsage(lastCpu);
  const elapsedUs = Number(now - lastCpuAt) / 1000;
  lastCpu = process.cpuUsage();
  lastCpuAt = now;
  return elapsedUs > 0 ? Math.round(((usage.user + usage.system) / elapsedUs) * 1000) / 10 : 0;
}

const mb = (bytes) => Math.round((bytes / 1024 / 1024) * 10) / 10;

function sample() {
  const mem = process.memoryUsage();
  history.push({ t: Date.now(), rssMb: mb(mem.rss), heapUsedMb: mb(mem.heapUsed), cpuPercent: cpuPercent() });
  if (history.length > HISTORY_LIMIT) history.shift();
}
const timer = setInterval(sample, HISTORY_INTERVAL_MS);
timer.unref(); // не мешает процессу завершиться

// Префиксы, под которыми смонтированы роутеры (самые длинные — первыми).
// После ошибки Express сбрасывает req.baseUrl, поэтому префикс восстанавливаем по исходному URL.
const MOUNT_PREFIXES = ['/api/auth', '/api/materials', '/api/favorites', '/api/users', '/api/admin', '/api'];

function routePrefix(req) {
  if (req.baseUrl) return req.baseUrl;
  const path = req.originalUrl.split('?')[0];
  return MOUNT_PREFIXES.find((p) => path === p || path.startsWith(`${p}/`)) || '';
}

// Middleware: считает запросы и время ответа
function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  counters.inFlight += 1;
  res.on('finish', () => {
    counters.inFlight -= 1;
    counters.total += 1;
    const cls = `${Math.floor(res.statusCode / 100)}xx`;
    if (cls in counters.byStatus) counters.byStatus[cls] += 1;
    counters.byMethod[req.method] = (counters.byMethod[req.method] || 0) + 1;

    // Шаблон маршрута (/api/materials/:id), а не конкретный URL, чтобы ключей было немного
    if (req.route) {
      const key = `${req.method} ${routePrefix(req)}${req.route.path === '/' ? '' : req.route.path}`;
      counters.byRoute[key] = (counters.byRoute[key] || 0) + 1;
    }

    durations.push(Number(process.hrtime.bigint() - start) / 1e6);
    if (durations.length > DURATIONS_LIMIT) durations.shift();
  });
  next();
}

function responseTimeStats() {
  if (durations.length === 0) return { avgMs: 0, p95Ms: 0, samples: 0 };
  const sorted = [...durations].sort((a, b) => a - b);
  const avg = sorted.reduce((s, d) => s + d, 0) / sorted.length;
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  return { avgMs: Math.round(avg * 10) / 10, p95Ms: Math.round(p95 * 10) / 10, samples: sorted.length };
}

function snapshot() {
  const mem = process.memoryUsage();
  const topRoutes = Object.entries(counters.byRoute)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));

  return {
    timestamp: new Date().toISOString(),
    startedAt: new Date(startedAt).toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    process: {
      nodeVersion: process.version,
      pid: process.pid,
      cpuPercent: history.length ? history[history.length - 1].cpuPercent : 0,
      memory: {
        rssMb: mb(mem.rss),
        heapUsedMb: mb(mem.heapUsed),
        heapTotalMb: mb(mem.heapTotal),
        externalMb: mb(mem.external),
      },
    },
    system: {
      platform: process.platform,
      cpus: os.cpus().length,
      loadAverage: os.loadavg().map((n) => Math.round(n * 100) / 100),
      totalMemMb: mb(os.totalmem()),
      freeMemMb: mb(os.freemem()),
    },
    requests: {
      total: counters.total,
      inFlight: counters.inFlight,
      byStatus: { ...counters.byStatus },
      byMethod: { ...counters.byMethod },
      topRoutes,
      responseTime: responseTimeStats(),
    },
    history: [...history],
  };
}

module.exports = { metricsMiddleware, snapshot };
