import { createButton } from '../components/button'
import { env } from '../utils/env'

export function renderPongLobby(roomId: string): HTMLElement {
    const container = document.createElement('div')
    container.className = 'min-h-screen flex flex-col items-center justify-center text-white px-4 py-8 text-center'

    const title = document.createElement('h2')
    title.textContent = `Lobby: ${roomId}`
    title.className = 'text-2xl font-bold mb-4'

    const status = document.createElement('p')
    status.className = 'text-gray-400 mb-4'
    status.textContent = 'Connecting to room...'

    const playersList = document.createElement('ul')
    playersList.className = 'mb-6 flex flex-col gap-2'

    const leaveBtn = createButton('Retour au menu', 'button', 'red')
    leaveBtn.onclick = () => {
        socket?.close()
        window.location.hash = '#/pong'
    }

    // === WebSocket Logic ===
    const socketUrl = `wss://${env.PONG_WS_URL}/${roomId}`
    const socket = new WebSocket(socketUrl)

    socket.onopen = () => {
        status.textContent = 'En attente de joueurs...'
    }

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'players') {
            // Expected format: { type: 'players', list: ['Alice', 'Bob'] }
            playersList.innerHTML = ''
            for (const name of data.list) {
                const li = document.createElement('li')
                li.textContent = name
                li.className = 'text-white bg-gray-800 px-4 py-2 rounded'
                playersList.appendChild(li)
            }
        }

        if (data.type === 'start') {
            status.textContent = 'Partie en cours...'
            setTimeout(() => {
                window.location.hash = '#/pong/play'
            }, 1000)
        }
    }

    socket.onerror = () => {
        status.textContent = 'Erreur de connexion WebSocket.'
    }

    socket.onclose = () => {
        status.textContent = 'Connexion fermée.'
    }

    container.append(title, status, playersList, leaveBtn)
    return container
}