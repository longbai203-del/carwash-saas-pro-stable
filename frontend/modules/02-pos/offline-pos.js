/**
 * @file offline-pos.js
 * @module offline-pos
 * @description 离线POS - 支持离线模式下的收银和同步
 * 
 * @example
 * import { init } from './offline-pos.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} OfflineOrder
 * @property {string} id - 订单ID
 * @property {string} customer - 客户名称
 * @property {number} total - 订单总额
 * @property {Array<{name: string, price: number, qty: number}>} items - 商品列表
 * @property {string} date - 订单日期
 * @property {string} status - 状态 (pending_sync/synced)
 */

/**
 * @typedef {Object} OfflineProduct
 * @property {string} id - 商品ID
 * @property {string} name - 商品名称
 * @property {number} price - 单价
 */

/**
 * @typedef {Object} OfflineState
 * @property {OfflineOrder[]} orders - 离线订单列表
 * @property {OfflineProduct[]} products - 商品缓存
 * @property {boolean} isOnline - 是否在线
 */

/** @type {OfflineState} 状态 */
const state = {
    orders: [],
    products: [],
    isOnline: navigator.onLine
};

/**
 * @private
 * @param {string} message - 日志消息
 * @description 添加同步日志
 */
function addLog(message) {
    const log = document.getElementById('syncLog');
    if (!log) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="time">[${time}]</span> ${message}`;
    log.prepend(entry);
    // 限制日志数量
    while (log.children.length > 50) {
        log.removeChild(log.lastChild);
    }
}

/**
 * @private
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return amount.toFixed(2);
}

/**
 * @private
 * @description 检测网络状态
 */
function checkConnection() {
    state.isOnline = navigator.onLine;
    const indicator = document.getElementById('connectionStatus');
    if (indicator) {
        if (state.isOnline) {
            indicator.innerHTML = '<i class="fas fa-wifi" style="color:#10b981;"></i><span style="color:#065f46;">在线模式</span>';
        } else {
            indicator.innerHTML = '<i class="fas fa-wifi-slash" style="color:#f59e0b;"></i><span style="color:#92400e;">离线模式</span>';
        }
    }
}

/**
 * @private
 * @description 加载数据
 */
function loadData() {
    try {
        const orders = localStorage.getItem('offline_orders');
        if (orders) state.orders = JSON.parse(orders);
        
        const products = localStorage.getItem('offline_products');
        if (products) {
            state.products = JSON.parse(products);
        } else {
            state.products = [
                { id: 'P001', name: '标准洗车', price: 68 },
                { id: 'P002', name: '精致洗车', price: 128 },
                { id: 'P003', name: '深度清洁', price: 268 },
                { id: 'P004', name: '抛光打蜡', price: 388 },
                { id: 'P005', name: '内饰清洗', price: 328 },
                { id: 'P006', name: '发动机清洗', price: 188 }
            ];
            localStorage.setItem('offline_products', JSON.stringify(state.products));
        }
    } catch (e) {
        console.error('加载数据失败:', e);
    }
}

/**
 * @private
 * @description 保存订单到本地
 */
function saveOrders() {
    localStorage.setItem('offline_orders', JSON.stringify(state.orders));
    updateUI();
    
    // 计算存储使用量
    const size = new Blob([JSON.stringify(state.orders)]).size;
    const storageEl = document.getElementById('storageUsed');
    if (storageEl) storageEl.textContent = (size / 1024).toFixed(1) + ' KB';
}

/**
 * @private
 * @description 更新UI
 */
function updateUI() {
    const list = document.getElementById('offlineOrderList');
    const pending = state.orders.filter(o => o.status === 'pending_sync');
    const pendingEl = document.getElementById('pendingSync');
    if (pendingEl) pendingEl.textContent = pending.length;
    
    if (state.orders.length === 0) {
        if (list) {
            list.innerHTML = `
                <div class="empty-offline">
                    <i class="fas fa-file-invoice"></i>
                    <p>暂无离线订单</p>
                </div>
            `;
        }
        return;
    }
    
    if (list) {
        let html = '';
        state.orders.slice().reverse().forEach(order => {
            const statusText = order.status === 'pending_sync' ? '待同步' : '已同步';
            const statusClass = order.status === 'pending_sync' ? 'status-pending-sync' : 'status-synced';
            html += `
                <div class="offline-order-item">
                    <div class="order-info">
                        <span class="order-id">${order.id}</span>
                        <span class="order-date">${order.date} | ${order.customer}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span>¥${formatCurrency(order.total)}</span>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    }
}

