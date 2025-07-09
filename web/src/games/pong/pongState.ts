export let selectedDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
export let selectedGameMode: 'ai' | 'pvp' | 'public' | 'private' = 'ai'

export function setSelectedDifficulty(diff: 'easy' | 'medium' | 'hard') {
    selectedDifficulty = diff
}

export function setSelectedGameMode(mode: 'ai' | 'pvp' | 'public' | 'private') {
    selectedGameMode = mode
}