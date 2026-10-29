// Пересоздаёт таблицы и заполняет их тестовыми данными: npm run seed
const bcrypt = require('bcrypt');
const { sequelize, User, Material, Favorite } = require('../models');

const PASSWORD = 'Password123!';

// Дополнительные материалы, чтобы в клиенте было видно пагинацию и фильтры
const EXTRA = [
  ['Лекция 2. Express.js и REST', 'lecture', 'Интернет-технологии', 'Петров П.П.', ['express', 'rest']],
  ['Лекция 3. Аутентификация и JWT', 'lecture', 'Интернет-технологии', 'Петров П.П.', ['jwt', 'security']],
  ['Лекция 4. React: компоненты и хуки', 'lecture', 'Интернет-технологии', 'Сидорова А.В.', ['react', 'frontend']],
  ['React Router и маршрутизация', 'presentation', 'Интернет-технологии', 'Сидорова А.В.', ['react', 'router']],
  ['CI/CD на GitHub Actions', 'presentation', 'DevOps', 'Козлов Д.С.', ['ci', 'github-actions']],
  ['Мониторинг и логирование в production', 'presentation', 'DevOps', 'Козлов Д.С.', ['monitoring', 'sentry']],
  ['Docker для разработчика', 'book', 'DevOps', 'Моуэт Э.', ['docker', 'devops']],
  ['PostgreSQL. Основы языка SQL', 'book', 'Базы данных', 'Моргунов Е.П.', ['postgresql', 'sql']],
  ['Чистый код', 'book', 'Программирование', 'Мартин Р.', ['clean-code']],
  ['Алгоритмы. Построение и анализ', 'book', 'Алгоритмы', 'Кормен Т.', ['algorithms']],
  ['Лекция 5. Оптимизация React-приложений', 'lecture', 'Интернет-технологии', 'Сидорова А.В.', ['react', 'performance']],
  ['Нормализация баз данных', 'presentation', 'Базы данных', 'Моргунов Е.П.', ['sql', 'normalization']],
];

async function seed() {
  await sequelize.sync({ force: true });

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const [admin, , user] = await User.bulkCreate([
    { email: 'admin@example.com', passwordHash, role: 'admin' },
    { email: 'moderator@example.com', passwordHash, role: 'moderator' },
    { email: 'user@example.com', passwordHash, role: 'user' },
    { email: 'user2@example.com', passwordHash, role: 'user' },
  ]);

  const materials = await Material.bulkCreate([
    {
      title: 'Лекция 1. Введение в Node.js',
      type: 'lecture',
      subject: 'Интернет-технологии',
      author: 'Петров П.П.',
      description: 'Платформа Node.js, модульная система, event loop.',
      fileUrl: 'https://example.com/files/lecture-1-nodejs.pdf',
      tags: ['node.js', 'javascript', 'backend'],
      ownerId: admin.id,
    },
    {
      title: 'Маршрутизация и middleware в Express.js',
      type: 'presentation',
      subject: 'Интернет-технологии',
      author: 'Петров П.П.',
      description: 'Слайды к лекции о маршрутах, middleware и обработке ошибок.',
      fileUrl: 'https://example.com/files/express-routing.pptx',
      tags: ['express', 'rest'],
      ownerId: user.id,
    },
    {
      title: 'Выразительный JavaScript',
      type: 'book',
      subject: 'Программирование',
      author: 'Марейн Хавербеке',
      description: 'Книга об основах языка JavaScript и программирования.',
      fileUrl: 'https://eloquentjavascript.net/',
      tags: ['javascript', 'книга'],
      ownerId: user.id,
    },
    ...EXTRA.map(([title, type, subject, author, tags], i) => ({
      title,
      type,
      subject,
      author,
      description: `Учебный материал по теме «${title}».`,
      fileUrl: `https://example.com/files/material-${i + 4}.pdf`,
      tags,
      ownerId: i % 2 === 0 ? user.id : admin.id,
    })),
  ]);

  // Пара материалов в избранном у user@example.com
  await Favorite.bulkCreate([
    { userId: user.id, materialId: materials[0].id },
    { userId: user.id, materialId: materials[2].id },
  ]);

  console.log(`Готово. Пользователи admin@, moderator@, user@, user2@example.com, пароль ${PASSWORD}`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
