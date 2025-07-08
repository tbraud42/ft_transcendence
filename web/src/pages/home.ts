import i18next from '../i18n'
import { createButton } from '../components/button'
import pongPreview from '../img/pong-preview.webp'
import comingSoon from '../img/coming-soon.webp'

export function renderHome(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'flex flex-col items-center justify-center text-center gap-12 py-12 px-4'

    const title = document.createElement('h2')
    title.className = 'text-3xl font-bold text-gray-800 dark:text-white'
    title.textContent = i18next.t('home_choose_game')

    const gamesGrid = document.createElement('div')
    gamesGrid.className =
        'grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl justify-center place-items-center'

    gamesGrid.appendChild(
        createGameCard({
            title: i18next.t('home_game_pong_title'),
            image: pongPreview,
            description: i18next.t('home_game_pong_desc'),
            buttons: [
                {
                    label: i18next.t('home_game_play'),
                    onClick: () => (window.location.hash = '#/pong'),
                },
            ],
        })
    )

    gamesGrid.appendChild(
        createGameCard({
            title: i18next.t('home_game_2_title'),
            image: comingSoon,
            description: i18next.t('home_game_2_desc'),
            buttons: [
                {
                    label: i18next.t('home_game_2_locked'),
                    onClick: () => alert(i18next.t('home_game_2_locked_msg')),
                    color: 'red',
                },
            ],
        })
    )

    container.appendChild(title)
    container.appendChild(gamesGrid)

    return container
}

function createGameCard(options: {
    title: string
    image: string
    description: string
    buttons: { label: string, onClick: () => void, color?: 'blue' | 'black' | 'red' }[]
}): HTMLElement {
    const card = document.createElement('div')
    card.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden flex flex-col w-full max-w-[320px]'
    const img = document.createElement('img')
    img.src = options.image
    img.alt = options.title
    img.className = 'w-full h-48 object-cover'

    const content = document.createElement('div')
    content.className = 'p-6 flex flex-col gap-4'

    const title = document.createElement('h3')
    title.textContent = options.title
    title.className = 'text-xl font-bold text-gray-800 dark:text-white'

    const desc = document.createElement('p')
    desc.textContent = options.description
    desc.className = 'text-gray-600 dark:text-gray-400 text-sm'

    const buttonGroup = document.createElement('div')
    buttonGroup.className = 'flex flex-col md:flex-row gap-4 justify-center'

    for (const btn of options.buttons) {
        const button = createButton(btn.label, 'button', btn.color || 'blue')
        button.classList.add('md:w-40')
        button.onclick = btn.onClick
        buttonGroup.appendChild(button)
    }

    content.appendChild(title)
    content.appendChild(desc)
    content.appendChild(buttonGroup)

    card.appendChild(img)
    card.appendChild(content)

    return card
}