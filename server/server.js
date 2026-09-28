const { port } = require('./config/env');
const { sequelize } = require('./models');
const app = require('./app');

async function start() {
  await sequelize.authenticate();
  // Создаёт недостающие таблицы и столбцы по описанию моделей
  await sequelize.sync({ alter: true });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('Не удалось запустить сервер:', err.message);
  process.exit(1);
});
