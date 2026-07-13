/**
 * @file vat.js
 * @module vat
 * @description 增值税管理 - 增值税申报和记录
 * 
 * @example
 * import { init } from './vat.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} VATRecord
 * @property {string} id - 记录ID
 * @property {string} period - 期间 (YYYY-MM)
 * @property {number} salesAmount - 销售额
 * @property {number} salesTax - 销项税额
 * @property {number} purchaseAmount - 采购额
 * @property {number} purchaseTax - 进项税额
 * @property {number} payable - 应纳税额
 * @property {string} status - 状态 (draft/submitted/paid)
 * @property {string} submitDate - 申报日期
 * @property {string} paymentDate - 缴款日期
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{records: VATRecord[], filteredRecords: VATRecord[], filters: {period: string, status: string}, stats: {totalPayable: number, totalPaid: number, totalSubmitted: number}, page: number, pageSize: number}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        period: '',
        status: ''
    },
    stats: {
        totalPayable: 0,
        totalPaid: 0,
        totalSubmitted: 0
    },
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
 * @returns {VATRecord[]} 模拟增值税数据
 */
function getMockVAT() {
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
    const statuses = ['draft', 'submitted', 'paid', 'paid', 'submitted', 'draft'];
    
    return months.map((month, i) => {
        const salesAmount = Math.floor(Math.random() * 100000) + 50000;
        const salesTax = Math.round(salesAmount * 0.06);
        const purchaseAmount = Math.floor(Math.random() * 60000) + 30000;
        const purchaseTax = Math.round(purchaseAmount * 0.06);
        const payable = salesTax - purchaseTax;
        
        return {
            id: `VAT-${String(i + 1).padStart(6, '0')}`,
            period: month,
            salesAmount: salesAmount,
            salesTax: salesTax,
            purchaseAmount: purchaseAmount,
            purchaseTax: purchaseTax,
            payable: payable,
            status: statuses[i],
            submitDate: statuses[i] !== 'draft' ? new Date(Date.now() - i * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
            paymentDate: statuses[i] === 'paid' ? new Date(Date.now() - (i + 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
            note: payable > 0 ? '需缴纳税款' : '进项大于销项，可抵扣',
            createdAt: new Date(Date.now() - i * 35 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载增值税数据
 */
function loadVAT() {
    try {
        const saved = localStorage.getItem('vat_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockVAT();
            localStorage.setItem('vat_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载增值税数据失败:', e);
        state.records = getMockVAT();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存增值税数据
 */
function saveVAT() {
    try {
        localStorage.setItem('vat_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存增值税数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.records;
    
    if (state.filters.period) {
        filtered = filtered.filter(r => r.period === state.filters.period);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    state.filteredRecords = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const totalPayable = state.filteredRecords.reduce((sum, r) => sum + r.payable, 0);
    const totalPaid = state.filteredRecords
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + r.payable, 0);
    const totalSubmitted = state.filteredRecords
        .filter(r => r.status === 'submitted' || r.status === 'paid')
        .length;
    
    state.stats = { totalPayable, totalPaid, totalSubmitted };
}

/**
 * @private
 * @description 渲染增值税列表
 */
function render() {
    const tbody = document.getElementById('vatListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-receipt" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无增值税记录
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        draft: { label: '草稿', color: '#F3F4F6', textColor: '#4B5563' },
        submitted: { label: '已申报', color: '#DBEAFE', textColor: '#1E40AF' },
        paid: { label: '已缴纳', color: '#D1FAE5', textColor: '#065F46' }
    };

    tbody.innerHTML = pageData.map(r => {
        const status = statusMap[r.status] || statusMap.draft;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${r.period}</td>
                <td style="padding:10px 16px;text-align:right;">¥${formatCurrency(r.salesAmount)}</td>
                <td style="padding:10px 16px;text-align:right;">¥${formatCurrency(r.salesTax)}</td>
                <td style="padding:10px 16px;text-align:right;">¥${formatCurrency(r.purchaseAmount)}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:${r.payable > 0 ? '#EF4444' : '#10B981'};">
                    ¥${formatCurrency(r.payable)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${r.status === 'draft' ? `
                            <button class="btn btn-sm btn-success" onclick="window.VATModule.submitVAT('${r.id}')" title="申报">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${r.status === 'submitted' ? `
                            <button class="btn btn-sm btn-primary" onclick="window.VATModule.payVAT('${r.id}')" title="缴纳">
                                <i class="fas fa-credit-card"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.VATModule.viewVAT('${r.id}')" title="查看">
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
    
    const elements = {
        'statTotalPayable': '¥' + formatCurrency(stats.totalPayable),
        'statTotalPaid': '¥' + formatCurrency(stats.totalPaid),
        'statTotalSubmitted': stats.totalSubmitted
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
                <button onclick="window.VATModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.VATModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
function viewVAT(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    const statusMap = { draft: '草稿', submitted: '已申报', paid: '已缴纳' };
    
    alert(`增值税详情：
期间: ${record.period}
销售额: ¥${formatCurrency(record.salesAmount)}
销项税额: ¥${formatCurrency(record.salesTax)}
采购额: ¥${formatCurrency(record.purchaseAmount)}
进项税额: ¥${formatCurrency(record.purchaseTax)}
应纳税额: ¥${formatCurrency(record.payable)}
状态: ${statusMap[record.status] || record.status}
申报日期: ${formatDate(record.submitDate)}
缴款日期: ${formatDate(record.paymentDate)}
备注: ${record.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 记录ID
 */
function submitVAT(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认申报 ${record.period} 增值税？\n应纳税额: ¥${formatCurrency(record.payable)}`)) return;
    
    record.status = 'submitted';
    record.submitDate = new Date().toISOString().split('T')[0];
    record.updatedAt = new Date().toISOString();
    
    saveVAT();
    applyFilters();
    render();
    showToast('增值税已申报', 'success');
}

/**
 * @private
 * @param {string} id - 记录ID
 */
function payVAT(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    const amount = record.payable;
    if (amount <= 0) {
        showToast('无需缴纳税款（进项大于销项）', 'info');
        return;
    }
    
    if (!confirm(`确认缴纳 ${record.period} 增值税？\n金额: ¥${formatCurrency(amount)}`)) return;
    
    record.status = 'paid';
    record.paymentDate = new Date().toISOString().split('T')[0];
    record.updatedAt = new Date().toISOString();
    
    saveVAT();
    applyFilters();
    render();
    showToast('增值税已缴纳', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.period = document.getElementById('searchPeriod')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const periodInput = document.getElementById('searchPeriod');
    const statusInput = document.getElementById('searchStatus');
    
    if (periodInput) periodInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { period: '', status: '' };
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
    
    document.querySelectorAll('#searchPeriod, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📊 增值税管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('vat_data', JSON.stringify(state.records));
    }
    
    loadVAT();
    bindEvents();
    render();
    
    window.VATModule = {
        state,
        loadVAT,
        render,
        renderPagination,
        updateStats,
        viewVAT,
        submitVAT,
        payVAT,
        goToPage,
        handleSearch,
        handleReset,
        saveVAT,
        applyFilters
    };
    
    console.log('✅ 增值税管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadVAT,
    viewVAT,
    submitVAT,
    payVAT,
    goToPage,
    saveVAT
};