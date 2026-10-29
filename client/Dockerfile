# Сборка фронтенда и раздача статики через nginx (для деплоя на свою виртуальную машину)
ARG NODE_IMAGE=node:22-alpine
ARG NGINX_IMAGE=nginx:1.29-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_SENTRY_DSN=""
ARG VITE_APP_RELEASE="dev"
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN} VITE_APP_RELEASE=${VITE_APP_RELEASE}
RUN npm run build

FROM ${NGINX_IMAGE}
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
