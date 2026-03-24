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
    private width = 7;
    private height = 15;
    private numPaths = 6;

    generate(): MapNode[] {
        const nodes: MapNode[] = [];
        const grid: (MapNode | null)[][] = Array.from({ length: this.height }, () => Array(this.width).fill(null));

        // 1. Create the paths
        for (let i = 0; i < this.numPaths; i++) {
            let curX = Math.floor(Math.random() * this.width);
            
            for (let curY = 0; curY < this.height; curY++) {
                // Ensure a node exists at this spot
                if (!grid[curY][curX]) {
                    const node: MapNode = {
                        id: `node_${curY}_${curX}`,
                        x: curX,
                        y: curY,
                        type: this.assignType(curY),
                        nextNodes: []
                    };
                    grid[curY][curX] = node;
                    nodes.push(node);
                }

                // Connect to the next floor (if not at the boss)
                if (curY < this.height - 1) {
                    const nextX = this.getNextX(curX);
                    const currentNode = grid[curY][curX]!;
                    const nextNodeId = `node_${curY + 1}_${nextX}`;
                    
                    if (!currentNode.nextNodes.includes(nextNodeId)) {
                        currentNode.nextNodes.push(nextNodeId);
                    }
                    curX = nextX; // Move "up" to the next row
                }
            }
        }

        // 2. Add the Final Boss connection
        const bossNode: MapNode = { id: 'BOSS', x: 3, y: this.height, type: NodeType.BOSS, nextNodes: [] };
        nodes.push(bossNode);
        
        nodes.filter(n => n.y === this.height - 1).forEach(topNode => {
            topNode.nextNodes.push(bossNode.id);
        });

        return nodes;
    }

    private getNextX(curX: number): number {
        const choices = [curX - 1, curX, curX + 1].filter(x => x >= 0 && x < this.width);
        return choices[Math.floor(Math.random() * choices.length)];
    }

    private assignType(y: number): NodeTypeValue {
        if (y === 0) return NodeType.COMBAT;
        if (y === 7) return NodeType.TREASURE;
        if (y === 14) return NodeType.REST;
        
        const rand = Math.random();
        if (rand < 0.15) return NodeType.SHOP;
        if (rand < 0.30) return NodeType.ELITE;
        if (rand < 0.45) return NodeType.REST;
        return NodeType.COMBAT;
    }
}