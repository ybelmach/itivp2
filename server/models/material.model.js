// Временное хранилище в памяти сервера.
// В следующих работах этот модуль будет заменён на работу с базой данных,
// поэтому контроллеры обращаются к данным только через эти функции.

const MATERIAL_TYPES = ['lecture', 'presentation', 'book'];

let materials = [
  {
    id: 1,
    title: 'Лекция 1. Введение в Node.js',
    type: 'lecture',
    subject: 'Интернет-технологии',
    author: 'Петров П.П.',
    description: 'Платформа Node.js, модульная система, event loop.',
    fileUrl: 'https://example.com/files/lecture-1-nodejs.pdf',
    tags: ['node.js', 'javascript', 'backend'],
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 2,
    title: 'Маршрутизация и middleware в Express.js',
    type: 'presentation',
    subject: 'Интернет-технологии',
    author: 'Петров П.П.',
    description: 'Слайды к лекции о маршрутах, middleware и обработке ошибок.',
    fileUrl: 'https://example.com/files/express-routing.pptx',
    tags: ['express', 'rest'],
    createdAt: '2026-09-05T10:30:00.000Z',
    updatedAt: '2026-09-05T10:30:00.000Z',
  },
  {
    id: 3,
    title: 'Выразительный JavaScript',
    type: 'book',
    subject: 'Программирование',
    author: 'Марейн Хавербеке',
    description: 'Книга об основах языка JavaScript и программирования.',
    fileUrl: 'https://eloquentjavascript.net/',
    tags: ['javascript', 'книга'],
    createdAt: '2026-09-10T12:00:00.000Z',
    updatedAt: '2026-09-10T12:00:00.000Z',
  },
];

let nextId = materials.length + 1;

function findAll({ type, subject, search } = {}) {
  return materials.filter((m) => {
    if (type && m.type !== type) return false;
    if (subject && m.subject.toLowerCase() !== subject.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [m.title, m.description, m.author, ...m.tags].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function findById(id) {
  return materials.find((m) => m.id === id) || null;
}

function create(data) {
  const now = new Date().toISOString();
  const material = { id: nextId++, ...data, createdAt: now, updatedAt: now };
  materials.push(material);
  return material;
}

function replace(id, data) {
  const index = materials.findIndex((m) => m.id === id);
  if (index === -1) return null;
  const { createdAt } = materials[index];
  materials[index] = { id, ...data, createdAt, updatedAt: new Date().toISOString() };
  return materials[index];
}

function remove(id) {
  const index = materials.findIndex((m) => m.id === id);
  if (index === -1) return false;
  materials.splice(index, 1);
  return true;
}

module.exports = { MATERIAL_TYPES, findAll, findById, create, replace, remove };
