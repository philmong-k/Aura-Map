import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyNodeChanges, applyEdgeChanges, addEdge, MarkerType } from '@xyflow/react'; 
import type { NodeChange, EdgeChange, Connection, Edge } from '@xyflow/react'; 

// 로직 임포트
import { executeDagreLayout } from '../logic/engineDagre';
import { groupSelectedNodes, ungroupSelectedNodes } from '../logic/nodeOperations';
import { extractSelectedFlowData, createSnapshot, parseImportedFlowData } from '../logic/snapshotManager';

export interface Snapshot {
  id: string;
  name: string;
  timestamp: number;
  nodes: any[];
  edges: any[];
}

interface HistoryEntry {
  nodes: any[];
  edges: any[];
}

const MAX_HISTORY = 50;

interface FlowState {
  nodes: any[];
  edges: any[];
  snapshots: Snapshot[];
  searchTerm: string;
  cloudDocuments: any[];
  userId: string;
  past: HistoryEntry[];
  future: HistoryEntry[];
  
  currentDoc: { id: number | null; visibility: 'PRIVATE' | 'SHARED'; user_id: string | null } | null;
  sharingDoc: any | null;
  isTableView: boolean;
  isSelectMode: boolean;
  
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  importFlowData: (jsonString: string) => void;
  createGroupFromSelection: (groupLabel: string) => void;
  ungroupSelection: () => void;
  applyAutoLayout: (direction?: 'TB' | 'LR') => void;
  updateNodeData: (id: string, newData: any) => void;
  addConnectedNode: (parentId: string, isSubTask: boolean) => void;
  addBranchingNodes: (parentId: string) => void;
  addSiblingNode: (nodeId: string) => void;
  addNode: (node: any) => void;
  deleteSelected: () => void;
  clearAll: () => void;
  deleteNodeById: (id: string) => void;
  toggleGroupCollapse: (groupId: string) => void;
  saveSnapshot: (name: string) => void;
  loadSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  setCloudDocuments: (docs: any[]) => void;
  setSearchTerm: (term: string) => void;
  getSelectedFlowData: () => { json: string; count: number; isPartial: boolean };
  setNodes: (nodes: any[]) => void;
  setEdges: (edges: any[]) => void;
  setSnapshots: (snapshots: Snapshot[]) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
  setUserId: (id: string) => void;
  setCurrentDoc: (doc: any) => void;
  setSharingDoc: (doc: any) => void;
  setIsTableView: (val: boolean) => void;
  setIsSelectMode: (val: boolean) => void;
  resetFlow: () => void;
  undo: () => void;
  redo: () => void;
}

const TACTICAL_EDGE_PROPS = {
  animated: true,
  style: { stroke: 'var(--neon-blue)', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 15,
    height: 15,
    color: 'var(--neon-blue)',
  },
};

const MANTIS_NODES = [
  { id: "ui_client", type: "viewer", position: { x: 0, y: 0 }, data: { label: "Tactical Dashboard (UI)", description: "지휘관의 명령을 수신하는 웹/모바일 프론트엔드 인터페이스.", symbolType: 'terminal' } },
  { id: "api_gateway", type: "viewer", position: { x: 0, y: 0 }, data: { label: "API Gateway", description: "모든 인바운드 트래픽을 통제하고 라우팅하는 방화벽 겸 게이트웨이.", symbolType: 'process' } },
  { id: "auth_service", type: "viewer", position: { x: 0, y: 0 }, data: { label: "Auth & Session DB", description: "지휘관의 접근 권한을 검증하고 세션을 유지하는 보안 데이터베이스.", symbolType: 'data' } },
  { id: "orchestrator", type: "viewer", position: { x: 0, y: 0 }, data: { label: "LLM Orchestrator", description: "프롬프트를 정제하고 컨텍스트를 조립하는 두뇌 역할의 코어 서버.", symbolType: 'process' } },
  { id: "vector_db", type: "viewer", position: { x: 0, y: 0 }, data: { label: "Vector Knowledge Base", description: "과거의 전술 스냅샷과 지식 임베딩이 저장된 고차원 벡터 저장소.", symbolType: 'data' } },
  { id: "inference_engine", type: "viewer", position: { x: 0, y: 0 }, data: { label: "Neural Inference Engine", description: "실제 생성형 AI 연산이 이루어지는 고성능 GPU 클러스터.", symbolType: 'process' } }
];

