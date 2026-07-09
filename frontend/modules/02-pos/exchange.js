// 02-pos/exchange.js
console.log('📄 02-pos/exchange page loaded');

export function init() {
    console.log('02-pos/exchange initialized');
    
    // 加载换货数据
    const saved = localStorage.getItem('exchange_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载换货数据:', data);
        } catch (e) {
            console.warn('加载换货数据失败');
        }
    }
    
    // 加载换货历史
    const history = getExchangeHistory();
    if (history.length > 0 && typeof window.ExchangeModule !== 'undefined') {
        window.ExchangeModule.exchanges = history;
        window.ExchangeModule.renderHistory();
    }
}

export function getExchangeHistory() {
    try {
        const data = localStorage.getItem('exchange_history');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function addExchangeRecord(record) {
    try {
        const history = getExchangeHistory();
        history.push(record);
        localStorage.setItem('exchange_history', JSON.stringify(history));
        return true;
    } catch (e) {
        return false;
    }
}

export function updateExchangeStatus(id, status) {
    try {
        const history = getExchangeHistory();
        const record = history.find(r => r.id === id);
        if (record) {
            record.status = status;
            localStorage.setItem('exchange_history', JSON.stringify(history));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function getExchangeById(id) {
    try {
        const history = getExchangeHistory();
        return history.find(r => r.id === id) || null;
    } catch (e) {
        return null;
    }
}

export default {
    init,
    getExchangeHistory,
    addExchangeRecord,
    updateExchangeStatus,
    getExchangeById
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('02-pos/exchange DOM ready');
    init();
});