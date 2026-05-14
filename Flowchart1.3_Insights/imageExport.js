import { state, dom } from './store.js';
import { showToast } from './aiExport.js';

export function getBestNodeText(nodeData) {
    const d = nodeData;
    if (d.type === 'Rectangle') return d.ui || d.logic || d.data_in || d.text;
    if (d.type === 'Diamond') return d.condition || d.text;
    if (d.type === 'Cylinder') return d.table || d.schema || d.text;
    if (d.type === 'Oval') return d.event || d.text;
    return d.text;
}

export async function capturePNG(mode = 'transparent') {
    if (state.nodes.length === 0) return alert('캡처할 내용이 없습니다.');
    
    const originalBtnText = state.captureBtn.textContent;
    state.captureBtn.textContent = '⌛';
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    state.nodes.forEach(n => {
        const d = n.data;
        const w = 150;
        const h = (d.type === 'Diamond' ? 90 : 60);
        minX = Math.min(minX, d.x);
        minY = Math.min(minY, d.y);
        maxX = Math.max(maxX, d.x + w);
        maxY = Math.max(maxY, d.y + h);
    });

    const padding = 60;
    const width = (maxX - minX) + padding * 2;
    const height = (maxY - minY) + padding * 2;

    const ui = document.getElementById('ui-overlay');
    const action = document.getElementById('action-menu');
    const grid = document.getElementById('grid-background');
    const originalBg = dom.transformer.style.background;
    
    ui.style.opacity = '0';
    action.style.opacity = '0';
    grid.style.display = 'none'; 

    if (mode === 'white') {
        dom.transformer.style.background = '#ffffff';
    } else {
        dom.transformer.style.background = 'transparent';
    }

    const originalTexts = new Map();
    state.nodes.forEach(nodeObj => {
        const span = nodeObj.el.querySelector('span');
        originalTexts.set(nodeObj.data.id, span.textContent);
        span.textContent = getBestNodeText(nodeObj.data);
        nodeObj.el.classList.add('is-capturing');
    });

    const options = {
        width: width,
        height: height,
        style: {
            transform: `translate(${-minX + padding}px, ${-minY + padding}px)`,
            'transform-origin': 'top left',
            background: mode === 'white' ? '#ffffff' : 'transparent'
        }
    };

    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const dataUrl = await domtoimage.toPng(dom.transformer, options);
        const link = document.createElement('a');
        link.download = `flowchart_professional_${mode}_${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
        showToast('전문가용 캡처 이미지가 생성되었습니다!');
    } catch (err) {
        console.error('Capture failed:', err);
        alert('캡처 성능 부하로 인해 실패했습니다. 요소를 줄이거나 다시 시도해 주세요.');
    } finally {
        ui.style.opacity = '1';
        action.style.opacity = '1';
        grid.style.display = 'block';
        dom.transformer.style.background = originalBg;
        state.captureBtn.textContent = originalBtnText;

        state.nodes.forEach(nodeObj => {
            const span = nodeObj.el.querySelector('span');
            span.textContent = originalTexts.get(nodeObj.data.id);
            nodeObj.el.classList.remove('is-capturing');
        });
    }
}

export function toggleCaptureMenu(e) {
    if (e) e.stopPropagation();
    state.captureMenu.classList.toggle('active');
}

export function handleCaptureMenuClick(e) {
    const item = e.target.closest('.capture-menu-item');
    if (item) {
        const mode = item.dataset.mode;
        capturePNG(mode);
        state.captureMenu.classList.remove('active');
    }
}

export function bindCaptureEvents() {
    state.captureBtn.addEventListener('click', toggleCaptureMenu);
    state.captureMenu.addEventListener('click', handleCaptureMenuClick);
}
