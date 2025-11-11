// api/jwt.ts

import { env } from '../utils/env';
import {getToken, updateLastTokenRefresh} from '../utils/storage';
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
import {logoutUser} from "./auth";

const API_URL = env.API_URL;

export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<T> {
  const token = getToken()

  const url = `${API_URL}${path}`;
  const method = init.method ?? 'GET';
  const hasBody = init.json !== undefined;

  const res = await fetch(url, {
    ...init,
    method,
    body: hasBody ? JSON.stringify(init.json) : undefined,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(hasBody ? { 'Content-Type': 'application/json' } : {})}
  });

  return res.json() as Promise<T>;
}

/**
 * Refresh the JWT token if it is older than the given tolerance (default: 30 minute)
 * @param tolerance Time in milliseconds (1800000 = 30 minutes, 0 = always refresh)
 * @returns The new token or null if the refresh failed
 */
export async function refreshToken(tolerance: number = 1800000): Promise<string | null> {
    const token = getToken();
    if (Date.now() - getLastTokenRefresh() < tolerance) {
        return token;
    }
    updateLastTokenRefresh()

    const url = `${API_URL}/auth/refreshAuth`;

    console.log(token)

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    console.log(res)

    if (!res.ok) {
        logoutUser();
        return null;
    }

    const data = await res.json();
    console.log(data)
    if (!data?.info?.token) {
        logoutUser();
        return null;
    }
    setToken(data.info.token);
    return data.info.token || null;
}
