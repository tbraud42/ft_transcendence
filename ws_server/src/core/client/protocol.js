/**
 * Protocol constants
 */

export const ClientStatus = Object.freeze({
    EMPTY: 0,
    CONNECTED: 1,
    READY: 2,
    OFFLINE: 3,
    PLAYING: 4,
    WINNER: 5,
    ELIMINATED: 6
});

export const MatchStatus = Object.freeze({
    WAITING: 0,
    RUNNING: 1,
    FINISHED: 2
});

export const SrvMessageType = Object.freeze({
    SNAPSHOT: 0,
    STOPPED: 1,
    ERROR: 2,
    TOURNAMENT_WINNER: 3,
    MATCH_ASSIGNED: 4,
    MATCH_START: 5,
    MATCH_STATE: 6,
    PLAYER_JOINED: 7,
    PLAYER_LEFT: 8,
    PLAYER_READY: 9,
    PLAYER_ELIMINATED: 10
});

export const CliMessageType = Object.freeze({
    AUTH: 0,
    JOIN: 1,
    READY: 2,
    INPUT: 3,
    ADD_BOT: 4,
    REMOVE_BOT: 5,
    SNAPSHOT: 6
});