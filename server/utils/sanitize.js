// Удаляет HTML-теги из строки. Используется в Joi-схемах для текстовых полей,
// чтобы в базу не попадала разметка, которую клиент может вывести как HTML (XSS).
function stripTags(value) {
  return value.replace(/<[^>]*>/g, '').trim();
}

module.exports = { stripTags };
