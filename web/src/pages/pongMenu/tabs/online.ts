import i18n from '../../../utils/lang/i18n'
import {createButton} from '../../../components/button'
import {createInput} from '../../../components/input'
import {createOverlayCard} from '../../../components/overlayCard'
import {createOptionSelector} from '../../../components/optionSelector'
import {
    Difficulty,
    GameMode, setIsPrivate,
    setMaxPlayers, setRoomId,
    setSelectedDifficulty,
    setSelectedGameMode
} from '../../../games/pong/pongState'
import {createTournament, fetchTournaments} from '../../../api/game'
import {createList} from "../../../components/list";
import {navigateTo} from "../../../utils/router";

export function renderOnlineTab(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'flex flex-col gap-4 w-full max-w-md'

    const lobbiesStatus = document.createElement('div')
    lobbiesStatus.textContent = i18n.t('pong_online_loading')
    lobbiesStatus.className = 'text-sm text-gray-400 text-center'
    container.appendChild(lobbiesStatus)

    const { element: roomList, setElements } = createList()
    container.appendChild(roomList)

    fetchTournaments().then((tournaments) => {
        if (Object.keys(tournaments).length === 0) {
            lobbiesStatus.textContent = i18n.t('pong_online_no_lobbies')
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
            const difficulty = tournament.difficulty || i18n.t('pong_ai_difficulty_unknown')
            details.textContent = `${difficulty} • ` + i18n.t("pong_online_players", { count: tournament.maxPlayer })

            info.append(title, details)

            const joinBtn = document.createElement('button')
            joinBtn.textContent = i18n.t('pong_join')
            joinBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded'
            joinBtn.onclick = () => {
                setSelectedGameMode(GameMode.ONLINE)
                navigateTo(`/pong/lobby/${tournament.id}`)
            }

            card.append(info, joinBtn)
            return card
        })

        setElements(items)
    }).catch(() => {
        lobbiesStatus.textContent = i18n.t('pong_online_error_fetch')
    })

    const createOnlineButton = (label: string): HTMLButtonElement => {
        const btn = createButton(label, 'button', 'blue')
        btn.onclick = () => {
            const nameInput = createInput('text', i18n.t('pong_online_name'))
            nameInput.id = 'tournament-name-input'
            const difficulty = createOptionSelector({
                label: i18n.t('pong_difficulty_label'),
                values: [
                    { value: Difficulty.EASY, label: i18n.t('pong_ai_difficulty_easy') },
                    { value: Difficulty.MEDIUM, label: i18n.t('pong_ai_difficulty_medium') },
                    { value: Difficulty.HARD, label: i18n.t('pong_ai_difficulty_hard') },
                ],
                selected: Difficulty.MEDIUM
            })
            const maxPlayers = createOptionSelector({
                label: i18n.t('pong_online_max_players'),
                values: [
                    { value: '2', label: '2' },
                    { value: '4', label: '4' },
                    { value: '8', label: '8' }
                ],
                selected: '2'
            })

            const confirm = createButton(i18n.t('pong_start'), 'button', 'black')
            const overlay = createOverlayCard({
                title: i18n.t('pong_configuration'),
                children: [nameInput, difficulty.element, maxPlayers.element, confirm]
            })

            confirm.onclick = () => {
                setSelectedDifficulty(Difficulty[difficulty.getValue() as keyof typeof Difficulty])
                setSelectedGameMode(GameMode.ONLINE)
                setMaxPlayers(parseInt(maxPlayers.getValue()))
                setIsPrivate(false)
                overlay.close()
                createTournament(nameInput.value, difficulty.getValue() as keyof typeof Difficulty, parseInt(maxPlayers.getValue()))
                    .then(result => {
                        if (result.error) {
                            const overlay = createOverlayCard({
                                title: i18n.t('error'),
                                text: i18n.t(result.message),
                            })
                            document.body.appendChild(overlay.element)
                        } else {
                            setRoomId(result.id)
                            navigateTo(`/pong/lobby/${result.id}`)
                        }
                    })
            }
            document.body.appendChild(overlay.element)
        }

        return btn
    }

    container.append(
        createOnlineButton(i18n.t('pong_online_create_public')),
    )

    return container
}