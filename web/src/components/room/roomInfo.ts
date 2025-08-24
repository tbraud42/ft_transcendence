import i18next from '../../utils/lang/i18n'
import { RoomState } from '../../games/pong/engine/Room'

export function renderRoomInfo(state: RoomState): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'text-sm text-gray-300 space-y-1 text-center'

    wrapper.innerHTML = `
        <div class="text-lg font-semibold text-white">${i18next.t('room_title')} #${state.id}</div>
        <div><strong>${i18next.t('room_players')}:</strong> ${state.players.length} / ${state.maxPlayers}</div>
        <div><strong>${i18next.t('room_mode')}:</strong> ${state.gameMode.toUpperCase()}</div>
        <div><strong>${i18next.t('room_difficulty')}:</strong> ${state.difficulty}</div>
    `

    return wrapper
}