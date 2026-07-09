// 03-orders/refunds.js
console.log('📄 03-orders/refunds page loaded');

export function init() {
    console.log('03-orders/refunds initialized');
    
    // 加载退款数据
    const saved = localStorage.getItem('refund_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载退款数据:', data.length);
            if (typeof window.RefundModule !== 'undefined') {
                window.RefundModule.refunds = data;
                window.RefundModule.filteredRefunds = [...data];
                window.RefundModule.render();
            }
        } catch (e) {
            console.warn('加载退款数据失败');
        }
    }
}

export function getRefunds() {
    try {
        const data = localStorage.getItem('refund_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function addRefund(refund) {
    try {
        const refunds = getRefunds();
        refunds.push(refund);
        localStorage.setItem('refund_data', JSON.stringify(refunds));
        return true;
    } catch (e) {
        return false;
    }
}

export function updateRefund(id, data) {
    try {
        const refunds = getRefunds();
        const index = refunds.findIndex(r => r.id === id);
        if (index >= 0) {
            refunds[index] = { ...refunds[index], ...data };
            localStorage.setItem('refund_data', JSON.stringify(refunds));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function deleteRefund(id) {
    try {
        const refunds = getRefunds();
        const filtered = refunds.filter(r => r.id !== id);
        localStorage.setItem('refund_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getRefunds,
    addRefund,
    updateRefund,
    deleteRefund
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('03-orders/refunds DOM ready');
    init();
});