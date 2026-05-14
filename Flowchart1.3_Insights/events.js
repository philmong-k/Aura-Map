import { state, dom, snapToGrid, saveHistory, undo, redo, deleteSelected, clearAll, exportToJSON, loadSnapshot, updateHistoryButtons } from './store.js';
import { updateTransform, updateMiniMap, moveCameraByMiniMap, renderConnections, screenToWorld, updateGhostLine, getPortWorldPos } from './canvasRenderer.js';

function isUIClick(e) {
    return e.target.closest('#ui-overlay');
}

export function showMenu(clientX, clientY) {
    state.menuCoords = screenToWorld(clientX, clientY);
    dom.creationMenu.style.display = 'flex';
    dom.creationMenu.style.left = `${clientX}px`;
    dom.creationMenu.style.top = `${clientY}px`;
}

export function hideMenu() {
    dom.creationMenu.style.display = 'none';
}

export function createNode(type, worldX, worldY, id = null, data = null) {
    const finalId = id || Date.now();
    const node = data || {
        id: finalId,
        type,
        x: snapToGrid(worldX),
        y: snapToGrid(worldY),
        text: type
    };

    const w = 150;
    const h = (type === 'Diamond' ? 90 : 60);

    const nodeEl = document.createElement('div');
    nodeEl.className = `node ${type.toLowerCase()}`;
    nodeEl.id = `node-${node.id}`;
    nodeEl.dataset.id = node.id;
    nodeEl.style.left = `${node.x}px`;
    nodeEl.style.top = `${node.y}px`;

    if (type === 'Diamond') {
        const bg = document.createElement('div');
        bg.className = 'shape-bg';
        nodeEl.appendChild(bg);
    }

    const span = document.createElement('span');
    span.textContent = node.text;
    nodeEl.appendChild(span);

    ['top', 'bottom', 'left', 'right'].forEach(dir => {
        const port = document.createElement('div');
        port.className = `port ${dir}`;
        port.dataset.dir = dir;
        
        port.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            startConnection(node.id, dir, e.clientX, e.clientY);
        });
        
        port.addEventListener('mouseup', (e) => {
            e.stopPropagation();
            endConnection(node.id, dir);
        });

        nodeEl.appendChild(port);
    });

    nodeEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        
        state.selectedNode = node;
        state.isDraggingNode = true;
        state.mouseDownPos = { x: e.clientX, y: e.clientY }; 
        
        const worldPos = screenToWorld(e.clientX, e.clientY);
        state.dragStartX = worldPos.x - node.x;
        state.dragStartY = worldPos.y - node.y;
        document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
        nodeEl.classList.add('selected');
    });

    nodeEl.addEventListener('mouseup', (e) => {
        const dist = Math.hypot(e.clientX - state.mouseDownPos.x, e.clientY - state.mouseDownPos.y);
        if (dist < 5) {
            selectElement(node.id, 'node');
        }

        if (state.isConnecting && state.connectionStart) {
            e.stopPropagation();
            const ports = ['top', 'bottom', 'left', 'right'];
            let nearestPort = 'top';
            let minDistance = Infinity;
            
            const worldPos = screenToWorld(e.clientX, e.clientY);
            ports.forEach(dir => {
                const portPos = getPortWorldPos({ data: node }, dir);
                const dist = Math.hypot(worldPos.x - portPos.x, worldPos.y - portPos.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestPort = dir;
                }
            });
            
            endConnection(node.id, nearestPort);
        }
    });

    dom.elementsLayer.appendChild(nodeEl);
    state.nodes.push({ data: node, el: nodeEl });
    hideMenu();
    updateMiniMap();
    saveHistory(); 
}

export function startConnection(nodeId, dir, clientX, clientY) {
    state.isConnecting = true;
    const worldPos = screenToWorld(clientX, clientY);
    state.connectionStart = { nodeId, dir, x: worldPos.x, y: worldPos.y };
}

export function endConnection(toNodeId, toDir) {
    if (!state.isConnecting) return;
    const from = state.connectionStart;
    
    if (from.nodeId !== toNodeId) {
        state.connections.push({
            id: Date.now(),
            fromId: from.nodeId,
            fromDir: from.dir,
            toId: toNodeId,
            toDir: toDir
        });
        renderConnections();
        saveHistory(); 
    }
    
    state.isConnecting = false;
    state.connectionStart = null;
}

