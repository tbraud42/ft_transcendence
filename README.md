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

## How to use Javascript/Typescript formatting

1. Install Node.js if you haven't already.

2. Initialize a new Node.js project and install the necessary packages:
```bash
npm init -y
npm i -D eslint prettier \
       @typescript-eslint/parser @typescript-eslint/eslint-plugin \
       eslint-config-prettier
```

3. The configuration file already exists in the repository as [eslint.config.mjs](eslint.config.mjs)

4. execute the following command to format your files:
```bash
npx eslint --fix FILE_NAME
```
