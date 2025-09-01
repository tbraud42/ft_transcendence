export function setToast(el: HTMLParagraphElement, kind: 'success' | 'error' | 'info', text: string) {
    const base = 'min-h-[1.25rem] text-sm'
    const color = kind === 'success' ? 'text-green-600' : kind === 'error' ? 'text-red-500' : 'text-gray-600'
    el.className = `${base} ${color}`
    el.textContent = text
}