export function createInput(
    type: string,
    placeholder: string,
    required = true
): HTMLInputElement {
    const input = document.createElement('input')
    input.type = type
    input.placeholder = placeholder
    input.required = required
    input.className =
        'w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 ' +
        'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ' +
        'focus:outline-none focus:ring-2 focus:ring-blue-400'
    return input
}