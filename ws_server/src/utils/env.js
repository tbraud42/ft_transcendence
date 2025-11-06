export const env = {
    API_URL: "http://" + process.env.API_URL,
    JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key',
    NODE_ENV: process.env.NODE_ENV
}