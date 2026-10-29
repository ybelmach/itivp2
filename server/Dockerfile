# Образ бэкенда. Базовый образ можно взять из зеркала, если Docker Hub недоступен:
#   docker build --build-arg NODE_IMAGE=mirror.gcr.io/library/node:22-alpine .
ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE}

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .
RUN mkdir -p logs && chown -R node:node logs

# Процесс работает не от root
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health > /dev/null || exit 1

CMD ["node", "server.js"]
