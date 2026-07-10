/**
 * @file wallet.js
 * @module wallet
 * @description 电子钱包模块 - 钱包余额管理和交易记录
 * 
 * @example
 * import { init } from './wallet.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Wallet
 * @property {number} balance - 当前余额
 * @property {number} totalRecharge - 累计充值
 * @property {number} totalSpend - 累计消费
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id - 交易ID
 * @property {string} type - 类型 (income/expense)
 * @property {string} category - 分类 (recharge/order/refund/withdraw)
 * @property {string} description - 描述
 * @property {number} amount - 金额
 * @property {number} balance - 交易后余额
 * @property {string} status - 状态 (success/pending/failed)
 * @property {string} createdAt - 创建时间
 * @property {string} [customerId] - 客户ID
 * @property {string} [customerName] - 客户名称
 */

/**
 * @typedef {Object} WalletState
 * @property {Wallet} wallet - 钱包数据
 * @property {Transaction[]} transactions - 交易记录
 * @property {string} searchQuery - 搜索关键词
 * @property {string} typeFilter - 类型筛选
 * @property {string} statusFilter - 状态筛选
 * @property {number} page - 页码
 * @property {number} limit - 每页数量
 */

/** @type {WalletState} 状态 */
const state = {
    wallet: {
        balance: 0,
        totalRecharge: 0,
        totalSpend: 0,
        updatedAt: new Date().toISOString()
    },
    transactions: [],
    searchQuery: '',
    typeFilter: 'all',
    statusFilter: 'all',
    page: 1,
    limit: 10
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
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * @private
 * @param {string} type - 交易类型
 * @returns {Object} 类型配置
 */
function getTypeConfig(type) {
    const map = {
        'income': { label: '收入', color: '#10B981', icon: 'fa-arrow-down' },
        'expense': { label: '支出', color: '#EF4444', icon: 'fa-arrow-up' }
    };
    return map[type] || map.income;
}

/**
 * @private
 * @param {string} status - 状态
 * @returns {Object} 状态配置
 */
function getStatusConfig(status) {
    const map = {
        'success': { label: '成功', color: '#10B981', bg: '#D1FAE5' },
        'pending': { label: '处理中', color: '#F59E0B', bg: '#FEF3C7' },
        'failed': { label: '失败', color: '#EF4444', bg: '#FEE2E2' }
    };
    return map[status] || map.success;
}

/**
 * @private
 * @param {string} category - 分类
 * @returns {string} 分类标签
 */
function getCategoryLabel(category) {
    const map = {
        'recharge': '充值',
        'order': '消费',
        'refund': '退款',
        'withdraw': '提现',
        'bonus': '奖励'
    };
    return map[category] || category;
}

/**
 * @private
 * @returns {Transaction[]} 模拟交易数据
 */
function getMockTransactions() {
    const descriptions = ['充值余额', '洗车消费', '会员充值', '消费退款', '推荐奖励'];
    const categories = ['recharge', 'order', 'recharge', 'refund', 'bonus'];
    const types = ['income', 'expense', 'income', 'income', 'income'];
    const statuses = ['success', 'success', 'success', 'success', 'success'];
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静'];
    
    const transactions = [];
    const now = Date.now();
    let balance = 500;
    
    for (let i = 0; i < 12; i++) {
        const idx = i % descriptions.length;
        const amount = [50, 100, 200, 500, 1000][Math.floor(Math.random() * 5)];
        const type = types[idx];
        const date = new Date(now - (i + 1) * 24 * 60 * 60 * 1000);
        
        if (type === 'income') {
            balance += amount;
        } else {
            balance -= amount;
        }
        
        transactions.push({
            id: `TXN-${String(i + 1).padStart(6, '0')}`,
            type: type,
            category: categories[idx],
            description: descriptions[idx],
            amount: amount,
            balance: balance,
            status: statuses[idx % statuses.length],
            customerId: `CUS-${String(Math.floor(Math.random() * 20) + 1).padStart(6, '0')}`,
            customerName: customers[Math.floor(Math.random() * customers.length)],
            createdAt: date.toISOString()
        });
    }
    
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return transactions;
}

/**
 * @private
 * @description 加载钱包数据
 */
function loadWallet() {
    try {
        const saved = localStorage.getItem('wallet_data');
        if (saved) {
            state.wallet = JSON.parse(saved);
        } else {
            state.wallet = {
                balance: 500,
                totalRecharge: 1200,
                totalSpend: 700,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('wallet_data', JSON.stringify(state.wallet));
        }
    } catch (e) {
        console.warn('加载钱包数据失败:', e);
    }
}

/**
 * @private
 * @description 加载交易记录
 */
function loadTransactions() {
    try {
        const saved = localStorage.getItem('wallet_transactions');
        if (saved) {
            state.transactions = JSON.parse(saved);
        } else {
            state.transactions = getMockTransactions();
            localStorage.setItem('wallet_transactions', JSON.stringify(state.transactions));
        }
    } catch (e) {
        console.warn('加载交易记录失败:', e);
        state.transactions = getMockTransactions();
    }
    renderTransactions();
    updateStats();
}

/**
 * @private
 * @description 保存交易记录
 */
function saveTransactions() {
    try {
        localStorage.setItem('wallet_transactions', JSON.stringify(state.transactions));
    } catch (e) {
        console.warn('保存交易记录失败:', e);
    }
}

/**
 * @private
 * @description 保存钱包数据
 */
function saveWallet() {
    try {
        localStorage.setItem('wallet_data', JSON.stringify(state.wallet));
    } catch (e) {
        console.warn('保存钱包数据失败:', e);
    }
}

/**
 * @private
 * @description 渲染钱包信息
 */
function renderWallet() {
    const balanceEl = document.getElementById('walletBalance');
    const totalRechargeEl = document.getElementById('totalRecharge');
    const totalSpendEl = document.getElementById('totalSpend');
    const updateTimeEl = document.getElementById('updateTime');
    
    if (balanceEl) balanceEl.textContent = '¥' + formatCurrency(state.wallet.balance);
    if (totalRechargeEl) totalRechargeEl.textContent = '¥' + formatCurrency(state.wallet.totalRecharge);
    if (totalSpendEl) totalSpendEl.textContent = '¥' + formatCurrency(state.wallet.totalSpend);
    if (updateTimeEl) updateTimeEl.textContent = formatDate(state.wallet.updatedAt);
}

/**
 * @private
 * @description 更新统计数据
 */
function updateStats() {
    const totalIncome = state.transactions
        .filter(t => t.type === 'income' && t.status === 'success')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = state.transactions
        .filter(t => t.type === 'expense' && t.status === 'success')
        .reduce((sum, t) => sum + t.amount, 0);
    const pendingCount = state.transactions.filter(t => t.status === 'pending').length;
    
    const elements = {
        'statIncome': '¥' + formatCurrency(totalIncome),
        'statExpense': '¥' + formatCurrency(totalExpense),
        'statTransactions': state.transactions.length,
        'statPending': pendingCount
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @description 渲染交易列表
 */
function renderTransactions() {
    const container = document.getElementById('transactionListBody');
    if (!container) return;
    
    let filtered = state.transactions;
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(t => 
            t.description.toLowerCase().includes(query) ||
            (t.customerName && t.customerName.toLowerCase().includes(query)) ||
            t.id.toLowerCase().includes(query)
        );
    }
    
    if (state.typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === state.typeFilter);
    }
    
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(t => t.status === state.statusFilter);
    }
    
    // 分页
    const start = (state.page - 1) * state.limit;
    const end = start + state.limit;
    const paginated = filtered.slice(start, end);
    
    if (paginated.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-receipt" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无交易记录
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = paginated.map(transaction => {
        const type = getTypeConfig(transaction.type);
        const status = getStatusConfig(transaction.status);
        const category = getCategoryLabel(transaction.category);
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 12px;font-family:monospace;font-size:13px;">${transaction.id}</td>
                <td style="padding:10px 12px;">
                    <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.color}20;color:${type.color};">
                        <i class="fas ${type.icon}"></i> ${type.label}
                    </span>
                </td>
                <td style="padding:10px 12px;font-size:13px;">
                    ${transaction.description}
                    <div style="font-size:11px;color:#6B7280;">${category}</div>
                </td>
                <td style="padding:10px 12px;font-size:13px;color:#6B7280;">${transaction.customerName || '-'}</td>
                <td style="padding:10px 12px;text-align:right;font-weight:600;color:${transaction.type === 'income' ? '#10B981' : '#EF4444'};">
                    ${transaction.type === 'income' ? '+' : '-'}¥${formatCurrency(transaction.amount)}
                </td>
                <td style="padding:10px 12px;text-align:center;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:500;background:${status.bg};color:${status.color};">
                        ${status.label}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    // 更新分页信息
    const totalPages = Math.ceil(filtered.length / state.limit);
    const pageInfo = document.getElementById('transactionPageInfo');
    if (pageInfo) {
        pageInfo.textContent = `共 ${filtered.length} 条记录，第 ${state.page}/${totalPages || 1} 页`;
    }
}

/**
 * @private
 * @description 充值
 */
function recharge() {
    const amount = parseFloat(prompt('请输入充值金额：', '100'));
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效金额', 'warning');
        return;
    }
    
    const note = prompt('充值备注：', '微信充值') || '微信充值';
    
    const transaction = {
        id: `TXN-${String(Date.now()).slice(-6)}`,
        type: 'income',
        category: 'recharge',
        description: note,
        amount: amount,
        balance: state.wallet.balance + amount,
        status: 'success',
        customerId: null,
        customerName: '系统充值',
        createdAt: new Date().toISOString()
    };
    
    state.wallet.balance += amount;
    state.wallet.totalRecharge += amount;
    state.wallet.updatedAt = new Date().toISOString();
    
    state.transactions.unshift(transaction);
    saveWallet();
    saveTransactions();
    renderWallet();
    renderTransactions();
    updateStats();
    showToast(`充值成功！¥${formatCurrency(amount)}`, 'success');
}

/**
 * @private
 * @description 提现
 */
function withdraw() {
    const amount = parseFloat(prompt('请输入提现金额：', '50'));
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效金额', 'warning');
        return;
    }
    
    if (amount > state.wallet.balance) {
        showToast('余额不足', 'error');
        return;
    }
    
    const note = prompt('提现备注：', '提现到银行卡') || '提现到银行卡';
    
    const transaction = {
        id: `TXN-${String(Date.now()).slice(-6)}`,
        type: 'expense',
        category: 'withdraw',
        description: note,
        amount: amount,
        balance: state.wallet.balance - amount,
        status: 'pending',
        customerId: null,
        customerName: '系统提现',
        createdAt: new Date().toISOString()
    };
    
    state.wallet.balance -= amount;
    state.wallet.updatedAt = new Date().toISOString();
    
    state.transactions.unshift(transaction);
    saveWallet();
    saveTransactions();
    renderWallet();
    renderTransactions();
    updateStats();
    showToast(`提现申请已提交！¥${formatCurrency(amount)}`, 'info');
}

/**
 * @private
 * @description 搜索交易
 */
function searchTransactions(query) {
    state.searchQuery = query;
    state.page = 1;
    renderTransactions();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    state.typeFilter = typeFilter ? typeFilter.value : 'all';
    state.statusFilter = statusFilter ? statusFilter.value : 'all';
    state.page = 1;
    renderTransactions();
}

/**
 * @private
 * @description 重置筛选
 */
function resetFilters() {
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (typeFilter) typeFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    
    state.typeFilter = 'all';
    state.statusFilter = 'all';
    state.searchQuery = '';
    state.page = 1;
    renderTransactions();
}

/**
 * @private
 * @description 切换页码
 */
function changePage(delta) {
    const total = state.transactions.length;
    const totalPages = Math.ceil(total / state.limit);
    const newPage = state.page + delta;
    if (newPage < 1 || newPage > totalPages) return;
    state.page = newPage;
    renderTransactions();
}

/**
 * @private
 * @description 刷新数据
 */
function refresh() {
    loadWallet();
    loadTransactions();
    renderWallet();
    showToast('数据已刷新', 'success');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                searchTransactions(this.value);
            }, 300);
        });
    }
    
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', applyFilters);
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    const refreshBtn = document.getElementById('refreshWallet');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
    
    const rechargeBtn = document.getElementById('rechargeBtn');
    if (rechargeBtn) {
        rechargeBtn.addEventListener('click', recharge);
    }
    
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', withdraw);
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @returns {Promise<void>}
 * @description 初始化电子钱包
 */
export async function init(options) {
    console.log('💰 电子钱包 初始化...');
    
    if (options?.wallet) {
        state.wallet = options.wallet;
        saveWallet();
    } else {
        loadWallet();
    }
    
    if (options?.transactions) {
        state.transactions = options.transactions;
        saveTransactions();
    } else {
        loadTransactions();
    }
    
    renderWallet();
    updateStats();
    bindEvents();
    
    // 暴露全局方法
    window.WalletModule = {
        state,
        loadWallet,
        loadTransactions,
        renderWallet,
        renderTransactions,
        updateStats,
        recharge,
        withdraw,
        searchTransactions,
        applyFilters,
        resetFilters,
        changePage,
        refresh,
        saveWallet,
        saveTransactions
    };
    
    console.log('✅ 电子钱包 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadWallet,
    loadTransactions,
    recharge,
    withdraw,
    refresh,
    saveWallet,
    saveTransactions
};