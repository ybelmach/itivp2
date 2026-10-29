// Клиентская проверка формы материала — те же правила, что и в Joi-схеме сервера
export function validateMaterial(values) {
  const errors = {};
  const title = values.title.trim();
  if (!title) errors.title = 'Укажите название';
  else if (title.length > 200) errors.title = 'Не длиннее 200 символов';

  if (!['lecture', 'presentation', 'book'].includes(values.type)) errors.type = 'Выберите тип';
  if (!values.subject.trim()) errors.subject = 'Укажите предмет';
  if (!values.author.trim()) errors.author = 'Укажите автора';
  if (values.description.length > 5000) errors.description = 'Не длиннее 5000 символов';

  try {
    const url = new URL(values.fileUrl.trim());
    if (!['http:', 'https:'].includes(url.protocol)) errors.fileUrl = 'Только ссылки http(s)';
  } catch {
    errors.fileUrl = 'Укажите корректную ссылку на файл';
  }

  const tags = parseTags(values.tags);
  if (tags.length > 20) errors.tags = 'Не больше 20 тегов';
  else if (tags.some((t) => t.length > 50)) errors.tags = 'Тег не длиннее 50 символов';

  return errors;
}

export function parseTags(value) {
  return [...new Set(value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))];
}

export function toPayload(values) {
  return {
    title: values.title.trim(),
    type: values.type,
    subject: values.subject.trim(),
    author: values.author.trim(),
    description: values.description.trim(),
    fileUrl: values.fileUrl.trim(),
    tags: parseTags(values.tags),
  };
}
