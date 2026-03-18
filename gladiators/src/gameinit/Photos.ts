// src/gameinit/Photos.ts
import Phaser from 'phaser';

type PhotoSpec = {
  key: string;
  path: string; // relative to site base, e.g. 'assets/color-wheel.png'
};

const PHOTO_LIST: PhotoSpec[] = [
  { key: 'colorWheel', path: 'assets/color-wheel.png' },
  // Add more photos here as your game grows
];

/**
 * Helper to tell a scene to load all images in our spec list
 */
export function preloadGamePhotos(scene: Phaser.Scene): void {
  PHOTO_LIST.forEach(photo => {
    const url = import.meta.env.BASE_URL + photo.path;
    scene.load.image(photo.key, url);
    console.log(`[PhotoLoader] Queued "${photo.key}" from: ${url}`);
  });
}

export const Photos = {
  ColorWheel: 'colorWheel',
};