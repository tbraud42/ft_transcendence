import { WSClient } from '../api/socket/WSClient'
import {CliMessageType} from "../api/socket/protocol";

export type TournamentElement = HTMLElement & { close: () => void }

export function renderTournament(
    wsUrl: string,
    token: string,
    tournamentId: string
): TournamentElement {
    const page = Object.assign(document.createElement('div'), {
        close: () => {}
    }) as TournamentElement

    page.className = 'w-full flex justify-center px-4'

    const ws = new WSClient(page)
    ws.connect(wsUrl, () => {
        ws.send({ type: CliMessageType.AUTH, token } as any)
        ws.send({ type: CliMessageType.JOIN, tournamentId } as any)
    })

    page.close = () => ws.close()

    return page
}