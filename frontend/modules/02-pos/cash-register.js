/**
 * @file cash-register.js
 * @module cash-register
 * @description 收银机模块 - 收银机模拟和交易管理
 * 
 * @example
 * import { init } from './cash-register.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} TransactionItem
 * @property {number} id - 商品ID
 * @property {string} name - 商品名称
 * @property {number} price - 单价
 * @property {number} qty - 数量
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id - 交易ID
 * @property {string} date - 交易日期
 * @property {number} amount - 交易金额
 * @property {string} method - 支付方式
 * @property {string} customer - 客户名称
 * @property {string} status - 状态 (completed/refunded)
 */

/**
 * @typedef {Object} RegisterState
 * @property {TransactionItem[]} items - 当前交易商品列表
 * @property {number} transactionId - 当前交易ID
 * @property {number} total - 当前交易总额
 * @property {Transaction[]} transactions - 交易历史
 * @property {string} searchQuery - 搜索关键词
 */

/** @type {RegisterState} 状态 */
const state = {
    items: [],
    transactionId: 0,
    total: 0,
    transactions: [],
    searchQuery: ''
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
 * @returns {Transaction[]} 模拟交易数据
 */
function getMockTransactions() {
    return [
        { id: 'T001', date: '2026-07-10 10:30:00', amount: 68, method: 'cash', customer: '张伟', status: 'completed' },
        { id: 'T002', date: '2026-07-10 11:15:00', amount: 128, method: 'wechat', customer: '李娜', status: 'completed' },
        { id: 'T003', date: '2026-07-10 13:45:00', amount: 268, method: 'card', customer: '王强', status: 'completed' },
        { id: 'T004', date: '2026-07-10 14:20:00', amount: 388, method: 'alipay', customer: '刘洋', status: 'refunded' },
        { id: 'T005', date: '2026-07-10 15:00:00', amount: 188, method: 'cash', customer: '陈静', status: 'completed' }
    ];
}

/**
 * @private
 * @description 创建新交易
 */
function newTransaction() {
    state.transactionId++;
    state.items = [];
    state.total = 0;
    
    const countEl = document.getElementById('transactionCount');
    const displayAmount = document.getElementById('displayAmount');
    const displaySub = document.getElementById('displaySub');
    
    if (countEl) countEl.textContent = '#' + state.transactionId;
    if (displayAmount) displayAmount.textContent = '¥0.00';
    if (displaySub) displaySub.textContent = '新交易已创建';
    
    updateItemsList();
    showToast('新交易已创建 #' + state.transactionId, 'info');
}

/**
 * @private
 * @description 扫描商品
 */
function scanItem() {
    const name = prompt('输入商品名称：', '洗车服务');
    if (!name) return;
    const price = parseFloat(prompt('输入价格：', '68'));
    if (isNaN(price)) return;
    
    state.items.push({ id: Date.now(), name: name, price: price, qty: 1 });
    state.total += price;
    
    const displayAmount = document.getElementById('displayAmount');
    const displaySub = document.getElementById('displaySub');
    if (displayAmount) displayAmount.textContent = '¥' + formatCurrency(state.total);
    if (displaySub) displaySub.textContent = '已添加: ' + name;
    
    updateItemsList();
    showToast('已添加: ' + name, 'success');
}

/**
 * @private
 * @description 搜索商品
 */
function searchItem() {
    const query = prompt('输入商品名称搜索：');
    if (!query) return;
    const found = state.items.filter(item => item.name.includes(query));
    if (found.length > 0) {
        alert('找到 ' + found.length + ' 个商品:\n' + found.map(i => i.name + ' ¥' + formatCurrency(i.price)).join('\n'));
    } else {
        showToast('未找到商品', 'warning');
    }
}

/**
 * @private
 * @description 应用折扣
 */
function applyDiscount() {
    const percent = parseFloat(prompt('输入折扣百分比：', '10'));
    if (isNaN(percent) || percent < 0 || percent > 100) return;
    const discount = state.total * (percent / 100);
    state.total -= discount;
    
    const displayAmount = document.getElementById('displayAmount');
    const displaySub = document.getElementById('displaySub');
    if (displayAmount) displayAmount.textContent = '¥' + formatCurrency(state.total);
    if (displaySub) displaySub.textContent = '折扣 ' + percent + '% 已应用';
    
    showToast('折扣已应用: ' + percent + '%', 'success');
}

/**
 * @private
 * @description 作废商品
 */
function voidItem() {
    if (state.items.length === 0) {
        showToast('没有商品可作废', 'warning');
        return;
    }
    const list = state.items.map((item, i) => (i+1) + '. ' + item.name + ' ¥' + formatCurrency(item.price)).join('\n');
    const idx = prompt('选择要作废的商品编号 (1-' + state.items.length + '):\n' + list);
    if (!idx) return;
    const index = parseInt(idx) - 1;
    if (isNaN(index) || index < 0 || index >= state.items.length) {
        showToast('无效编号', 'error');
        return;
    }
    const removed = state.items.splice(index, 1)[0];
    state.total -= removed.price;
    
    const displayAmount = document.getElementById('displayAmount');
    const displaySub = document.getElementById('displaySub');
    if (displayAmount) displayAmount.textContent = '¥' + formatCurrency(state.total);
    if (displaySub) displaySub.textContent = '已作废: ' + removed.name;
    
    updateItemsList();
    showToast('已作废: ' + removed.name, 'info');
}

/**
 * @private
 * @description 挂起交易
 */
function suspendTransaction() {
    if (state.items.length === 0) {
        showToast('没有交易可挂起', 'warning');
        return;
    }
    const data = {
        id: state.transactionId,
        items: state.items,
        total: state.total
    };
    localStorage.setItem('suspended_transaction', JSON.stringify(data));
    showToast('交易已挂起 #' + state.transactionId, 'info');
    newTransaction();
}

/**
 * @private
 * @description 完成交易
 */
function completeTransaction() {
    if (state.items.length === 0) {
        showToast('没有商品，无法完成交易', 'warning');
        return;
    }
    const method = confirm('使用现金支付？\n点击"确定"现金，点击"取消"刷卡');
    const payment = method ? '现金' : '刷卡';
    
    const msg = '交易已完成!\n' +
              '交易号: #' + state.transactionId + '\n' +
              '商品数: ' + state.items.length + '\n' +
              '总计: ¥' + formatCurrency(state.total) + '\n' +
              '支付方式: ' + payment;
    alert(msg);
    
    // 更新统计
    const sales = document.getElementById('todaySales');
    if (sales) {
        const current = parseFloat(sales.textContent.replace('¥', ''));
        sales.textContent = '¥' + formatCurrency(current + state.total);
    }
    const count = document.getElementById('todayTransactions');
    if (count) count.textContent = parseInt(count.textContent) + 1;
    const net = document.getElementById('todayNet');
    if (net) {
        const netCurrent = parseFloat(net.textContent.replace('¥', ''));
        net.textContent = '¥' + formatCurrency(netCurrent + state.total);
    }
    
    newTransaction();
}

/**
 * @private
 * @description 打开钱箱
 */
function openDrawer() {
    showToast('💰 钱箱已打开', 'success');
    // 实际项目中会触发硬件钱箱
}

/**
 * @private
 * @description 打印X报表
 */
function printXReport() {
    showToast('📊 X报表已打印 (当前班次统计)', 'info');
}

/**
 * @private
 * @description 打印Z报表
 */
function printZReport() {
    showToast('📊 Z报表已打印 (结算报表)', 'info');
}

/**
 * @private
 * @description 更新商品列表
 */
function updateItemsList() {
    const container = document.getElementById('registerItems');
    if (!container) return;
    
    if (state.items.length === 0) {
        container.innerHTML = `
            <div class="empty-items">
                <i class="fas fa-shopping-cart"></i>
                <p>暂无商品，请扫描或添加</p>
            </div>
        `;
        return;
    }
    
    let html = '<div style="display:grid;grid-template-columns:1fr 80px 80px;gap:8px;font-weight:600;padding:8px 0;border-bottom:2px solid #e5e7eb;">';
    html += '<span>商品名称</span><span>数量</span><span>金额</span></div>';
    state.items.forEach(item => {
        html += `
            <div style="display:grid;grid-template-columns:1fr 80px 80px;gap:8px;padding:6px 0;border-bottom:1px solid #f3f4f6;">
                <span>${item.name}</span>
                <span>${item.qty}</span>
                <span>¥${formatCurrency(item.price)}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

/**
 * @private
 * @description 渲染交易列表
 */
function renderTransactions() {
    const container = document.getElementById('transactionList');
    if (!container) return;

    const filtered = state.transactions.filter(t => 
        t.customer.includes(state.searchQuery) ||
        t.id.includes(state.searchQuery)
    );

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 0;color:#8e8e93;">
                <i class="fas fa-receipt" style="font-size:48px;margin-bottom:12px;display:block;"></i>
                <p>暂无交易记录</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead>
                    <tr style="border-bottom:2px solid #e5e7eb;">
                        <th style="padding:10px 12px;text-align:left;">订单号</th>
                        <th style="padding:10px 12px;text-align:left;">时间</th>
                        <th style="padding:10px 12px;text-align:left;">客户</th>
                        <th style="padding:10px 12px;text-align:right;">金额</th>
                        <th style="padding:10px 12px;text-align:left;">支付方式</th>
                        <th style="padding:10px 12px;text-align:left;">状态</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(t => `
                        <tr style="border-bottom:1px solid #f3f4f6;">
                            <td style="padding:10px 12px;">${t.id}</td>
                            <td style="padding:10px 12px;">${t.date}</td>
                            <td style="padding:10px 12px;">${t.customer}</td>
                            <td style="padding:10px 12px;text-align:right;font-weight:600;">¥${formatCurrency(t.amount)}</td>
                            <td style="padding:10px 12px;">
                                <span style="padding:2px 10px;border-radius:12px;font-size:12px;background:#f3f4f6;">
                                    ${t.method === 'cash' ? '现金' : t.method === 'wechat' ? '微信' : t.method === 'alipay' ? '支付宝' : '刷卡'}
                                </span>
                            </td>
                            <td style="padding:10px 12px;">
                                <span style="padding:2px 10px;border-radius:12px;font-size:12px;background:${t.status === 'completed' ? '#d1fae5' : '#fee2e2'};color:${t.status === 'completed' ? '#065f46' : '#991b1b'};">
                                    ${t.status === 'completed' ? '已完成' : '已退款'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * @private
 * @description 更新统计数据
 */
function updateStats() {
    const total = state.transactions.reduce((sum, t) => sum + t.amount, 0);
    const count = state.transactions.length;
    const completed = state.transactions.filter(t => t.status === 'completed').length;
    const avg = count > 0 ? total / count : 0;

    const statTotal = document.getElementById('statTotal');
    const statCount = document.getElementById('statCount');
    const statCompleted = document.getElementById('statCompleted');
    const statAvg = document.getElementById('statAvg');
    
    if (statTotal) statTotal.textContent = `¥${formatCurrency(total)}`;
    if (statCount) statCount.textContent = count;
    if (statCompleted) statCompleted.textContent = completed;
    if (statAvg) statAvg.textContent = `¥${formatCurrency(avg)}`;
}

/**
 * @public
 * @returns {Promise<void>}
 * @description 初始化收银机
 */
export async function init() {
    console.log('💳 收银机 初始化...');
    
    state.transactions = getMockTransactions();
    renderTransactions();
    updateStats();
    
    // 检查挂起交易
    const saved = localStorage.getItem('suspended_transaction');
    if (saved) {
        const data = JSON.parse(saved);
        const displaySub = document.getElementById('displaySub');
        if (displaySub) displaySub.textContent = '有挂起交易 #' + data.id;
    }
    
    // 暴露全局方法
    window.CashRegisterModule = {
        items: state.items,
        transactionId: state.transactionId,
        total: state.total,
        newTransaction,
        scanItem,
        searchItem,
        applyDiscount,
        voidItem,
        suspendTransaction,
        completeTransaction,
        openDrawer,
        printXReport,
        printZReport,
        updateItemsList
    };
    
    console.log('✅ 收银机 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    newTransaction,
    completeTransaction
};