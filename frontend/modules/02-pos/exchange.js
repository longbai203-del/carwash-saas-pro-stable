/**
 * @file exchange.js
 * @module exchange
 * @description 换货管理 - 换货申请、处理和记录
 * 
 * @example
 * import { init } from './exchange.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ExchangeItem
 * @property {string} name - 商品名称
 * @property {number} price - 单价
 * @property {number} qty - 数量
 */

/**
 * @typedef {Object} ExchangeRecord
 * @property {string} id - 换货单号
 * @property {string} orderId - 原订单号
 * @property {ExchangeItem[]} items - 换货商品列表
 * @property {string} reason - 换货原因
 * @property {string} note - 备注
 * @property {string} date - 日期
 * @property {string} status - 状态 (pending/processing/completed/cancelled)
 */

/**
 * @typedef {Object} ExchangeState
 * @property {ExchangeRecord[]} exchanges - 换货记录
 * @property {Object|null} currentOrder - 当前订单
 * @property {ExchangeItem[]} exchangeItems - 当前换货商品
 */

/** @type {ExchangeState} 状态 */
const state = {
    exchanges: [],
    currentOrder: null,
    exchangeItems: []
};

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
 * @description 创建新换货
 */
function newExchange() {
    state.exchangeItems = [];
    state.currentOrder = null;
    
    const orderInfo = document.getElementById('orderInfo');
    const exchangeItems = document.getElementById('exchangeItems');
    const originalOrder = document.getElementById('originalOrder');
    const originalAmount = document.getElementById('originalAmount');
    const exchangeAmount = document.getElementById('exchangeAmount');
    const difference = document.getElementById('difference');
    
    if (orderInfo) {
        orderInfo.innerHTML = `
            <div class="empty-order">
                <i class="fas fa-file-invoice"></i>
                <p>请搜索订单</p>
            </div>
        `;
    }
    if (exchangeItems) {
        exchangeItems.innerHTML = `
            <div class="empty-items">
                <i class="fas fa-boxes"></i>
                <p>请添加换货商品</p>
            </div>
        `;
    }
    if (originalOrder) originalOrder.textContent = '-';
    if (originalAmount) originalAmount.textContent = '¥0.00';
    if (exchangeAmount) exchangeAmount.textContent = '¥0.00';
    if (difference) {
        difference.textContent = '¥0.00';
        difference.style.color = '#10b981';
    }
    
    showToast('新建换货单', 'info');
}

/**
 * @private
 * @param {string} query - 搜索关键词
 * @description 搜索订单
 */
function search(query) {
    if (query.length > 2) {
        console.log('搜索换货订单:', query);
        // 实际项目中会调用API搜索
    }
}

/**
 * @private
 * @description 查找订单
 */
function findOrder() {
    const orderNo = prompt('输入订单号：', 'ORD-2024-001');
    if (!orderNo) return;
    
    // 模拟找到订单
    state.currentOrder = {
        id: orderNo,
        date: new Date().toLocaleString(),
        total: 388,
        items: [
            { name: '抛光打蜡', price: 388, qty: 1 }
        ]
    };
    
    const orderInfo = document.getElementById('orderInfo');
    const originalOrder = document.getElementById('originalOrder');
    const originalAmount = document.getElementById('originalAmount');
    
    if (orderInfo) {
        orderInfo.innerHTML = `
            <div style="padding:12px;">
                <div><strong>订单号:</strong> ${state.currentOrder.id}</div>
                <div><strong>日期:</strong> ${state.currentOrder.date}</div>
                <div><strong>金额:</strong> ¥${formatCurrency(state.currentOrder.total)}</div>
                <div style="margin-top:8px;font-size:13px;color:#6b7280;">
                    ${state.currentOrder.items.map(i => i.name + ' × ' + i.qty).join(', ')}
                </div>
            </div>
        `;
    }
    if (originalOrder) originalOrder.textContent = state.currentOrder.id;
    if (originalAmount) originalAmount.textContent = '¥' + formatCurrency(state.currentOrder.total);
    
    // 添加换货商品
    state.exchangeItems = [
        { name: '精致洗车', price: 128, qty: 1 }
    ];
    renderExchangeItems();
}

/**
 * @private
 * @description 渲染换货商品列表
 */
function renderExchangeItems() {
    const container = document.getElementById('exchangeItems');
    const exchangeAmount = document.getElementById('exchangeAmount');
    const difference = document.getElementById('difference');
    
    if (!container) return;
    
    if (state.exchangeItems.length === 0) {
        container.innerHTML = `
            <div class="empty-items">
                <i class="fas fa-boxes"></i>
                <p>请添加换货商品</p>
            </div>
        `;
        return;
    }
    
    let html = '<div style="display:grid;grid-template-columns:1fr 60px 80px;gap:8px;font-weight:600;padding:8px 0;border-bottom:2px solid #e5e7eb;">';
    html += '<span>商品</span><span>数量</span><span>金额</span></div>';
    let total = 0;
    state.exchangeItems.forEach(item => {
        total += item.price * item.qty;
        html += `
            <div style="display:grid;grid-template-columns:1fr 60px 80px;gap:8px;padding:6px 0;border-bottom:1px solid #f3f4f6;">
                <span>${item.name}</span>
                <span>${item.qty}</span>
                <span>¥${formatCurrency(item.price * item.qty)}</span>
            </div>
        `;
    });
    container.innerHTML = html;
    
    if (exchangeAmount) exchangeAmount.textContent = '¥' + formatCurrency(total);
    if (difference) {
        const diff = total - (state.currentOrder ? state.currentOrder.total : 0);
        difference.textContent = '¥' + formatCurrency(diff);
        difference.style.color = diff > 0 ? '#ef4444' : '#10b981';
    }
}

