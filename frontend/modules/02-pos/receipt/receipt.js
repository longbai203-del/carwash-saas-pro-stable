// 02-pos/receipt.js
console.log('📄 02-pos/receipt page loaded');

export function init() {
    console.log('02-pos/receipt initialized');
    
    // 加载小票数据
    const saved = localStorage.getItem('receipt_history');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载小票历史:', data.length);
            if (typeof window.ReceiptModule !== 'undefined') {
                window.ReceiptModule.receipts = data;
                window.ReceiptModule.updateHistory();
            }
        } catch (e) {
            console.warn('加载小票历史失败');
        }
    }
    
    // 加载打印设置
    const settings = getPrintSettings();
    if (settings && typeof window.ReceiptModule !== 'undefined') {
        const printerSelect = document.getElementById('printerSelect');
        if (printerSelect) printerSelect.value = settings.printer || 'default';
        const formatSelect = document.getElementById('receiptFormat');
        if (formatSelect) formatSelect.value = settings.format || 'standard';
        const copySelect = document.getElementById('copyCount');
        if (copySelect) copySelect.value = settings.copies || '1';
    }
}

export function getReceiptHistory() {
    try {
        const data = localStorage.getItem('receipt_history');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function saveReceipt(receipt) {
    try {
        const history = getReceiptHistory();
        history.push(receipt);
        localStorage.setItem('receipt_history', JSON.stringify(history));
        return true;
    } catch (e) {
        return false;
    }
}

export function getPrintSettings() {
    try {
        const data = localStorage.getItem('receipt_print_settings');
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
}

export function savePrintSettings(settings) {
    try {
        localStorage.setItem('receipt_print_settings', JSON.stringify(settings));
        return true;
    } catch (e) {
        return false;
    }
}

export function deleteReceipt(id) {
    try {
        let history = getReceiptHistory();
        history = history.filter(r => r.id !== id);
        localStorage.setItem('receipt_history', JSON.stringify(history));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getReceiptHistory,
    saveReceipt,
    getPrintSettings,
    savePrintSettings,
    deleteReceipt
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('02-pos/receipt DOM ready');
    init();
});