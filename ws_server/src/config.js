import dotenv from "dotenv";

export function loadEnv() {
    dotenv.config();
    if (!process.env.JWT_SECRET) {
        console.warn("[config] Missing JWT_SECRET (using insecure default for dev!)");
        process.env.JWT_SECRET = "dev-insecure-secret";
    }
}

export const CONFIG = {
    tokenHeader: "authorization",
    tokenQueryParam: "token",
    tokenSubprotocol: "jwt",
    heartbeatMs: 30000,
    tickMs: 1000 / 60,
    broadcastEvery: 1
};