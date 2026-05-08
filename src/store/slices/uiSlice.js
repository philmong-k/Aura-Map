export const createUiSlice = (set, get) => ({
  multiSelectMode: false,
  isLegendOpen: false,
  
  setIsLegendOpen: (isOpen) => set({ isLegendOpen: isOpen }),

  setMultiSelectMode: (mode) => {
    if (!mode) {
      set((state) => ({
        multiSelectMode: false,
        tacticalSelection: [],
        nodes: state.nodes.map(n => ({ ...n, selected: false }))
      }));
      get().saveToStorage(true);
    } else {
      set({ multiSelectMode: true });
    }
  },

  tacticalTemplates: JSON.parse(localStorage.getItem('aura-map-templates')) || [
    { id: 't1', name: '기본 진행 상태', options: '대기,진행중,완료,보류' },
    { id: 't2', name: '우선순위', options: '낮음,보통,높음,긴급' }
  ],

  sheetLayoutTemplates: JSON.parse(localStorage.getItem('aura-map-layout-templates')) || [
    { 
      id: 'l1', 
      name: '기본 보급 장부', 
      columns: [
        { id: 'c1', name: '품명', type: 'text' },
        { id: 'c2', name: '단가', type: 'number' },
        { id: 'c3', name: '수량', type: 'number' },
        { id: 'c4', name: '소계', type: 'formula', formula: '(c2 * c3)' }
      ]
    }
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

  addSheetLayoutTemplate: (name, columns) => {
    const newLayout = { id: `l-${Date.now()}`, name, columns };
    set((state) => {
      const updated = [...state.sheetLayoutTemplates, newLayout];
      localStorage.setItem('aura-map-layout-templates', JSON.stringify(updated));
      return { sheetLayoutTemplates: updated };
    });
    return true;
  },

  deleteSheetLayoutTemplate: (id) => {
    set((state) => {
      const updated = state.sheetLayoutTemplates.filter(l => l.id !== id);
      localStorage.setItem('aura-map-layout-templates', JSON.stringify(updated));
      return { sheetLayoutTemplates: updated };
    });
  },
});
