import { create } from 'zustand';
import { createProjectSlice } from './slices/projectSlice';
import { createTacticalSlice } from './slices/tacticalSlice';
import { createSyncSlice } from './slices/syncSlice';
import { createUiSlice } from './slices/uiSlice';
import { loadProjectData } from './storeHelpers';

const lastProjectId = localStorage.getItem('aura-map-last-project-id');
const lastProject = lastProjectId ? loadProjectData(lastProjectId) : null;

const useStore = create((set, get) => ({
  // 1. 초기 상태 주입 (슬라이스에서 공통으로 쓰거나 초기화가 필요한 값들)
  ...createProjectSlice(set, get),
  ...createTacticalSlice(set, get),
  ...createSyncSlice(set, get),
  ...createUiSlice(set, get),

  // 2. 초기 노드/에지 데이터 덮어쓰기 (lastProject 기준)
  nodes: lastProject?.nodes || [
    {
      id: 'root-1',
      type: 'tactical',
      position: { x: 250, y: 250 },
      data: { label: '🚀 작전 시작', shape: 'terminal' }
    }
  ],
  edges: lastProject?.edges || [],
}));

export default useStore;
