// 02-pos/offline-pos.js
console.log('📄 02-pos/offline-pos page loaded');

export function init() {
    console.log('02-pos/offline-pos initialized');
    
    // 初始化离线POS
    const offlineData = localStorage.getItem('offline_orders');
    if (offlineData) {
        try {
            const data = JSON.parse(offlineData);
            console.log('已加载离线订单:', data.length);
            if (typeof window.OfflinePOSModule !== 'undefined') {
                window.OfflinePOSModule.orders = data;
                window.OfflinePOSModule.updateUI();
                window.OfflinePOSModule.saveOrders();
            }
        } catch (e) {
            console.warn('加载离线订单失败');
        }
    }
    
    // 检测网络状态
    if (typeof window.OfflinePOSModule !== 'undefined') {
        window.OfflinePOSModule.checkConnection();
        window.OfflinePOSModule.addLog('离线POS已初始化');
    }
}

export function getOfflineOrders() {
    try {
        const data = localStorage.getItem('offline_orders');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function addOfflineOrder(order) {
    try {
        const orders = getOfflineOrders();
        orders.push(order);
        localStorage.setItem('offline_orders', JSON.stringify(orders));
        return true;
    } catch (e) {
        return false;
    }
}

export function syncOfflineOrders() {
    try {
        const orders = getOfflineOrders();
        const pending = orders.filter(o => o.status === 'pending_sync');
        pending.forEach(o => o.status = 'synced');
        localStorage.setItem('offline_orders', JSON.stringify(orders));
        return pending.length;
    } catch (e) {
        return -1;
    }
}

export function getOfflineProducts() {
    try {
        const data = localStorage.getItem('offline_products');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function saveOfflineProducts(products) {
    try {
        localStorage.setItem('offline_products', JSON.stringify(products));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getOfflineOrders,
    addOfflineOrder,
    syncOfflineOrders,
    getOfflineProducts,
    saveOfflineProducts
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('02-pos/offline-pos DOM ready');
    init();
});