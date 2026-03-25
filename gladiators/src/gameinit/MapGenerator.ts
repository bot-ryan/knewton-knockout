// mapGenerator.ts

export const NodeType = {
    COMBAT: '⚔️',
    ELITE: '👹',
    SHOP: '💰',
    REST: '⛺',
    TREASURE: '💎',
    BOSS: '💀'
} as const;

export type NodeTypeValue = typeof NodeType[keyof typeof NodeType];

export interface MapNode {
    id: string;
    x: number;
    y: number;
    type: NodeTypeValue;
    nextNodes: string[];
}

export class SpireMapGenerator {
    private mapLength = 15; 
    private mapHeightSpread = 7; 
    private numPaths = 6;

    generate(): MapNode[] {
        const nodes: MapNode[] = [];
        const grid: (MapNode | null)[][] = Array.from({ length: this.mapLength }, () => Array(this.mapHeightSpread).fill(null));

        // 1. Create the paths (Left to Right)
        for (let i = 0; i < this.numPaths; i++) {
            let curY = Math.floor(Math.random() * this.mapHeightSpread);
            
            for (let curX = 0; curX < this.mapLength; curX++) {
                if (!grid[curX][curY]) {
                    const node: MapNode = {
                        id: `node_${curX}_${curY}`,
                        x: curX,
                        y: curY,
                        // Now passing curY and the grid to check previous neighbors
                        type: this.assignType(curX, curY, grid), 
                        nextNodes: []
                    };
                    grid[curX][curY] = node;
                    nodes.push(node);
                }

                if (curX < this.mapLength - 1) {
                    const nextY = this.getNextY(curY);
                    const currentNode = grid[curX][curY]!;
                    const nextNodeId = `node_${curX + 1}_${nextY}`;
                    
                    if (!currentNode.nextNodes.includes(nextNodeId)) {
                        currentNode.nextNodes.push(nextNodeId);
                    }
                    curY = nextY;
                }
            }
        }

        // 2. Final Boss connection
        const bossNode: MapNode = { id: 'BOSS', x: this.mapLength, y: 3, type: NodeType.BOSS, nextNodes: [] };
        nodes.push(bossNode);
        
        nodes.filter(n => n.x === this.mapLength - 1).forEach(lastColumnNode => {
            lastColumnNode.nextNodes.push(bossNode.id);
        });

        return nodes;
    }

    private getNextY(curY: number): number {
        const choices = [curY - 1, curY, curY + 1].filter(y => y >= 0 && y < this.mapHeightSpread);
        return choices[Math.floor(Math.random() * choices.length)];
    }

    private assignType(x: number, y: number, grid: (MapNode | null)[][]): NodeTypeValue {
        // Mandatory Floors
        if (x === 0) return NodeType.COMBAT;
        if (x === 7) return NodeType.TREASURE;
        if (x === 14) return NodeType.REST;

        // Collect types of nodes in the previous column that could connect to this one
        const previousTypes: NodeTypeValue[] = [];
        if (x > 0) {
            for (let offset = -1; offset <= 1; offset++) {
                const prevY = y + offset;
                if (prevY >= 0 && prevY < this.mapHeightSpread) {
                    const prevNode = grid[x - 1][prevY];
                    if (prevNode) previousTypes.push(prevNode.type);
                }
            }
        }

        const rand = Math.random();

        // Enforce Spire Rules: No back-to-back specials
        if (previousTypes.includes(NodeType.ELITE)) {
            return rand < 0.2 ? NodeType.SHOP : NodeType.COMBAT;
        }

        if (previousTypes.includes(NodeType.REST)) {
            return rand < 0.3 ? NodeType.ELITE : NodeType.COMBAT;
        }

        if (previousTypes.includes(NodeType.SHOP)) {
            return rand < 0.2 ? NodeType.ELITE : NodeType.COMBAT;
        }

        // Standard distribution
        if (rand < 0.12) return NodeType.SHOP;
        if (rand < 0.25) return NodeType.ELITE;
        if (rand < 0.40) return NodeType.REST;
        return NodeType.COMBAT;
    }
}