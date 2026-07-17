

/**
 * SceneKeys.ts
 * Centralized registry of all scene identifiers. 
 * Use these instead of raw strings to ensure type safety. 
 */ 
export const SceneKeys = { 
    Init: 'Init',
    MainMenu: 'MainMenu', 
    HowToPlay: 'HowToPlay',
    CharacterCreate: 'CharacterCreate', 
    CombatScene: 'CombatScene',
    OpenMap: 'OpenMap',
    GameOver: 'GameOver', 
    Credits: 'Credits' 
} as const; 

export type SceneKeys = typeof SceneKeys[keyof typeof SceneKeys]; 