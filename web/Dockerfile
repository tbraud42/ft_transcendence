FROM node:20-alpine

ENV SHELL=/bin/sh

RUN apk add --no-cache rsync

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src

COPY ./entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]