export function createAuthContainer(): HTMLDivElement {
    const container = document.createElement('div')
    container.className = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ' +
        'w-full max-w-md px-8 py-10 bg-white/70 dark:bg-gray-800/80 ' +
        'backdrop-blur-md shadow-xl rounded-3xl space-y-6 text-center transition'
    return container
}