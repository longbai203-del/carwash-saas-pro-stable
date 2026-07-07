// 04-products/brands.js
console.log('📄 04-products/brands page loaded');

export function init() {
    console.log('04-products/brands initialized');
    
    const saved = localStorage.getItem('brand_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载品牌数据:', data.length);
            if (typeof window.BrandModule !== 'undefined') {
                window.BrandModule.brands = data;
                window.BrandModule.filteredBrands = [...data];
                window.BrandModule.render();
            }
        } catch (e) {
            console.warn('加载品牌数据失败');
        }
    }
}

export function getBrands() {
    try {
        const data = localStorage.getItem('brand_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function addBrand(brand) {
    try {
        const brands = getBrands();
        brands.push(brand);
        localStorage.setItem('brand_data', JSON.stringify(brands));
        return true;
    } catch (e) {
        return false;
    }
}

export function updateBrand(id, data) {
    try {
        const brands = getBrands();
        const index = brands.findIndex(b => b.id === id);
        if (index >= 0) {
            brands[index] = { ...brands[index], ...data };
            localStorage.setItem('brand_data', JSON.stringify(brands));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function deleteBrand(id) {
    try {
        const brands = getBrands();
        const filtered = brands.filter(b => b.id !== id);
        localStorage.setItem('brand_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getBrands,
    addBrand,
    updateBrand,
    deleteBrand
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('04-products/brands DOM ready');
    init();
});