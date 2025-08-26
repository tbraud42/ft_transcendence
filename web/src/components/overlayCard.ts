export function createOverlayCard(options: {
    title?: string
    text?: string
    children?: HTMLElement[]
    onClose?: () => void
}): {
    element: HTMLElement
    close: () => void
    content: HTMLElement
} {
    const { title, text, children = [], onClose } = options

    const overlay = document.createElement('div')
    overlay.className = 'fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4'

    const card = document.createElement('div')
    card.className = `
        bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
        rounded-2xl shadow-2xl p-6 max-w-md w-full 
        space-y-4 relative animate-fade-in transition
    `.trim()

    const close = () => {
        overlay.remove()
        onClose?.()
    }

    const closeBtn = document.createElement('button')
    closeBtn.className = 'absolute top-3 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold'
    closeBtn.textContent = '×'
    closeBtn.onclick = close
    card.appendChild(closeBtn)

    if (title) {
        const h2 = document.createElement('h2')
        h2.className = 'text-xl font-bold text-center'
        h2.textContent = title
        card.appendChild(h2)
    }

    if (text) {
        const p = document.createElement('p')
        p.className = 'text-sm text-center text-gray-600 dark:text-gray-300'
        p.textContent = text
        card.appendChild(p)
    }

    children.forEach(child => card.appendChild(child))

    overlay.appendChild(card)

    return {
        element: overlay,
        close,
        content: card,
    }
}