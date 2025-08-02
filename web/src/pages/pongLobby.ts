import {createButton} from '../components/button'
import {Room} from "../games/pong/engine/Room";
import {OnlinePlayer} from "../games/pong/engine/players/OnlinePlayer";
import {
    isPrivate,
    maxPlayers,
    selectedDifficulty,
    selectedGameMode
} from "../games/pong/pongState";

let room: Room

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

    room = new Room(roomId, selectedDifficulty, selectedGameMode, maxPlayers, isPrivate)

    const leaveBtn = createButton('Retour au menu', 'button', 'red')
    leaveBtn.onclick = () => {
        room.close()
        window.location.hash = '#/pong'
    }

    container.append(title, status, playersList, leaveBtn)

    room.init().then(() => {
        room.join(new OnlinePlayer('Player1', 'randomId1', 5));
    }).catch((err) => {
        console.error('Room init error:', err);
        status.textContent = 'Erreur de connexion à la room.';
    });

    return container
}