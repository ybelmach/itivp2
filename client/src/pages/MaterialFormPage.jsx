import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { ErrorMessage, Spinner } from '../components/States';
import { TYPE_LABELS } from '../utils/format';
import { toPayload, validateMaterial } from '../utils/validateMaterial';

const EMPTY = {
  title: '', type: 'lecture', subject: '', author: '', description: '', fileUrl: '', tags: '',
};

const toFormValues = (m) => ({
  title: m.title, type: m.type, subject: m.subject, author: m.author,
  description: m.description ?? '', fileUrl: m.fileUrl, tags: m.tags.join(', '),
});

// Создание (/materials/new) и редактирование (/materials/:id/edit)
export default function MaterialFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: material, isPending, isError, error } = useQuery({
    queryKey: ['material', id],
    queryFn: ({ signal }) => materialsApi.get(id, signal),
    enabled: isEdit,
  });

  if (isEdit && isPending) return <Spinner />;
  if (isEdit && isError) return <ErrorMessage message={getErrorMessage(error, 'Материал не найден')} />;

  // key: форма заново инициализируется значениями, когда данные загрузились
  return <MaterialForm key={material?.id ?? 'new'} initial={material ? toFormValues(material) : EMPTY} id={id} />;
}

function MaterialForm({ initial, id }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const save = useMutation({
    mutationFn: (payload) => (id ? materialsApi.update(id, payload) : materialsApi.create(payload)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.setQueryData(['material', String(saved.id)], saved);
      navigate(`/materials/${saved.id}`);
    },
  });

  const handleChange = (e) => {
    const next = { ...values, [e.target.name]: e.target.value };
    setValues(next);
    if (touched[e.target.name]) setErrors(validateMaterial(next));
  };

  const handleBlur = (e) => {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
    setErrors(validateMaterial(values));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validateMaterial(values);
    setErrors(found);
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
    if (Object.keys(found).length === 0) save.mutate(toPayload(values));
  };

  const field = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    'aria-invalid': Boolean(touched[name] && errors[name]),
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  const fieldError = (name) => touched[name] && errors[name] && (
    <span id={`${name}-error`} className="field-error">{errors[name]}</span>
  );

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <h1>{id ? 'Редактирование материала' : 'Новый материал'}</h1>

      <label htmlFor="title">Название *</label>
      <input className="input" maxLength={200} {...field('title')} />
      {fieldError('title')}

      <label htmlFor="type">Тип *</label>
      <select className="input" {...field('type')}>
        {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {fieldError('type')}

      <div className="form-row">
        <div>
          <label htmlFor="subject">Предмет *</label>
          <input className="input" {...field('subject')} />
          {fieldError('subject')}
        </div>
        <div>
          <label htmlFor="author">Автор *</label>
          <input className="input" {...field('author')} />
          {fieldError('author')}
        </div>
      </div>

      <label htmlFor="fileUrl">Ссылка на файл *</label>
      <input className="input" type="url" placeholder="https://…" {...field('fileUrl')} />
      {fieldError('fileUrl')}

      <label htmlFor="description">Описание</label>
      <textarea className="input" rows={5} {...field('description')} />
      {fieldError('description')}

      <label htmlFor="tags">Теги через запятую</label>
      <input className="input" placeholder="react, hooks" {...field('tags')} />
      {fieldError('tags')}

      {save.isError && <ErrorMessage message={getErrorMessage(save.error, 'Не удалось сохранить')} />}

      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={save.isPending}>
          {save.isPending ? 'Сохранение…' : 'Сохранить'}
        </button>
        <Link to={id ? `/materials/${id}` : '/'} className="btn">Отмена</Link>
      </div>
    </form>
  );
}
