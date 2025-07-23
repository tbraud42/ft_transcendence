import dotenv from 'dotenv'
dotenv.config()

export const config = {
    JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
    WS_PORT: process.env.WS_PORT || 3000,
}