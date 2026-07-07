// 04-products/price-lists.js
console.log('📄 04-products/price-lists page loaded');

export function init() {
    console.log('04-products/price-lists initialized');
    
    const saved = localStorage.getItem('pricelist_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载价格表数据:', data.length);
            if (typeof window.PriceListModule !== 'undefined') {
                window.PriceListModule.priceLists = data;
                window.PriceListModule.render();
            }
        } catch (e) {
            console.warn('加载价格表数据失败');
        }
    }
}

export function getPriceLists() {
    try {
        const data = localStorage.getItem('pricelist_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function addPriceList(pricelist) {
    try {
        const priceLists = getPriceLists();
        priceLists.push(pricelist);
        localStorage.setItem('pricelist_data', JSON.stringify(priceLists));
        return true;
    } catch (e) {
        return false;
    }
}

export function updatePriceList(id, data) {
    try {
        const priceLists = getPriceLists();
        const index = priceLists.findIndex(p => p.id === id);
        if (index >= 0) {
            priceLists[index] = { ...priceLists[index], ...data };
            localStorage.setItem('pricelist_data', JSON.stringify(priceLists));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function deletePriceList(id) {
    try {
        const priceLists = getPriceLists();
        const filtered = priceLists.filter(p => p.id !== id);
        localStorage.setItem('pricelist_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getPriceLists,
    addPriceList,
    updatePriceList,
    deletePriceList
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('04-products/price-lists DOM ready');
    init();
});