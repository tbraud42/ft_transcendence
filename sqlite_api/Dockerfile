### multi stage build
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y sqlite3 curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["npm", "start"]
