import {LeafAddress, Match, Player} from './types';
import {CliMessageType, SrvMessageType} from "./protocol";
import {Difficulty} from "../../games/pong/pongState";

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
    difficulty: Difficulty;
};

export type SrvState = {
    type: typeof SrvMessageType.MATCH_STATE;
    roomId: string;
    tick: number;
    players: {
        username: string;
        score: number;
        y: number;
        pad: {
            width: number;
            height: number;
            speed: number;
        };
    }[];
    ball: {
        x: number;
        y: number;
        radius: number;
    };
    size: {
        w: number;
        h: number;
    };
};

export type SrvEnd = {
    type: typeof SrvMessageType.MATCH_END;
    roomId: string;
    winner: string;
    score?: Record<string, number> | null;
};

export type SrvEliminated = {
    type: typeof SrvMessageType.PLAYER_ELIMINATED;
    tournamentId: number;
    user: string;
};

export type SrvKick = {
    type: typeof SrvMessageType.PLAYER_KICK;
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
    | SrvEnd
    | SrvEliminated
    | SrvKick
    | SrvWinner
    | SrvError;

// ----- Client -> Serveur
export type CliAuth = { type: typeof CliMessageType.AUTH; token: string };
export type CliJoin = { type: typeof CliMessageType.JOIN; tournamentId: number };
export type CliReady = { type: typeof CliMessageType.READY, ready: boolean };
export type CliInput = { type: typeof CliMessageType.INPUT; roomId: string, up: boolean; down: boolean };
export type CliAddBot = { type: typeof CliMessageType.ADD_BOT; addr: LeafAddress };
export type CliRemove = { type: typeof CliMessageType.REMOVE; addr: LeafAddress };
export type CliSnapshot = { type: typeof CliMessageType.SNAPSHOT; tournamentId: number };

export type ClientEvent = CliAuth | CliJoin | CliReady | CliInput | CliAddBot | CliRemove | CliSnapshot;