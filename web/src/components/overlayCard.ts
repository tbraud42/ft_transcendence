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
    rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative animate-fade-in
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
        h2.className = 'text-2xl font-bold text-center mb-4'
        h2.textContent = title
        card.appendChild(h2)
    }

    const body = document.createElement('div')
    body.className = 'max-h-[70vh] overflow-y-auto pr-2'

    if (text) {
        const p = document.createElement('p')
        p.className = 'text-sm leading-relaxed text-left text-gray-700 dark:text-gray-200 whitespace-pre-line'
        p.textContent = text
        body.appendChild(p)
    }

    children.forEach(child => body.appendChild(child))

    card.appendChild(body)
    overlay.appendChild(card)

    return {
        element: overlay,
        close,
        content: card,
    }
}