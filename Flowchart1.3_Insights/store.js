import { renderConnections } from './canvasRenderer.js';
import { createNode, closeDrawer } from './events.js';

export const state = {
    x: 0,
    y: 0,
    scale: 1,
    isPanning: false,
    startX: 0,
    startY: 0,
    gridSize: 20,
    nodes: [],
    selectedNode: null,
    isDraggingNode: false,
    dragStartX: 0,
    dragStartY: 0,
    longPressTimer: null,
    menuCoords: { x: 0, y: 0 },
    isMiniMapDragging: false,
    connections: [],
    isConnecting: false,
    connectionStart: null,
    selectedId: null,
    selectedType: null,
    undoStack: [],
    redoStack: [],
    maxHistory: 50,
    isHistorizing: false,
    mouseDownPos: { x: 0, y: 0 },
    drawer: document.getElementById('side-drawer'),
    drawerTitle: document.getElementById('drawer-title'),
    drawerContent: document.getElementById('drawer-content'),
    undoBtn: document.getElementById('undo-btn'),
    redoBtn: document.getElementById('redo-btn'),
    captureBtn: document.getElementById('capture-png'),
    exportBtn: document.getElementById('export-json'),
    importTrigger: document.getElementById('import-json-trigger'),
    importInput: document.getElementById('import-json-input'),
    clearAllBtn: document.getElementById('clear-all'),
    aiBtn: document.getElementById('copy-ai'),
    aiMenu: document.getElementById('ai-dropdown-menu'),
    captureMenu: document.getElementById('capture-dropdown-menu')
};

export const WORLD_SIZE = 100000;
export const WORLD_CENTER = WORLD_SIZE / 2;

export const dom = {
    container: document.getElementById('canvas-container'),
    transformer: document.getElementById('transformer'),
    elementsLayer: document.getElementById('elements-layer'),
    creationMenu: document.getElementById('creation-menu'),
    miniMapContainer: document.getElementById('mini-map-container'),
    miniMapCanvas: document.getElementById('mini-map-canvas'),
    miniMapViewport: document.getElementById('mini-map-viewport'),
    connectionsLayer: document.getElementById('connections-layer'),
    coordDisplay: document.querySelector('.controls-guide span:last-child'),
    closeDrawerBtn: document.getElementById('close-drawer')
};

export const snapToGrid = (value) => {
    return Math.round(value / state.gridSize) * state.gridSize;
};

export function saveHistory() {
    if (state.isHistorizing) return;
    const snapshot = {
        nodes: state.nodes.map(n => ({ ...n.data })),
        connections: state.connections.map(c => ({ ...c }))
    };
    const last = state.undoStack[state.undoStack.length - 1];
    if (last && JSON.stringify(last) === JSON.stringify(snapshot)) return;
    state.undoStack.push(snapshot);
    if (state.undoStack.length > state.maxHistory) state.undoStack.shift();
    state.redoStack = [];
    updateHistoryButtons();
    saveToLocalStorage();
}

export function undo() {
    if (state.undoStack.length <= 1) return;
    state.isHistorizing = true;
    const current = state.undoStack.pop();
    state.redoStack.push(current);
    const previous = state.undoStack[state.undoStack.length - 1];
    loadSnapshot(previous);
    updateHistoryButtons();
    state.isHistorizing = false;
}

export function redo() {
    if (state.redoStack.length === 0) return;
    state.isHistorizing = true;
    const next = state.redoStack.pop();
    state.undoStack.push(next);
    loadSnapshot(next);
    updateHistoryButtons();
    state.isHistorizing = false;
}

export function loadSnapshot(snapshot) {
    if (!snapshot) return;
    state.nodes.forEach(n => n.el.remove());
    state.nodes = [];
    state.connections = (snapshot.connections || []).map(c => ({ ...c }));
    snapshot.nodes.forEach(nodeData => {
        createNode(nodeData.type, nodeData.x, nodeData.y, nodeData.id, nodeData);
    });
    renderConnections();
    saveToLocalStorage();
}

export function deleteSelected() {
    if (!state.selectedId) return;
    if (state.selectedType === 'node') {
        const index = state.nodes.findIndex(n => n.data.id === state.selectedId);
        if (index !== -1) {
            state.nodes[index].el.remove();
            state.connections = state.connections.filter(c => 
                c.fromId !== state.selectedId && c.toId !== state.selectedId
            );
            state.nodes.splice(index, 1);
        }
    } else if (state.selectedType === 'connection') {
        state.connections = state.connections.filter(c => c.id !== state.selectedId);
    }
    closeDrawer();
    renderConnections();
    saveHistory();
}

export function clearAll() {
    if (state.nodes.length === 0 && state.connections.length === 0) return;
    if (confirm('정말로 모든 내용을 삭제하시겠습니까? (이 작업은 되돌릴 수 있습니다)')) {
        state.nodes.forEach(n => n.el.remove());
        state.nodes = [];
        state.connections = [];
        closeDrawer();
        renderConnections();
        saveHistory();
        alert('모든 내용이 초기화되었습니다.');
    }
}

export function updateHistoryButtons() {
    state.undoBtn.disabled = state.undoStack.length <= 1;
    state.redoBtn.disabled = state.redoStack.length === 0;
    state.undoBtn.style.opacity = state.undoBtn.disabled ? '0.3' : '1';
    state.redoBtn.style.opacity = state.redoBtn.disabled ? '0.3' : '1';
}

export function saveToLocalStorage() {
    const data = {
        nodes: state.nodes.map(n => n.data),
        connections: state.connections
    };
    localStorage.setItem('flowchart_data', JSON.stringify(data));
}

export function loadFromLocalStorage() {
    const saved = localStorage.getItem('flowchart_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            loadSnapshot(data);
            state.undoStack = [JSON.parse(JSON.stringify(data))]; 
            state.redoStack = [];
            updateHistoryButtons();
        } catch (e) {
            console.error('Failed to load storage:', e);
        }
    } else {
        saveHistory();
    }
}

export function exportToJSON() {
    const data = {
        version: '1.3',
        nodes: state.nodes.map(n => n.data),
        connections: state.connections,
        timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowchart_backup_${new Date().getTime()}.json`;
    a.click();
}
