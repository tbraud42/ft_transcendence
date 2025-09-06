import Tournament from '../game/Tournament'

export function renderLobby(tournamentId: string, wsUrl: string, token: string): HTMLElement {
    const root = div('min-h-screen w-full flex items-start justify-center p-6 text-white')
    const card = div('w-full max-w-3xl rounded-2xl border border-white/10 p-5 shadow bg-white/5 backdrop-blur flex flex-col gap-4')
    root.append(card)

    const title = text('h1', 'text-2xl font-semibold', 'Lobby')
    const status = text('div', 'text-sm opacity-80', 'Connecting...')
    const metaBox = div('text-sm space-y-1')
    const playersTitle = text('h2', 'font-medium', 'Players')
    const playersList = ul('list-disc pl-5 text-sm')
    const matchesTitle = text('h2', 'font-medium', 'Matches')
    const matchesList = ul('list-disc pl-5 text-sm')
    card.append(title, status, metaBox, playersTitle, playersList, matchesTitle, matchesList)

    const t = new Tournament(wsUrl, token, tournamentId)

    t.onUpdate = (s) => {
        status.textContent = t.ws.readyState === WebSocket.OPEN ? 'Connected' : 'Connecting...'

        metaBox.replaceChildren()
        metaBox.append(line(`ID: ${s.meta?.id ?? tournamentId}`))
        if (s.meta?.name) {
            metaBox.append(line(`Name: ${s.meta.name}`))
        }
        if (s.meta?.maxClients) {
            metaBox.append(line(`Max: ${s.meta.maxClients}`))
        }
        if (s.meta?.error) {
            metaBox.append(line(`Error: ${s.meta.error}`))
        }

        playersList.replaceChildren()
        s.players.slice().sort().forEach(u => playersList.append(li(u)))

        matchesList.replaceChildren()
        s.matches.forEach(m => {
            const vs = (m.players || []).map(p => p.username).join(' vs ')
            matchesList.append(li(`${m.matchId}${m.roomId ? ` (${m.roomId})` : ''} — ${vs}${m.status ? ` [${m.status}]` : ''}`))
        })
    }

    return root
}

function div(cls: string) {
    const d = document.createElement('div'); d.className = cls; return d
}
function text(tag: string, cls: string, s: string) {
    const e = document.createElement(tag); e.className = cls; e.textContent = s; return e
}
function ul(cls: string) {
    const e = document.createElement('ul'); e.className = cls; return e
}
function li(s: string) {
    const e = document.createElement('li'); e.textContent = s; return e
}
function line(s: string) {
    const d = document.createElement('div'); d.textContent = s; return d
}