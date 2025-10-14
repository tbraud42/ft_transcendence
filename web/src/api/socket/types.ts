import { ClientStatus, MatchStatus } from './protocol';

export { ClientStatus as ClientStatus, MatchStatus as MatchStatus };

export type MatchStatus = typeof MatchStatus;

export type Player = {
    username: string;
    connected: boolean;
    isReady: boolean;
    isBot: boolean;
};

export type Match = {
    id: string;
    round: number;
    p1: string | null;
    p2: string | null;
    status: MatchStatus;
    winner?: string | null;
    score?: Record<string, number> | null;
};

export type LeafAddress = {
    side: 'left' | 'right';
    pair: number;
    pos: 'top' | 'bottom';
};

export type RenderOptions = {
    myUsername?: string;
    isOwner?: boolean;
    onAddBot?: (addr: LeafAddress) => void;
    onRemove?: (remover: LeafAddress) => void;
    onReady?: (addr: LeafAddress) => void;
    isReady?: (username: string, addr: LeafAddress) => boolean;
};