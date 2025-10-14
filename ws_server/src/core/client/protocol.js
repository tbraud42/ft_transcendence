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
    ERROR: 1,
    TOURNAMENT_WINNER: 2,
    MATCH_ASSIGNED: 3,
    MATCH_START: 4,
    MATCH_STATE: 5,
    MATCH_END: 6,
    PLAYER_JOINED: 7,
    PLAYER_LEFT: 8,
    PLAYER_READY: 9,
    PLAYER_ELIMINATED: 10,
    PLAYER_KICK: 11,
});

export const CliMessageType = Object.freeze({
    AUTH: 0,
    JOIN: 1,
    READY: 2,
    INPUT: 3,
    ADD_BOT: 4,
    REMOVE: 5,
    SNAPSHOT: 6
});