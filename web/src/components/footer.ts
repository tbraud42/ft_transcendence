export function createFooter(): HTMLElement {
    const footer = document.createElement('footer')
    footer.className = 'bg-gray-800 text-white text-center p-4 mt-8'
    footer.textContent = '© 2025 ft_transcendence project'
    return footer
}