import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from '@xyflow/react';
import dagre from 'dagre';

// 로컬 스토리지 키 정의
const STORAGE_KEY = 'aura-map-tactical-data';
const LIST_KEY = 'aura-map-project-list';

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
  currentProjectName: initialList.find(p => p.id === lastProjectId)?.name || '기본 작전',
  projectList: initialList,
  
  // 데이터 영구 보존 명령 (현재 활성화된 프로젝트)
  saveToStorage: () => {
    const { nodes, edges, currentProjectId, currentProjectName } = get();
    localStorage.setItem(`${STORAGE_KEY}-${currentProjectId}`, JSON.stringify({ nodes, edges }));
    localStorage.setItem('aura-map-last-project-id', currentProjectId);
    
    // 목록 업데이트 (이름 변경 등 반영)
    const list = getProjectList();
    const existing = list.find(p => p.id === currentProjectId);
    if (existing) {
      existing.name = currentProjectName;
      existing.lastModified = new Date().toISOString();
    } else {
      list.push({ id: currentProjectId, name: currentProjectName, lastModified: new Date().toISOString() });
    }
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
    set({ projectList: list });
  },

  // 새 작전 생성
  createNewProject: (name = '새 전술 계획') => {
    const newId = `proj-${Date.now()}`;
    set({
      nodes: [
        {
          id: 'root-1',
          type: 'tactical',
          position: { x: 250, y: 250 },
          data: { label: '🚀 작전 시작', shape: 'terminal' }
        }
      ],
      edges: [],
      currentProjectId: newId,
      currentProjectName: name
    });
    get().saveToStorage();
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

  // 프로젝트 삭제
  deleteProject: (id) => {
    const list = getProjectList().filter(p => p.id !== id);
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
    localStorage.removeItem(`${STORAGE_KEY}-${id}`);
    set({ projectList: list });
    
    // 만약 현재 열린 프로젝트를 삭제했다면 기본값으로 복구
    if (get().currentProjectId === id) {
      get().createNewProject('기본 작전');
    }
  },

  // 프로젝트 이름 변경
  renameProject: (id, newName) => {
    const list = getProjectList().map(p => p.id === id ? { ...p, name: newName } : p);
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
    if (get().currentProjectId === id) {
      set({ currentProjectName: newName });
    }
    set({ projectList: list });
  },

  // 노드 변경 적용 (드래그 등)
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    get().saveToStorage(); // 즉시 저장
  },
  
  // 에지 변경 적용
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    get().saveToStorage(); // 즉시 저장
  },
  
  // 새로운 연결 생성 (보급로 확보)
  onConnect: (connection) => {
    set({
      edges: addEdge({ 
        ...connection, 
        type: 'tactical', // 커스텀 연결선 타입 적용
        animated: true, 
        data: { label: '' },
        style: { stroke: '#00e5ff', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#00e5ff',
        },
      }, get().edges),
    });
    get().saveToStorage(); // 즉시 저장
  },

  // 보급로 라벨 수정
  updateEdgeLabel: (id, label) => {
    set((state) => ({
      edges: state.edges.map((edge) => 
        edge.id === id ? { ...edge, data: { ...edge.data, label } } : edge
      ),
    }));
    get().saveToStorage();
  },
  
  // 노드 추가 (지능형 첫 노드 처리 포함)
  addNode: (position, label = '새 전술 거점', shape = 'process', type = 'tactical') => {
    const { nodes } = get();
    const isFirstNode = nodes.length === 0;
    
    const id = `node-${Date.now()}`;
    const newNode = {
      id,
      position,
      type,
      data: { 
        label: isFirstNode ? '🚀 작전 시작' : label, 
        shape: isFirstNode ? 'terminal' : shape 
      }
    };
    
    set((state) => ({ 
      nodes: [...state.nodes, newNode] 
    }));
    get().saveToStorage(); // 즉시 저장
  },

  // 노드 이름 변경
  updateNodeLabel: (id, label) => {
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
  loadFromData: (data) => {
    if (data.nodes) set({ nodes: data.nodes });
    if (data.edges) set({ edges: data.edges });
    get().saveToStorage();
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
  }
}));

export default useStore;
