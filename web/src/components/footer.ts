export function createFooter(): HTMLElement {
    const footer = document.createElement('footer')
    footer.className = 'bg-gray-800 text-white text-center px-4 py-3 mt-auto rounded-t-xl'
    footer.textContent = 'ft_transcendence project'
    return footer
}