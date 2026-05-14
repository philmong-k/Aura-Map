import { state, dom, WORLD_SIZE } from './store.js';
import { selectElement } from './events.js';

export function updateTransform() {
    dom.transformer.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
    const worldSize = 100000;
    const centerX = Math.round((-state.x + window.innerWidth / 2) / state.scale - worldSize / 2);
    const centerY = Math.round((-state.y + window.innerHeight / 2) / state.scale - worldSize / 2);
    dom.coordDisplay.textContent = `(${centerX}, ${centerY})`;
    updateMiniMap();
}

export function initCenter() {
    const worldSize = 100000;
    state.x = window.innerWidth / 2 - (worldSize / 2) * state.scale;
    state.y = window.innerHeight / 2 - (worldSize / 2) * state.scale;
    updateTransform();
}

export function screenToWorld(clientX, clientY) {
    return {
        x: (clientX - state.x) / state.scale,
        y: (clientY - state.y) / state.scale
    };
}

export function moveCameraByMiniMap(clientX, clientY, isSmooth = false) {
    const rect = dom.miniMapContainer.getBoundingClientRect();
    const mx = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const my = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    const targetWorldX = (mx / rect.width) * WORLD_SIZE;
    const targetWorldY = (my / rect.height) * WORLD_SIZE;

    if (isSmooth) {
        dom.transformer.classList.add('smooth-move');
        setTimeout(() => dom.transformer.classList.remove('smooth-move'), 500);
    } else {
        dom.transformer.classList.remove('smooth-move');
    }

    state.x = window.innerWidth / 2 - targetWorldX * state.scale;
    state.y = window.innerHeight / 2 - targetWorldY * state.scale;

    updateTransform();
}

export function updateMiniMap() {
    const ctx = dom.miniMapCanvas.getContext('2d');
    const rect = dom.miniMapContainer.getBoundingClientRect();
    const miniMapWidth = rect.width;
    const miniMapHeight = rect.height;
    
    if (dom.miniMapCanvas.width !== miniMapWidth || dom.miniMapCanvas.height !== miniMapHeight) {
        dom.miniMapCanvas.width = miniMapWidth;
        dom.miniMapCanvas.height = miniMapHeight;
    }

    ctx.clearRect(0, 0, miniMapWidth, miniMapHeight);
    const mapScale = miniMapWidth / WORLD_SIZE;

    const vpW = (window.innerWidth / state.scale) * mapScale;
    const vpH = (window.innerHeight / state.scale) * mapScale;
    const cameraWorldX = (-state.x + window.innerWidth / 2) / state.scale;
    const cameraWorldY = (-state.y + window.innerHeight / 2) / state.scale;

    const viewX = cameraWorldX * mapScale - vpW / 2;
    const viewY = cameraWorldY * mapScale - vpH / 2;

    dom.miniMapViewport.style.width = `${vpW}px`;
    dom.miniMapViewport.style.height = `${vpH}px`;
    dom.miniMapViewport.style.transform = `translate(${viewX}px, ${viewY}px)`;

    ctx.fillStyle = '#6366f1'; 
    state.nodes.forEach(nodeObj => {
        const { x, y, type } = nodeObj.data;
        const mapX = x * mapScale;
        const mapY = y * mapScale;
        const mapW = Math.max(150 * mapScale, 6);
        const mapH = Math.max((type === 'Diamond' ? 90 : 60) * mapScale, 4);

        if (type === 'Diamond') {
            ctx.beginPath();
            ctx.moveTo(mapX + mapW / 2, mapY);
            ctx.lineTo(mapX + mapW, mapY + mapH / 2);
            ctx.lineTo(mapX + mapW / 2, mapY + mapH);
            ctx.lineTo(mapX, mapY + mapH / 2);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(mapX, mapY, mapW, mapH);
        }
    });
}

