import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ErrorMessage } from '../components/States';
import { validateAuth } from '../utils/validateAuth';

// Вход (/login) и регистрация (/register)
export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/'} replace />;

  const handleChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateAuth(values, mode);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setServerError('');
    try {
      const credentials = { email: values.email.trim(), password: values.password };
      if (isRegister) await register(credentials);
      await login(credentials);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, isRegister ? 'Не удалось зарегистрироваться' : 'Не удалось войти'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form form-narrow" onSubmit={handleSubmit} noValidate>
      <h1>{isRegister ? 'Регистрация' : 'Вход'}</h1>

      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" className="input" value={values.email} onChange={handleChange} aria-invalid={Boolean(errors.email)} />
      {errors.email && <span className="field-error">{errors.email}</span>}

      <label htmlFor="password">Пароль</label>
      <input id="password" name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} className="input" value={values.password} onChange={handleChange} aria-invalid={Boolean(errors.password)} />
      {errors.password && <span className="field-error">{errors.password}</span>}
      {isRegister && !errors.password && <span className="muted small">Минимум 8 символов: строчная и заглавная буквы, цифра и спецсимвол</span>}

      {serverError && <ErrorMessage message={serverError} />}

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Подождите…' : isRegister ? 'Зарегистрироваться' : 'Войти'}
      </button>
      <p className="muted small">
        {isRegister ? <>Уже есть аккаунт? <Link to="/login">Войти</Link></> : <>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></>}
      </p>
    </form>
  );
}
