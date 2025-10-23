FROM node:20 AS builder
WORKDIR /app

COPY package*.json tsconfig.json vite.config.ts tailwind.config.js postcss.config.js ./

RUN npm install

COPY scripts ./scripts
COPY src ./src

# Build-time args (come from docker-compose)
ARG VITE_DOMAIN
ARG VITE_API_URL
ARG VITE_PONG_WS_URL
ARG VITE_NODE_ENV=production

# Expose them as ENV for the prebuild step (node script reads process.env)
ENV VITE_DOMAIN=$VITE_DOMAIN \
    VITE_API_URL=$VITE_API_URL \
    VITE_PONG_WS_URL=$VITE_PONG_WS_URL \
    VITE_NODE_ENV=$VITE_NODE_ENV

# Generate src/env.ts then build
RUN node scripts/inject-env.js && npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000