export function getPortWorldPos(nodeObj, dir) {
    const { x, y, type } = nodeObj.data;
    const w = 150;
    const h = (type === 'Diamond' ? 90 : 60);
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    switch(dir) {
        case 'top': return { x: centerX, y: y };
        case 'bottom': return { x: centerX, y: y + h };
        case 'left': return { x: x, y: centerY };
        case 'right': return { x: x + w, y: centerY };
    }
}

export function findBestPortPair(fromNode, toNode, excludeConnId) {
    const fNode = fromNode.data;
    const tNode = toNode.data;
    const dirs = ['top', 'bottom', 'left', 'right'];

    const fromNodeUsage = { top: 0, bottom: 0, left: 0, right: 0 };
    const toNodeUsage = { top: 0, bottom: 0, left: 0, right: 0 };

    state.connections.forEach(c => {
        if (c.id === excludeConnId) return;
        if (c.fromId === fNode.id && c.actualFromDir) fromNodeUsage[c.actualFromDir]++;
        if (c.toId === fNode.id && c.actualToDir) fromNodeUsage[c.actualToDir] += 2;
        if (c.toId === tNode.id && c.actualToDir) toNodeUsage[c.actualToDir]++;
    });

    let bestPair = { fromDir: 'right', toDir: 'left' };
    let minScore = Infinity;

    dirs.forEach(d1 => {
        dirs.forEach(d2 => {
            const p1 = getPortWorldPos(fromNode, d1);
            const p2 = getPortWorldPos(toNode, d2);
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            
            let score = dist;
            score += fromNodeUsage[d1] * 200;
            score += toNodeUsage[d2] * 200;

            const isFacing = 
                (d1 === 'right' && d2 === 'left') || (d1 === 'left' && d2 === 'right') ||
                (d1 === 'bottom' && d2 === 'top') || (d1 === 'top' && d2 === 'bottom');
            
            if (isFacing) score -= 50; 

            if (score < minScore) {
                minScore = score;
                bestPair = { fromDir: d1, toDir: d2 };
            }
        });
    });

    return bestPair;
}

export function getPathPoints(fromNode, fromDir, toNode, toDir) {
    const start = getPortWorldPos(fromNode, fromDir);
    const end = getPortWorldPos(toNode, toDir);
    const GUTTER = 30; 
    const OFFSET = 20;

    const vectors = {
        top: { x: 0, y: -1 },
        bottom: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
    };

    const vStart = vectors[fromDir];
    const vEnd = vectors[toDir];

    const pStart = start;
    const pExit = { x: start.x + vStart.x * OFFSET, y: start.y + vStart.y * OFFSET };
    const pEntry = { x: end.x + vEnd.x * OFFSET, y: end.y + vEnd.y * OFFSET };
    const pEnd = end;

    let midPoints = [];
    const fromIsVertical = (fromDir === 'top' || fromDir === 'bottom');
    const toIsVertical = (toDir === 'top' || toDir === 'bottom');

    if (fromIsVertical === toIsVertical) {
        if (fromIsVertical) {
            const midY = (pExit.y + pEntry.y) / 2;
            midPoints = [{ x: pExit.x, y: midY }, { x: pEntry.x, y: midY }];
        } else {
            const midX = (pExit.x + pEntry.x) / 2;
            midPoints = [{ x: midX, y: pExit.y }, { x: midX, y: pEntry.y }];
        }
    } else {
        if (fromIsVertical) {
            midPoints = [{ x: pExit.x, y: pEntry.y }];
        } else {
            midPoints = [{ x: pEntry.x, y: pExit.y }];
        }
    }

    const rawPoints = [pStart, pExit, ...midPoints, pEntry, pEnd];
    
    const result = [rawPoints[0]];
    for (let i = 0; i < rawPoints.length - 1; i++) {
        const p1 = rawPoints[i];
        const p2 = rawPoints[i+1];
        const isEntryExit = (i === 0 || i === rawPoints.length - 2);
        
        let collision = null;
        if (!isEntryExit) {
            state.nodes.forEach(nodeObj => {
                if (nodeObj.data.id === fromNode.data.id || nodeObj.data.id === toNode.data.id) return;
                const rect = {
                    x: nodeObj.data.x - 5,
                    y: nodeObj.data.y - 5,
                    w: 150 + 10,
                    h: (nodeObj.data.type === 'Diamond' ? 90 : 60) + 10
                };
                if (Math.abs(p1.x - p2.x) < 0.1) {
                    const minY = Math.min(p1.y, p2.y);
                    const maxY = Math.max(p1.y, p2.y);
                    if (p1.x > rect.x && p1.x < rect.x + rect.w && maxY > rect.y && minY < rect.y + rect.h) collision = rect;
                } else {
                    const minX = Math.min(p1.x, p2.x);
                    const maxX = Math.max(p1.x, p2.x);
                    if (p1.y > rect.y && p1.y < rect.y + rect.h && maxX > rect.x && minX < rect.x + rect.w) collision = rect;
                }
            });
        }

        if (collision) {
            const bypassX = p1.x < (collision.x + collision.w / 2) ? collision.x - GUTTER : collision.x + collision.w + GUTTER;
            const bypassY = p1.y < (collision.y + collision.h / 2) ? collision.y - GUTTER : collision.y + collision.h + GUTTER;
            const isTooFarX = Math.abs(bypassX - p1.x) > 300;
            const isTooFarY = Math.abs(bypassY - p1.y) > 300;

            if (Math.abs(p1.x - p2.x) < 0.1 && !isTooFarX) {
                result.push({x: bypassX, y: p1.y}, {x: bypassX, y: p2.y});
            } else if (Math.abs(p1.y - p2.y) < 0.1 && !isTooFarY) {
                result.push({x: p1.x, y: bypassY}, {x: p2.x, y: bypassY});
            }
        }
        result.push(p2);
    }
    return result;
}

