/**
 * @file returns.js
 * @module returns
 * @description 退货管理 - 退货申请、处理和记录
 * 
 * @example
 * import { init } from './returns.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ReturnItem
 * @property {string} name - 商品名称
 * @property {number} price - 单价
 * @property {number} qty - 数量
 */

/**
 * @typedef {Object} ReturnRecord
 * @property {string} id - 退货单号
 * @property {string} orderId - 原订单号
 * @property {ReturnItem[]} items - 退货商品列表
 * @property {string} reason - 退货原因
 * @property {string} note - 备注
 * @property {string} date - 日期
 * @property {string} status - 状态 (pending/processing/completed/rejected)
 */

/**
 * @typedef {Object} ReturnState
 * @property {ReturnRecord[]} returns - 退货记录
 * @property {Object|null} currentOrder - 当前订单
 * @property {ReturnItem[]} returnItems - 当前退货商品
 */

/** @type {ReturnState} 状态 */
const state = {
    returns: [],
    currentOrder: null,
    returnItems: []
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
 * @description 创建新退货
 */
function newReturn() {
    state.returnItems = [];
    state.currentOrder = null;
    
    const orderInfo = document.getElementById('returnOrderInfo');
    const returnItems = document.getElementById('returnItems');
    const returnOrderId = document.getElementById('returnOrderId');
    const returnAmount = document.getElementById('returnAmount');
    const refundAmount = document.getElementById('refundAmount');
    
    if (orderInfo) {
        orderInfo.innerHTML = `
            <div class="empty-order">
                <i class="fas fa-file-invoice"></i>
                <p>请搜索要退货的订单</p>
            </div>
        `;
    }
    if (returnItems) {
        returnItems.innerHTML = `
            <div class="empty-items">
                <i class="fas fa-boxes"></i>
                <p>选择要退货的商品</p>
            </div>
        `;
    }
    if (returnOrderId) returnOrderId.textContent = '-';
    if (returnAmount) returnAmount.textContent = '¥0.00';
    if (refundAmount) refundAmount.textContent = '¥0.00';
    
    showToast('新建退货单', 'info');
}

/**
 * @private
 * @param {string} query - 搜索关键词
 * @description 搜索订单
 */
function search(query) {
    if (query.length > 2) {
        console.log('搜索退货订单:', query);
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
    
    const orderInfo = document.getElementById('returnOrderInfo');
    const returnOrderId = document.getElementById('returnOrderId');
    
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
    if (returnOrderId) returnOrderId.textContent = state.currentOrder.id;
    
    // 添加退货商品
    state.returnItems = [
        { name: '抛光打蜡', price: 388, qty: 1 }
    ];
    renderReturnItems();
}

/**
 * @private
 * @description 渲染退货商品列表
 */
function renderReturnItems() {
    const container = document.getElementById('returnItems');
    const returnAmount = document.getElementById('returnAmount');
    const refundAmount = document.getElementById('refundAmount');
    
    if (!container) return;
    
    if (state.returnItems.length === 0) {
        container.innerHTML = `
            <div class="empty-items">
                <i class="fas fa-boxes"></i>
                <p>选择要退货的商品</p>
            </div>
        `;
        return;
    }
    
    let html = '<div style="display:grid;grid-template-columns:1fr 60px 80px;gap:8px;font-weight:600;padding:8px 0;border-bottom:2px solid #e5e7eb;">';
    html += '<span>商品</span><span>数量</span><span>金额</span></div>';
    let total = 0;
    state.returnItems.forEach(item => {
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
    
    if (returnAmount) returnAmount.textContent = '¥' + formatCurrency(total);
    if (refundAmount) {
        refundAmount.textContent = '¥' + formatCurrency(total);
        refundAmount.style.color = '#10b981';
    }
}

/**
 * @private
 * @description 处理退货
 */
function processReturn() {
    if (state.returnItems.length === 0) {
        showToast('请先选择要退货的商品', 'warning');
        return;
    }
    const refundTotal = document.getElementById('refundAmount');
    const total = refundTotal ? refundTotal.textContent : '¥0.00';
    if (confirm('确认退货处理？\n退货金额: ' + total)) {
        showToast('退货处理中...', 'info');
    }
}

/**
 * @private
 * @description 提交退货
 */
function submitReturn() {
    if (state.returnItems.length === 0) {
        showToast('请先选择要退货的商品', 'warning');
        return;
    }
    
    const reasonSelect = document.getElementById('returnReason');
    const noteTextarea = document.getElementById('returnNote');
    const reason = reasonSelect ? reasonSelect.value : 'other';
    const note = noteTextarea ? noteTextarea.value : '';
    const returnNo = 'RTN-' + Date.now().toString().slice(-8);
    
    const record = {
        id: returnNo,
        orderId: state.currentOrder ? state.currentOrder.id : '-',
        items: state.returnItems,
        reason: reason,
        note: note,
        date: new Date().toLocaleString(),
        status: 'pending'
    };
    
    state.returns.push(record);
    renderHistory();
    localStorage.setItem('return_history', JSON.stringify(state.returns));
    
    showToast('退货已提交! 退货单号: ' + returnNo, 'success');
    newReturn();
}

/**
 * @private
 * @description 渲染退货历史
 */
function renderHistory() {
    const tbody = document.querySelector('#returnHistory tbody');
    if (!tbody) return;
    
    if (state.returns.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">暂无退货记录</td></tr>';
        return;
    }
    
    const statusMap = {
        pending: '<span class="status-badge status-pending">待处理</span>',
        processing: '<span class="status-badge status-processing">处理中</span>',
        completed: '<span class="status-badge status-completed">已完成</span>',
        rejected: '<span class="status-badge status-rejected">已拒绝</span>'
    };
    
    let html = '';
    state.returns.slice().reverse().forEach(record => {
        const total = record.items.reduce((s, i) => s + i.price * i.qty, 0);
        html += `
            <tr>
                <td><strong>${record.id}</strong></td>
                <td>${record.orderId}</td>
                <td>¥${formatCurrency(total)}</td>
                <td>${statusMap[record.status] || statusMap.pending}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="window.ReturnModule.viewDetail('${record.id}')">查看</button>
                    ${record.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="window.ReturnModule.updateStatus('${record.id}', 'processing')">处理</button>
                        <button class="btn btn-sm btn-danger" onclick="window.ReturnModule.updateStatus('${record.id}', 'rejected')">拒绝</button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

/**
 * @private
 * @param {string} id - 退货单号
 * @description 查看退货详情
 */
function viewDetail(id) {
    const record = state.returns.find(r => r.id === id);
    if (!record) {
        showToast('退货记录不存在', 'error');
        return;
    }
    
    const total = record.items.reduce((s, i) => s + i.price * i.qty, 0);
    const statusLabels = {
        pending: '待处理',
        processing: '处理中',
        completed: '已完成',
        rejected: '已拒绝'
    };
    
    alert(`退货详情：
退货单号: ${record.id}
原订单: ${record.orderId}
日期: ${record.date}
状态: ${statusLabels[record.status] || record.status}
退货金额: ¥${formatCurrency(total)}
原因: ${record.reason}
备注: ${record.note || '无'}
商品: ${record.items.map(i => i.name + ' × ' + i.qty).join(', ')}`);
}

/**
 * @private
 * @param {string} id - 退货单号
 * @param {string} status - 新状态
 * @description 更新退货状态
 */
function updateStatus(id, status) {
    const record = state.returns.find(r => r.id === id);
    if (record) {
        record.status = status;
        localStorage.setItem('return_history', JSON.stringify(state.returns));
        renderHistory();
        showToast('退货状态已更新: ' + status, 'success');
        return true;
    }
    return false;
}

/**
 * @private
 * @param {string} id - 退货单号
 * @returns {ReturnRecord|null} 退货记录
 * @description 获取退货记录
 */
function getReturnById(id) {
    return state.returns.find(r => r.id === id) || null;
}

/**
 * @private
 * @returns {ReturnRecord[]} 退货历史
 * @description 获取退货历史
 */
function getReturnHistory() {
    return state.returns;
}

/**
 * @private
 * @param {ReturnRecord} record - 退货记录
 * @description 添加退货记录
 */
function addReturnRecord(record) {
    state.returns.push(record);
    localStorage.setItem('return_history', JSON.stringify(state.returns));
    renderHistory();
}

/**
 * @private
 * @returns {ReturnRecord[]} 待处理退货
 * @description 获取待处理退货
 */
function getPendingReturns() {
    return state.returns.filter(r => r.status === 'pending' || r.status === 'processing');
}

/**
 * @public
 * @returns {Promise<void>}
 * @description 初始化退货管理
 */
export async function init() {
    console.log('↩️ 退货管理 初始化...');
    
    // 加载历史记录
    try {
        const saved = localStorage.getItem('return_history');
        if (saved) {
            state.returns = JSON.parse(saved);
            renderHistory();
        }
    } catch (e) {
        console.warn('加载退货历史失败:', e);
    }
    
    // 暴露全局方法
    window.ReturnModule = {
        returns: state.returns,
        currentOrder: state.currentOrder,
        returnItems: state.returnItems,
        newReturn,
        search,
        findOrder,
        processReturn,
        submitReturn,
        renderReturnItems,
        renderHistory,
        viewDetail,
        updateStatus,
        getReturnById,
        getReturnHistory,
        addReturnRecord,
        getPendingReturns
    };
    
    console.log('✅ 退货管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    newReturn,
    findOrder,
    submitReturn,
    updateStatus,
    getReturnById,
    getReturnHistory,
    addReturnRecord,
    getPendingReturns
};