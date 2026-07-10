/**
 * @file journal.js
 * @module journal
 * @description 日记账 - 会计凭证记录
 * 
 * @example
 * import { init } from './journal.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} JournalEntry
 * @property {string} id - 凭证ID
 * @property {string} voucherNo - 凭证编号
 * @property {string} date - 日期
 * @property {string} accountCode - 科目编码
 * @property {string} accountName - 科目名称
 * @property {string} summary - 摘要
 * @property {number} debit - 借方金额
 * @property {number} credit - 贷方金额
 * @property {string} status - 状态 (draft/posted)
 * @property {string} createdAt - 创建时间
 * @property {string} postedAt - 过账时间
 */

/** @type {{entries: JournalEntry[], filteredEntries: JournalEntry[], filters: {dateFrom: string, dateTo: string, account: string, status: string}, stats: {totalDebit: number, totalCredit: number, count: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    entries: [],
    filteredEntries: [],
    filters: {
        dateFrom: '',
        dateTo: '',
        account: '',
        status: ''
    },
    stats: {
        totalDebit: 0,
        totalCredit: 0,
        count: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
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
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的完整日期时间
 */
function formatDateTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
}

/**
 * @private
 * @returns {JournalEntry[]} 模拟日记账数据
 */
function getMockEntries() {
    const accounts = [
        { code: '1001', name: '库存现金' },
        { code: '1002', name: '银行存款' },
        { code: '1122', name: '应收账款' },
        { code: '1403', name: '库存商品' },
        { code: '2001', name: '应付账款' },
        { code: '6001', name: '主营业务收入' },
        { code: '6401', name: '主营业务成本' }
    ];
    const summaries = ['销售商品', '采购入库', '支付工资', '收到货款', '支付货款', '计提折旧', '结转成本'];
    const statuses = ['draft', 'posted', 'posted', 'posted', 'draft', 'posted'];
    
    const entries = [];
    const now = Date.now();
    
    for (let i = 0; i < 12; i++) {
        const idx = i % accounts.length;
        const isDebit = Math.random() > 0.5;
        const amount = Math.floor(Math.random() * 10000) + 500;
        const date = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000);
        
        entries.push({
            id: `JE-${String(i + 1).padStart(6, '0')}`,
            voucherNo: `VOUCH-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
            date: date.toISOString().split('T')[0],
            accountCode: accounts[idx].code,
            accountName: accounts[idx].name,
            summary: summaries[idx % summaries.length] + (i + 1),
            debit: isDebit ? amount : 0,
            credit: isDebit ? 0 : amount,
            status: statuses[i % statuses.length],
            createdAt: date.toISOString(),
            postedAt: statuses[i % statuses.length] === 'posted' 
                ? new Date(date.getTime() + 3600000).toISOString() 
                : null
        });
    }
    
    // 按日期排序
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    return entries;
}

/**
 * @private
 * @description 加载日记账数据
 */
function loadJournal() {
    try {
        const saved = localStorage.getItem('journal_data');
        if (saved) {
            state.entries = JSON.parse(saved);
        } else {
            state.entries = getMockEntries();
            localStorage.setItem('journal_data', JSON.stringify(state.entries));
        }
    } catch (e) {
        console.warn('加载日记账数据失败:', e);
        state.entries = getMockEntries();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存日记账数据
 */
function saveJournal() {
    try {
        localStorage.setItem('journal_data', JSON.stringify(state.entries));
    } catch (e) {
        console.warn('保存日记账数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.entries;
    
    if (state.filters.dateFrom) {
        filtered = filtered.filter(e => e.date >= state.filters.dateFrom);
    }
    
    if (state.filters.dateTo) {
        filtered = filtered.filter(e => e.date <= state.filters.dateTo);
    }
    
    if (state.filters.account) {
        filtered = filtered.filter(e => 
            e.accountName.includes(state.filters.account) ||
            e.accountCode.includes(state.filters.account)
        );
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(e => e.status === state.filters.status);
    }
    
    state.filteredEntries = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const totalDebit = state.filteredEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = state.filteredEntries.reduce((sum, e) => sum + e.credit, 0);
    const count = state.filteredEntries.length;
    
    state.stats = { totalDebit, totalCredit, count };
}

/**
 * @private
 * @description 渲染日记账列表
 */
function render() {
    const tbody = document.getElementById('journalBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredEntries.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-book" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无日记账记录
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        draft: { label: '草稿', color: '#F3F4F6', textColor: '#4B5563' },
        posted: { label: '已过账', color: '#D1FAE5', textColor: '#065F46' }
    };

    tbody.innerHTML = pageData.map(e => {
        const status = statusMap[e.status] || statusMap.draft;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:8px 12px;font-family:monospace;font-size:12px;">${e.voucherNo}</td>
                <td style="padding:8px 12px;font-size:13px;">${formatDate(e.date)}</td>
                <td style="padding:8px 12px;font-family:monospace;font-size:12px;">${e.accountCode}</td>
                <td style="padding:8px 12px;font-size:13px;">${e.accountName}</td>
                <td style="padding:8px 12px;font-size:13px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${e.summary}</td>
                <td style="padding:8px 12px;text-align:right;color:#10B981;">
                    ${e.debit > 0 ? formatCurrency(e.debit) : '-'}
                </td>
                <td style="padding:8px 12px;text-align:right;color:#EF4444;">
                    ${e.credit > 0 ? formatCurrency(e.credit) : '-'}
                </td>
                <td style="padding:8px 12px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
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
    
    document.getElementById('statTotalDebit')?.textContent = formatCurrency(stats.totalDebit);
    document.getElementById('statTotalCredit')?.textContent = formatCurrency(stats.totalCredit);
    document.getElementById('statCount')?.textContent = stats.count;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredEntries.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条记录
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
    `;
    
    html += `
        <button onclick="window.JournalModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.JournalModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.JournalModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.JournalModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.JournalModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredEntries.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function handleSearch() {
    state.filters.dateFrom = document.getElementById('dateFrom')?.value || '';
    state.filters.dateTo = document.getElementById('dateTo')?.value || '';
    state.filters.account = document.getElementById('searchAccount')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const accountInput = document.getElementById('searchAccount');
    const statusInput = document.getElementById('searchStatus');
    
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    if (accountInput) accountInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { dateFrom: '', dateTo: '', account: '', status: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function showCreateModal() {
    const voucherNo = prompt('凭证编号：', `VOUCH-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`);
    if (!voucherNo) return;
    const date = prompt('日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
    if (!date) return;
    const accountCode = prompt('科目编码：', '1001');
    if (!accountCode) return;
    const accountName = prompt('科目名称：', '库存现金');
    if (!accountName) return;
    const summary = prompt('摘要：');
    if (!summary) return;
    const debit = parseFloat(prompt('借方金额：', '0'));
    const credit = parseFloat(prompt('贷方金额：', '0'));
    if (isNaN(debit) || isNaN(credit) || (debit === 0 && credit === 0)) {
        showToast('请输入有效金额', 'error');
        return;
    }
    
    const newEntry = {
        id: 'JE-' + Date.now().toString().slice(-6),
        voucherNo: voucherNo.trim(),
        date: date,
        accountCode: accountCode.trim(),
        accountName: accountName.trim(),
        summary: summary.trim(),
        debit: debit || 0,
        credit: credit || 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
        postedAt: null
    };
    
    state.entries.push(newEntry);
    saveJournal();
    applyFilters();
    render();
    showToast('凭证已创建', 'success');
}

/**
 * @private
 */
function bindEvents() {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    
    const createBtn = document.getElementById('createBtn');
    if (createBtn) createBtn.addEventListener('click', showCreateModal);
    
    document.querySelectorAll('#dateFrom, #dateTo, #searchAccount, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📖 日记账 初始化...');
    
    if (options?.data) {
        state.entries = options.data;
        localStorage.setItem('journal_data', JSON.stringify(state.entries));
    }
    
    loadJournal();
    bindEvents();
    render();
    
    window.JournalModule = {
        state,
        loadJournal,
        render,
        renderPagination,
        updateStats,
        goToPage,
        handleSearch,
        handleReset,
        showCreateModal,
        saveJournal,
        applyFilters
    };
    
    console.log('✅ 日记账 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadJournal,
    goToPage,
    showCreateModal,
    saveJournal
};