// src/gameinit/Audio.ts
import Phaser from 'phaser';

type AudioSpec = {
    key: string;
    path: string; // relative to site base, e.g., 'assets/audio/MichaelBossSong.ogg'
};

const AUDIO_LIST: AudioSpec[] = [
    { key: 'michaelBossSong', path: 'assets/audio/MichaelBossSong.ogg' }
    // Add more music and SFX here as your game grows!
];

/**
 * Helper to tell a scene to load all audio in our spec list
 */
export function preloadGameAudio(scene: Phaser.Scene): void {
    AUDIO_LIST.forEach(audio => {
        const url = import.meta.env.BASE_URL + audio.path;
        scene.load.audio(audio.key, url);
        console.log(`[AudioLoader] Queued "${audio.key}" from: ${url}`);
    });
}

// Export the keys for type-safe usage in your scenes
export const AudioKeys = {
    MichaelBossSong: 'michaelBossSong',
} as const;