import {LeafAddress, Match, Player} from './types';
import {CliMessageType, SrvMessageType} from "./protocol";

// ----- Serveur -> Client
export type SrvSnapshot = {
    type: typeof SrvMessageType.SNAPSHOT;
    creator: string;
    matches: Match[];
    maxPlayers: number;
    name: string;
    players: Player[];
    tournamentId: number;
};

export type SrvPlayerJoined = {
    type: typeof SrvMessageType.PLAYER_JOINED;
    username: string;
};

export type SrvPlayerLeft = {
    type: typeof SrvMessageType.PLAYER_LEFT;
    username: string;
};

export type SrvMatchAssigned = {
    type: typeof SrvMessageType.MATCH_ASSIGNED;
    tournamentId: number;
    maxPlayers: number;
    match: Match;
};

export type SrvPlayerReady = {
    type: typeof SrvMessageType.PLAYER_READY;
    roomId: string;
    username: string;
};

export type SrvStart = {
    type: typeof SrvMessageType.MATCH_START;
    roomId: string;
    clients: { username: string; slot: 0 | 1 }[];
};

export type SrvState = {
    type: typeof SrvMessageType.MATCH_STATE;
    roomId: string;
    state: any;
};

export type SrvStopped = {
    type: typeof SrvMessageType.STOPPED;
    roomId: string;
    winner: string;
    score?: Record<string, number> | null;
};

export type SrvEliminated = {
    type: typeof SrvMessageType.PLAYER_ELIMINATED;
    tournamentId: number;
    user: string;
};

export type SrvWinner = {
    type: typeof SrvMessageType.TOURNAMENT_WINNER;
    tournamentId: number;
    winner: string;
};

export type SrvError = {
    type: typeof SrvMessageType.ERROR;
    error: string;
};

export type ServerEvent =
    | SrvSnapshot
    | SrvPlayerJoined
    | SrvPlayerLeft
    | SrvMatchAssigned
    | SrvPlayerReady
    | SrvStart
    | SrvState
    | SrvStopped
    | SrvEliminated
    | SrvWinner
    | SrvError;

// ----- Client -> Serveur
export type CliAuth = { type: typeof CliMessageType.AUTH; token: string };
export type CliJoin = { type: typeof CliMessageType.JOIN; tournamentId: number };
export type CliReady = { type: typeof CliMessageType.READY, ready: boolean };
export type CliInput = { type: typeof CliMessageType.INPUT; up?: boolean; down?: boolean };
export type CliAddBot = { type: typeof CliMessageType.ADD_BOT; addr: LeafAddress };
export type CliRemoveBot = { type: typeof CliMessageType.REMOVE_BOT; addr: LeafAddress };
export type CliSnapshot = { type: typeof CliMessageType.SNAPSHOT; tournamentId: number };

export type ClientEvent = CliAuth | CliJoin | CliReady | CliInput | CliAddBot | CliRemoveBot | CliSnapshot;