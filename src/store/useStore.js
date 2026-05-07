import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from '@xyflow/react';
import dagre from 'dagre';
import { migrateNodes, migrateEdges } from '../utils/tacticalEngine';

// 로컬 스토리지 키 정의
const STORAGE_KEY = 'aura-map-tactical-data';
const LIST_KEY = 'aura-map-project-list';

// 디바운스 타이머 (백엔드 과부하 방지)
let syncTimer = null;

// 프로젝트 목록 불러오기
const getProjectList = () => {
  const list = localStorage.getItem(LIST_KEY);
  return list ? JSON.parse(list) : [];
};

// 특정 프로젝트 데이터 불러오기
const loadProjectData = (id) => {
  const data = localStorage.getItem(`${STORAGE_KEY}-${id}`);
  return data ? JSON.parse(data) : null;
};

const initialList = getProjectList();
const lastProjectId = localStorage.getItem('aura-map-last-project-id');
const lastProject = lastProjectId ? loadProjectData(lastProjectId) : null;

const useStore = create((set, get) => ({
  nodes: lastProject?.nodes || [
    {
      id: 'root-1',
      type: 'tactical',
      position: { x: 250, y: 250 },
      data: { label: '🚀 작전 시작', shape: 'terminal' }
    }
  ],
  edges: lastProject?.edges || [],
  currentProjectId: lastProjectId || 'default',
  currentProjectName: initialList.find(p => p.id === lastProjectId)?.name || '기본 프로젝트',
  projectList: initialList,
  
  // 전술 타임라인 (Undo/Redo) 상태
  past: [],
  future: [],
  
  // 편집 편의 기능 상태
  multiSelectMode: false,
  isLegendOpen: false, // 범례 상태 추가
  copiedNodes: [], // 복사된 노드 데이터 (클립보드)
  copiedEdges: [], // 복사된 에지 데이터

  setIsLegendOpen: (isOpen) => set({ isLegendOpen: isOpen }), // 범례 액션 추가

  toggleNodeSelection: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === nodeId ? { ...node, selected: !node.selected } : node
      )
    }));
  },

  // 현재 상태 스냅샷 기록 (과거로 저장)
  takeSnapshot: () => {
    const { nodes, edges, past } = get();
    // 최대 50단계까지만 기록 (메모리 최적화)
    const newPast = [...past.slice(-49), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
    set({ past: newPast, future: [] }); // 새로운 행동 시 미래 이력은 초기화
  },

  // 작전 취소 (Undo)
  undo: () => {
    const { nodes, edges, past, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: newPast,
      future: [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }, ...future].slice(0, 50)
    });
    get().saveToStorage();
  },

  // 작전 재개 (Redo)
  redo: () => {
    const { nodes, edges, past, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      nodes: next.nodes,
      edges: next.edges,
      past: [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }].slice(-50),
      future: newFuture
    });
    get().saveToStorage();
  },
  // 데이터 저장 및 동기화 (강화 버전)
  saveToStorage: (immediateSync = false) => {
    try {
      const { nodes, edges, currentProjectId, projectList, syncToBackend } = get();
      if (!currentProjectId) return;

      const projectInfo = projectList.find(p => p.id === currentProjectId);
      const isLocked = projectInfo?.isLocked || false;

      // 1. 개별 프로젝트 데이터 저장 (타임스탬프 포함 및 데이터 안전 복제)
      const lastModified = new Date().toISOString();
      const nodesCopy = JSON.parse(JSON.stringify(nodes));
      
      // [감시 센서 1] 로컬 저장 데이터 검증
      const totalRows = nodesCopy.reduce((acc, node) => acc + (node.data?.sheet?.rows?.length || 0), 0);
      console.log(`🛡️ [Step 1] 로컬 금고 저장 시도: 노드 ${nodesCopy.length}개, 총 장부 행 ${totalRows}개`);

      const projectData = JSON.stringify({ 
        nodes: nodesCopy,
        edges: JSON.parse(JSON.stringify(edges)),
        isLocked,
        lastModified 
      });
      
      localStorage.setItem(`${STORAGE_KEY}-${currentProjectId}`, projectData);
      localStorage.setItem('aura-map-last-project-id', currentProjectId);
      
      // 2. 목록 업데이트
      const list = getProjectList();
      const existingIndex = list.findIndex(p => p.id === currentProjectId);
      if (existingIndex > -1) {
        list[existingIndex].lastModified = lastModified;
        localStorage.setItem(LIST_KEY, JSON.stringify(list));
        set({ projectList: list });
      }

      // 3. 백엔드 동기화 (즉시 혹은 지연)
      if (syncTimer) clearTimeout(syncTimer);
      
      if (immediateSync) {
        syncToBackend(currentProjectId);
      } else {
        syncTimer = setTimeout(() => {
          syncToBackend(currentProjectId);
        }, 3000); 
      }
    } catch (error) {
      console.error('🚨 데이터 저장 실패:', error);
    }
  },

  // 작성 중인 행 데이터 임시 보관 (Auto-Commit용)
  updatePendingRow: (id, rowData) => {
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, pendingRow: rowData } } : node
      ),
    }));
  },

  // 백엔드 실시간 동기화 브릿지
  // 백엔드 실시간 동기화 브릿지
  syncToBackend: async (projectId) => {
    const { nodes, edges, currentProjectId, currentProjectName, projectList } = get();
    const targetId = projectId || currentProjectId;
    if (!targetId) return;

    const BACKEND_URL = import.meta.env.VITE_QUARK_CORE_URL;
    if (!BACKEND_URL) return;

    // 대상 프로젝트의 정보 가져오기
    const projectInfo = projectList.find(p => p.id === targetId);
    if (!projectInfo) return;

    // 만약 대상이 현재 활성화된 프로젝트가 아니라면, 로컬 스토리지에서 데이터를 읽어옴
    let syncNodes = nodes;
    let syncEdges = edges;
    let syncName = currentProjectName;

    if (targetId !== currentProjectId) {
      const storedData = loadProjectData(targetId);
      if (!storedData) return;
      syncNodes = storedData.nodes;
      syncEdges = storedData.edges;
      syncName = projectInfo.name;
    }

    // [감시 센서 2] 서버 전송 데이터 검증
    const syncRows = syncNodes.reduce((acc, node) => acc + (node.data?.sheet?.rows?.length || 0), 0);
    console.log(`📡 [Step 2] 서버 무전 전송 시도: 프로젝트 [${syncName}], 총 장부 행 ${syncRows}개`);

    try {
      await fetch(`${BACKEND_URL}/api/tactical/sync`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_TACTICAL_API_KEY}`,
          'X-Device-Id': navigator.userAgent
        },
        body: JSON.stringify({
          projectId: targetId,
          projectName: syncName,
          data: { 
            nodes: syncNodes, 
            edges: syncEdges, 
            isLocked: projectInfo.isLocked || false 
          },
          lastModified: new Date().toISOString()
        })
      });
      console.log(`✅ [${syncName}] 백엔드 동기화 성공 (잠금: ${projectInfo.isLocked})`);
    } catch (error) {
      console.warn('⚠️ 동기화 실패:', error.message);
    }
  },

  // 백엔드에서 프로젝트 삭제
  deleteFromBackend: async (projectId) => {
    const BACKEND_URL = import.meta.env.VITE_QUARK_CORE_URL;
    if (!BACKEND_URL) return;

    try {
      await fetch(`${BACKEND_URL}/api/tactical/delete/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_TACTICAL_API_KEY}`
        }
      });
      console.log(`✅ 백엔드에서 프로젝트 ${projectId} 삭제 완료`);
    } catch (error) {
      console.warn('⚠️ 백엔드 삭제 실패:', error.message);
    }
  },

  // 백엔드에서 모든 데이터 불러오기
  loadFromBackend: async () => {
    const BACKEND_URL = import.meta.env.VITE_QUARK_CORE_URL;
    if (!BACKEND_URL) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/tactical/load`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_TACTICAL_API_KEY}`
        }
      });

      if (!response.ok) throw new Error('데이터 불러오기 실패');
      
      const remoteProjects = await response.json();
      if (remoteProjects.length > 0) {
        // 1. 프로젝트 목록 업데이트
        const localList = getProjectList();
        const mergedList = [...localList];

        remoteProjects.forEach(remote => {
          const index = mergedList.findIndex(p => p.id === remote.id);
          const remoteName = remote.name || '알 수 없는 작전';

          // 데이터 파싱 (문자열로 올 경우 대비)
          const remoteData = typeof remote.data === 'string' ? JSON.parse(remote.data) : remote.data;
          const remoteIsLocked = remoteData?.isLocked || false;

          if (index === -1) {
            mergedList.push({ 
              id: remote.id, 
              name: remoteName, 
              lastModified: remote.lastModified, 
              isRemote: true,
              isLocked: remoteIsLocked
            });
          } else {
            // 불변성을 유지하며 객체 업데이트
            mergedList[index] = {
              ...mergedList[index],
              lastModified: remote.lastModified,
              isRemote: true,
              isLocked: remoteIsLocked
            };
            
            // 이름 동기화 (기본값일 경우만)
            if (mergedList[index].name === 'default' || mergedList[index].name === '기본 작전' || mergedList[index].name === '새 전술 계획') {
              if (remoteName !== 'default' && remoteName !== '기본 작전') {
                mergedList[index].name = remoteName;
              }
            }
          }
          // 개별 프로젝트 데이터 캐싱 (타임스탬프 보존 필수)
          const finalRemoteData = {
            ...remoteData,
            lastModified: remote.lastModified
          };
          localStorage.setItem(`${STORAGE_KEY}-${remote.id}`, JSON.stringify(finalRemoteData));
        });

        // 3. 유령 프로젝트 정리 (서버에는 없는데 로컬 리스트에는 'isRemote'로 표시된 것들 삭제)
        const remoteIds = remoteProjects.map(p => p.id);
        const finalList = mergedList.filter(p => {
          // 서버에서 가져온 것이 아니거나(순수 로컬), 서버 목록에 현재 존재하는 경우만 유지
          return !p.isRemote || remoteIds.includes(p.id);
        });

        localStorage.setItem(LIST_KEY, JSON.stringify(finalList));
        set({ projectList: finalList });

        // 4. 만약 현재 활성화된 프로젝트가 백엔드에 있다면 최신화 (타임스탬프 비교 도입)
        const { currentProjectId, nodes: localNodes } = get();
        const currentRemote = remoteProjects.find(p => p.id === currentProjectId);
        
        if (currentRemote) {
          const localData = loadProjectData(currentProjectId);
          const remoteTime = new Date(currentRemote.lastModified).getTime();
          const localTime = localData?.lastModified ? new Date(localData.lastModified).getTime() : 0;

          // 서버 데이터가 로컬보다 최신일 때만 갱신 검토
          if (remoteTime > localTime) {
            const remoteData = typeof currentRemote.data === 'string' ? JSON.parse(currentRemote.data) : currentRemote.data;
            const remoteNodes = remoteData.nodes || [];
            
            // [정밀 검사] 서버 데이터에 장부 정보가 있는지 확인
            const remoteHasSheet = remoteNodes.some(n => n.data?.sheet && n.data.sheet.rows?.length > 0);
            const localHasSheet = localNodes.some(n => n.data?.sheet && n.data.sheet.rows?.length > 0);

            // 서버 데이터가 로컬보다 부실하다면(장부가 증발했다면) 덮어쓰기 거부
            if (localHasSheet && !remoteHasSheet) {
              console.warn(`⚠️ [${currentProjectId}] 서버 데이터의 무결성이 의심됩니다 (장부 누락). 로컬 데이터를 보호합니다.`);
              return;
            }

            set({
              nodes: remoteNodes,
              edges: remoteData.edges || []
            });
            console.log(`📡 [${currentProjectId}] 서버 데이터가 최신이며 무결함이 확인되어 갱신했습니다.`);
          } else {
            console.log(`🛡️ [${currentProjectId}] 로컬 데이터가 최신이므로 서버 데이터를 무시합니다.`);
          }
        }
        console.log('✅ 백엔드 전술 데이터 동기화 완료');
      }
    } catch (error) {
      console.warn('⚠️ 백엔드 로드 실패:', error.message);
    }
  },

  // 새 작전 생성
  createNewProject: (name = '새 프로젝트 계획') => {
    const newId = `proj-${Date.now()}`;
    const initialNodes = [
      {
        id: 'root-1',
        type: 'tactical',
        position: { x: 250, y: 250 },
        data: { label: '🚀 작전 시작', shape: 'terminal' }
      }
    ];
    
    set({
      nodes: initialNodes,
      edges: [],
      currentProjectId: newId,
      currentProjectName: name
    });
    
    // 생성 즉시 서버 등록 (디바운스 없이 즉시 실행)
    get().saveToStorage();
    get().syncToBackend(); 
  },

  // 프로젝트 불러오기
  loadProject: (id) => {
    const data = loadProjectData(id);
    const list = getProjectList();
    const projectInfo = list.find(p => p.id === id);
    if (data) {
      set({
        nodes: data.nodes,
        edges: data.edges,
        currentProjectId: id,
        currentProjectName: projectInfo?.name || '알 수 없는 작전'
      });
      localStorage.setItem('aura-map-last-project-id', id);
    }
  },

  // 프로젝트 삭제 (로컬 + 백엔드 동시 삭제)
  deleteProject: (id) => {
    const list = getProjectList().filter(p => p.id !== id);
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
    localStorage.removeItem(`${STORAGE_KEY}-${id}`);
    set({ projectList: list });
    
    // 백엔드에서도 삭제 (유령 프로젝트 재발 방지)
    get().deleteFromBackend(id);
    
    // 만약 현재 열린 프로젝트를 삭제했다면 '빈 상태'로 전환
    if (get().currentProjectId === id) {
      set({ 
        currentProjectId: null,
        currentProjectName: '',
        nodes: [],
        edges: []
      });
    }
  },

  // 프로젝트 이름 변경
  renameProject: (id, newName) => {
    if (!newName) return;
    const { currentProjectId, projectList } = get();
    
    // 잠금 상태 확인
    const project = projectList.find(p => p.id === id);
    if (project?.isLocked) {
      alert('🔒 이 작전은 잠겨 있어 이름을 변경할 수 없습니다.');
      return;
    }

    // 1. 목록 업데이트 (로컬)
    const list = getProjectList();
    const target = list.find(p => p.id === id);
    if (target) {
      target.name = newName;
      target.lastModified = new Date().toISOString();
      localStorage.setItem(LIST_KEY, JSON.stringify(list));
      set({ projectList: list });
    }
    
    if (id === currentProjectId) {
      set({ currentProjectName: newName });
      get().saveToStorage();
    }
  },

  // 프로젝트 잠금 토글
  toggleProjectLock: (id) => {
    const list = getProjectList();
    const index = list.findIndex(p => p.id === id);
    if (index > -1) {
      const newLockState = !list[index].isLocked;
      list[index].isLocked = newLockState;
      localStorage.setItem(LIST_KEY, JSON.stringify(list));
      set({ projectList: list });
      
      // 해당 프로젝트 데이터에도 잠금 상태 반영 (개별 로드 시 일관성 유지)
      const projectData = loadProjectData(id);
      if (projectData) {
        projectData.isLocked = newLockState;
        localStorage.setItem(`${STORAGE_KEY}-${id}`, JSON.stringify(projectData));
      }

      // 즉시 서버 동기화 (특정 프로젝트 ID 전달)
      get().syncToBackend(id);
    }
  },

  // 노드 변경 적용 (드래그 등)
  onNodesChange: (changes) => {
    const { currentProjectId, projectList, nodes } = get();
    const project = projectList.find(p => p.id === currentProjectId);
    
    // 잠금 상태인 경우 '선택(select)' 관련 변경만 허용하고 나머지는 차단
    if (project?.isLocked) {
      const selectionOnlyChanges = changes.filter(c => c.type === 'select');
      if (selectionOnlyChanges.length === 0) return;
      
      set({ nodes: applyNodeChanges(selectionOnlyChanges, nodes) });
      return;
    }

    set({
      nodes: applyNodeChanges(changes, nodes),
    });
    get().saveToStorage();
  },
  
  // 에지 변경 적용
  onEdgesChange: (changes) => {
    const { currentProjectId, projectList, edges } = get();
    const project = projectList.find(p => p.id === currentProjectId);
    
    // 잠금 상태인 경우 '선택(select)' 관련 변경만 허용하고 나머지는 차단
    if (project?.isLocked) {
      const selectionOnlyChanges = changes.filter(c => c.type === 'select');
      if (selectionOnlyChanges.length === 0) return;
      
      set({ edges: applyEdgeChanges(selectionOnlyChanges, edges) });
      return;
    }

    set({
      edges: applyEdgeChanges(changes, edges),
    });
    get().saveToStorage();
  },
  
  // 새로운 연결 생성 (보급로 확보)
  onConnect: (connection) => {
    const { currentProjectId, projectList } = get();
    const project = projectList.find(p => p.id === currentProjectId);
    if (project?.isLocked) return;

    get().takeSnapshot();
    set((state) => ({
      edges: addEdge({ 
        ...connection, 
        type: 'tactical', 
        animated: true,
        style: { stroke: '#00e5ff', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#00e5ff' }
      }, state.edges),
    }));
    get().saveToStorage();
  },

  // 보급로 라벨 수정
  updateEdgeLabel: (id, label) => {
    get().takeSnapshot();
    set((state) => ({
      edges: state.edges.map((edge) => 
        edge.id === id ? { ...edge, data: { ...edge.data, label } } : edge
      ),
    }));
    get().saveToStorage();
  },
  
  // 노드 추가
  addNode: (position, label = '새 전술 거점', shape = 'process', type = 'tactical') => {
    const { currentProjectId, projectList } = get();
    const project = projectList.find(p => p.id === currentProjectId);
    if (project?.isLocked) return;

    get().takeSnapshot();
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position,
      data: { 
        label, 
        shape, 
        memo: '',
        sheet: {
          columns: [
            { id: 'c1', name: '품명', type: 'text' },
            { id: 'c2', name: '단가', type: 'number' },
            { id: 'c3', name: '수량', type: 'number' },
            { id: 'c4', name: '소계', type: 'formula', formula: '(c2 * c3)' }
          ],
          rows: []
        }
      },
      measured: { width: 200, height: 70 }
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
    get().saveToStorage();
  },

  // 노드 이름 변경
  updateNodeLabel: (id, label) => {
    get().takeSnapshot();
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, label } } : node
      ),
    }));
    get().saveToStorage(); // 즉시 저장
  },

  // 노드 모양 변경
  updateNodeShape: (id, shape) => {
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, shape } } : node
      ),
    }));
    get().saveToStorage(); // 즉시 저장
  },

  // 기호 순환 (Cycle Shape)
  onCycleShape: (id) => {
    get().takeSnapshot();
    const { nodes } = get();
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    
    const shapes = ['process', 'decision', 'io', 'subroutine', 'database', 'terminal'];
    const currentShape = node.data?.shape || 'process';
    const currentIndex = shapes.indexOf(currentShape);
    const nextIndex = (currentIndex + 1) % shapes.length;
    const nextShape = shapes[nextIndex];
    
    set({
      nodes: nodes.map(n => n.id === id ? { ...n, data: { ...n.data, shape: nextShape } } : n)
    });
    get().saveToStorage();
  },

  // 노드/그룹 상세 메모 업데이트
  updateNodeMemo: (id, memo) => {
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, memo } } : node
      ),
    }));
    get().saveToStorage();
  },

  // 부대 편성
  createGroup: (selectedNodes) => {
    if (selectedNodes.length === 0) return;
    const minX = Math.min(...selectedNodes.map(n => n.position.x));
    const minY = Math.min(...selectedNodes.map(n => n.position.y));
    const maxX = Math.max(...selectedNodes.map(n => n.position.x + (n.width || 200)));
    const maxY = Math.max(...selectedNodes.map(n => n.position.y + (n.height || 70)));
    const padding = 60;
    const groupId = `group-${Date.now()}`;
    const groupNode = {
      id: groupId, type: 'auraGroup', position: { x: minX - padding, y: minY - padding },
      style: { width: (maxX - minX) + padding * 2, height: (maxY - minY) + padding * 2 },
      data: { label: '새 전술 구역' }, zIndex: -1,
    };
    const updatedNodes = get().nodes.map(node => {
      const isSelected = selectedNodes.find(sn => sn.id === node.id);
      if (isSelected) {
        return { ...node, parentId: groupId, extent: 'parent', position: { x: node.position.x - (minX - padding), y: node.position.y - (minY - padding) } };
      }
      return node;
    });
    set({ nodes: [groupNode, ...updatedNodes] });
    get().saveToStorage(); // 즉시 저장
  },

  // 전체 데이터 강제 로드 (파일 업로드 등)
  // 전체 데이터 강제 로드 (새 프로젝트로 생성하여 안전하게 로드)
  loadFromData: (data) => {
    if (!data || !data.nodes) return;

    const newProjectId = `import-${Date.now()}`;
    const newProjectName = data.projectName || `이관된 작전_${new Date().toLocaleTimeString()}`;

    // 1 & 2. 데이터 보정 및 최적화 (엔진 이관 완료)
    const migratedNodes = migrateNodes(data.nodes);
    const migratedEdges = migrateEdges(data.edges || [], migratedNodes);

    // 3. 새 프로젝트로 설정 및 저장
    set({ 
      currentProjectId: newProjectId,
      currentProjectName: newProjectName,
      nodes: migratedNodes, 
      edges: migratedEdges,
      past: [],
      future: []
    });
    
    get().saveToStorage(); 
    console.log(`✅ [Mission] 작전 이관 완료: [${newProjectName}]`);
  },

  // 전체 초기화
  clearAll: () => {
    if (confirm('모든 작전 데이터를 초기화하시겠습니까?')) {
      set({ nodes: [], edges: [] });
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  // 부대 편성 해제 (Ungroup)
  ungroup: (groupId) => {
    const state = get();
    const groupNode = state.nodes.find(n => n.id === groupId);
    if (!groupNode) return;

    const groupPos = groupNode.position;
    
    // 1. 자식 노드들을 전역 좌표로 복구하고 소속 해제
    const updatedNodes = state.nodes.map(node => {
      if (node.parentId === groupId) {
        return {
          ...node,
          parentId: null,
          position: {
            x: groupPos.x + node.position.x,
            y: groupPos.y + node.position.y
          },
          hidden: false // 혹시 압축되어 있었다면 해제
        };
      }
      return node;
    }).filter(n => n.id !== groupId); // 그룹 노드 자체는 삭제

    // 2. 숨겨졌던 에지들도 다시 보이게 처리
    const updatedEdges = state.edges.map(edge => {
      if (edge.hidden && (edge.source === groupId || edge.target === groupId)) {
        // 그룹에 임시로 붙었던 에지들은 일단 숨김 해제 (완벽한 복구는 복잡하므로 기본 상태로)
        return { ...edge, hidden: false };
      }
      return { ...edge, hidden: false };
    });

    set({ nodes: updatedNodes, edges: updatedEdges });
    state.saveToStorage();
  },

  // 전술 섹터 압축/펼치기 (보급로 재라우팅 지원)
  toggleGroupCollapse: (groupId) => {
    const state = get();
    const groupNode = state.nodes.find(n => n.id === groupId);
    if (!groupNode) return;

    const isCollapsing = !groupNode.data.collapsed;
    const childIds = state.nodes.filter(n => n.parentId === groupId).map(n => n.id);
    
    // 1. 노드 상태 업데이트
    const updatedNodes = state.nodes.map(node => {
      if (node.id === groupId) {
        return {
          ...node,
          data: { 
            ...node.data, 
            collapsed: isCollapsing,
            prevWidth: isCollapsing ? node.style.width : node.data.prevWidth,
            prevHeight: isCollapsing ? node.style.height : node.data.prevHeight,
          },
          style: {
            ...node.style,
            width: isCollapsing ? 200 : (node.data.prevWidth || 200),
            height: isCollapsing ? 50 : (node.data.prevHeight || 150),
          }
        };
      }
      if (node.parentId === groupId) {
        return { ...node, hidden: isCollapsing };
      }
      return node;
    });

    // 2. 에지 상태 업데이트 (재라우팅)
    const updatedEdges = state.edges.map(edge => {
      const isSourceInside = childIds.includes(edge.source);
      const isTargetInside = childIds.includes(edge.target);

      if (isCollapsing) {
        // 내부 에지 (둘 다 안쪽): 숨김
        if (isSourceInside && isTargetInside) {
          return { ...edge, hidden: true };
        }
        // 경계 에지 (하나만 안쪽): 그룹 노드로 연결 변경
        if (isSourceInside || isTargetInside) {
          return {
            ...edge,
            data: { 
              ...edge.data, 
              originalSource: edge.source, 
              originalTarget: edge.target 
            },
            source: isSourceInside ? groupId : edge.source,
            target: isTargetInside ? groupId : edge.target,
          };
        }
      } else {
        // 펼칠 때: 원래의 소스/타겟 복구
        if (edge.data?.originalSource || edge.data?.originalTarget) {
          return {
            ...edge,
            source: edge.data.originalSource || edge.source,
            target: edge.data.originalTarget || edge.target,
            hidden: false,
            data: { ...edge.data, originalSource: null, originalTarget: null }
          };
        }
        // 내부 에지 다시 보이기
        if (isSourceInside && isTargetInside) {
          return { ...edge, hidden: false };
        }
      }
      return edge;
    });

    set({ nodes: updatedNodes, edges: updatedEdges });
    state.saveToStorage();
  },

  // 정밀 제거 (선택된 항목 삭제)
  deleteSelection: (selectedNodes, selectedEdges) => {
    get().takeSnapshot();
    const nodeIdsToDelete = selectedNodes.map(n => n.id);
    const edgeIdsToDelete = selectedEdges.map(e => e.id);

    set((state) => ({
      nodes: state.nodes.filter(node => !nodeIdsToDelete.includes(node.id)),
      edges: state.edges.filter(edge => !edgeIdsToDelete.includes(edge.id)),
    }));
    get().saveToStorage();
  },

  // 지능형 자동 정렬 및 전술적 재배치 (Dagre Engine)
  autoLayout: (direction = 'TB') => {
    const { nodes, edges } = get();
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // 노드 규격 설정 (전술 노드 표준 규격)
    const nodeWidth = 220;
    const nodeHeight = 80;

    // 그래프 설정 (방향: 위에서 아래로)
    dagreGraph.setGraph({ 
      rankdir: direction, 
      nodesep: 80, // 노드 간 수평 간격
      ranksep: 100 // 계층 간 수직 간격
    });

    // 1. 노드 등록 (그룹 노드 제외)
    nodes.forEach((node) => {
      if (node.type !== 'auraGroup') {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
      }
    });

    // 2. 에지 등록
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // 3. 레이아웃 계산 수행
    dagre.layout(dagreGraph);

    // 4. 노드 위치 업데이트
    const updatedNodes = nodes.map((node) => {
      if (node.type !== 'auraGroup') {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
          },
        };
      }
      return node;
    });

    set({ nodes: updatedNodes });
    get().saveToStorage();
    console.log('Tactical auto-layout complete');
  },
  setMultiSelectMode: (mode) => set({ multiSelectMode: mode }),
  copySelection: () => {
    const { nodes, edges } = get();
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedNodeIds = selectedNodes.map(n => n.id);
    const selectedEdges = edges.filter(e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target));
    set({ copiedNodes: JSON.parse(JSON.stringify(selectedNodes)), copiedEdges: JSON.parse(JSON.stringify(selectedEdges)) });
  },
  pasteSelection: (position = null) => {
    const { copiedNodes, copiedEdges, nodes, edges } = get();
    if (copiedNodes.length === 0) return;
    get().takeSnapshot();
    const idMap = {};
    const timestamp = Date.now();
    const newNodes = copiedNodes.map((node, index) => {
      const newId = `node-${timestamp}-${index}`;
      idMap[node.id] = newId;
      const newPos = position ? { x: position.x + (node.position.x - copiedNodes[0].position.x), y: position.y + (node.position.y - copiedNodes[0].position.y) } : { x: node.position.x + 40, y: node.position.y + 40 };
      return { ...node, id: newId, position: newPos, selected: true, dragging: false };
    });
    const newEdges = copiedEdges.map((edge, index) => ({ ...edge, id: `edge-${timestamp}-${index}`, source: idMap[edge.source], target: idMap[edge.target], selected: false }));
    const deselectedNodes = nodes.map(n => ({ ...n, selected: false }));
    const deselectedEdges = edges.map(e => ({ ...e, selected: false }));
    set({ nodes: [...deselectedNodes, ...newNodes], edges: [...deselectedEdges, ...newEdges] });
    get().saveToStorage();
  },

  // 글로벌 전술 템플릿(Global Tactical Templates) 관리
  tacticalTemplates: JSON.parse(localStorage.getItem('aura-map-templates')) || [
    { id: 't1', name: '기본 진행 상태', options: '대기,진행중,완료,보류' },
    { id: 't2', name: '우선순위', options: '낮음,보통,높음,긴급' }
  ],

  addTemplate: (name, options) => {
    const newTemplate = { id: `t-${Date.now()}`, name, options };
    set((state) => {
      const updated = [...state.tacticalTemplates, newTemplate];
      localStorage.setItem('aura-map-templates', JSON.stringify(updated));
      return { tacticalTemplates: updated };
    });
  },

  updateTemplate: (id, name, options) => {
    set((state) => {
      const updated = state.tacticalTemplates.map(t => t.id === id ? { ...t, name, options } : t);
      localStorage.setItem('aura-map-templates', JSON.stringify(updated));
      return { tacticalTemplates: updated };
    });
  },

  deleteTemplate: (id) => {
    set((state) => {
      const updated = state.tacticalTemplates.filter(t => t.id !== id);
      localStorage.setItem('aura-map-templates', JSON.stringify(updated));
      return { tacticalTemplates: updated };
    });
  },

  // 전술 데이터 시트(Tactical Sheet) 업데이트 (유연한 스키마 지원)
  updateNodeSheet: (id, sheetData) => {
    set((state) => {
      const newNodes = state.nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, sheet: sheetData } } : node
      );
      console.log(`💾 [Store] 노드 ${id} 장부 데이터 각인 (행: ${sheetData?.rows?.length || 0}개)`);
      return { nodes: newNodes };
    });
    // 즉시 서버 동기화 강제 (3초 대기 생략)
    get().saveToStorage(true);
  }
}));

export default useStore;
