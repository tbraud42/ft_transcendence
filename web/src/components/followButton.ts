import addFriendsIcon from '../img/friend_add-icon.svg'
import removedFriendsIcon from '../img/friend_remove-icon.svg'
import i18n from "../utils/lang/i18n";

export function createFollowButton(
    isFollowing: boolean,
    onToggle: (next: boolean) => Promise<void>
): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.type = 'button'

    const icon = document.createElement('img')
    icon.className = 'w-5 h-5'
    btn.appendChild(icon)

    const syncUI = (f: boolean) => {
        icon.src = f ? removedFriendsIcon : addFriendsIcon
        icon.alt = f ? 'Unfollow' : 'Follow'
        btn.title = f ? (i18n.t('unfollow') || 'Unfollow') : (i18n.t('follow') || 'Follow')

        btn.className =
            'absolute -bottom-1 -right-1 rounded-full border border-white/20 shadow p-2 transition ' +
            (f
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white')
    }

    syncUI(isFollowing)

    btn.onclick = async () => {
        const next = !isFollowing
        syncUI(next)
        btn.disabled = true
        try {
            await onToggle(next)
            isFollowing = next
        } catch (e) {
            console.error(e)
            syncUI(isFollowing)
        } finally {
            btn.disabled = false
        }
    }

    return btn
}