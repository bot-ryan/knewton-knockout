import Phaser from 'phaser';
import { type Expression } from '../types/models';

export class Stickman extends Phaser.GameObjects.Container {
    private bodyGraphics: Phaser.GameObjects.Graphics;
    private skinColor: number;
    private expression: Expression;
    private scaleFactor: number;

    constructor(scene: Phaser.Scene, x: number, y: number, skinColor: number, expression: Expression, scale: number = 1.4) {
        super(scene, x, y);
        
        this.skinColor = skinColor;
        this.expression = expression;
        this.scaleFactor = scale;

        // Create the graphics object that will hold the drawing
        this.bodyGraphics = scene.add.graphics();
        this.add(this.bodyGraphics);

        // Initial draw
        this.draw();
        
        // Add to scene
        scene.add.existing(this);
    }

    /**
     * Updates the appearance and redraws the graphics
     */
    public updateAppearance(skinColor: number, expression: Expression) {
        this.skinColor = skinColor;
        this.expression = expression;
        this.draw();
    }

    private draw() {
        const g = this.bodyGraphics;
        const s = this.scaleFactor;
        
        g.clear();
        
        // --- BODY ---
        g.fillStyle(this.skinColor, 1);
        g.fillCircle(0, -90 * s, 35 * s); // Head
        
        // Torso
        g.beginPath()
         .moveTo(-15 * s, -60 * s)
         .lineTo(-25 * s, -10 * s)
         .lineTo(25 * s, -10 * s)
         .lineTo(15 * s, -60 * s)
         .closePath()
         .fillPath();
        
        // Limbs Helper
        const drawLimb = (dir: number, isArm: boolean) => {
            g.beginPath();
            if (isArm) {
                g.moveTo(dir * 20 * s, -55 * s)
                 .lineTo(dir * 45 * s, -30 * s)
                 .lineTo(dir * 35 * s, -20 * s)
                 .lineTo(dir * 15 * s, -45 * s);
            } else {
                g.moveTo(dir * 5 * s, -10 * s)
                 .lineTo(dir * 30 * s, 60 * s)
                 .lineTo(dir * 15 * s, 60 * s)
                 .lineTo(0, -5 * s);
            }
            g.closePath().fillPath();
        };

        drawLimb(-1, true);  // Left Arm
        drawLimb(1, true);   // Right Arm
        drawLimb(-1, false); // Left Leg
        drawLimb(1, false);  // Right Leg

        // --- FACE ---
        const colorObj = Phaser.Display.Color.IntegerToColor(this.skinColor);
        const faceCol = (colorObj.v > 0.5) ? 0x000000 : 0xffffff; 
        g.fillStyle(faceCol, 0.8);
        
        const eyeY = -95 * s;
        const mouthY = -82 * s;

        // I've kept your exact switch logic here for the expressions
        switch(this.expression) {
            case 'happy':
                g.lineStyle(3 * s, faceCol, 0.8);
                g.beginPath().arc(-14*s, eyeY+2*s, 5*s, Math.PI, 0).strokePath();
                g.beginPath().arc(14*s, eyeY+2*s, 5*s, Math.PI, 0).strokePath();
                g.beginPath().arc(0, mouthY-5*s, 10*s, 0.2, Math.PI-0.2).closePath().fillPath();
                break;
            case 'sad':
                g.fillCircle(-12 * s, eyeY, 3.5 * s); g.fillCircle(12 * s, eyeY, 3.5 * s);
                g.lineStyle(3 * s, faceCol, 0.8);
                g.beginPath().arc(0, mouthY+10*s, 10*s, Math.PI + 0.5, -0.5).strokePath();
                break;
            case 'angry':
                g.lineStyle(4 * s, faceCol, 0.9);
                g.beginPath().moveTo(-20*s, eyeY-5*s).lineTo(-8*s, eyeY+2*s).strokePath();
                g.beginPath().moveTo(20*s, eyeY-5*s).lineTo(8*s, eyeY+2*s).strokePath();
                g.fillCircle(-12 * s, eyeY+3*s, 3.5 * s); g.fillCircle(12 * s, eyeY+3*s, 3.5 * s);
                g.fillRect(-10*s, mouthY, 20*s, 4*s);
                break;
            case 'wink':
                g.fillCircle(-12 * s, eyeY, 3.5 * s);
                g.fillRect(8 * s, eyeY - 1.5 * s, 8 * s, 3 * s); 
                g.lineStyle(3 * s, faceCol, 0.8);
                g.beginPath().arc(0, mouthY - 5 * s, 10 * s, 0.2, Math.PI - 0.2).strokePath();
                break;
            case 'determined':
                g.fillCircle(-12 * s, eyeY-2*s, 6 * s); g.fillCircle(12 * s, eyeY-2*s, 6 * s);
                g.fillStyle(0xffffff, 0.9);
                g.fillCircle(-14 * s, eyeY-4*s, 2 * s); g.fillCircle(10 * s, eyeY-4*s, 2 * s);
                g.fillStyle(faceCol, 0.8);
                g.lineStyle(2 * s, faceCol, 0.8);
                g.beginPath().arc(0, mouthY+8*s, 8*s, Math.PI + 0.5, -0.5).strokePath(); 
                break;
            case 'battle_cry':
                g.lineStyle(2 * s, faceCol, 0.8);
                g.beginPath().arc(-12*s, eyeY-8*s, 5*s, Math.PI, 0).strokePath(); 
                g.fillRect(8*s, eyeY-6*s, 8*s, 2*s); 
                g.fillCircle(-12 * s, eyeY, 3.5 * s); g.fillCircle(12 * s, eyeY, 3.5 * s);
                g.fillRect(-6*s, mouthY, 12*s, 2*s);
                break;
            case 'smirk':
                g.lineStyle(3 * s, faceCol, 0.8);
                g.beginPath().moveTo(-16*s, eyeY-4*s).lineTo(-8*s, eyeY+4*s).strokePath(); 
                g.beginPath().moveTo(-8*s, eyeY-4*s).lineTo(-16*s, eyeY+4*s).strokePath(); 
                g.beginPath().moveTo(16*s, eyeY-4*s).lineTo(8*s, eyeY+4*s).strokePath();   
                g.beginPath().moveTo(8*s, eyeY-4*s).lineTo(16*s, eyeY+4*s).strokePath();   
                g.beginPath().arc(0, mouthY, 4*s, 0, Math.PI*2).strokePath();
                break;
            case 'fearful':
                g.fillCircle(-12 * s, eyeY, 4 * s); g.fillCircle(12 * s, eyeY, 4 * s);
                g.lineStyle(3 * s, faceCol, 0.8);
                g.beginPath().arc(0, mouthY+4*s, 8*s, 0, Math.PI*2).strokePath();
                break;
            case 'nervous':
                g.lineStyle(3 * s, faceCol, 0.9);
                g.beginPath().moveTo(-18*s, eyeY-4*s).lineTo(-8*s, eyeY).strokePath();
                g.beginPath().moveTo(-18*s, eyeY+4*s).lineTo(-8*s, eyeY).strokePath();
                g.beginPath().moveTo(18*s, eyeY-4*s).lineTo(8*s, eyeY).strokePath();
                g.beginPath().moveTo(18*s, eyeY+4*s).lineTo(8*s, eyeY).strokePath();
                g.beginPath().moveTo(-10*s, mouthY+4*s).lineTo(-5*s, mouthY).lineTo(0*s, mouthY+4*s).lineTo(5*s, mouthY).lineTo(10*s, mouthY+4*s).strokePath();
                break;
            default: // Poker
                g.fillCircle(-12 * s, eyeY, 3.5 * s); g.fillCircle(12 * s, eyeY, 3.5 * s);
                g.fillRect(-8 * s, mouthY, 16 * s, 3 * s);
        }
    }
}