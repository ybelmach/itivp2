import { expect, test } from 'vitest';
import { parseTags, toPayload, validateMaterial } from './validateMaterial';

const valid = {
  title: 'Лекция', type: 'lecture', subject: 'ИТиВП', author: 'Петров', description: '', fileUrl: 'https://x.io/a.pdf', tags: 'React, react, hooks',
};

test('корректная форма без ошибок', () => {
  expect(validateMaterial(valid)).toEqual({});
});

test('ошибки для пустых полей и неверной ссылки', () => {
  const errors = validateMaterial({ ...valid, title: ' ', subject: '', fileUrl: 'ftp://x' });
  expect(Object.keys(errors).sort()).toEqual(['fileUrl', 'subject', 'title']);
});

test('теги приводятся к нижнему регистру без повторов', () => {
  expect(parseTags('React, react, hooks, ')).toEqual(['react', 'hooks']);
  expect(toPayload(valid).tags).toEqual(['react', 'hooks']);
});
