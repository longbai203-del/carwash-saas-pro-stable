// 04-products/categories.js
console.log('📄 04-products/categories page loaded');

export function init() {
    console.log('04-products/categories initialized');
    
    const saved = localStorage.getItem('category_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载分类数据:', data.length);
            if (typeof window.CategoryModule !== 'undefined') {
                window.CategoryModule.categories = data;
                window.CategoryModule.render();
            }
        } catch (e) {
            console.warn('加载分类数据失败');
        }
    }
}

export function getCategories() {
    try {
        const data = localStorage.getItem('category_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function addCategory(category) {
    try {
        const categories = getCategories();
        categories.push(category);
        localStorage.setItem('category_data', JSON.stringify(categories));
        return true;
    } catch (e) {
        return false;
    }
}

export function updateCategory(id, data) {
    try {
        const categories = getCategories();
        const index = categories.findIndex(c => c.id === id);
        if (index >= 0) {
            categories[index] = { ...categories[index], ...data };
            localStorage.setItem('category_data', JSON.stringify(categories));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function deleteCategory(id) {
    try {
        const categories = getCategories();
        const filtered = categories.filter(c => c.id !== id);
        localStorage.setItem('category_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export function getCategoriesByParent(parentId) {
    try {
        const categories = getCategories();
        return categories.filter(c => c.parent === parentId);
    } catch (e) {
        return [];
    }
}

export default {
    init,
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByParent
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('04-products/categories DOM ready');
    init();
});