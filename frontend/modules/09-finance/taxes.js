/**
 * @file taxes.js
 * @module taxes
 * @description 税务管理 - 税务申报和缴纳记录
 * 
 * @example
 * import { init } from './taxes.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} TaxRecord
 * @property {string} id - 记录ID
 * @property {string} taxType - 税种 (vat/cit/individual/other)
 * @property {string} period - 期间
 * @property {number} taxableAmount - 应税金额
 * @property {number} taxRate - 税率
 * @property {number} taxAmount - 税额
 * @property {string} status - 状态 (pending/paid/overdue)
 * @property {string} dueDate - 截止日期
 * @property {string} paymentDate - 缴款日期
 * @property {string} note - 备注
 */

/** @type {{records: TaxRecord[], filteredRecords: TaxRecord[], filters: {type: string, status: string, period: string}, stats: {totalTax: number, paidTax: number, pendingCount: number}, page: number, pageSize: number}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        type: '',
        status: '',
        period: ''
    },
    stats: {
        totalTax: 0,
        paidTax: 0,
        pendingCount: 0
    },
    page: 1,
    pageSize: 10
};

/**
 * 税种配置
 */
const TAX_TYPE_MAP = {
    vat: { label: '增值税', color: '#DBEAFE', textColor: '#1E40AF' },
    cit: { label: '企业所得税', color: '#FEF3C7', textColor: '#92400E' },
    individual: { label: '个人所得税', color: '#EDE9FE', textColor: '#6D28D9' },
    other: { label: '其他税费', color: '#F3F4F6', textColor: '#4B5563' }
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
 * @returns {TaxRecord[]} 模拟税务数据
 */
function getMockTaxes() {
    const taxTypes = ['vat', 'cit', 'individual', 'vat', 'cit'];
    const statuses = ['pending', 'paid', 'pending', 'overdue', 'paid'];
    const periods = ['2024-Q1', '2024-Q1', '2024-Q2', '2024-Q2', '2024-Q1'];
    const rates = [0.06, 0.25, 0.03, 0.06, 0.25];
    const amounts = [8500, 12000, 3500, 9200, 15000];
    
    return amounts.map((amount, i) => ({
        id: `TAX-${String(i + 1).padStart(6, '0')}`,
        taxType: taxTypes[i % taxTypes.length],
        period: periods[i % periods.length],
        taxableAmount: Math.round(amount / rates[i % rates.length]),
        taxRate: rates[i % rates.length] * 100,
        taxAmount: amount,
        status: statuses[i % statuses.length],
        dueDate: new Date(Date.now() + (i + 1) * 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentDate: statuses[i % statuses.length] === 'paid' 
            ? new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : '',
        note: ''
    }));
}

/**
 * @private
 * @description 加载税务数据
 */
function loadTaxes() {
    try {
        const saved = localStorage.getItem('tax_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockTaxes();
            localStorage.setItem('tax_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载税务数据失败:', e);
        state.records = getMockTaxes();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存税务数据
 */
function saveTaxes() {
    try {
        localStorage.setItem('tax_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存税务数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.records;
    
    if (state.filters.type) {
        filtered = filtered.filter(r => r.taxType === state.filters.type);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    if (state.filters.period) {
        filtered = filtered.filter(r => r.period === state.filters.period);
    }
    
    state.filteredRecords = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const totalTax = state.filteredRecords.reduce((sum, r) => sum + r.taxAmount, 0);
    const paidTax = state.filteredRecords
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + r.taxAmount, 0);
    const pendingCount = state.filteredRecords
        .filter(r => r.status === 'pending' || r.status === 'overdue')
        .length;
    
    state.stats = { totalTax, paidTax, pendingCount };
}

/**
 * @private
 * @description 渲染税务列表
 */
function render() {
    const tbody = document.getElementById('taxListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-receipt" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无税务记录
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        pending: { label: '待缴', color: '#FEF3C7', textColor: '#92400E' },
        paid: { label: '已缴', color: '#D1FAE5', textColor: '#065F46' },
        overdue: { label: '逾期', color: '#FEE2E2', textColor: '#991B1B' }
    };

    tbody.innerHTML = pageData.map(r => {
        const type = TAX_TYPE_MAP[r.taxType] || TAX_TYPE_MAP.other;
        const status = statusMap[r.status] || statusMap.pending;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${r.period}</td>
                <td style="padding:10px 16px;text-align:right;">${r.taxRate}%</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;">
                    ¥${formatCurrency(r.taxAmount)}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(r.dueDate)}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${r.status === 'pending' || r.status === 'overdue' ? `
                            <button class="btn btn-sm btn-success" onclick="window.TaxesModule.payTax('${r.id}')" title="缴纳税款">
                                <i class="fas fa-credit-card"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.TaxesModule.viewTax('${r.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
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
    
    document.getElementById('statTotalTax')?.textContent = '¥' + formatCurrency(stats.totalTax);
    document.getElementById('statPaidTax')?.textContent = '¥' + formatCurrency(stats.paidTax);
    document.getElementById('statPendingCount')?.textContent = stats.pendingCount;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredRecords.length;
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
                <button onclick="window.TaxesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.TaxesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
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
    const totalPages = Math.ceil(state.filteredRecords.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 记录ID
 */
function viewTax(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    const type = TAX_TYPE_MAP[record.taxType] || TAX_TYPE_MAP.other;
    const statusMap = { pending: '待缴', paid: '已缴', overdue: '逾期' };
    
    alert(`税务详情：
税种: ${type.label}
期间: ${record.period}
应税金额: ¥${formatCurrency(record.taxableAmount)}
税率: ${record.taxRate}%
税额: ¥${formatCurrency(record.taxAmount)}
状态: ${statusMap[record.status] || record.status}
截止日期: ${formatDate(record.dueDate)}
缴款日期: ${record.paymentDate ? formatDate(record.paymentDate) : '-'}`);
}

/**
 * @private
 * @param {string} id - 记录ID
 */
function payTax(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认缴纳 ${record.taxType} 税款 ¥${formatCurrency(record.taxAmount)}？`)) return;
    
    record.status = 'paid';
    record.paymentDate = new Date().toISOString().split('T')[0];
    
    saveTaxes();
    applyFilters();
    render();
    showToast('税款已缴纳', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.type = document.getElementById('searchType')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.period = document.getElementById('searchPeriod')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const typeInput = document.getElementById('searchType');
    const statusInput = document.getElementById('searchStatus');
    const periodInput = document.getElementById('searchPeriod');
    
    if (typeInput) typeInput.value = '';
    if (statusInput) statusInput.value = '';
    if (periodInput) periodInput.value = '';
    
    state.filters = { type: '', status: '', period: '' };
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
    
    document.querySelectorAll('#searchType, #searchStatus, #searchPeriod').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📊 税务管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('tax_data', JSON.stringify(state.records));
    }
    
    loadTaxes();
    bindEvents();
    render();
    
    window.TaxesModule = {
        state,
        loadTaxes,
        render,
        renderPagination,
        updateStats,
        viewTax,
        payTax,
        goToPage,
        handleSearch,
        handleReset,
        saveTaxes,
        applyFilters
    };
    
    console.log('✅ 税务管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadTaxes,
    viewTax,
    payTax,
    goToPage,
    saveTaxes
};