// 04-products/variants.js
console.log('📄 04-products/variants page loaded');

export function init() {
    console.log('04-products/variants initialized');
    
    const saved = localStorage.getItem('variant_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载变体数据:', data.length);
            if (typeof window.VariantModule !== 'undefined') {
                window.VariantModule.variants = data;
                window.VariantModule.render();
            }
        } catch (e) {
            console.warn('加载变体数据失败');
        }
    }
}

export function getVariants() {
    try {
        const data = localStorage.getItem('variant_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function addVariant(variant) {
    try {
        const variants = getVariants();
        variants.push(variant);
        localStorage.setItem('variant_data', JSON.stringify(variants));
        return true;
    } catch (e) {
        return false;
    }
}

export function updateVariant(id, data) {
    try {
        const variants = getVariants();
        const index = variants.findIndex(v => v.id === id);
        if (index >= 0) {
            variants[index] = { ...variants[index], ...data };
            localStorage.setItem('variant_data', JSON.stringify(variants));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function deleteVariant(id) {
    try {
        const variants = getVariants();
        const filtered = variants.filter(v => v.id !== id);
        localStorage.setItem('variant_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getVariants,
    addVariant,
    updateVariant,
    deleteVariant
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('04-products/variants DOM ready');
    init();
});