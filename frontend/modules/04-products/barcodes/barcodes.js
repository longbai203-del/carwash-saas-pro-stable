// 04-products/barcodes.js
console.log('📄 04-products/barcodes page loaded');

export function init() {
    console.log('04-products/barcodes initialized');
    
    const saved = localStorage.getItem('barcode_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载条码数据:', data.length);
            if (typeof window.BarcodeModule !== 'undefined') {
                window.BarcodeModule.barcodes = data;
                window.BarcodeModule.filteredBarcodes = [...data];
                window.BarcodeModule.render();
            }
        } catch (e) {
            console.warn('加载条码数据失败');
        }
    }
}

export function getBarcodes() {
    try {
        const data = localStorage.getItem('barcode_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function addBarcode(barcode) {
    try {
        const barcodes = getBarcodes();
        barcodes.push(barcode);
        localStorage.setItem('barcode_data', JSON.stringify(barcodes));
        return true;
    } catch (e) {
        return false;
    }
}

export function updateBarcode(id, data) {
    try {
        const barcodes = getBarcodes();
        const index = barcodes.findIndex(b => b.id === id);
        if (index >= 0) {
            barcodes[index] = { ...barcodes[index], ...data };
            localStorage.setItem('barcode_data', JSON.stringify(barcodes));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function deleteBarcode(id) {
    try {
        const barcodes = getBarcodes();
        const filtered = barcodes.filter(b => b.id !== id);
        localStorage.setItem('barcode_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getBarcodes,
    addBarcode,
    updateBarcode,
    deleteBarcode
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('04-products/barcodes DOM ready');
    init();
});