export enum GameMode {
    AI = 'ai',
    LOCAL = 'local',
    ONLINE = 'online',
}

export enum Difficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
}

export let selectedDifficulty: Difficulty = Difficulty.MEDIUM
export let selectedGameMode: GameMode = GameMode.AI
export let maxPlayers: number = 2
export let isPrivate: boolean = false
export let secondPlayerName: string | null = null

export function setSelectedDifficulty(diff: Difficulty) {
    selectedDifficulty = diff
}

export function setSelectedGameMode(mode: GameMode) {
    selectedGameMode = mode
}

export function setMaxPlayers(count: number) {
    if (count % 2 !== 0) {
        throw new Error('Max players must be an even number');
    }
    maxPlayers = count
}

export function setIsPrivate(privateStatus: boolean) {
    isPrivate = privateStatus
}

export function setSecondPlayerName(name: string | null) {
    secondPlayerName = name
}
