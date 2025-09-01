type AppConfig = {
  API_URL?: string;
  DOMAIN?: string;
  PONG_WS_URL?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig;
  }
}

const rt = (window.__APP_CONFIG__ ?? {}) as AppConfig;

export const env = {
  API_URL: rt.API_URL ?? import.meta.env.VITE_API_URL ?? "/api",
  DOMAIN: rt.DOMAIN ?? import.meta.env.VITE_DOMAIN ?? "localhost",
  PONG_WS_URL: rt.PONG_WS_URL ?? import.meta.env.VITE_PONG_WS_URL ?? "ws://localhost:3000",
} as const;

