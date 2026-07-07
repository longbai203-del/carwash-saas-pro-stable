// 03-orders/returns.js
console.log('📄 03-orders/returns page loaded');

export function init() {
    console.log('03-orders/returns initialized');
    
    // 加载退货数据
    const saved = localStorage.getItem('return_order_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载退货数据:', data.length);
            if (typeof window.ReturnOrderModule !== 'undefined') {
                window.ReturnOrderModule.returns = data;
                window.ReturnOrderModule.filteredReturns = [...data];
                window.ReturnOrderModule.render();
            }
        } catch (e) {
            console.warn('加载退货数据失败');
        }
    }
}

export function getReturns() {
    try {
        const data = localStorage.getItem('return_order_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function addReturn(returnRecord) {
    try {
        const returns = getReturns();
        returns.push(returnRecord);
        localStorage.setItem('return_order_data', JSON.stringify(returns));
        return true;
    } catch (e) {
        return false;
    }
}

export function updateReturn(id, data) {
    try {
        const returns = getReturns();
        const index = returns.findIndex(r => r.id === id);
        if (index >= 0) {
            returns[index] = { ...returns[index], ...data };
            localStorage.setItem('return_order_data', JSON.stringify(returns));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function deleteReturn(id) {
    try {
        const returns = getReturns();
        const filtered = returns.filter(r => r.id !== id);
        localStorage.setItem('return_order_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export function getReturnsByStatus(status) {
    try {
        const returns = getReturns();
        return returns.filter(r => r.status === status);
    } catch (e) {
        return [];
    }
}

export default {
    init,
    getReturns,
    addReturn,
    updateReturn,
    deleteReturn,
    getReturnsByStatus
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('03-orders/returns DOM ready');
    init();
});