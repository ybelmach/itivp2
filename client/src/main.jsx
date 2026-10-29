import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initSentry } from './sentry';
import { AuthProvider } from './auth/AuthContext';
import { createRouter } from './router';
import './index.css';

initSentry();

// Кэш запросов: повторный заход на страницу показывает данные сразу, без нового запроса в течение 30 с
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => count < 2 && !(error.response?.status >= 400 && error.response?.status < 500),
      refetchOnWindowFocus: false,
    },
  },
});

const router = createRouter();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
