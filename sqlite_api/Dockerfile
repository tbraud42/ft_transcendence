### multi stage build
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

FROM node:20-slim

# RUN useradd -m appuser

WORKDIR /app

RUN apt-get update && apt-get install -y sqlite3 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# RUN chown -R appuser:appuser /app

# USER appuser

EXPOSE 3000

CMD ["npm", "run", "dev"]
# CMD ["npm", "start"]
