export const GameConfig = {
    // Character Creation Defaults
    CHARACTER: {
        STARTING_POINTS: 9,
        MIN_STAT_VALUE: 1,
        MAX_STAT_VALUE: 10, // Optional cap
        DEFAULT_SKIN_COLOR: 0x3498db,
    },

    // Stat Scaling (The "Math" behind the game)
    SCALING: {
        HP_BASE: 10,
        HP_PER_VITALITY: 5,
        
        MP_BASE: 5,
        MP_PER_ARCANE: 3,
        
        SPEED_BASE: 100,
        SPEED_PER_DEXTERITY: 5,
        
        BLOCK_PER_GUARD: 2,       // Percentage %
        HIT_CHANCE_PER_PRECISION: 2, // Percentage %
        CRIT_CHANCE_MODIFIER: 0.2,    // Percentage %

        ATK_RANGE_BONUS: 2, 
    },

    // UI & Visuals
    UI: {
        COLORS: {
            PRIMARY: 0x141a2a,
            SECONDARY: 0x22304c,
            ACCENT: 0xe2c16b,
            CONFIRM: 0x12a150,
            CANCEL: 0xaa3d3d,
            TEXT_ERROR: '#ff4d4d',
            TEXT_MUTED: '#9aa4b2'
        }
    }
} as const;