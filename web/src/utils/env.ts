export const env = {
    DOMAIN: "https://" + import.meta.env.VITE_DOMAIN,
    API_URL: "https://" + import.meta.env.VITE_API_URL,
    PONG_WS_URL: "https://" + import.meta.env.VITE_PONG_WS_URL,
    NODE_ENV: import.meta.env.VITE_NODE_ENV,
} as const;
