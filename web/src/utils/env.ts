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
    API_URL: rt.API_URL ?? "https://" + import.meta.env.VITE_API_URL ?? "api.trans.clesucre.fr",
    DOMAIN: rt.DOMAIN ?? "https://" + import.meta.env.VITE_DOMAIN ?? "trans.clesucre.fr",
    PONG_WS_URL: rt.PONG_WS_URL ?? "wss://" + import.meta.env.VITE_PONG_WS_URL ?? "ws://pong.ws.trans.clesucre.fr",
} as const;

