import { createButton } from './button'

export interface GameButton {
    label: string
    onClick: () => void
    color?: 'blue' | 'black' | 'red'
}

export interface GameCardOptions {
    title: string
    image: string
    description: string
    buttons: GameButton[]
}

export function createGameCard({ title, image, description, buttons }: GameCardOptions): HTMLElement {
    const card = document.createElement('div')
    card.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden flex flex-col w-full max-w-[320px]'

    const img = document.createElement('img')
    img.src = image
    img.alt = title
    img.className = 'w-full h-48 object-cover'

    const content = document.createElement('div')
    content.className = 'p-6 flex flex-col gap-4'

    const titleEl = document.createElement('h3')
    titleEl.textContent = title
    titleEl.className = 'text-xl font-bold text-gray-800 dark:text-white'

    const desc = document.createElement('p')
    desc.textContent = description
    desc.className = 'text-gray-600 dark:text-gray-400 text-sm'

    const buttonGroup = document.createElement('div')
    buttonGroup.className = 'flex flex-col md:flex-row gap-4 justify-center'

    buttons.forEach(({ label, onClick, color = 'blue' }) => {
        const btn = createButton(label, 'button', color)
        btn.classList.add('md:w-40')
        btn.onclick = onClick
        buttonGroup.appendChild(btn)
    })

    content.append(titleEl, desc, buttonGroup)
    card.append(img, content)

    return card
}