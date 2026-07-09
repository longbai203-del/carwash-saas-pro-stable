// 02-pos/returns.js
console.log('📄 02-pos/returns page loaded');

export function init() {
    console.log('02-pos/returns initialized');
    
    // 加载退货数据
    const saved = localStorage.getItem('return_history');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载退货数据:', data.length);
            if (typeof window.ReturnModule !== 'undefined') {
                window.ReturnModule.returns = data;
                window.ReturnModule.renderHistory();
            }
        } catch (e) {
            console.warn('加载退货数据失败');
        }
    }
}

export function getReturnHistory() {
    try {
        const data = localStorage.getItem('return_history');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function addReturnRecord(record) {
    try {
        const history = getReturnHistory();
        history.push(record);
        localStorage.setItem('return_history', JSON.stringify(history));
        return true;
    } catch (e) {
        return false;
    }
}

export function updateReturnStatus(id, status) {
    try {
        const history = getReturnHistory();
        const record = history.find(r => r.id === id);
        if (record) {
            record.status = status;
            localStorage.setItem('return_history', JSON.stringify(history));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function getReturnById(id) {
    try {
        const history = getReturnHistory();
        return history.find(r => r.id === id) || null;
    } catch (e) {
        return null;
    }
}

export function getPendingReturns() {
    try {
        const history = getReturnHistory();
        return history.filter(r => r.status === 'pending' || r.status === 'processing');
    } catch (e) {
        return [];
    }
}

export default {
    init,
    getReturnHistory,
    addReturnRecord,
    updateReturnStatus,
    getReturnById,
    getPendingReturns
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('02-pos/returns DOM ready');
    init();
});