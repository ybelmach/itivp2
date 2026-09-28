// Демонстрация ограничения частоты запросов: node scripts/rate-limit-demo.js
// Отправляет серию запросов на вход и показывает, с какого момента сервер отвечает 429.
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const COUNT = Number(process.argv[2]) || 25;

async function main() {
  for (let i = 1; i <= COUNT; i++) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com', password: 'Wrong1234' }),
    });
    const remaining = res.headers.get('RateLimit') || '';
    console.log(`#${String(i).padStart(2)}  ${res.status}  ${remaining}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
