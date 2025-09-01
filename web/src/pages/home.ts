import i18n from '../utils/lang/i18n'
import { createGameCard } from '../components/gameCard'
// @ts-ignore
import pongPreview from '../img/pong-preview.webp'
import {refreshToken} from "../api/auth";

export function renderHome(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'flex flex-col items-center justify-center text-center gap-12 py-12 px-4'

    const title = document.createElement('h2')
    title.className = 'text-3xl font-bold text-gray-800 dark:text-white'
    title.textContent = i18n.t('home_choose_game')

    const gamesGrid = document.createElement('div')
    gamesGrid.className =
        'grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl justify-center place-items-center'

    // Avoid page load if token is expired
    refreshToken().then(() => {});

    gamesGrid.appendChild(
        createGameCard({
            title: i18n.t('home_game_pong_title'),
            image: pongPreview,
            description: i18n.t('home_game_pong_desc'),
            buttons: [
                {
                    label: i18n.t('home_game_play'),
                    onClick: () => (window.location.hash = '#/pong'),
                },
            ],
        })
    )

    container.appendChild(title)
    container.appendChild(gamesGrid)

    return container
}