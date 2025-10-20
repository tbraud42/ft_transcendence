export const env = {
    API_URL: "https://" + import.meta.env.VITE_API_URL,
    DOMAIN: "https://" + import.meta.env.VITE_DOMAIN,
    PONG_WS_URL: "https://" + import.meta.env.VITE_PONG_WS_URL,
} as const;
