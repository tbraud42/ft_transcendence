export function createDivider(label: string): HTMLDivElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'flex items-center text-gray-400 text-sm my-4'

    const lineLeft = document.createElement('div')
    lineLeft.className = 'flex-grow border-t border-gray-300 dark:border-gray-600'

    const text = document.createElement('span')
    text.className = 'mx-4 whitespace-nowrap text-gray-500 dark:text-gray-400'
    text.textContent = label

    const lineRight = document.createElement('div')
    lineRight.className = 'flex-grow border-t border-gray-300 dark:border-gray-600'

    wrapper.appendChild(lineLeft)
    wrapper.appendChild(text)
    wrapper.appendChild(lineRight)

    return wrapper
}