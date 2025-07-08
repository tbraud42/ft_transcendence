export let selectedDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
export let selectedGameMode: 'ai' | 'pvp' = 'ai'

export function setSelectedDifficulty(diff: 'easy' | 'medium' | 'hard') {
    selectedDifficulty = diff
}

export function setSelectedGameMode(mode: 'ai' | 'pvp') {
    selectedGameMode = mode
}