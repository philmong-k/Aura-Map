import { getProjectList, loadProjectData, LIST_KEY, STORAGE_KEY } from '../storeHelpers';

export const createProjectSlice = (set, get) => ({
  currentProjectId: localStorage.getItem('aura-map-last-project-id') || 'default',
  currentProjectName: getProjectList().find(p => p.id === (localStorage.getItem('aura-map-last-project-id') || 'default'))?.name || '기본 프로젝트',
  projectList: getProjectList(),

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
    
    get().saveToStorage();
    get().syncToBackend(); 
  },

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

  deleteProject: (id) => {
    const list = getProjectList().filter(p => p.id !== id);
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
    localStorage.removeItem(`${STORAGE_KEY}-${id}`);
    set({ projectList: list });
    
    get().deleteFromBackend(id);
    
    if (get().currentProjectId === id) {
      set({ 
        currentProjectId: null,
        currentProjectName: '',
        nodes: [],
        edges: []
      });
    }
  },

  renameProject: (id, newName) => {
    if (!newName) return;
    const { currentProjectId, projectList } = get();
    
    const project = projectList.find(p => p.id === id);
    if (project?.isLocked) {
      alert('🔒 이 작전은 잠겨 있어 이름을 변경할 수 없습니다.');
      return;
    }

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

  toggleProjectLock: (id) => {
    const list = getProjectList();
    const index = list.findIndex(p => p.id === id);
    if (index > -1) {
      const newLockState = !list[index].isLocked;
      list[index].isLocked = newLockState;
      localStorage.setItem(LIST_KEY, JSON.stringify(list));
      set({ projectList: list });
      
      const projectData = loadProjectData(id);
      if (projectData) {
        projectData.isLocked = newLockState;
        localStorage.setItem(`${STORAGE_KEY}-${id}`, JSON.stringify(projectData));
      }

      get().syncToBackend(id);
    }
  },

  activateCTypePipeline: async () => {
    const blueprintId = 'proj-aura-master-plan-v3';
    const blueprintPath = '/canvas/scenario_c_blueprint.json';
    
    try {
      let data = loadProjectData(blueprintId);
      
      if (!data) {
        const bpRes = await fetch(blueprintPath);
        if (bpRes.ok) {
          data = await bpRes.json();
          localStorage.setItem(`${STORAGE_KEY}-${blueprintId}`, JSON.stringify({
            nodes: data.nodes,
            edges: data.edges,
            isLocked: true,
            lastModified: new Date().toISOString()
          }));
          
          const list = getProjectList();
          if (!list.find(p => p.id === blueprintId)) {
            list.unshift({
              id: blueprintId,
              name: '제국 설계도 V3 - C타입 파이프라인',
              lastModified: new Date().toISOString(),
              isLocked: true,
              isRemote: true
            });
            localStorage.setItem(LIST_KEY, JSON.stringify(list));
            set({ projectList: list });
          }
        }
      }

      if (data) {
        set({
          nodes: data.nodes,
          edges: data.edges,
          currentProjectId: blueprintId,
          currentProjectName: '제국 설계도 V3 - C타입 파이프라인'
        });
      localStorage.setItem('aura-map-last-project-id', blueprintId);
        console.log('🚀 C타입 전술 파이프라인 가동 완료');
      }
    } catch (error) {
      console.error('Pipeline Activation Failed', error);
    }
  },

  toggleProjectPin: (id) => {
    const list = getProjectList();
    const index = list.findIndex(p => p.id === id);
    if (index > -1) {
      list[index].isPinned = !list[index].isPinned;
      localStorage.setItem(LIST_KEY, JSON.stringify(list));
      set({ projectList: list });
    }
  },

  exportAllTacticalData: () => {
    const list = getProjectList();
    const allData = {
      projectList: list,
      projects: {},
      templates: JSON.parse(localStorage.getItem('aura-map-templates')) || []
    };
    
    list.forEach(p => {
      const data = loadProjectData(p.id);
      if (data) {
        allData.projects[p.id] = data;
      }
    });
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `Aura_Tactical_Backup_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importAllTacticalData: (data) => {
    if (!data.projectList || !data.projects) return false;
    
    try {
      // 1. 프로젝트 목록 저장
      localStorage.setItem(LIST_KEY, JSON.stringify(data.projectList));
      
      // 2. 개별 프로젝트 데이터 저장
      Object.keys(data.projects).forEach(id => {
        localStorage.setItem(`${STORAGE_KEY}-${id}`, JSON.stringify(data.projects[id]));
      });
      
      // 3. 템플릿 저장 (UI 슬라이스 데이터 포함)
      if (data.templates) {
        localStorage.setItem('aura-map-templates', JSON.stringify(data.templates));
      }
      
      // 4. 스토어 상태 즉시 갱신
      set({ 
        projectList: data.projectList,
        tacticalTemplates: data.templates || get().tacticalTemplates
      });
      
      // 5. 현재 프로젝트 로드 시도 (백업 당시의 마지막 프로젝트)
      const lastId = localStorage.getItem('aura-map-last-project-id');
      if (lastId && data.projects[lastId]) {
        get().loadProject(lastId);
      } else if (data.projectList.length > 0) {
        get().loadProject(data.projectList[0].id);
      }
      
      return true;
    } catch (err) {
      console.error('Import Failed:', err);
      return false;
    }
  },
});
