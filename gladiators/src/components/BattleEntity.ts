// src/components/BattleEntity.ts
import Phaser from 'phaser';
import { Stickman } from './Stickman';
import { type Expression } from '../data/playerData';

export interface EntityVisualOptions {
    skinColor: number;
    expression: Expression;
    scale?: number;
}

/**
 * BattleEntity unifies characters and enemies within the combat arena.
 * It manages positions on the combat grid, movement calculations, animations, 
 * and physical impact states while nesting a Stickman for visuals.
 */
export class BattleEntity extends Phaser.GameObjects.Container {
    /** The current tile index on the combat grid */
    public gridX: number;
    /** The visual stickman instance rendered inside this container */
    public visual: Stickman;
    
    private gridSize: number;
    private worldCenterX: number;

    constructor(
        scene: Phaser.Scene, 
        gridX: number, 
        y: number, 
        worldCenterX: number, 
        gridSize: number, 
        options: EntityVisualOptions
    ) {
        // Calculate screen coordinate relative to world center and grid spacing
        const initialX = worldCenterX + (gridX * gridSize);
        super(scene, initialX, y);

        this.gridX = gridX;
        this.gridSize = gridSize;
        this.worldCenterX = worldCenterX;

        // Instantiate your visual Stickman at local (0, 0) relative to this folder
        this.visual = new Stickman(
            scene, 
            0, 
            0, 
            options.skinColor, 
            options.expression, 
            options.scale ?? 1.4
        );
        
        this.add(this.visual);
        scene.add.existing(this);
    }

    /**
     * Smoothly updates and animates this entity to a new grid layout tile.
     * @returns A promise that resolves when the movement finishes.
     */
    public animateToGrid(newGridX: number, duration: number = 400, onUpdateNotify?: () => void): Promise<void> {
        this.gridX = newGridX;
        const targetX = this.worldCenterX + (this.gridX * this.gridSize);

        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: this,
                x: targetX,
                duration: duration,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    if (onUpdateNotify) onUpdateNotify();
                },
                onComplete: () => resolve()
            });
        });
    }

    /**
     * Plays a snappy flash animation indicating this gladiator has sustained a hit.
     * @returns A promise that resolves when the animation finishes.
     */
    public playDamageFlash(): Promise<void> {
        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: this,
                alpha: 0.3,
                yoyo: true,
                duration: 60,
                repeat: 1,
                onComplete: () => {
                    this.alpha = 1.0;
                    resolve();
                }
            });
        });
    }
}