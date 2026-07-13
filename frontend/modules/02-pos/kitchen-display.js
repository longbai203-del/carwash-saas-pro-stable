/**
 * @file kitchen-display.js
 * @module kitchen-display
 * @description 厨房显示 - 厨房订单管理和状态跟踪
 * 
 * @example
 * import { init } from './kitchen-display.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} KitchenItem
 * @property {string} name - 商品名称
 * @property {number} qty - 数量
 * @property {string} [note] - 备注
 */

/**
 * @typedef {Object} KitchenOrder
 * @property {string} id - 订单ID
 * @property {KitchenItem[]} items - 商品列表
 * @property {string} status - 状态 (pending/cooking/ready)
 * @property {string} time - 下单时间
 * @property {number} elapsed - 已耗时(秒)
 */

/**
 * @typedef {Object} KitchenStats
 * @property {number} pending - 待处理数
 * @property {number} cooking - 制作中数
 * @property {number} completed - 已完成数
 * @property {number} today - 今日订单数
 */

/**
 * @typedef {Object} KitchenState
 * @property {KitchenOrder[]} orders - 订单列表
 * @property {number} orderId - 订单ID计数器
 * @property {KitchenStats} stats - 统计数据
 * @property {number|null} timerInterval - 定时器ID
 */

/** @type {KitchenState} 状态 */
const state = {
    orders: [],
    orderId: 0,
    stats: { pending: 0, cooking: 0, completed: 0, today: 0 },
    timerInterval: null
};

/**
 * @private
 * @returns {string[]} 商品名称列表
 */
function getMenuItems() {
    return ['标准洗车', '精致洗车', '深度清洁', '抛光打蜡', '内饰清洗', '发动机清洗', '空调清洗', '轮胎养护'];
}

/**
 * @private
 * @description 生成随机订单
 * @returns {KitchenOrder} 新订单
 */
function generateOrder() {
    state.orderId++;
    const items = [];
    const menu = getMenuItems();
    const count = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < count; i++) {
        items.push({
            name: menu[Math.floor(Math.random() * menu.length)],
            qty: Math.floor(Math.random() * 2) + 1,
            note: Math.random() > 0.7 ? '备注: 尽快' : ''
        });
    }
    
    return {
        id: 'ORD-' + String(state.orderId).padStart(4, '0'),
        items: items,
        status: 'pending',
        time: new Date().toLocaleTimeString(),
        elapsed: 0
    };
}

/**
 * @private
 * @description 创建新订单
 */
function newOrder() {
    const order = generateOrder();
    state.orders.push(order);
    state.stats.today++;
    state.stats.pending++;
    render();
    updateStats();
    showToast('📋 新订单: ' + order.id, 'info');
}

/**
 * @private
 * @param {string} id - 订单ID
 * @description 开始制作
 */
function startCooking(id) {
    const order = state.orders.find(o => o.id === id);
    if (order && order.status === 'pending') {
        order.status = 'cooking';
        state.stats.pending = state.orders.filter(o => o.status === 'pending').length;
        state.stats.cooking = state.orders.filter(o => o.status === 'cooking').length;
        render();
        updateStats();
        showToast('🔨 开始制作: ' + order.id, 'info');
    }
}

/**
 * @private
 * @param {string} id - 订单ID
 * @description 完成订单
 */
function completeOrder(id) {
    const order = state.orders.find(o => o.id === id);
    if (order && (order.status === 'pending' || order.status === 'cooking')) {
        order.status = 'ready';
        state.stats.pending = state.orders.filter(o => o.status === 'pending').length;
        state.stats.cooking = state.orders.filter(o => o.status === 'cooking').length;
        state.stats.completed = state.orders.filter(o => o.status === 'ready').length;
        render();
        updateStats();
        showToast('✅ 订单完成: ' + order.id, 'success');
    }
}

/**
 * @private
 * @description 标记订单为已完成（快捷操作）
 */
function markReady() {
    const pending = state.orders.filter(o => o.status === 'pending' || o.status === 'cooking');
    if (pending.length === 0) {
        showToast('没有可标记完成的订单', 'warning');
        return;
    }
    const order = pending[0];
    if (confirm('标记订单 ' + order.id + ' 为已完成？')) {
        completeOrder(order.id);
    }
}

/**
 * @private
 * @description 渲染订单列表
 */
