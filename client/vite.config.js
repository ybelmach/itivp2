import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  // Source maps загружаются в Sentry только при наличии токена (в CI) и затем удаляются из сборки,
  // чтобы исходники не были доступны публично
  const uploadSourceMaps = Boolean(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT);

  return {
    plugins: [
      react(),
      uploadSourceMaps && sentryVitePlugin({
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN,
        release: { name: env.VITE_APP_RELEASE },
        sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
        telemetry: false,
      }),
    ].filter(Boolean),
    build: {
      sourcemap: uploadSourceMaps ? 'hidden' : false,
    },
    server: {
      // В разработке /api проксируется на локальный бэкенд — тот же путь, что и в продакшене
      proxy: {
        '/api': { target: env.DEV_API_PROXY || 'http://localhost:3000', changeOrigin: true },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      css: false,
    },
  };
});