export function selectElement(id, type) {
    state.selectedId = id;
    state.selectedType = type;
    
    document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
    document.querySelectorAll('.connection-line').forEach(l => l.classList.remove('selected-line'));

    if (type === 'node') {
        const node = state.nodes.find(n => n.data.id === id);
        if (node) node.el.classList.add('selected');
    } else {
        const line = document.querySelector(`.connection-line[data-id="${id}"]`);
        if (line) line.classList.add('selected-line');
    }

    openDrawer();
}

export function openDrawer() {
    state.drawer.classList.add('open');
    renderDrawerContent();
    setTimeout(ensureSelectionInView, 100); 
}

export function ensureSelectionInView() {
    if (!state.selectedId) return;
    
    let worldCenter;
    if (state.selectedType === 'node') {
        const node = state.nodes.find(n => n.data.id === state.selectedId);
        if (!node) return;
        const w = 150;
        const h = (node.data.type === 'Diamond' ? 90 : 60);
        worldCenter = { x: node.data.x + w / 2, y: node.data.y + h / 2 };
    } else {
        const conn = state.connections.find(c => c.id === state.selectedId);
        if (!conn || !conn.points) return;
        const mid = conn.points[Math.floor(conn.points.length/2)];
        worldCenter = mid;
    }
    
    const screenX = worldCenter.x * state.scale + state.x;
    const panelWidth = 350;
    const safeMargin = 50;
    
    const dangerZone = window.innerWidth - panelWidth - safeMargin;
    if (screenX > dangerZone) {
        const diff = screenX - (window.innerWidth / 2 - panelWidth / 2);
        state.x -= diff;
        updateTransform();
        updateMiniMap();
    }
}

export function closeDrawer() {
    state.drawer.classList.remove('open');
    state.selectedId = null;
    state.selectedType = null;
    document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
}

