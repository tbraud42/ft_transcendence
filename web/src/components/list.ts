export function createList(): {
    element: HTMLDivElement,
    setElements: (elements: HTMLElement[]) => void
    } {
    const container = document.createElement('div')
    container.className = `
        flex flex-col gap-3 overflow-y-auto
        max-h-96 w-full p-2 bg-gray-900/40 
        rounded-xl border border-white/10
    `

    const setElements = (elements: HTMLElement[]) => {
        container.innerHTML = ''
        elements.forEach(el => container.appendChild(el))
    }

    return {
        element: container,
        setElements
    }
}