const MANTIS_EDGES: Edge[] = [
  { id: "e1", source: "ui_client", target: "api_gateway", ...TACTICAL_EDGE_PROPS },
  { id: "e2", source: "api_gateway", target: "auth_service", ...TACTICAL_EDGE_PROPS },
  { id: "e3", source: "api_gateway", target: "orchestrator", ...TACTICAL_EDGE_PROPS },
  { id: "e4", source: "orchestrator", target: "vector_db", ...TACTICAL_EDGE_PROPS },
  { id: "e5", source: "orchestrator", target: "inference_engine", ...TACTICAL_EDGE_PROPS }
];

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      nodes: MANTIS_NODES,
      edges: MANTIS_EDGES,
      snapshots: [{ id: "mantis-initial", name: "MANTIS_INITIAL_DEPLOY", timestamp: Date.now(), nodes: MANTIS_NODES, edges: MANTIS_EDGES }],
      cloudDocuments: [],
      userId: 'guest',
      currentDoc: null,
      sharingDoc: null,
      isTableView: false,
      isSelectMode: false,
      searchTerm: '',
      past: [],
      future: [],

      undo: () => {
        const { past, nodes, edges, future } = get();
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        set({ past: past.slice(0, -1), nodes: previous.nodes, edges: previous.edges, future: [{ nodes, edges }, ...future].slice(0, MAX_HISTORY) });
      },
      redo: () => {
        const { past, nodes, edges, future } = get();
        if (future.length === 0) return;
        const next = future[0];
        set({ past: [...past, { nodes, edges }].slice(-MAX_HISTORY), nodes: next.nodes, edges: next.edges, future: future.slice(1) });
      },
      onNodesChange: (changes) => {
        const shouldRecord = changes.some((c) => c.type === 'remove' || (c.type === 'position' && (c as any).dragging === false));
        const { nodes, edges, past } = get();
        set({ nodes: applyNodeChanges(changes, nodes), ...(shouldRecord ? { past: [...past, { nodes, edges }].slice(-MAX_HISTORY), future: [] } : {}) });
      },
      onEdgesChange: (changes) => {
        const shouldRecord = changes.some((c) => c.type === 'remove');
        const { nodes, edges, past } = get();
        set({ edges: applyEdgeChanges(changes, edges), ...(shouldRecord ? { past: [...past, { nodes, edges }].slice(-MAX_HISTORY), future: [] } : {}) });
      },
      importFlowData: (jsonString) => {
        const { nodes: importedNodes, edges: importedEdges, error } = parseImportedFlowData(jsonString);
        if (error) { alert(error); } 
        else {
          const { nodes, edges, past } = get();
          const standardizedEdges = importedEdges.map(e => ({ ...e, ...TACTICAL_EDGE_PROPS }));
          set({ nodes: importedNodes, edges: standardizedEdges, past: [...past, { nodes, edges }].slice(-MAX_HISTORY), future: [] });
        }
      },
      createGroupFromSelection: (groupLabel) => {
        try {
          const { nodes, edges, past } = get();
          const newNodes = groupSelectedNodes(nodes, groupLabel);
          set({ nodes: newNodes, past: [...past, { nodes, edges }].slice(-MAX_HISTORY), future: [] });
        } catch(e: any) { alert(e.message); }
      },
      ungroupSelection: () => {
        try {
          const { nodes, edges, past } = get();
          const newNodes = ungroupSelectedNodes(nodes);
          set({ nodes: newNodes, past: [...past, { nodes, edges }].slice(-MAX_HISTORY), future: [] });
        } catch(e: any) { alert(e.message); }
      },
      applyAutoLayout: (direction = 'TB') => {
        const layoutedNodes = executeDagreLayout(get().nodes, get().edges, direction);
        set({ nodes: layoutedNodes });
      },
      updateNodeData: (id, newData) => {
        const { nodes, edges, past } = get();
        set({
          nodes: nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, ...newData } } : node),
          past: [...past, { nodes, edges }].slice(-MAX_HISTORY),
          future: [],
        });
      },
      addConnectedNode: (parentId, isSubTask = false) => {
        const { nodes, edges, past, applyAutoLayout } = get();
        
        // 🚀 지휘관 지침: [+] 버튼(isSubTask: false)은 무조건 흐름이다!
        // 부모로부터 나가는 기존 엣지들을 모두 찾아냄
        const outgoingEdges = edges.filter(e => e.source === parentId);
        
        const newNodeId = `node-${Date.now()}`;
        const newNode = {
          id: newNodeId,
          type: 'viewer',
          position: { x: 0, y: 0 },
          data: { 
            label: isSubTask ? 'New Sub-task' : 'Inserted Step', 
            description: '', 
            symbolType: 'process',
            isSubTask
          },
        };

        let newEdges = [...edges];

        if (outgoingEdges.length > 0 && !isSubTask) {
          // 🛠 중간 삽입(Insertion) 모드 가동!
          // 1. 부모에서 나가던 기존 선들을 모두 끊음
          newEdges = newEdges.filter(e => e.source !== parentId);
          
          // 2. 부모 -> 새 노드 연결
          const edgeToNew = { id: `e-in-${Date.now()}`, source: parentId, target: newNodeId, ...TACTICAL_EDGE_PROPS };
          newEdges.push(edgeToNew);
          
          // 3. 새 노드 -> 기존 자식들 연결 (흐름 계승)
          outgoingEdges.forEach((oldEdge, idx) => {
            const edgeFromNew = { 
              id: `e-out-${Date.now()}-${idx}`, 
              source: newNodeId, 
              target: oldEdge.target, 
              ...TACTICAL_EDGE_PROPS,
              label: oldEdge.label // 기존 라벨 승계
            };
            newEdges.push(edgeFromNew);
          });
        } else {
          // 자식이 없거나 분기(>) 버튼인 경우 -> 일반적인 연결 추가
          const newEdge = { id: `e-${Date.now()}`, source: parentId, target: newNodeId, ...TACTICAL_EDGE_PROPS };
          newEdges.push(newEdge);
        }

        set({ 
          nodes: [...nodes, newNode], 
          edges: newEdges, 
          past: [...past, { nodes, edges }].slice(-MAX_HISTORY), 
          future: [] 
        });

        applyAutoLayout('LR');
      },

      addBranchingNodes: (parentId) => {
        const { nodes, edges, past, applyAutoLayout } = get();
        const timestamp = Date.now();
        
        // 🚀 지휘관 지침: 분기 생성 시 기존 흐름을 일시 정지(끊기)하고 지휘관의 재연결을 기다린다!
        
        // 1. 기존 자식들과의 연결(Edge)을 모두 찾아내어 제거 목록에 포함
        const newEdges = edges.filter(e => e.source !== parentId);
        
        // 2. 새로운 분기 노드 2개 생성
        const branchNodes = [
          {
            id: `node-${timestamp}-A`,
            type: 'viewer',
            position: { x: 0, y: 0 },
            data: { label: 'BRANCH_PATH_A', description: '전술 분기 경로 A', symbolType: 'decision', isSubTask: true, isBranch: true }
          },
          {
            id: `node-${timestamp}-B`,
            type: 'viewer',
            position: { x: 0, y: 0 },
            data: { label: 'BRANCH_PATH_B', description: '전술 분기 경로 B', symbolType: 'decision', isSubTask: true, isBranch: true }
          }
        ];

        // 3. 부모 -> 새 분기 노드들로만 연결 (기존 자식들은 이제 미지정 상태가 됨)
        branchNodes.forEach(node => {
          newEdges.push({
            id: `e-${timestamp}-${node.id}`,
            source: parentId,
            target: node.id,
            ...TACTICAL_EDGE_PROPS,
            style: { stroke: '#ff9800', strokeWidth: 3, animated: true }
          });
        });

        set({ 
          nodes: [...nodes, ...branchNodes], 
          edges: newEdges,
          past: [...past, { nodes, edges }].slice(-MAX_HISTORY), 
          future: [] 
        });

        applyAutoLayout('LR');
      },
      addSiblingNode: (nodeId) => {
        const { nodes, edges, past, applyAutoLayout } = get();
        const parentEdge = edges.find(e => e.target === nodeId);
        const parentId = parentEdge ? parentEdge.source : null;
        const newNodeId = `node-${Date.now()}`;
        const newNode = {
          id: newNodeId,
          type: 'viewer',
          position: { x: 0, y: 0 },
          data: { label: 'New Parallel Step', description: '', symbolType: 'process' },
        };
        let newEdges = [...edges];
        if (parentId) {
          const edgeId = `e-${Date.now()}`;
          const newEdge = { id: edgeId, source: parentId, target: newNodeId, ...TACTICAL_EDGE_PROPS };
          newEdges = addEdge(newEdge, edges);
        }
        set({ nodes: [...nodes, newNode], edges: newEdges, past: [...past, { nodes, edges }].slice(-MAX_HISTORY), future: [] });
        applyAutoLayout('LR');
      },
      addNode: (node) => {
        const { nodes, edges, past } = get();
        set({ nodes: [...nodes, node], past: [...past, { nodes, edges }].slice(-MAX_HISTORY), future: [] });
      },
      deleteSelected: () => {
        const { nodes, edges, past } = get();
        set({ nodes: nodes.filter(n => !n.selected), edges: edges.filter(e => !e.selected), past: [...past, { nodes, edges }].slice(-MAX_HISTORY), future: [] });
      },
      clearAll: () => {
        const { nodes, edges, past } = get();
        set({ nodes: [], edges: [], past: [...past, { nodes, edges }].slice(-MAX_HISTORY), future: [] });
      },
      deleteNodeById: (id) => {
        const { nodes, edges, past } = get();
        set({ nodes: nodes.filter(n => n.id !== id), edges: edges.filter(e => e.source !== id && e.target !== id), past: [...past, { nodes, edges }].slice(-MAX_HISTORY), future: [] });
      },
      
      // 🚀 두 노드를 강제로 연결 (집결 로직)
      linkNodes: (sourceId, targetId) => {
        const { nodes, edges, past } = get();
        if (sourceId === targetId) return; // 자기 자신 연결 방지
        
        // 이미 연결되어 있는지 확인
        if (edges.some(e => e.source === sourceId && e.target === targetId)) return;

        const newEdge = { 
          id: `e-link-${Date.now()}`, 
          source: sourceId, 
          target: targetId, 
          ...TACTICAL_EDGE_PROPS,
          style: { stroke: '#a855f7', strokeWidth: 2, animated: true } // 집결선은 보라색
        };

        set({
          edges: [...edges, newEdge],
          past: [...past, { nodes, edges }].slice(-MAX_HISTORY),
          future: []
        });
      },
      toggleGroupCollapse: (groupId) => {
        set((state) => {
          const groupNode = state.nodes.find(n => n.id === groupId);
          if (!groupNode) return state;
          const willCollapse = !groupNode.data.isCollapsed;
          const childNodeIds = state.nodes.filter(n => n.parentId === groupId).map(n => n.id);
          const newNodes = state.nodes.map(n => {
            if (n.id === groupId) {
              const originalStyle = n.data.isCollapsed ? (n.data.originalStyle || { width: 250, height: 150 }) : { width: n.style?.width || 250, height: n.style?.height || 150 };
              return { ...n, style: willCollapse ? { width: 200, height: 60 } : { width: originalStyle.width, height: originalStyle.height }, data: { ...n.data, isCollapsed: willCollapse, originalStyle: willCollapse ? originalStyle : n.data.originalStyle } };
            }
            if (childNodeIds.includes(n.id)) return { ...n, hidden: willCollapse };
            return n;
          });
          const newEdges = state.edges.map(e => {
            const sourceIsChild = childNodeIds.includes(e.source);
            const targetIsChild = childNodeIds.includes(e.target);
            if (willCollapse) {
              if (sourceIsChild || targetIsChild) {
                if (sourceIsChild && targetIsChild) return { ...e, hidden: true };
                return { ...e, data: { ...e.data, originalSource: sourceIsChild ? e.source : (e.data?.originalSource || e.source), originalTarget: targetIsChild ? e.target : (e.data?.originalTarget || e.target) }, source: sourceIsChild ? groupId : e.source, target: targetIsChild ? groupId : e.target };
              }
            } else {
              if (sourceIsChild && targetIsChild && e.hidden) { const restored = { ...e }; delete restored.hidden; return restored; }
              if (e.source === groupId || e.target === groupId) {
                const oS = e.data?.originalSource; const oT = e.data?.originalTarget;
                if (oS || oT) { const restoredData = { ...e.data }; delete restoredData.originalSource; delete restoredData.originalTarget; return { ...e, source: oS || e.source, target: oT || e.target, data: restoredData }; }
              }
            }
            return e;
          });
          return { nodes: newNodes, edges: newEdges };
        });
      },
      saveSnapshot: (name) => { const s = get(); set({ snapshots: [...s.snapshots, createSnapshot(name, s.nodes, s.edges)] }); },
      loadSnapshot: (id) => { const s = get(); const t = s.snapshots.find(x => x.id === id); if (t) set({ nodes: t.nodes, edges: t.edges }); },
      deleteSnapshot: (id) => { set({ snapshots: get().snapshots.filter(s => s.id !== id) }); },
      setSearchTerm: (term) => set({ searchTerm: term }),
      getSelectedFlowData: () => extractSelectedFlowData(get().nodes, get().edges),
      setNodes: (n) => set({ nodes: n }),
      setEdges: (e) => set({ edges: e }),
      setSnapshots: (s) => set({ snapshots: s }),
      setCloudDocuments: (d) => set({ cloudDocuments: d }),
      updateEdgeLabel: (id, label) => {
        set((s) => ({ edges: s.edges.map((e) => e.id === id ? { ...e, label, labelStyle: { fill: '#e2e8f0', fontWeight: 'bold', fontSize: 12 }, labelBgStyle: { fill: 'rgba(30, 41, 59, 0.95)', stroke: '#00e5ff', strokeWidth: 1.5 }, labelBgPadding: [8, 4], labelBgBorderRadius: 4 } : e) }));
      },
      setUserId: (id) => set({ userId: id }),
      setCurrentDoc: (doc) => set({ currentDoc: doc }),
      setSharingDoc: (doc) => set({ sharingDoc: doc }),
      setIsTableView: (v) => set({ isTableView: v }),
      setIsSelectMode: (v) => set({ isSelectMode: v }),
      resetFlow: () => set({ nodes: [], edges: [], snapshots: [], cloudDocuments: [], currentDoc: null, searchTerm: '', past: [], future: [] }),
    }),
    { name: 'flowchart-storage', partialize: (s) => ({ nodes: s.nodes, edges: s.edges, snapshots: s.snapshots, cloudDocuments: s.cloudDocuments, userId: s.userId, searchTerm: s.searchTerm }) }
  )
);
