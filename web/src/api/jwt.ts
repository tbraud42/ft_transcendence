// api/jwt.ts

import { env } from '../utils/env';
import { getToken } from '../utils/storage';
import {
    getLastTokenRefresh,
    setToken,
    logout,
    login,
    getUsername,
    setUsername,
    isLoggedIn, getTmpToken, removeItem, TMP_TOKEN_KEY
} from "../utils/storage";
import { ApiInit, Tournament, TournamentPayload } from "./types";

const API_URL = env.API_URL;

export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<T> {
  await refreshToken();

  const url = `https://${API_URL}${path}`;
  const method = init.method ?? 'GET';
  const hasBody = init.json !== undefined;

  const res = await fetch(url, {
    ...init,
    method,
    body: hasBody ? JSON.stringify(init.json) : undefined,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(hasBody ? { 'Content-Type': 'application/json' } : {})}
  });

//   if (!res.ok) {
//     const errText = await res.text().catch(() => '');
//     throw new Error(`${res.status} ${errText || res.statusText}`);
//   }

//   if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

/**
 * Refresh the JWT token if it is older than the given tolerance (default: 30 minute)
 * @param tolerance Time in milliseconds (1800000 = 30 minutes, 0 = always refresh)
 * @returns The new token or null if the refresh failed
 */
export async function refreshToken(tolerance: number = 1800000): Promise<string | null> {
    if (Date.now() - getLastTokenRefresh() < tolerance) {
        return getToken();
    }

    const url = `${API_URL}/auth/refreshAuth`;

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
    });

    if (!res.ok) {
        logout();
        return null;
    }

    const data = await res.json();
    if (!data?.token) {
        logout();
        return null;
    }
    setToken(data.token);
    return data.token || null;
}