export function renderDrawerContent() {
    state.drawerContent.innerHTML = '';
    
    if (state.selectedType === 'node') {
        const nodeObj = state.nodes.find(n => n.data.id === state.selectedId);
        const node = nodeObj.data;
        state.drawerTitle.textContent = `${node.type} Logic Settings`;
        
        let formHTML = '';
        if (node.type === 'Rectangle') {
            formHTML = `
                <label>UI Scenario</label>
                <span class="hint-text">화면 묘사 (사용자에게 어떻게 보여야 하나요?)</span>
                <textarea data-key="ui" placeholder="예: 화면 중앙에 로그인 버튼이 있고, 그 위에 ID와 PW를 입력하는 칸이 두 개 있어요.">${node.ui || ''}</textarea>
                
                <label>Input Data</label>
                <span class="hint-text">필요 정보 (어떤 데이터를 입력받고 보여주나요?)</span>
                <textarea data-key="data" placeholder="예: 사용자의 이메일 주소와 비밀번호 값을 문자 형태로 입력받아요.">${node.data_in || ''}</textarea>
                
                <label>Business Logic</label>
                <span class="hint-text">동작 설명 (버튼을 누르면 어떤 일이 발생하나요?)</span>
                <textarea data-key="logic" placeholder="예: 로그인 버튼을 누르면 입력한 정보가 서버로 전달되어 맞는지 확인하고, 성공하면 홈 화면으로 이동해요.">${node.logic || ''}</textarea>
            `;
        } else if (node.type === 'Diamond') {
            formHTML = `
                <label>Condition</label>
                <span class="hint-text">판단 조건 (무엇을 기준으로 YES/NO 분기를 나누나요?)</span>
                <textarea data-key="condition" placeholder="예: 사용자가 입력한 비밀번호가 우리 DB에 있는 것과 똑같은가요?">${node.condition || ''}</textarea>
            `;
        } else if (node.type === 'Cylinder') {
            formHTML = `
                <label>Database Schema</label>
                <span class="hint-text">기억할 내용 (나중을 위해 어떤 정보를 저장해 두어야 하나요?)</span>
                <input type="text" data-key="table" value="${node.table || ''}" placeholder="예: 회원 정보 테이블 (UserTable)">
                <textarea data-key="schema" placeholder="예: 번호, 아이디, 비밀번호, 가입 날짜를 세트로 묶어서 저장할 거예요.">${node.schema || ''}</textarea>
            `;
        } else if (node.type === 'Oval') {
            formHTML = `
                <label>Trigger / End</label>
                <span class="hint-text">시작/종료 지점 (언제 시작하고 언제 끝나나요?)</span>
                <input type="text" data-key="event" value="${node.event || ''}" placeholder="예: 사용자가 앱 아이콘을 손가락으로 클릭했을 때">
            `;
        }
        
        formHTML += `
            <button class="drawer-delete-btn" id="delete-element-btn">
                <span>지우기 (Delete)</span>
            </button>
        `;

        state.drawerContent.innerHTML = formHTML;
        
        document.getElementById('delete-element-btn').addEventListener('click', () => {
            deleteSelected();
        });
        
    } else if (state.selectedType === 'connection') {
        const conn = state.connections.find(c => c.id === state.selectedId);
        state.drawerTitle.textContent = 'Edge Logic';
        
        const formHTML = `
            <label>Connection Label</label>
            <input type="text" id="edge-label-input" value="${conn.label || ''}">
            
            <label>Flow Theme (주석)</label>
            <div class="color-picker-list">
                <div class="color-option ${conn.theme==='success'?'active':''}" data-theme="success">
                    <div class="color-swatch success"></div>
                    <span class="color-label">성공 (Success)</span>
                </div>
                <div class="color-option ${conn.theme==='failure'?'active':''}" data-theme="failure">
                    <div class="color-swatch failure"></div>
                    <span class="color-label">실패 (Failure)</span>
                </div>
                <div class="color-option ${conn.theme==='warning'?'active':''}" data-theme="warning">
                    <div class="color-swatch warning"></div>
                    <span class="color-label">경고 (Warning)</span>
                </div>
                <div class="color-option ${conn.theme==='normal'||!conn.theme?'active':''}" data-theme="normal">
                    <div class="color-swatch normal"></div>
                    <span class="color-label">일반 (Normal)</span>
                </div>
            </div>
            
            <button class="drawer-delete-btn" id="delete-element-btn">
                <span>이 선 지우기 (Delete)</span>
            </button>
        `;
        state.drawerContent.innerHTML = formHTML;

        document.getElementById('delete-element-btn').addEventListener('click', () => {
            deleteSelected();
        });
        
        document.getElementById('edge-label-input').addEventListener('change', (e) => {
            conn.label = e.target.value;
            renderConnections();
            saveHistory(); 
        });
        
        state.drawerContent.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                conn.theme = option.dataset.theme;
                renderDrawerContent();
                renderConnections();
                saveHistory(); 
            });
        });
    }

    const nodeObj = state.nodes.find(n => n.data.id === state.selectedId);
    if (nodeObj) {
        const node = nodeObj.data;
        state.drawerContent.oninput = (e) => {
            const key = e.target.dataset.key;
            if (key) {
                if (key === 'data') node.data_in = e.target.value;
                else node[key] = e.target.value;
            }
        };
        state.drawerContent.onchange = (e) => {
            if (e.target.id === 'edge-label-input') return;
            saveHistory();
        };
    }
}

