import {createButton} from "../components/button";

export function renderPongLobby(roomId: string): HTMLElement {
    const container = document.createElement('div')
    container.className = 'min-h-screen flex flex-col items-center justify-center text-white bg-black'

    const title = document.createElement('h2')
    title.textContent = `Lobby: ${roomId}`
    title.className = 'text-2xl font-bold mb-4'

    const status = document.createElement('p')
    status.textContent = 'Waiting for players...'
    status.className = 'text-gray-400 mb-6'

    const leaveBtn = createButton('Quitter', 'button', 'red')
    leaveBtn.onclick = () => {
        window.location.hash = '#/pong'
    }

    container.append(title, status, leaveBtn)
    return container
}