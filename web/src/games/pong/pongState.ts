export let selectedDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
export let selectedGameMode: 'ai' | 'ai-vs-ai' | 'pvp' | 'public' | 'private' = 'ai'
export let secondPlayerName: string | null = null

export function setSelectedDifficulty(diff: 'easy' | 'medium' | 'hard') {
    selectedDifficulty = diff
}

export function setSelectedGameMode(mode: 'ai' | 'ai-vs-ai' | 'pvp' | 'public' | 'private') {
    selectedGameMode = mode
}

export function setSecondPlayerName(name: string | null) {
    secondPlayerName = name
}