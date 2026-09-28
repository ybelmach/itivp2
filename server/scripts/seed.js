// Пересоздаёт таблицы и заполняет их тестовыми данными: npm run seed
const bcrypt = require('bcrypt');
const { sequelize, User, Material } = require('../models');

const PASSWORD = 'Password123!';

async function seed() {
  await sequelize.sync({ force: true });

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const [admin, , user] = await User.bulkCreate([
    { email: 'admin@example.com', passwordHash, role: 'admin' },
    { email: 'moderator@example.com', passwordHash, role: 'moderator' },
    { email: 'user@example.com', passwordHash, role: 'user' },
    { email: 'user2@example.com', passwordHash, role: 'user' },
  ]);

  await Material.bulkCreate([
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
  ]);

  console.log(`Готово. Пользователи admin@, moderator@, user@, user2@example.com, пароль ${PASSWORD}`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