/**
 * @private
 * @description 刷新缓存
 */
function refreshCache() {
    state.products = [
        { id: 'P001', name: '标准洗车', price: 68 },
        { id: 'P002', name: '精致洗车', price: 128 },
        { id: 'P003', name: '深度清洁', price: 268 },
        { id: 'P004', name: '抛光打蜡', price: 388 },
        { id: 'P005', name: '内饰清洗', price: 328 },
        { id: 'P006', name: '发动机清洗', price: 188 }
    ];
    localStorage.setItem('offline_products', JSON.stringify(state.products));
    
    const cacheTime = document.getElementById('cacheTime');
    if (cacheTime) cacheTime.textContent = new Date().toLocaleTimeString();
    addLog('商品缓存已刷新');
    showToast('缓存已刷新!', 'success');
}

/**
 * @private
 * @description 创建新离线订单
 */
function newOfflineOrder() {
    const name = prompt('输入客户名称：', '客户');
    if (!name) return;
    
    const total = Math.floor(Math.random() * 500) + 100;
    const order = {
        id: 'OFF-' + Date.now().toString().slice(-8),
        customer: name,
        total: total,
        items: [
            { name: '洗车服务', price: total, qty: 1 }
        ],
        date: new Date().toLocaleString(),
        status: 'pending_sync'
    };
    
    state.orders.push(order);
    saveOrders();
    updateUI();
    addLog('新离线订单: ' + order.id + ' - ¥' + formatCurrency(total));
    showToast('离线订单已创建: ' + order.id, 'success');
}

/**
 * @private
 * @description 同步离线订单到服务器
 */
async function syncOrders() {
    if (state.orders.length === 0) {
        showToast('没有需要同步的订单', 'info');
        return;
    }
    
    const pending = state.orders.filter(o => o.status === 'pending_sync');
    if (pending.length === 0) {
        showToast('所有订单已同步', 'success');
        return;
    }
    
    addLog('开始同步 ' + pending.length + ' 个订单...');
    
    let synced = 0;
    for (const order of pending) {
        try {
            // 模拟同步到服务器
            await new Promise(resolve => setTimeout(resolve, 500));
            order.status = 'synced';
            synced++;
            addLog('已同步: ' + order.id);
        } catch (error) {
            addLog('同步失败: ' + order.id + ' - ' + error.message);
        }
    }
    
    saveOrders();
    addLog('同步完成! 共同步 ' + synced + ' 个订单');
    showToast('同步完成! 已同步 ' + synced + ' 个订单', 'success');
}

/**
 * @private
 * @description 获取离线订单列表
 * @returns {OfflineOrder[]} 订单列表
 */
function getOfflineOrders() {
    return state.orders;
}

/**
 * @private
 * @description 添加离线订单
 * @param {OfflineOrder} order - 订单数据
 * @returns {boolean} 是否成功
 */
function addOfflineOrder(order) {
    try {
        state.orders.push(order);
        saveOrders();
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * @public
 * @returns {Promise<void>}
 * @description 初始化离线POS
 */
export async function init() {
    console.log('📴 离线POS 初始化...');
    
    loadData();
    updateUI();
    checkConnection();
    addLog('系统启动 - ' + (state.isOnline ? '在线模式' : '离线模式'));
    
    // 检测网络变化
    window.addEventListener('online', () => {
        state.isOnline = true;
        checkConnection();
        addLog('网络已恢复，进入在线模式');
        showToast('网络已恢复', 'success');
    });
    
    window.addEventListener('offline', () => {
        state.isOnline = false;
        checkConnection();
        addLog('网络已断开，进入离线模式');
        showToast('网络已断开，进入离线模式', 'warning');
    });
    
    // 暴露全局方法
    window.OfflinePOSModule = {
        orders: state.orders,
        products: state.products,
        isOnline: state.isOnline,
        newOfflineOrder,
        sync: syncOrders,
        refreshCache,
        addLog,
        saveOrders,
        updateUI,
        getOfflineOrders,
        addOfflineOrder
    };
    
    // 设置缓存时间
    const cacheTime = document.getElementById('cacheTime');
    if (cacheTime) cacheTime.textContent = new Date().toLocaleTimeString();
    
    console.log('✅ 离线POS 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    getOfflineOrders,
    addOfflineOrder,
    sync: syncOrders
};