/**
 * SceneKeys.ts
 * Centralized registry of all scene identifiers.
 * Use these instead of raw strings to ensure type safety.
 */
export const SceneKeys = {
    MainMenu: 'MainMenu',
    CharacterCreate: 'CharacterCreate',
    OpenMap: 'OpenMap',
    Arena: 'Arena',
    GameOver: 'GameOver',
    Credits: 'Credits'
} as const;

// This line allows you to use SceneKeys as a Type if needed
export type SceneKeys = typeof SceneKeys[keyof typeof SceneKeys];