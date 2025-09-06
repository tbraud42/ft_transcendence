import { PlayerBase } from '../../game/pong/engine/players/PlayerBase'

export function renderPlayerList(players: PlayerBase[]): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'w-full max-w-md text-sm text-center'

    const table = document.createElement('div')
    table.className = 'grid grid-cols-1 gap-2'

    players.forEach(player => {
        const row = document.createElement('div')
        row.className = 'bg-gray-800 text-white px-4 py-2 rounded shadow-sm text-left'
        row.textContent = `👤 ${player.getName()}`
        table.appendChild(row)
    })

    wrapper.append(table)
    return wrapper
}