export function updateGhostLine(clientX, clientY) {
    let ghost = document.getElementById('ghost-line');
    if (!ghost) {
        ghost = document.createElementNS("http://www.w3.org/2000/svg", "path");
        ghost.setAttribute('id', 'ghost-line');
        ghost.setAttribute('class', 'connection-line');
        ghost.style.opacity = '0.5';
        ghost.style.strokeDasharray = '5,5';
        dom.connectionsLayer.appendChild(ghost);
    }
    const start = { x: state.connectionStart.x, y: state.connectionStart.y };
    const end = screenToWorld(clientX, clientY);
    const midX = (start.x + end.x) / 2;
    const d = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
    ghost.setAttribute('d', d);
}

export function renderConnections() {
    const existingLines = dom.connectionsLayer.querySelectorAll('.connection-line, .connection-hit-area, .arrowhead');
    existingLines.forEach(l => l.remove());
    
    const labelContainer = document.getElementById('edge-labels-container');
    if (labelContainer) labelContainer.innerHTML = '';

    const allSegments = [];

    state.connections.forEach(conn => {
        const fromNode = state.nodes.find(n => n.data.id === conn.fromId);
        const toNode = state.nodes.find(n => n.data.id === conn.toId);
        if (!fromNode || !toNode) return;

        const bestPorts = findBestPortPair(fromNode, toNode, conn.id);
        const fromDir = bestPorts.fromDir;
        const toDir = bestPorts.toDir;

        const pathData = getPathPoints(fromNode, fromDir, toNode, toDir);
        conn.points = pathData;
        conn.actualFromDir = fromDir;
        conn.actualToDir = toDir;
        
        for (let i = 0; i < pathData.length - 1; i++) {
            allSegments.push({
                connId: conn.id,
                p1: pathData[i],
                p2: pathData[i+1],
                isVertical: pathData[i].x === pathData[i+1].x
            });
        }
    });

    state.connections.forEach(conn => {
        const fromNode = state.nodes.find(n => n.data.id === conn.fromId);
        const toNode = state.nodes.find(n => n.data.id === conn.toId);
        if (!fromNode || !toNode || !conn.points) return;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('class', 'connection-line');
        
        let d = `M ${conn.points[0].x} ${conn.points[0].y}`;
        
        for (let i = 0; i < conn.points.length - 1; i++) {
            const p1 = conn.points[i];
            const p2 = conn.points[i+1];
            const isVertical = Math.abs(p1.x - p2.x) < 0.1;
            
            if (!isVertical) {
                const intersections = [];
                allSegments.forEach(s => {
                    if (s.connId !== conn.id && s.isVertical) {
                        const minX = Math.min(p1.x, p2.x);
                        const maxX = Math.max(p1.x, p2.x);
                        const minY = Math.min(s.p1.y, s.p2.y);
                        const maxY = Math.max(s.p1.y, s.p2.y);
                        
                        if (s.p1.x > minX && s.p1.x < maxX && p1.y > minY && p1.y < maxY) {
                            intersections.push(s.p1.x);
                        }
                    }
                });
                
                intersections.sort((a, b) => p1.x < p2.x ? a - b : b - a);
                
                intersections.forEach(ix => {
                    const jumpSize = 8;
                    const sweep = p1.x < p2.x ? 1 : 0;
                    d += ` L ${ix - jumpSize * (p1.x < p2.x ? 1 : -1)} ${p1.y}`;
                    d += ` A ${jumpSize} ${jumpSize} 0 0 ${sweep} ${ix + jumpSize * (p1.x < p2.x ? 1 : -1)} ${p1.y}`;
                });
            }
            d += ` L ${p2.x} ${p2.y}`;
        }

        path.setAttribute('d', d);
        path.setAttribute('data-id', conn.id);
        
        const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
        hitArea.setAttribute('class', 'connection-hit-area');
        hitArea.setAttribute('d', d);
        hitArea.setAttribute('data-id', conn.id);

        const themeClass = conn.theme ? `line-${conn.theme}` : 'line-normal';
        path.classList.add(themeClass);

        const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arrow.setAttribute('class', `arrowhead ${themeClass}`);
        
        const last = conn.points[conn.points.length - 1];
        const prev = conn.points[conn.points.length - 2];
        const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
        
        const arrowSize = 10;
        const arrowTipDist = 2; 
        
        const ax = last.x - arrowTipDist * Math.cos(angle);
        const ay = last.y - arrowTipDist * Math.sin(angle);
        
        const p1x = ax - arrowSize * Math.cos(angle - Math.PI / 6);
        const p1y = ay - arrowSize * Math.sin(angle - Math.PI / 6);
        const p2x = ax - arrowSize * Math.cos(angle + Math.PI / 6);
        const p2y = ay - arrowSize * Math.sin(angle + Math.PI / 6);
        
        arrow.setAttribute('d', `M ${ax} ${ay} L ${p1x} ${p1y} L ${p2x} ${p2y} Z`);

        hitArea.addEventListener('click', (e) => {
            e.stopPropagation();
            selectElement(conn.id, 'connection');
        });

        dom.connectionsLayer.appendChild(hitArea); 
        dom.connectionsLayer.appendChild(path);    
        dom.connectionsLayer.appendChild(arrow);   

        if (conn.label) {
            renderEdgeLabel(conn);
        }
    });
}

export function renderEdgeLabel(conn) {
    if (!conn.points || conn.points.length < 2) return;
    let longestIdx = 1;
    let maxDist = -1;
    for (let i = 1; i < conn.points.length; i++) {
        const p1 = conn.points[i - 1];
        const p2 = conn.points[i];
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (dist > maxDist) {
            maxDist = dist;
            longestIdx = i;
        }
    }

    const pA = conn.points[longestIdx - 1];
    const pB = conn.points[longestIdx];
    const center = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };

    const label = document.createElement('div');
    label.className = 'edge-label';
    label.style.left = `${center.x}px`;
    label.style.top = `${center.y}px`;
    label.textContent = conn.label;
    
    let container = document.getElementById('edge-labels-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'edge-labels-container';
        container.className = 'edge-label-container';
        dom.elementsLayer.appendChild(container); 
    }
    container.appendChild(label);
}
