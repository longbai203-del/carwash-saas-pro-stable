// 04-products/modifiers.js
console.log('📄 04-products/modifiers page loaded');

export function init() {
    console.log('04-products/modifiers initialized');
    
    const saved = localStorage.getItem('modifier_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载附加项数据:', data.length);
            if (typeof window.ModifierModule !== 'undefined') {
                window.ModifierModule.modifiers = data;
                window.ModifierModule.render();
            }
        } catch (e) {
            console.warn('加载附加项数据失败');
        }
    }
}

export function getModifiers() {
    try {
        const data = localStorage.getItem('modifier_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function addModifier(modifier) {
    try {
        const modifiers = getModifiers();
        modifiers.push(modifier);
        localStorage.setItem('modifier_data', JSON.stringify(modifiers));
        return true;
    } catch (e) {
        return false;
    }
}

export function updateModifier(id, data) {
    try {
        const modifiers = getModifiers();
        const index = modifiers.findIndex(m => m.id === id);
        if (index >= 0) {
            modifiers[index] = { ...modifiers[index], ...data };
            localStorage.setItem('modifier_data', JSON.stringify(modifiers));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function deleteModifier(id) {
    try {
        const modifiers = getModifiers();
        const filtered = modifiers.filter(m => m.id !== id);
        localStorage.setItem('modifier_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getModifiers,
    addModifier,
    updateModifier,
    deleteModifier
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('04-products/modifiers DOM ready');
    init();
});