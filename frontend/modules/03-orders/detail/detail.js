// 03-orders/detail.js
console.log('📄 03-orders/detail page loaded');

export function init() {
    console.log('03-orders/detail initialized');
    
    // 从URL获取订单ID
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    
    if (orderId) {
        console.log('查看订单:', orderId);
        // 加载订单数据
        const order = getOrderById(orderId);
        if (order && typeof window.OrderDetailModule !== 'undefined') {
            window.OrderDetailModule.orderData = order;
            window.OrderDetailModule.orderId = orderId;
            window.OrderDetailModule.render();
        }
    } else {
        // 如果没有ID，使用示例数据
        console.log('无订单ID，使用示例数据');
        if (typeof window.OrderDetailModule !== 'undefined') {
            window.OrderDetailModule.loadOrderData();
        }
    }
}

export function getOrderById(id) {
    try {
        const orders = getOrdersFromStorage();
        return orders.find(o => o.id === id) || null;
    } catch (e) {
        return null;
    }
}

export function getOrdersFromStorage() {
    try {
        const data = localStorage.getItem('orders_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function saveOrder(order) {
    try {
        const orders = getOrdersFromStorage();
        const index = orders.findIndex(o => o.id === order.id);
        if (index >= 0) {
            orders[index] = order;
        } else {
            orders.push(order);
        }
        localStorage.setItem('orders_data', JSON.stringify(orders));
        return true;
    } catch (e) {
        return false;
    }
}

export function deleteOrder(id) {
    try {
        const orders = getOrdersFromStorage();
        const filtered = orders.filter(o => o.id !== id);
        localStorage.setItem('orders_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getOrderById,
    getOrdersFromStorage,
    saveOrder,
    deleteOrder
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('03-orders/detail DOM ready');
    init();
});