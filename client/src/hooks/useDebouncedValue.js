import { useEffect, useState } from 'react';

// Возвращает значение с задержкой: запрос поиска уходит, когда пользователь перестал печатать
export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
