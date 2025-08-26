export function createSidebarButton(
    label: string,
    targetHash: string,
    color: 'default' | 'red' = 'default'
): HTMLButtonElement {
    const isActive = window.location.hash === targetHash

    const baseClass =
        'px-4 py-2 rounded text-left transition w-full ' +
        (isActive ? 'font-bold ' : '')

    const colorClass =
        color === 'red'
            ? isActive
                ? 'bg-red-700 text-white hover:bg-red-800'
                : 'text-red-400 hover:bg-red-900'
            : isActive
                ? 'bg-gray-700 text-white hover:bg-gray-800'
                : 'text-white hover:bg-gray-700'

    const btn = document.createElement('button')
    btn.className = baseClass + colorClass
    btn.textContent = label
    btn.onclick = () => {
        window.location.hash = targetHash
    }

    return btn
}