function render() {
    const grid = document.getElementById('kitchenGrid');
    if (!grid) return;
    
    if (state.orders.length === 0) {
        grid.innerHTML = `
            <div class="empty-kitchen">
                <i class="fas fa-utensils"></i>
                <p>暂无订单</p>
                <span style="font-size:13px;color:#9ca3af;">等待新订单...</span>
            </div>
        `;
        return;
    }
    
    let html = '';
    // 按状态排序: pending > cooking > ready
    const sorted = [...state.orders].sort((a, b) => {
        const order = { pending: 0, cooking: 1, ready: 2 };
        return order[a.status] - order[b.status];
    });
    
    sorted.forEach(order => {
        const statusClass = order.status;
        const statusLabel = { pending: '待处理', cooking: '制作中', ready: '已完成' }[order.status] || order.status;
        const statusColor = { pending: '#f59e0b', cooking: '#3b82f6', ready: '#10b981' }[order.status] || '#6b7280';
        
        html += `<div class="kitchen-card ${statusClass}" style="border-left-color: ${statusColor};">`;
        html += `<div class="order-header">`;
        html += `<span class="order-id">${order.id}</span>`;
        html += `<span class="order-time">${order.time}</span>`;
        html += `</div>`;
        html += `<div class="order-items">`;
        order.items.forEach(item => {
            html += `<div class="order-item">
                <span>${item.name} × ${item.qty}</span>
                ${item.note ? `<span style="font-size:12px;color:#f59e0b;">${item.note}</span>` : ''}
            </div>`;
        });
        html += `</div>`;
        html += `<div style="font-size:12px;color:#6b7280;margin-top:4px;">状态: ${statusLabel}</div>`;
        
        if (order.status === 'pending') {
            html += `<div class="order-actions">
                <button class="btn btn-primary" onclick="window.KitchenDisplayModule.startCooking('${order.id}')">开始制作</button>
            </div>`;
        } else if (order.status === 'cooking') {
            html += `<div class="order-actions">
                <button class="btn btn-success" onclick="window.KitchenDisplayModule.completeOrder('${order.id}')">标记完成</button>
            </div>`;
        } else if (order.status === 'ready') {
            html += `<div class="order-actions">
                <button class="btn btn-outline" disabled>✓ 已完成</button>
            </div>`;
        }
        html += `</div>`;
    });
    grid.innerHTML = html;
}

/**
 * @private
 * @description 更新统计数据
 */
function updateStats() {
    const pendingEl = document.getElementById('pendingCount');
    const cookingEl = document.getElementById('cookingCount');
    const completedEl = document.getElementById('completedCount');
    const todayEl = document.getElementById('todayCount');
    
    if (pendingEl) pendingEl.textContent = state.stats.pending;
    if (cookingEl) cookingEl.textContent = state.stats.cooking;
    if (completedEl) completedEl.textContent = state.stats.completed;
    if (todayEl) todayEl.textContent = state.stats.today;
}

/**
 * @private
 * @description 启动定时器更新订单耗时
 */
function startTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }
    state.timerInterval = setInterval(() => {
        let hasChanges = false;
        state.orders.forEach(order => {
            if (order.status !== 'ready') {
                order.elapsed += 1;
                hasChanges = true;
            }
        });
        if (hasChanges) {
            render();
        }
    }, 1000);
}

/**
 * @private
 * @description 停止定时器
 */
function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

/**
 * @private
 * @description 加载本地存储的订单
 */
function loadOrders() {
    try {
        const saved = localStorage.getItem('kitchen_orders');
        if (saved) {
            const data = JSON.parse(saved);
            state.orders = data;
            state.orderId = data.length > 0 ? parseInt(data[data.length - 1].id.replace('ORD-', '')) : 0;
            state.stats.pending = data.filter(o => o.status === 'pending').length;
            state.stats.cooking = data.filter(o => o.status === 'cooking').length;
            state.stats.completed = data.filter(o => o.status === 'ready').length;
            state.stats.today = data.length;
            render();
            updateStats();
        }
    } catch (e) {
        console.warn('加载厨房订单失败:', e);
    }
}

/**
 * @private
 * @description 保存订单到本地存储
 */
function saveOrders() {
    try {
        localStorage.setItem('kitchen_orders', JSON.stringify(state.orders));
    } catch (e) {
        console.warn('保存厨房订单失败:', e);
    }
}

/**
 * @private
 * @description 获取所有订单
 * @returns {KitchenOrder[]} 订单列表
 */
function getOrders() {
    return state.orders;
}

/**
 * @private
 * @param {KitchenOrder} order - 订单数据
 * @description 添加订单
 */
function addOrder(order) {
    state.orders.push(order);
    saveOrders();
    render();
    updateStats();
}

/**
 * @private
 * @param {string} id - 订单ID
 * @param {string} status - 新状态
 * @description 更新订单状态
 */
function updateOrderStatus(id, status) {
    const order = state.orders.find(o => o.id === id);
    if (order) {
        order.status = status;
        saveOrders();
        render();
        updateStats();
        return true;
    }
    return false;
}

/**
 * @private
 * @returns {KitchenOrder[]} 待处理订单
 */
function getPendingOrders() {
    return state.orders.filter(o => o.status === 'pending' || o.status === 'cooking');
}

/**
 * @public
 * @returns {Promise<void>}
 * @description 初始化厨房显示
 */
export async function init() {
    console.log('🍳 厨房显示 初始化...');
    
    loadOrders();
    startTimer();
    render();
    updateStats();
    
    // 暴露全局方法
    window.KitchenDisplayModule = {
        orders: state.orders,
        stats: state.stats,
        newOrder,
        startCooking,
        completeOrder,
        markReady,
        render,
        updateStats,
        getOrders,
        addOrder,
        updateOrderStatus,
        getPendingOrders,
        saveOrders
    };
    
    // 模拟接收新订单（演示用）
    setTimeout(() => {
        newOrder();
        setTimeout(() => newOrder(), 3000);
        setTimeout(() => newOrder(), 6000);
    }, 500);
    
    // 模拟自动接收新订单
    setInterval(() => {
        if (Math.random() > 0.6 && state.orders.length < 20) {
            newOrder();
        }
    }, 15000);
    
    // 自动保存
    setInterval(saveOrders, 5000);
    
    console.log('✅ 厨房显示 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    newOrder,
    startCooking,
    completeOrder,
    markReady,
    getOrders,
    addOrder,
    updateOrderStatus,
    getPendingOrders,
    saveOrders
};