/**
 * @private
 * @description 处理换货
 */
function processExchange() {
    if (state.exchangeItems.length === 0) {
        showToast('请先添加换货商品', 'warning');
        return;
    }
    showToast('换货处理中...请确认商品信息', 'info');
}

/**
 * @private
 * @description 提交换货
 */
function submitExchange() {
    if (state.exchangeItems.length === 0) {
        showToast('请先添加换货商品', 'warning');
        return;
    }
    
    const reasonSelect = document.getElementById('exchangeReason');
    const noteTextarea = document.getElementById('exchangeNote');
    const reason = reasonSelect ? reasonSelect.value : 'other';
    const note = noteTextarea ? noteTextarea.value : '';
    const exchangeNo = 'EXC-' + Date.now().toString().slice(-8);
    
    const record = {
        id: exchangeNo,
        orderId: state.currentOrder ? state.currentOrder.id : '-',
        items: state.exchangeItems,
        reason: reason,
        note: note,
        date: new Date().toLocaleString(),
        status: 'pending'
    };
    
    state.exchanges.push(record);
    renderHistory();
    localStorage.setItem('exchange_history', JSON.stringify(state.exchanges));
    
    showToast('换货已提交! 换货单号: ' + exchangeNo, 'success');
    newExchange();
}

/**
 * @private
 * @description 渲染换货历史
 */
function renderHistory() {
    const tbody = document.querySelector('#exchangeHistory tbody');
    if (!tbody) return;
    
    if (state.exchanges.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">暂无换货记录</td></tr>';
        return;
    }
    
    const statusMap = {
        pending: '<span class="status-badge status-pending">待处理</span>',
        processing: '<span class="status-badge status-processing">处理中</span>',
        completed: '<span class="status-badge status-completed">已完成</span>',
        cancelled: '<span class="status-badge status-cancelled">已取消</span>'
    };
    
    let html = '';
    state.exchanges.slice().reverse().forEach(record => {
        const total = record.items.reduce((s, i) => s + i.price * i.qty, 0);
        html += `
            <tr>
                <td><strong>${record.id}</strong></td>
                <td>${record.orderId}</td>
                <td>¥${formatCurrency(total)}</td>
                <td>${statusMap[record.status] || statusMap.pending}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="window.ExchangeModule.viewDetail('${record.id}')">查看</button>
                    ${record.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="window.ExchangeModule.updateStatus('${record.id}', 'processing')">处理</button>` : ''}
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

/**
 * @private
 * @param {string} id - 换货单号
 * @description 查看换货详情
 */
function viewDetail(id) {
    const record = state.exchanges.find(r => r.id === id);
    if (!record) {
        showToast('换货记录不存在', 'error');
        return;
    }
    
    const total = record.items.reduce((s, i) => s + i.price * i.qty, 0);
    const statusLabels = {
        pending: '待处理',
        processing: '处理中',
        completed: '已完成',
        cancelled: '已取消'
    };
    
    alert(`换货详情：
换货单号: ${record.id}
原订单: ${record.orderId}
日期: ${record.date}
状态: ${statusLabels[record.status] || record.status}
换货金额: ¥${formatCurrency(total)}
原因: ${record.reason}
备注: ${record.note || '无'}
商品: ${record.items.map(i => i.name + ' × ' + i.qty).join(', ')}`);
}

/**
 * @private
 * @param {string} id - 换货单号
 * @param {string} status - 新状态
 * @description 更新换货状态
 */
function updateStatus(id, status) {
    const record = state.exchanges.find(r => r.id === id);
    if (record) {
        record.status = status;
        localStorage.setItem('exchange_history', JSON.stringify(state.exchanges));
        renderHistory();
        showToast('换货状态已更新: ' + status, 'success');
        return true;
    }
    return false;
}

/**
 * @private
 * @param {string} id - 换货单号
 * @returns {ExchangeRecord|null} 换货记录
 * @description 获取换货记录
 */
function getExchangeById(id) {
    return state.exchanges.find(r => r.id === id) || null;
}

/**
 * @private
 * @returns {ExchangeRecord[]} 换货历史
 * @description 获取换货历史
 */
function getExchangeHistory() {
    return state.exchanges;
}

/**
 * @private
 * @param {ExchangeRecord} record - 换货记录
 * @description 添加换货记录
 */
function addExchangeRecord(record) {
    state.exchanges.push(record);
    localStorage.setItem('exchange_history', JSON.stringify(state.exchanges));
    renderHistory();
}

/**
 * @public
 * @returns {Promise<void>}
 * @description 初始化换货管理
 */
export async function init() {
    console.log('🔄 换货管理 初始化...');
    
    // 加载历史记录
    try {
        const saved = localStorage.getItem('exchange_history');
        if (saved) {
            state.exchanges = JSON.parse(saved);
            renderHistory();
        }
    } catch (e) {
        console.warn('加载换货历史失败:', e);
    }
    
    // 暴露全局方法
    window.ExchangeModule = {
        exchanges: state.exchanges,
        currentOrder: state.currentOrder,
        exchangeItems: state.exchangeItems,
        newExchange,
        search,
        findOrder,
        processExchange,
        submitExchange,
        renderExchangeItems,
        renderHistory,
        viewDetail,
        updateStatus,
        getExchangeById,
        getExchangeHistory,
        addExchangeRecord
    };
    
    console.log('✅ 换货管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    newExchange,
    findOrder,
    submitExchange,
    updateStatus,
    getExchangeById,
    getExchangeHistory,
    addExchangeRecord
};