export type Player = { username: string; connected: boolean; isBot?: boolean };

export type Match = {
    id: string;
    round: number;
    p1: string | null;
    p2: string | null;
    status: 'waiting' | 'running' | 'finished';
    winner?: string | null;
};

export type Snapshot = {
    type: 'snapshot';
    name: string;
    tournamentId: string;
    maxPlayers: number;
    creator?: { id: number; username?: string };
    players: Player[];
    matches: Match[];
    owner?: string;
};

export enum ClientStatus {
    EMPTY = 0,
    CONNECTED = 1,
    READY = 2,
    OFFLINE = 3,
    PLAYING = 4,
    WINNER = 5,
    ELIMINATED = 6
}

export type LeafAddress = {
    side: 'left' | 'right';
    pair: number;
    pos: 'top' | 'bottom';
};

export type RenderOptions = {
    myUsername?: string;
    isOwner?: boolean;
    onAddBot?: (addr: LeafAddress) => void;
    onReady?: (addr: LeafAddress) => void;
    isReady?: (addr: LeafAddress) => boolean;
};