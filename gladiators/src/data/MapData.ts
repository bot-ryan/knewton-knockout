// src/data/MapData.ts
import { createStore } from 'zustand/vanilla'

export type NodeType = 'COMBAT' | 'ELITE' | 'BOSS' | 'REST';

export interface MapNode {
    id: string;
    x: number;
    y: number;
    type: any; // or 'NodeTypeValue' if you have it exported
    nextNodes: string[]; // <-- Matches your generator!
    vX: number;          // <-- Added for UI positioning
    vY: number;          // <-- Added for UI positioning
}

interface MapStoreState {
    nodes: MapNode[];
    currentNodeId: string | null;
    setMapData: (nodes: MapNode[]) => void;
    setCurrentNode: (nodeId: string | null) => void;
    clearMap: () => void;
}


export const useMapStore = createStore<MapStoreState>((set) => ({
    nodes: [],
    currentNodeId: null,
    setMapData: (nodes) => set({ nodes }),
    setCurrentNode: (currentNodeId) => set({ currentNodeId }),
    clearMap: () => set({ nodes: [], currentNodeId: null }),
}));