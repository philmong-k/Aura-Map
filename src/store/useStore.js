import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from '@xyflow/react';
import dagre from 'dagre';
import { migrateNodes, migrateEdges, evaluateFormula } from '../utils/tacticalEngine';

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
const lastProjectId = localStorage.getItem('aura-map-last-project-id') || 'default';

// 🛡️ [Self-Healing] 만약 프로젝트 목록이 비어있고 기본 데이터가 존재한다면 목록에 추가
if (initialList.length === 0) {
  const defaultProject = { 
    id: 'default', 
    name: '기본 프로젝트', 
    lastModified: new Date().toISOString(), 
    isLocked: false 
  };
  initialList.push(defaultProject);
  localStorage.setItem(LIST_KEY, JSON.stringify(initialList));
}

const lastProject = loadProjectData(lastProjectId);

const useStore = create((set, get) => ({
  isLoading: false,
  nodes: [],
  edges: [],
  currentProjectId: lastProjectId || 'default',
  currentProjectName: '연결 중...',
  projectList: initialList,
  
  // [v4.6-PLATINUM] 상세 창 관리 상태
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  closeNodeDetail: () => set({ selectedNodeId: null }),

  // [v4.6-PLATINUM] 지니어스 선택 엔진: 전술적 주권(Tactical Sovereignty) 레이어
  tacticalSelection: [], // 독자적인 전술 선택 명부 (ID 배열)
  setTacticalSelection: (selection) => set({ tacticalSelection: selection }),
  toggleTacticalSelection: (id) => set((state) => {
    const isSelected = state.tacticalSelection.includes(id);
    const newSelection = isSelected 
      ? state.tacticalSelection.filter(item => item !== id)
      : [...state.tacticalSelection, id];
    
    // 🛡️ 지니어스 엔진: 독자 명부와 실제 노드 상태를 1:1로 강제 동기화 (Sovereignty Sync)
    const updatedNodes = state.nodes.map(node => 
      node.id === id ? { ...node, selected: !isSelected } : node
    );
    
    return { tacticalSelection: newSelection, nodes: updatedNodes };
  }),
  clearTacticalSelection: () => set((state) => ({ 
    tacticalSelection: [],
    nodes: state.nodes.map(node => ({ ...node, selected: false }))
  })),
  toggleNodeSelection: (id) => {
    const { nodes } = get();
    set({
      nodes: nodes.map(n => n.id === id ? { ...n, selected: !n.selected } : n)
    });
  },
  
  // [v4.6-PLATINUM] 글로벌 총액 집계 엔진 (수식 엔진 통합형)
  getGlobalTotal: () => {
    const { nodes } = get();
    return nodes.reduce((total, node) => {
      if (node.type === 'tactical' && node.data?.sheet?.rows && node.data.sheet.rows.length > 0) {
        const { columns = [], rows = [] } = node.data.sheet;

        const nodeSum = rows.reduce((sum, row) => {
          // 1. 대표 수식/숫자 필드(c4 또는 '계', '합' 포함) 우선 탐색
          const targetCol = columns.find(c => 
            (c.type === 'formula' || c.type === 'number') && 
            (c.id === 'c4' || c.name.includes('계') || c.name.includes('합') || c.name.includes('소계'))
          );

          if (targetCol) {
            if (targetCol.type === 'formula') {
              return sum + (evaluateFormula(targetCol.formula, row, columns) || 0);
            } else {
              return sum + (parseFloat(row[targetCol.id]) || 0);
            }
          }
          
          // 2. 대표 필드가 없으면 모든 숫자 필드를 합산 (Fallback)
          return sum + columns.reduce((rSum, col) => {
            if (col.type === 'number') return rSum + (parseFloat(row[col.id]) || 0);
            return rSum;
          }, 0);
        }, 0);
        return total + nodeSum;
      }
      return total;
    }, 0);
  },
  
  // 전술 타임라인 (Undo/Redo) 상태
  past: [],
  future: [],
  
  // 편집 편의 기능 상태
  multiSelectMode: false,
  copiedNodes: [], // 복사된 노드 데이터 (클립보드)
  copiedEdges: [], // 복사된 에지 데이터

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

      // 1. 개별 프로젝트 데이터 저장 (로컬 캐시 부활 - 오프라인 가용성 및 깜빡임 방지)
      const projectData = JSON.stringify({
        nodes,
        edges,
        lastModified,
        version: projectInfo?.version || 1
      });
      localStorage.setItem(`${STORAGE_KEY}-${currentProjectId}`, projectData);
      localStorage.setItem('aura-map-last-project-id', currentProjectId);
      
      // 2. 목록 업데이트 (메모리 및 로컬 스토리지)
      const list = get().projectList;
      const existingIndex = list.findIndex(p => p.id === currentProjectId);
      if (existingIndex > -1) {
        list[existingIndex].lastModified = lastModified;
        set({ projectList: [...list] });
        localStorage.setItem(LIST_KEY, JSON.stringify(get().projectList));
      }

      // 3. 백엔드 동기화 (즉시 혹은 지연)
      if (syncTimer) clearTimeout(syncTimer);
      
      if (immediateSync) {
        get().syncToBackend(currentProjectId);
      } else {
        syncTimer = setTimeout(() => {
          get().syncToBackend(currentProjectId);
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

  // 백엔드 실시간 동기화 브릿지 (🛸 지니어스 엔진: ID 동기화 및 유실 방지 필터 탑재)
  syncToBackend: async (projectId) => {
    const { nodes, edges, currentProjectId, currentProjectName, projectList } = get();
    const targetId = projectId || currentProjectId;
    if (!targetId) return;

    // [방어벽] 데이터가 비어있는 비정상 상황 감지 시 동기화 차단
    if (nodes.length === 0 && edges.length === 0) {
      console.warn('⚠️ [Data Shield] 노드와 엣지가 비어있습니다. 유실 방지를 위해 서버 전송을 차단합니다.');
      return;
    }

    const BACKEND_URL = import.meta.env.VITE_QUARK_CORE_URL || '';
    const projectInfo = projectList.find(p => p.id === targetId);
    if (!projectInfo) return;

    let syncNodes = nodes;
    let syncEdges = edges;
    let syncName = currentProjectName;

    // 현재 열린 프로젝트가 아닌 다른 프로젝트를 동기화할 때 (예: 잠금 토글)
    if (targetId !== currentProjectId) {
      const storedData = loadProjectData(targetId);
      if (!storedData) return;
      syncNodes = storedData.nodes || [];
      syncEdges = storedData.edges || [];
      syncName = projectInfo.name;
    }

    try {
      const userToken = localStorage.getItem('aura_token');
      const authHeader = userToken ? `Bearer ${userToken}` : `Bearer ${import.meta.env.VITE_TACTICAL_API_KEY}`;

      const response = await fetch(`${BACKEND_URL}/api/tactical-map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          id: targetId,
          version: projectInfo.version || 0, // [v4.7.9] 버전 정보 추가
          server_updated_at: projectInfo.serverUpdatedAt,
          nodes: syncNodes,
          edges: syncEdges,
          title: syncName,
          folder_name: projectInfo.folder || 'Unclassified',
          visibility: projectInfo.visibility || 'PRIVATE'
        })
      });
      
      if (response.ok) {
        const resData = await response.json();
        const serverTime = resData.updated_at;
        const serverVersion = resData.version;
        
        set((state) => {
          const newList = [...state.projectList];
          const idx = newList.findIndex(p => p.id === targetId || p.id === resData.id);
          if (idx !== -1) {
            if (serverTime) {
              newList[idx].serverUpdatedAt = serverTime;
              newList[idx].lastModified = serverTime;
            }
            if (serverVersion) {
              newList[idx].version = serverVersion;
            }
            if (resData.id) newList[idx].id = resData.id;
          }
          return { projectList: newList };
        });

        // 🛡️ ID 승격 시 추가 처리 (localStorage 등)
        if (resData.id && targetId !== resData.id) {
          console.log(`🆔 [Sync] 임시 ID(${targetId})를 서버 ID(${resData.id})로 승격합니다.`);
          const data = localStorage.getItem(`${STORAGE_KEY}-${targetId}`);
          if (data) {
            localStorage.setItem(`${STORAGE_KEY}-${resData.id}`, data);
            localStorage.removeItem(`${STORAGE_KEY}-${targetId}`);
          }
          set({ currentProjectId: get().currentProjectId === targetId ? resData.id : get().currentProjectId });
        }
        
        // 전역 목록 스토리지 갱신
        localStorage.setItem(LIST_KEY, JSON.stringify(get().projectList));
        console.log(`✅ [Sync] 백엔드 동기화 성공: ${syncName}`);
      }
    } catch (error) {
      console.warn('⚠️ [Sync] 통신 오류:', error.message);
    }
  },

  // 백엔드에서 프로젝트 삭제
  deleteFromBackend: async (projectId) => {
    const BACKEND_URL = import.meta.env.VITE_QUARK_CORE_URL || '';
    try {
      const userToken = localStorage.getItem('aura_token');
      const authHeader = userToken ? `Bearer ${userToken}` : `Bearer ${import.meta.env.VITE_TACTICAL_API_KEY}`;

      const response = await fetch(`${BACKEND_URL}/api/tactical-map/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': authHeader }
      });
      if (response.ok) {
        console.log(`✅ 백엔드에서 프로젝트 ${projectId} 삭제 완료`);
      }
    } catch (error) {
      console.warn('⚠️ 백엔드 삭제 실패:', error.message);
    }
  },

  // 백엔드에서 모든 데이터 불러오기
  loadFromBackend: async (options = { force: false }) => {
    if (!options.force) set({ isLoading: true });
    const BACKEND_URL = import.meta.env.VITE_QUARK_CORE_URL || '';

    try {
      const userToken = localStorage.getItem('aura_token');
      const authHeader = userToken ? `Bearer ${userToken}` : `Bearer ${import.meta.env.VITE_TACTICAL_API_KEY}`;

      const response = await fetch(`${BACKEND_URL}/api/tactical-map`, {
        headers: { 'Authorization': authHeader }
      });

      if (!response.ok) throw new Error('데이터 불러오기 실패');
      
      const remoteProjects = await response.json();
      set((state) => {
        const localList = [...state.projectList];
        const mergedList = [...localList];

        remoteProjects.forEach(remote => {
          // 🛡️ [v4.7.1] ID 또는 (제목+수정시간) 기반 정밀 매칭으로 중복 생성 방지
          const index = mergedList.findIndex(p => 
            p.id === remote.id || (p.name === remote.title && Math.abs(new Date(p.lastModified) - new Date(remote.updated_at)) < 5000)
          );

          const existingLocal = mergedList[index];
          const localTime = existingLocal?.lastModified ? new Date(existingLocal.lastModified).getTime() : 0;
          const remoteTime = new Date(remote.updated_at).getTime();

          const remoteInfo = {
            id: remote.id,
            name: (existingLocal && localTime > remoteTime + 1000) ? existingLocal.name : remote.title,
            lastModified: remote.updated_at,
            serverUpdatedAt: remote.updated_at,
            version: remote.version || 1, // [v4.7.9] 서버 버전 정보 저장
            folder: remote.folder_name,
            visibility: remote.visibility,
            isRemote: true
          };

          if (index === -1) {
            mergedList.push(remoteInfo);
          } else {
            // ID가 달랐던 경우(임시 ID) 서버 ID로 업데이트
            if (mergedList[index].id !== remote.id) {
              console.log(`🔗 [Merge] 임시 ID(${mergedList[index].id})를 정식 ID(${remote.id})로 통합합니다.`);
              const oldId = mergedList[index].id;
              localStorage.removeItem(`${STORAGE_KEY}-${oldId}`);
              mergedList[index] = remoteInfo;
            } else {
              mergedList[index] = { ...mergedList[index], ...remoteInfo };
            }
          }
          
          // 개별 프로젝트 데이터 로컬 캐싱
          localStorage.setItem(`${STORAGE_KEY}-${remote.id}`, JSON.stringify({
            nodes: remote.nodes,
            edges: remote.edges,
            snapshots: remote.snapshots || [],
            lastModified: remote.updated_at
          }));
        });

        // 서버에 없는 'isRemote' 항목 제거 (원격 삭제 반영)
        const remoteIds = remoteProjects.map(p => p.id);
        const finalList = mergedList.filter(p => !p.isRemote || remoteIds.includes(p.id));
        
        localStorage.setItem(LIST_KEY, JSON.stringify(finalList));
        return { projectList: finalList };
      });

      // 🔄 [v4.7.1] 현재 활성화된 프로젝트 최신화 (실시간 동기화 완성)
      const { currentProjectId, nodes: localNodes } = get();
      const currentRemote = remoteProjects.find(p => p.id === currentProjectId);
      
      if (currentRemote) {
        const localData = loadProjectData(currentProjectId);
        const remoteTime = new Date(currentRemote.updated_at).getTime();
        const localTime = localData?.lastModified ? new Date(localData.lastModified).getTime() : 0;

        if (options.force || remoteTime > localTime) {
          const standardizedNodes = migrateNodes(currentRemote.nodes || []);
          const standardizedEdges = migrateEdges(currentRemote.edges || [], standardizedNodes);

          set({
            nodes: standardizedNodes,
            edges: standardizedEdges,
            currentProjectName: currentRemote.title
          });
          console.log(`📡 [${currentProjectId}] 서버 최신 데이터 수신 완료.`);
        }
      }
    } catch (error) {
      console.warn('⚠️ 백엔드 로드 실패:', error.message);
    } finally {
      set({ isLoading: false });
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

    const newProject = {
      id: newId,
      name: name,
      lastModified: new Date().toISOString(),
      isLocked: false
    };
    
    set((state) => ({
      nodes: initialNodes,
      edges: [],
      currentProjectId: newId,
      currentProjectName: name,
      projectList: [newProject, ...state.projectList]
    }));
    
    // 로컬 스토리지 목록 즉시 갱신
    const currentList = getProjectList();
    localStorage.setItem(LIST_KEY, JSON.stringify([newProject, ...currentList]));
    
    // 생성 즉시 서버 등록 (디바운스 없이 즉시 실행)
    get().saveToStorage(true); // true를 전달하여 즉시 동기화 유도
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
      get().saveToStorage(true); // [v4.7.6] 이름 변경은 지연 없이 즉시 서버에 보고 (폴링과 경합 방지)
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

  // [v4.6-PLATINUM] 프로젝트 핀(중요) 토글
  toggleProjectPin: (id) => {
    const list = getProjectList();
    const index = list.findIndex(p => p.id === id);
    if (index > -1) {
      const newPinState = !list[index].isPinned;
      list[index].isPinned = newPinState;
      localStorage.setItem(LIST_KEY, JSON.stringify(list));
      set({ projectList: list });
      
      // 즉시 서버 동기화 (핀 상태도 서버에 저장)
      get().syncToBackend(id);
    }
  },

  // 노드 변경 적용 (드래그, 선택 등)
  onNodesChange: (changes) => {
    const { currentProjectId, projectList, nodes, multiSelectMode } = get();
    const project = projectList.find(p => p.id === currentProjectId);
    
    // 1. 잠금 상태 처리
    if (project?.isLocked) {
      const selectionOnlyChanges = changes.filter(c => c.type === 'select');
      if (selectionOnlyChanges.length === 0) return;
      set({ nodes: applyNodeChanges(selectionOnlyChanges, nodes) });
      return;
    }

    // 2. [v4.6-PLATINUM] 지니어스 엔진: 주권 분리 및 자동 해제 원천 차단 (A#8 Reduction)
    if (multiSelectMode) {
      // 다중 선택 모드일 때는 리액트 플로우의 모든 선택/해제 신호를 무시함
      // 오직 toggleTacticalSelection만이 부대 명부를 갱신함
      const otherChanges = changes.filter(c => c.type !== 'select');
      if (otherChanges.length > 0) {
        set({ nodes: applyNodeChanges(otherChanges, nodes) });
      }
    } else {
      set({ nodes: applyNodeChanges(changes, nodes) });
    }
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

  // [v4.6-PLATINUM] 노드 데이터 통합 업데이트 (제목, 메모 등)
  updateNodeData: (id, newData) => {
    get().takeSnapshot();
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      ),
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

    const newProject = {
      id: newProjectId,
      name: newProjectName,
      lastModified: new Date().toISOString(),
      isLocked: false
    };

    // 3. 새 프로젝트로 설정 및 목록 추가
    set((state) => ({ 
      currentProjectId: newProjectId,
      currentProjectName: newProjectName,
      nodes: migratedNodes, 
      edges: migratedEdges,
      projectList: [newProject, ...state.projectList],
      past: [],
      future: []
    }));
    
    // 로컬 스토리지 목록 즉시 갱신
    const currentList = getProjectList();
    localStorage.setItem(LIST_KEY, JSON.stringify([newProject, ...currentList]));

    get().saveToStorage(true); 
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
  setMultiSelectMode: (mode) => {
    set((state) => {
      // 다중 선택 모드가 꺼질 때 모든 선택 해제 (지휘관 명령 반영)
      const updatedNodes = mode ? state.nodes : state.nodes.map(n => ({ ...n, selected: false }));
      return { multiSelectMode: mode, nodes: updatedNodes };
    });
  },
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
