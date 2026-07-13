/**
 * @file bank.js
 * @module bank
 * @description 银行管理 - 银行账户和交易记录
 * 
 * @example
 * import { init } from './bank.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} BankAccount
 * @property {string} id - 账户ID
 * @property {string} name - 账户名称
 * @property {string} bank - 银行名称
 * @property {string} accountNumber - 账号
 * @property {number} balance - 余额
 * @property {string} type - 类型 (current/savings)
 * @property {string} status - 状态 (active/inactive)
 */

/**
 * @typedef {Object} BankTransaction
 * @property {string} id - 交易ID
 * @property {string} accountId - 账户ID
 * @property {string} type - 类型 (deposit/withdrawal/transfer)
 * @property {number} amount - 金额
 * @property {string} description - 描述
 * @property {string} date - 日期
 * @property {string} status - 状态 (completed/pending)
 */

/** @type {{accounts: BankAccount[], transactions: BankTransaction[], selectedAccount: string|null, page: number, pageSize: number}} 状态 */
const state = {
    accounts: [],
    transactions: [],
    selectedAccount: null,
    page: 1,
    pageSize: 10
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
    return d.toLocaleDateString('zh-CN');
}

/**
 * @private
 * @returns {{accounts: BankAccount[], transactions: BankTransaction[]}} 模拟银行数据
 */
function getMockData() {
    const accounts = [
        { id: 'BA001', name: '基本户', bank: '中国银行', accountNumber: '6217****1234', balance: 85600, type: 'current', status: 'active' },
        { id: 'BA002', name: '一般户', bank: '工商银行', accountNumber: '6217****5678', balance: 32500, type: 'current', status: 'active' }
    ];
    
    const transactions = [];
    const types = ['deposit', 'withdrawal', 'transfer'];
    const descs = ['销售收入', '采购付款', '工资发放', '税费缴纳', '客户付款', '供应商付款'];
    const statuses = ['completed', 'completed', 'pending', 'completed'];
    
    for (let i = 0; i < 12; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const amount = type === 'deposit' 
            ? Math.floor(Math.random() * 10000) + 1000 
            : -(Math.floor(Math.random() * 8000) + 500);
        
        transactions.push({
            id: `BT-${String(i + 1).padStart(6, '0')}`,
            accountId: Math.random() > 0.5 ? 'BA001' : 'BA002',
            type: type,
            amount: amount,
            description: descs[Math.floor(Math.random() * descs.length)],
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: statuses[Math.floor(Math.random() * statuses.length)]
        });
    }
    
    return { accounts, transactions };
}

/**
 * @private
 * @description 加载银行数据
 */
function loadData() {
    try {
        const saved = localStorage.getItem('bank_data');
        if (saved) {
            const data = JSON.parse(saved);
            state.accounts = data.accounts || [];
            state.transactions = data.transactions || [];
        } else {
            const data = getMockData();
            state.accounts = data.accounts;
            state.transactions = data.transactions;
            localStorage.setItem('bank_data', JSON.stringify(data));
        }
    } catch (e) {
        console.warn('加载银行数据失败:', e);
        const data = getMockData();
        state.accounts = data.accounts;
        state.transactions = data.transactions;
    }
    renderAccounts();
    renderTransactions();
    updateStats();
}

/**
 * @private
 * @description 渲染账户列表
 */
function renderAccounts() {
    const container = document.getElementById('accountList');
    if (!container) return;
    
    if (state.accounts.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#9CA3AF;">暂无账户</div>';
        return;
    }
    
    container.innerHTML = state.accounts.map(acc => `
        <div style="padding:12px 16px;border-bottom:1px solid #F3F4F6;cursor:pointer;${state.selectedAccount === acc.id ? 'background:#EEF2FF;' : ''}"
             onclick="window.BankModule.selectAccount('${acc.id}')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-weight:500;">${acc.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${acc.bank} | ${acc.accountNumber}</div>
                </div>
                <div style="font-weight:600;color:#10B981;">¥${formatCurrency(acc.balance)}</div>
            </div>
        </div>
    `).join('');
}

/**
 * @private
 * @description 渲染交易记录
 */
function renderTransactions() {
    const tbody = document.getElementById('transactionBody');
    if (!tbody) return;
    
    const filtered = state.selectedAccount 
        ? state.transactions.filter(t => t.accountId === state.selectedAccount)
        : state.transactions;
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="5" style="text-align:center;padding:20px;color:#9CA3AF;">暂无交易记录</td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = filtered.slice(0, 10).map(t => {
        const isInflow = t.amount > 0;
        const color = isInflow ? '#10B981' : '#EF4444';
        const typeLabel = { deposit: '存入', withdrawal: '取款', transfer: '转账' }[t.type] || t.type;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;">
                <td style="padding:8px 16px;font-size:13px;">${formatDate(t.date)}</td>
                <td style="padding:8px 16px;font-size:13px;">${t.description}</td>
                <td style="padding:8px 16px;font-size:13px;">${typeLabel}</td>
                <td style="padding:8px 16px;text-align:right;font-weight:600;color:${color};">
                    ${isInflow ? '+' : '-'}¥${formatCurrency(Math.abs(t.amount))}
                </td>
                <td style="padding:8px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:11px;background:${t.status === 'completed' ? '#D1FAE5' : '#FEF3C7'};color:${t.status === 'completed' ? '#065F46' : '#92400E'};">
                        ${t.status === 'completed' ? '已完成' : '处理中'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * @private
 * @description 更新统计
 */
function updateStats() {
    const totalBalance = state.accounts.reduce((sum, a) => sum + a.balance, 0);
    document.getElementById('totalBalance')?.textContent = '¥' + formatCurrency(totalBalance);
    document.getElementById('accountCount')?.textContent = state.accounts.length;
}

/**
 * @private
 * @param {string} id - 账户ID
 */
function selectAccount(id) {
    state.selectedAccount = state.selectedAccount === id ? null : id;
    renderAccounts();
    renderTransactions();
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('🏦 银行管理 初始化...');
    
    if (options?.data) {
        localStorage.setItem('bank_data', JSON.stringify(options.data));
    }
    
    loadData();
    
    window.BankModule = {
        state,
        loadData,
        renderAccounts,
        renderTransactions,
        updateStats,
        selectAccount
    };
    
    console.log('✅ 银行管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadData,
    selectAccount
};