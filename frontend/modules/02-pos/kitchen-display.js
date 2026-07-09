// 02-pos/kitchen-display.js
console.log('📄 02-pos/kitchen-display page loaded');

export function init() {
    console.log('02-pos/kitchen-display initialized');
    
    // 加载厨房显示数据
    const saved = localStorage.getItem('kitchen_orders');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载厨房订单:', data.length);
            if (typeof window.KitchenDisplayModule !== 'undefined') {
                window.KitchenDisplayModule.orders = data;
                // 更新统计
                window.KitchenDisplayModule.stats.pending = data.filter(o => o.status === 'pending').length;
                window.KitchenDisplayModule.stats.cooking = data.filter(o => o.status === 'cooking').length;
                window.KitchenDisplayModule.stats.completed = data.filter(o => o.status === 'ready').length;
                window.KitchenDisplayModule.stats.today = data.length;
                window.KitchenDisplayModule.render();
                window.KitchenDisplayModule.updateStats();
            }
        } catch (e) {
            console.warn('加载厨房订单失败');
        }
    }
}

export function addOrder(order) {
    try {
        const saved = localStorage.getItem('kitchen_orders');
        let orders = saved ? JSON.parse(saved) : [];
        orders.push(order);
        localStorage.setItem('kitchen_orders', JSON.stringify(orders));
        return true;
    } catch (e) {
        return false;
    }
}

export function getOrders() {
    try {
        const data = localStorage.getItem('kitchen_orders');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function updateOrderStatus(id, status) {
    try {
        const orders = getOrders();
        const order = orders.find(o => o.id === id);
        if (order) {
            order.status = status;
            localStorage.setItem('kitchen_orders', JSON.stringify(orders));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function getPendingOrders() {
    try {
        const orders = getOrders();
        return orders.filter(o => o.status === 'pending' || o.status === 'cooking');
    } catch (e) {
        return [];
    }
}

export default {
    init,
    addOrder,
    getOrders,
    updateOrderStatus,
    getPendingOrders
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('02-pos/kitchen-display DOM ready');
    init();
});