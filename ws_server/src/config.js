import dotenv from 'dotenv'
dotenv.config()

export const config = {
    API_URL: process.env.API_URL || 'http://localhost:3000',
    JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
    WS_PORT: process.env.WS_PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development'
}