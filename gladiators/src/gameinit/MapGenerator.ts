// mapGenerator.ts

export const NodeType = {
    COMBAT: '⚔️',
    ELITE: '👹',
    SHOP: '💰',
    REST: '⛺',
    TREASURE: '💎',
    BOSS: '💀'
} as const;

// This extracts the values into a union type: '⚔️' | '👹' | etc.
export type NodeTypeValue = typeof NodeType[keyof typeof NodeType];

export interface MapNode {
    id: string;
    x: number;
    y: number;
    type: NodeTypeValue; // Updated to use the new type
    nextNodes: string[];
}

export class SpireMapGenerator {
    // We swap these mentally: height is now the length across (X)
    // and width is now the spread vertically (Y).
    private mapLength = 15; // How many columns long the map is (X)
    private mapHeightSpread = 7; // How many nodes high the columns can be (Y)
    private numPaths = 6;

    generate(): MapNode[] {
        const nodes: MapNode[] = [];
        // Grid dimension order: [Column/X][Row/Y]
        const grid: (MapNode | null)[][] = Array.from({ length: this.mapLength }, () => Array(this.mapHeightSpread).fill(null));

        // 1. Create the paths (Left to Right)
        for (let i = 0; i < this.numPaths; i++) {
            // Pick a random vertical starting slot (Y) in the first column (X=0)
            let curY = Math.floor(Math.random() * this.mapHeightSpread);
            
            for (let curX = 0; curX < this.mapLength; curX++) {
                // Ensure a node exists at this spot
                if (!grid[curX][curY]) {
                    const node: MapNode = {
                        id: `node_${curX}_${curY}`,
                        x: curX, // X is now the progress across
                        y: curY, // Y is now the vertical spread
                        type: this.assignType(curX), // Pass curX for type rules
                        nextNodes: []
                    };
                    grid[curX][curY] = node;
                    nodes.push(node);
                }

                // Connect to the next column (if not at the end)
                if (curX < this.mapLength - 1) {
                    const nextY = this.getNextY(curY);
                    const currentNode = grid[curX][curY]!;
                    const nextNodeId = `node_${curX + 1}_${nextY}`;
                    
                    if (!currentNode.nextNodes.includes(nextNodeId)) {
                        currentNode.nextNodes.push(nextNodeId);
                    }
                    curY = nextY; // Move "right" to the next column
                }
            }
        }

        // 2. Add the Final Boss connection on the far right
        const bossNode: MapNode = { id: 'BOSS', x: this.mapLength, y: 3, type: NodeType.BOSS, nextNodes: [] };
        nodes.push(bossNode);
        
        // Connect nodes in the very last column to the boss
        nodes.filter(n => n.x === this.mapLength - 1).forEach(lastColumnNode => {
            lastColumnNode.nextNodes.push(bossNode.id);
        });

        return nodes;
    }

    // Swapped name from getNextX to getNextY (same math)
    private getNextY(curY: number): number {
        const choices = [curY - 1, curY, curY + 1].filter(y => y >= 0 && y < this.mapHeightSpread);
        return choices[Math.floor(Math.random() * choices.length)];
    }

    // Pass X here, as type rules now depend on map progress (X)
    private assignType(x: number): NodeTypeValue {
        if (x === 0) return NodeType.COMBAT;
        if (x === 7) return NodeType.TREASURE;
        if (x === 14) return NodeType.REST;
        
        const rand = Math.random();
        if (rand < 0.15) return NodeType.SHOP;
        if (rand < 0.30) return NodeType.ELITE;
        if (rand < 0.45) return NodeType.REST;
        return NodeType.COMBAT;
    }
}