export function bindGlobalEvents() {
    dom.container.addEventListener('mousedown', (e) => {
        if (isUIClick(e)) return;
        if (e.target.closest('.node')) return; 

        if (e.button === 0 || e.button === 1) {
            state.isPanning = true;
            state.startX = e.clientX - state.x;
            state.startY = e.clientY - state.y;
            dom.container.style.cursor = 'grabbing';
            hideMenu();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (state.isPanning) {
            state.x = e.clientX - state.startX;
            state.y = e.clientY - state.startY;
            updateTransform();
            state.drawer.classList.add('panning-mode'); 
        } else if (state.isDraggingNode && state.selectedNode) {
            state.drawer.classList.add('panning-mode'); 
            const worldPos = screenToWorld(e.clientX, e.clientY);
            const nodeObj = state.nodes.find(n => n.data.id === state.selectedNode.id);
            
            if (nodeObj) {
                nodeObj.data.x = snapToGrid(worldPos.x - state.dragStartX);
                nodeObj.data.y = snapToGrid(worldPos.y - state.dragStartY);
                
                nodeObj.el.style.left = `${nodeObj.data.x}px`;
                nodeObj.el.style.top = `${nodeObj.data.y}px`;
                updateMiniMap(); 
                renderConnections(); 
            }
        }

        if (state.isConnecting && state.connectionStart) {
            updateGhostLine(e.clientX, e.clientY);
        }
        
        if (state.isMiniMapDragging) {
            moveCameraByMiniMap(e.clientX, e.clientY, false);
        }
    });

    window.addEventListener('mouseup', () => {
        if (state.isDraggingNode) {
            state.isDraggingNode = false;
            renderConnections(); 
            saveHistory(); 
        }

        state.isPanning = false;
        state.isMiniMapDragging = false;
        if (state.drawer) state.drawer.classList.remove('panning-mode');
        dom.container.style.cursor = 'grab';
        clearTimeout(state.longPressTimer);

        if (state.isConnecting) {
            state.isConnecting = false;
            state.connectionStart = null;
            const ghost = document.getElementById('ghost-line');
            if (ghost) ghost.remove();
        }
    });

    dom.container.addEventListener('wheel', (e) => {
        if (isUIClick(e)) return;
        e.preventDefault();

        const zoomSpeed = 0.001;
        const delta = -e.deltaY;
        const oldScale = state.scale;
        const newScale = Math.min(Math.max(oldScale + delta * zoomSpeed * oldScale, 0.1), 5);

        const rect = dom.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        state.x = mouseX - (mouseX - state.x) * (newScale / oldScale);
        state.y = mouseY - (mouseY - state.y) * (newScale / oldScale);
        state.scale = newScale;

        updateTransform();
        hideMenu(); 
    }, { passive: false });

    window.addEventListener('resize', () => {
        updateTransform();
    });

    dom.miniMapContainer.addEventListener('mousedown', (e) => {
        state.isMiniMapDragging = true;
        moveCameraByMiniMap(e.clientX, e.clientY, true);
    });

    dom.miniMapContainer.addEventListener('mouseenter', () => {
        const interval = setInterval(updateMiniMap, 16);
        setTimeout(() => clearInterval(interval), 500);
    });

    dom.miniMapContainer.addEventListener('mouseleave', () => {
        const interval = setInterval(updateMiniMap, 16);
        setTimeout(() => clearInterval(interval), 500);
    });

    dom.creationMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.menu-item');
        if (item) {
            createNode(item.dataset.type, state.menuCoords.x, state.menuCoords.y);
        }
    });

    dom.container.addEventListener('dblclick', (e) => {
        if (isUIClick(e)) return;
        showMenu(e.clientX, e.clientY);
    });

    dom.container.addEventListener('click', (e) => {
        const isNodeClick = e.target.closest('.node');
        const isLineClick = e.target.closest('.connection-line');
        const isDrawerClick = e.target.closest('#side-drawer');
        const isMenuClick = e.target.closest('#creation-menu');
        
        if (!isNodeClick && !isLineClick && !isDrawerClick && !isMenuClick) {
            closeDrawer();
        }
    });

    dom.container.addEventListener('touchstart', (e) => {
        if (isUIClick(e)) return;
        if (e.touches.length > 1) return;

        const touch = e.touches[0];
        state.longPressTimer = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            showMenu(touch.clientX, touch.clientY);
        }, 500);
    });

    dom.container.addEventListener('touchmove', () => {
        clearTimeout(state.longPressTimer);
    });

    dom.closeDrawerBtn.addEventListener('click', closeDrawer);

    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redo();
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                deleteSelected();
            }
        }
    });

    state.undoBtn.addEventListener('click', undo);
    state.redoBtn.addEventListener('click', redo);
    state.exportBtn.addEventListener('click', exportToJSON);
    state.clearAllBtn.addEventListener('click', clearAll); 
    
    state.importTrigger.addEventListener('click', () => state.importInput.click());
    state.importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (re) => {
            try {
                const data = JSON.parse(re.target.result);
                loadSnapshot(data);
                const snapshot = {
                    nodes: state.nodes.map(n => ({ ...n.data })),
                    connections: state.connections.map(c => ({ ...c }))
                };
                state.undoStack = [snapshot];
                state.redoStack = [];
                updateHistoryButtons();
                alert('성공적으로 불러왔습니다!');
            } catch (err) {
                alert('잘못된 파일 형식입니다.');
            }
        };
        reader.readAsText(file);
    });

    window.addEventListener('click', (e) => {
        if (!e.target.closest('.ai-dropdown-container') && !e.target.closest('.capture-dropdown-container')) {
            state.aiMenu.classList.remove('active');
            state.captureMenu.classList.remove('active');
        }
    });
}
