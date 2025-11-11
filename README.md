# ft_transcendence

## How to run

1. Clone the repository:
```bash
git clone https://github.com/tbraud42/ft_transcendence.git
cd ft_transcendence
```

2. Setup the environment variables from the `.env-example` file:
```bash
cp .env-example .env
```
Edit the `.env` file to set your environment variables as needed.

3. Simply run make:
```bash
make
```

Everything will be built and started automatically.
After that, you can access the application at `http://localhost`.

## How to run in development mode

NOTE: load pages to accept https certificate in your browser:
 - DOMAIN_NAME
 - api.DOMAIN_NAME
 - pong.ws.DOMAIN_NAME

## How to test web socket using terminal

TOKEN=a_valid_jwt_token_here

### websocat

websocat --insecure --text wss://pong.ws.DOMAIN_NAME \
--one-message='{"type":"AUTH","token":"$TOKEN"}'


{"type":0,"token":"a_valid_jwt_token_here"}

### curl

curl -i -N -k \
-H "Connection: Upgrade" \
-H "Upgrade: websocket" \
-H "Host: https://pong.ws.DOMAIN_NAME" \
-H "Origin: https://pong.ws.DOMAIN_NAME" \
-H "Sec-WebSocket-Key: SGVsbG9Xb3JsZDEyMzQ1Ng==" \
-H "Sec-WebSocket-Version: 13" \
https://pong.ws.DOMAIN_NAME