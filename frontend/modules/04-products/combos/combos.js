// 04-products/combos.js
console.log('📄 04-products/combos page loaded');

export function init() {
    console.log('04-products/combos initialized');
    
    const saved = localStorage.getItem('combo_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载组合数据:', data.length);
            if (typeof window.ComboModule !== 'undefined') {
                window.ComboModule.combos = data;
                window.ComboModule.render();
            }
        } catch (e) {
            console.warn('加载组合数据失败');
        }
    }
}

export function getCombos() {
    try {
        const data = localStorage.getItem('combo_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function addCombo(combo) {
    try {
        const combos = getCombos();
        combos.push(combo);
        localStorage.setItem('combo_data', JSON.stringify(combos));
        return true;
    } catch (e) {
        return false;
    }
}

export function updateCombo(id, data) {
    try {
        const combos = getCombos();
        const index = combos.findIndex(c => c.id === id);
        if (index >= 0) {
            combos[index] = { ...combos[index], ...data };
            localStorage.setItem('combo_data', JSON.stringify(combos));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function deleteCombo(id) {
    try {
        const combos = getCombos();
        const filtered = combos.filter(c => c.id !== id);
        localStorage.setItem('combo_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getCombos,
    addCombo,
    updateCombo,
    deleteCombo
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('04-products/combos DOM ready');
    init();
});