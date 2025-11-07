export function createButton(
    text: string,
    type: 'submit' | 'button' = 'button',
    color: 'blue' | 'red' | 'black' | 'gray' = 'blue'
): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = type

    const base =
        'w-full py-3 rounded-xl text-lg font-semibold shadow-md transition '

    if (color === 'blue') {
        button.className =
            base +
            'bg-blue-600 hover:bg-blue-700 dark:bg-blue-400 dark:hover:bg-blue-500 text-white dark:text-black'
    } else if (color === 'red') {
        button.className =
            base +
            'bg-red-500 hover:bg-red-600 dark:bg-red-400 dark:hover:bg-red-500 text-white dark:text-black'
    } else if (color === 'black') {
        button.className =
            base +
            'bg-black hover:bg-gray-900 text-white'
    } else if (color === 'gray') {
        button.className =
            base +
            'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-black dark:text-white'
    }

    button.textContent = text
    return button
}