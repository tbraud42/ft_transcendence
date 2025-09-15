export type SrvSnapshot = {
    creator: { id: number; username: string },
    type: 'snapshot',
    tournamentId: string,
    players: { username: string; connected: boolean; isBot: boolean }[],
    matches: {
        id: string; round: number; p1: string; p2: string;
        status: 'waiting'|'ready_check'|'running'|'finished';
        winner?: string|null; score?: Record<string, number>|null;
    }[]
}

export type SrvPlayerJoined = { type: 'player_joined', username: string }
export type SrvPlayerLeft   = { type: 'player_left', username: string }

export type SrvMatchAssigned = {
    type: 'match_assigned',
    tournamentId?: string,
    maxPlayers?: number,
    match: { id: string; round: number; p1: string; p2: string; status: 'ready_check'|'waiting'|'running'|'finished' }
}

export type SrvReadyCheck = {
    type: 'ready_check',
    roomId: string,
    players: [string, string],
    timeoutMs: number
}

export type SrvPlayerReady = {
    type: 'player_ready',
    roomId: string,
    username: string
}

export type SrvStart = {
    type: 'start',
    roomId: string,
    clients: { username: string; slot: 0|1 }[]
}

export type SrvState = {
    type: 'state',
    roomId: string,
    state: any
}

export type SrvStopped = {
    type: 'stopped',
    roomId: string,
    winner: string,
    score?: Record<string, number>|null
}

export type SrvEliminated = { type: 'eliminated', tournamentId: string, user: string }
export type SrvWinner     = { type: 'tournament_winner', tournamentId: string, winner: string }
export type SrvError      = { type: 'error', error: string }

export type ServerEvent =
    | SrvSnapshot | SrvPlayerJoined | SrvPlayerLeft
    | SrvMatchAssigned | SrvReadyCheck | SrvPlayerReady
    | SrvStart | SrvState | SrvStopped
    | SrvEliminated | SrvWinner | SrvError

export type CliAuth    = { type: 'auth', token: string }
export type CliJoin    = { type: 'join', tournamentId: string }
export type CliReady   = { type: 'ready' }
export type CliInput   = { type: 'input', up?: boolean, down?: boolean }
export type CliAddBot  = { type: 'add_bot', tournamentId: string, username?: string }
export type CliSnapshot= { type: 'snapshot', tournamentId: string }

export type ClientEvent = CliAuth | CliJoin | CliReady | CliInput | CliAddBot | CliSnapshot