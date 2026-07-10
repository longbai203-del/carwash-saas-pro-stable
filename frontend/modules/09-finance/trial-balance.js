/**
 * @file trial-balance.js
 * @module trial-balance
 * @description 试算平衡表 - 科目余额汇总
 * 
 * @example
 * import { init } from './trial-balance.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} AccountBalance
 * @property {string} accountCode - 科目编码
 * @property {string} accountName - 科目名称
 * @property {string} type - 科目类型 (asset/liability/equity/income/expense)
 * @property {number} debit - 借方余额
 * @property {number} credit - 贷方余额
 * @property {number} balance - 余额
 */

/** @type {{accounts: AccountBalance[], filteredAccounts: AccountBalance[], filters: {type: string, search: string}, stats: {totalDebit: number, totalCredit: number, totalBalance: number}, page: number, pageSize: number}} 状态 */
const state = {
    accounts: [],
    filteredAccounts: [],
    filters: {
        type: '',
        search: ''
    },
    stats: {
        totalDebit: 0,
        totalCredit: 0,
        totalBalance: 0
    },
    page: 1,
    pageSize: 10
};

/**
 * 科目类型配置
 */
const TYPE_MAP = {
    asset: { label: '资产', color: '#3B82F6', bg: '#DBEAFE' },
    liability: { label: '负债', color: '#F59E0B', bg: '#FEF3C7' },
    equity: { label: '权益', color: '#8B5CF6', bg: '#EDE9FE' },
    income: { label: '收入', color: '#10B981', bg: '#D1FAE5' },
    expense: { label: '费用', color: '#EF4444', bg: '#FEE2E2' }
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
 * @returns {AccountBalance[]} 模拟科目余额数据
 */
function getMockAccounts() {
    return [
        { accountCode: '1001', accountName: '库存现金', type: 'asset', debit: 12500, credit: 0, balance: 12500 },
        { accountCode: '1002', accountName: '银行存款', type: 'asset', debit: 85600, credit: 0, balance: 85600 },
        { accountCode: '1122', accountName: '应收账款', type: 'asset', debit: 32000, credit: 0, balance: 32000 },
        { accountCode: '1403', accountName: '库存商品', type: 'asset', debit: 45600, credit: 0, balance: 45600 },
        { accountCode: '1601', accountName: '固定资产', type: 'asset', debit: 120000, credit: 0, balance: 120000 },
        { accountCode: '2001', accountName: '应付账款', type: 'liability', debit: 0, credit: 28000, balance: -28000 },
        { accountCode: '2201', accountName: '应付职工薪酬', type: 'liability', debit: 0, credit: 15000, balance: -15000 },
        { accountCode: '2221', accountName: '应交税费', type: 'liability', debit: 0, credit: 8500, balance: -8500 },
        { accountCode: '4001', accountName: '实收资本', type: 'equity', debit: 0, credit: 200000, balance: -200000 },
        { accountCode: '4101', accountName: '盈余公积', type: 'equity', debit: 0, credit: 25000, balance: -25000 },
        { accountCode: '6001', accountName: '主营业务收入', type: 'income', debit: 0, credit: 158000, balance: -158000 },
        { accountCode: '6401', accountName: '主营业务成本', type: 'expense', debit: 95000, credit: 0, balance: 95000 },
        { accountCode: '6601', accountName: '销售费用', type: 'expense', debit: 12000, credit: 0, balance: 12000 },
        { accountCode: '6602', accountName: '管理费用', type: 'expense', debit: 18000, credit: 0, balance: 18000 },
        { accountCode: '6603', accountName: '财务费用', type: 'expense', debit: 3000, credit: 0, balance: 3000 }
    ];
}

/**
 * @private
 * @description 加载科目余额数据
 */
function loadTrialBalance() {
    try {
        const saved = localStorage.getItem('trial_balance_data');
        if (saved) {
            state.accounts = JSON.parse(saved);
        } else {
            state.accounts = getMockAccounts();
            localStorage.setItem('trial_balance_data', JSON.stringify(state.accounts));
        }
    } catch (e) {
        console.warn('加载试算平衡表数据失败:', e);
        state.accounts = getMockAccounts();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存科目余额数据
 */
function saveTrialBalance() {
    try {
        localStorage.setItem('trial_balance_data', JSON.stringify(state.accounts));
    } catch (e) {
        console.warn('保存试算平衡表数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.accounts;
    
    if (state.filters.type) {
        filtered = filtered.filter(a => a.type === state.filters.type);
    }
    
    if (state.filters.search) {
        const search = state.filters.search.toLowerCase();
        filtered = filtered.filter(a => 
            a.accountName.toLowerCase().includes(search) ||
            a.accountCode.includes(search)
        );
    }
    
    state.filteredAccounts = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const totalDebit = state.filteredAccounts.reduce((sum, a) => sum + a.debit, 0);
    const totalCredit = state.filteredAccounts.reduce((sum, a) => sum + a.credit, 0);
    const totalBalance = state.filteredAccounts.reduce((sum, a) => sum + a.balance, 0);
    
    state.stats = { totalDebit, totalCredit, totalBalance };
}

/**
 * @private
 * @description 渲染试算平衡表
 */
function render() {
    const tbody = document.getElementById('trialBalanceBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredAccounts.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-balance-scale" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无科目数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(a => {
        const type = TYPE_MAP[a.type] || TYPE_MAP.asset;
        const balance = a.balance;
        const isDebit = balance > 0;
        const absBalance = Math.abs(balance);
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-family:monospace;">${a.accountCode}</td>
                <td style="padding:10px 16px;font-weight:500;">${a.accountName}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.bg};color:${type.color};">
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:right;color:#10B981;">
                    ${a.debit > 0 ? formatCurrency(a.debit) : '-'}
                </td>
                <td style="padding:10px 16px;text-align:right;color:#EF4444;">
                    ${a.credit > 0 ? formatCurrency(a.credit) : '-'}
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:${isDebit ? '#10B981' : '#EF4444'};">
                    ${isDebit ? '' : '-'}${formatCurrency(absBalance)}
                </td>
            </tr>
        `;
    }).join('');

    updateStats();
    renderPagination();
}

/**
 * @private
 * @description 更新统计
 */
function updateStats() {
    const stats = state.stats;
    
    const elements = {
        'statTotalDebit': formatCurrency(stats.totalDebit),
        'statTotalCredit': formatCurrency(stats.totalCredit),
        'statTotalBalance': formatCurrency(stats.totalBalance),
        'statTotalAccounts': state.filteredAccounts.length
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredAccounts.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 个科目
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个科目，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
    `;
    
    html += `
        <button onclick="window.TrialBalanceModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.TrialBalanceModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.TrialBalanceModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.TrialBalanceModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.TrialBalanceModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * @private
 * @param {number} page - 页码
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredAccounts.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function handleSearch() {
    state.filters.type = document.getElementById('searchType')?.value || '';
    state.filters.search = document.getElementById('searchInput')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const typeInput = document.getElementById('searchType');
    const searchInput = document.getElementById('searchInput');
    
    if (typeInput) typeInput.value = '';
    if (searchInput) searchInput.value = '';
    
    state.filters = { type: '', search: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function bindEvents() {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    
    document.querySelectorAll('#searchType, #searchInput').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('⚖️ 试算平衡表 初始化...');
    
    if (options?.data) {
        state.accounts = options.data;
        localStorage.setItem('trial_balance_data', JSON.stringify(state.accounts));
    }
    
    loadTrialBalance();
    bindEvents();
    render();
    
    window.TrialBalanceModule = {
        state,
        loadTrialBalance,
        render,
        renderPagination,
        updateStats,
        goToPage,
        handleSearch,
        handleReset,
        saveTrialBalance,
        applyFilters
    };
    
    console.log('✅ 试算平衡表 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadTrialBalance,
    goToPage,
    saveTrialBalance
};