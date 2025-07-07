FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src

RUN npm install
RUN npm run build

RUN find src -type f ! -name '*.ts' -exec cp --parents {} dist/ \;

FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist/src /usr/share/nginx/html