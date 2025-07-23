import i18next from '../../utils/lang/i18n'
import { createButton } from '../../components/button'
import { createInput } from '../../components/input'
import { createOverlayCard } from '../../components/overlayCard'
import { createOptionSelector } from '../../components/optionSelector'
import { setSelectedDifficulty, setSelectedGameMode } from '../../games/pong/pongState'
import { fetchPublicRooms, createRoom } from '../../api/game'
import {createList} from "../../components/list";

export function renderOnlineTab(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'flex flex-col gap-4 w-full max-w-md'

    // === Loading placeholder ===
    const lobbiesStatus = document.createElement('div')
    lobbiesStatus.textContent = i18next.t('pong_online_loading')
    lobbiesStatus.className = 'text-sm text-gray-400 text-center'
    container.appendChild(lobbiesStatus)

    // === Scrollable list container ===
    const { element: roomList, setElements } = createList()
    container.appendChild(roomList)

    // === Load public rooms ===
    fetchPublicRooms().then((rooms) => {
        if (rooms.length === 0) {
            lobbiesStatus.textContent = i18next.t('pong_online_no_lobbies')
            return
        }

        container.removeChild(lobbiesStatus) // remove loading text

        const items = rooms.map(room => {
            const card = document.createElement('div')
            card.className = 'bg-gray-800 p-4 rounded flex justify-between items-center hover:bg-gray-700 transition'

            const info = document.createElement('div')
            const title = document.createElement('h3')
            title.className = 'font-semibold text-white'
            title.textContent = room.name

            const players = document.createElement('p')
            players.className = 'text-sm text-gray-400'
            players.textContent = `👤 ${room.players.length} joueurs`

            info.append(title, players)

            const joinBtn = document.createElement('button')
            joinBtn.textContent = i18next.t('pong_join')
            joinBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded'
            joinBtn.onclick = () => {
                window.location.hash = `#/pong/lobby/${room.id}`
            }

            card.append(info, joinBtn)
            return card
        })

        setElements(items)
    }).catch(() => {
        lobbiesStatus.textContent = i18next.t('pong_online_error_fetch')
    })

    // === Room creation buttons ===
    const createOnlineButton = (label: string, mode: 'public' | 'private'): HTMLButtonElement => {
        const btn = createButton(label, 'button', mode === 'public' ? 'blue' : 'black')
        btn.onclick = () => {
            const nameInput = createInput('text', i18next.t('pong_online_name'))
            const difficulty = createOptionSelector({
                label: i18next.t('pong_difficulty_label'),
                values: [
                    { value: 'easy', label: i18next.t('pong_ai_difficulty_easy') },
                    { value: 'medium', label: i18next.t('pong_ai_difficulty_medium') },
                    { value: 'hard', label: i18next.t('pong_ai_difficulty_hard') },
                ],
                selected: 'medium'
            })

            const confirm = createButton(i18next.t('pong_start'), 'button', 'black')
            const overlay = createOverlayCard({
                title: i18next.t('pong_configuration'),
                children: [nameInput, difficulty.element, confirm]
            })

            confirm.onclick = () => {
                setSelectedDifficulty(difficulty.getValue() as 'easy' | 'medium' | 'hard')
                setSelectedGameMode(mode)
                overlay.close()
                createRoom(nameInput.value, mode === 'private', difficulty.getValue() as 'easy' | 'medium' | 'hard', 'player-id')
                    .then(room => {
                        window.location.hash = `#/pong/lobby/${room.id}`
                    })
                    .catch(() => alert(i18next.t('pong_online_error_create')))
            }

            document.body.appendChild(overlay.element)
        }

        return btn
    }

    container.append(
        createOnlineButton(i18next.t('pong_online_create_public'), 'public'),
        createOnlineButton(i18next.t('pong_online_create_private'), 'private')
    )

    return container
}