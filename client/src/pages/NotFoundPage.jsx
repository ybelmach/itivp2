import { Link } from 'react-router';
import { EmptyState } from '../components/States';

export default function NotFoundPage() {
  return (
    <EmptyState title="Страница не найдена (404)">
      <Link to="/" className="btn btn-primary">В каталог</Link>
    </EmptyState>
  );
}
