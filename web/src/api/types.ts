// api/types.ts

import { Difficulty } from "../games/pong/pongState";

export type ApiInit = Omit<RequestInit, 'body' | 'headers' | 'method'> & {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  json?: unknown;
};

export interface Tournament {
  id: number;
  name: string;
  description: string | null;
  creator_id: number;
  difficulty: Difficulty;
  maxPlayers: number;
  isPrivate: boolean;
  status: number;
  created_at: string;
}

export interface TournamentPayload {
  name: string;
  description?: string;
  difficulty: Difficulty;
  maxPlayers?: number;
  isPrivate?: boolean;
}
