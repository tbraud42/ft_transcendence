import { getUsername } from '../utils/storage'
import { navigateTo } from '../utils/router'

export type TournamentState = {
    meta: any | null
    players: string[]
    matches: Array<{
        matchId: string
        roomId?: string
        players: { username: string; slot: 0 | 1 }[]
        status?: string
    }>
}

export default class Tournament {
    ws: WebSocket
    token: string
    tournamentId: string
    state: TournamentState = { meta: null, players: [], matches: [] }
    onUpdate: (s: TournamentState) => void = () => {}

    onStartRoom?: (roomId: string, slot: 0 | 1, opponent: string) => void

    constructor(
        wsUrl: string,
        token: string,
        tournamentId: string,
        onStartRoom?: (roomId: string, slot: 0 | 1, opponent: string) => void
    ) {
        this.token = token
        this.tournamentId = tournamentId
        this.ws = new WebSocket(wsUrl)
        this.onStartRoom = onStartRoom

        this.ws.addEventListener('open', () => {
            this.send({ type: 'auth', token: this.token })
        })

        this.ws.addEventListener('message', (e) => {
            let msg: any
            try { msg = JSON.parse(String(e.data)) } catch { return }
            this.handle(msg)
        })
    }

    private send(payload: any) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload))
        } else {
            this.ws.addEventListener('open', () => this.ws.send(JSON.stringify(payload)), { once: true })
        }
    }

    private pushUpdate() {
        this.onUpdate({
            meta: this.state.meta,
            players: [...this.state.players],
            matches: [...this.state.matches],
        })
    }

    private handle(msg: any) {
        switch (msg?.type) {
            case 'auth_ok': {
                this.send({ type: 'join', tournamentId: this.tournamentId })
                break
            }

            case 'joined': {
                this.state.meta = msg.tournament || { id: this.tournamentId }
                this.pushUpdate()
                break
            }

            case 'player_joined': {
                const u = msg.username
                if (u && !this.state.players.includes(u)) this.state.players.push(u)
                this.pushUpdate()
                break
            }

            case 'match_assigned': {
                const names = (msg.players || []).map((p: any) => p.username).filter(Boolean)
                for (const n of names) if (!this.state.players.includes(n)) this.state.players.push(n)

                const base = {
                    matchId: msg.matchId,
                    roomId: msg.roomId,
                    players: msg.players || [],
                    status: 'pending' as const,
                }
                const i = this.state.matches.findIndex(m => m.matchId === msg.matchId)
                if (i >= 0) this.state.matches[i] = base
                else this.state.matches.push(base)

                this.pushUpdate()
                break
            }

            case 'starting': {
                this.state.matches = this.state.matches.map(m =>
                    m.roomId === msg.roomId ? { ...m, status: 'starting' } : m
                )
                this.pushUpdate()
                break
            }

            case 'start': {
                const roomId = msg.roomId
                const clients = msg.clients || []

                const mine = clients.find(c => c.username === getUsername())
                const opp = clients.find(c => c.username !== getUsername())

                if (mine && opp) {
                    if (this.onStartRoom) {
                        this.onStartRoom(roomId, mine.slot, opp.username || 'Opponent')
                    } else {
                        navigateTo(`/pong/play/${roomId}`)
                    }
                }

                this.state.matches = this.state.matches.map(m =>
                    m.roomId === roomId ? { ...m, status: 'running' } : m
                )
                this.pushUpdate()
                break
            }

            case 'match_cancelled': {
                this.state.matches = this.state.matches.map(m =>
                    m.roomId === msg.roomId ? { ...m, status: 'cancelled' } : m
                )
                this.pushUpdate()
                break
            }

            case 'error': {
                this.state.meta = { ...(this.state.meta || {}), error: msg.error }
                this.pushUpdate()
                break
            }

            default: break
        }
    }

    close() { try { this.ws.close() } catch {} }
}
