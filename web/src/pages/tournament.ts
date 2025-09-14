import { WSClient } from '../api/socket/wsClient'
import {getUsername} from "../utils/storage";

export type TournamentElement = HTMLElement & { close: () => void }

export function renderTournament(
    wsUrl: string,
    token: string,
    tournamentId: string,
    username?: string
): TournamentElement {
    const me = username || getUsername() || 'player'

    const page = Object.assign(document.createElement('div'), {
        close: () => {}
    }) as TournamentElement

    page.className = 'w-full flex justify-center px-4'

    const ws = new WSClient(page)
    ws.connect(wsUrl, () => {
        ws.send({ type: 'auth', token, username: me } as any)
        ws.send({ type: 'join', tournamentId } as any)
    })

    page.close = () => ws.close()

    return page
}