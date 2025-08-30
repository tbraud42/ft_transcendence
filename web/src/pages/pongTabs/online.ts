import i18next from '../../utils/lang/i18n'
import {createButton} from '../../components/button'
import {createInput} from '../../components/input'
import {createOverlayCard} from '../../components/overlayCard'
import {createOptionSelector} from '../../components/optionSelector'
import {
    Difficulty,
    GameMode, setIsPrivate,
    setMaxPlayers, setRoomId,
    setSelectedDifficulty,
    setSelectedGameMode
} from '../../games/pong/pongState'
import {createTournament, fetchTournaments} from '../../api/game'
import {createList} from "../../components/list";

export function renderOnlineTab(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'flex flex-col gap-4 w-full max-w-md'

    const lobbiesStatus = document.createElement('div')
    lobbiesStatus.textContent = i18next.t('pong_online_loading')
    lobbiesStatus.className = 'text-sm text-gray-400 text-center'
    container.appendChild(lobbiesStatus)

    const { element: roomList, setElements } = createList()
    container.appendChild(roomList)

    fetchTournaments().then((tournaments) => {
        if (tournaments.length === 0) {
            lobbiesStatus.textContent = i18next.t('pong_online_no_lobbies')
            return
        }

        container.removeChild(lobbiesStatus)

        const items = tournaments.map(tournament => {
            const card = document.createElement('div')
            card.className = 'bg-gray-800 p-4 rounded flex justify-between items-center hover:bg-gray-700 transition'

            const info = document.createElement('div')

            const title = document.createElement('h3')
            title.className = 'font-semibold text-white'
            title.textContent = tournament.name

            const details = document.createElement('p')
            details.className = 'text-sm text-gray-400'
            const difficulty = tournament.difficulty || i18next.t('pong_ai_difficulty_unknown')
            details.textContent = `${difficulty} • ${tournament.maxPlayers} ` + i18next.t("pong_online_players")

            info.append(title, details)

            const joinBtn = document.createElement('button')
            joinBtn.textContent = i18next.t('pong_join')
            joinBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded'
            joinBtn.onclick = () => {
                setSelectedGameMode(GameMode.ONLINE)
                window.location.hash = `#/pong/lobby/${tournament.id}`
            }

            card.append(info, joinBtn)
            return card
        })

        setElements(items)
    }).catch(() => {
        lobbiesStatus.textContent = i18next.t('pong_online_error_fetch')
    })

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
                setSelectedDifficulty(Difficulty[difficulty.getValue() as keyof typeof Difficulty])
                setSelectedGameMode(GameMode.ONLINE)
                setMaxPlayers(2)
                setIsPrivate(false)
                overlay.close()
                createTournament(nameInput.value, difficulty.getValue() as 'easy' | 'medium' | 'hard')
                    .then(room => {
                        // lastInsertRowid is the id of the newly created room
                        setRoomId(room.lastInsertRowid)
                        window.location.hash = `#/pong/lobby/${room.lastInsertRowid}`
                    })
                    .catch(() => alert(i18next.t('pong_online_error_create')))
            }

            document.body.appendChild(overlay.element)
        }

        return btn
    }

    container.append(
        createOnlineButton(i18next.t('pong_online_create_public'), 'public'),
    )

    return container
}