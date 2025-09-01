FROM node:20 AS builder
WORKDIR /app

COPY package*.json tsconfig.json vite.config.ts tailwind.config.js postcss.config.js ./
COPY src ./src
COPY public ./public

RUN npm install
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
COPY entrypoint.d/10-vault-env.sh /docker-entrypoint.d/10-vault-env.sh
COPY entrypoint.d/50-app-config.sh /docker-entrypoint.d/50-app-config.sh

RUN chmod +x /docker-entrypoint.d/*
