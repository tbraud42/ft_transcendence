import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export function verifyToken(token) {
    return jwt.verify(token, config.JWT_SECRET)
}