/**
 * @file billing.js
 * @module billing
 * @description 计费管理 - 租户计费和账单管理
 * 
 * @example
 * import { init } from './billing.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Invoice
 * @property {string} id - 账单ID
 * @property {string} invoiceNo - 账单编号
 * @property {string} tenantId - 租户ID
 * @property {string} tenantName - 租户名称
 * @property {number} amount - 金额
 * @property {string} status - 状态 (paid/unpaid/overdue)
 * @property {string} dueDate - 到期日期
 * @property {string} paidDate - 支付日期
 * @property {string} items - 计费项目
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{invoices: Invoice[], filteredInvoices: Invoice[], filters: {tenant: string, status: string, dateFrom: string, dateTo: string}, stats: {total: number, paid: number, unpaid: number, overdue: number, totalAmount: number, paidAmount: number, unpaidAmount: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    invoices: [],
    filteredInvoices: [],
    filters: {
        tenant: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    },
    stats: {
        total: 0,
        paid: 0,
        unpaid: 0,
        overdue: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    paid: { label: '已支付', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    unpaid: { label: '未支付', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    overdue: { label: '已逾期', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-exclamation-triangle' }
};

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
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return amount.toFixed(2);
}

/**
 * @private
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

/**
 * @private
 * @returns {Invoice[]} 模拟账单数据
 */
function getMockInvoices() {
    const tenants = ['洗车店A', '洗车店B', '洗车店C', '洗车店D', '洗车店E', '洗车店F'];
    const statuses = ['paid', 'unpaid', 'overdue', 'paid', 'unpaid', 'paid'];
    const amounts = [199, 399, 799, 199, 399, 799];
    const items = ['月度订阅费 - 基础版', '月度订阅费 - 专业版', '季度订阅费 - 企业版', '月度订阅费 - 基础版', '月度订阅费 - 专业版', '季度订阅费 - 企业版'];
    
    return tenants.map((name, i) => {
        const dateOffset = Math.floor(Math.random() * 30);
        const dueDate = new Date(Date.now() + dateOffset * 24 * 60 * 60 * 1000);
        const paidDate = statuses[i] === 'paid' 
            ? new Date(Date.now() - (30 - dateOffset) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : '';
        
        return {
            id: `INV-${String(i + 1).padStart(6, '0')}`,
            invoiceNo: `INV${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
            tenantId: `TEN-${String(i + 1).padStart(6, '0')}`,
            tenantName: name,
            amount: amounts[i],
            status: statuses[i],
            dueDate: dueDate.toISOString().split('T')[0],
            paidDate: paidDate,
            items: items[i],
            note: '',
            createdAt: new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载账单数据
 */
function loadInvoices() {
    try {
        const saved = localStorage.getItem('billing_data');
        if (saved) {
            state.invoices = JSON.parse(saved);
        } else {
            state.invoices = getMockInvoices();
            localStorage.setItem('billing_data', JSON.stringify(state.invoices));
        }
    } catch (e) {
        console.warn('加载账单数据失败:', e);
        state.invoices = getMockInvoices();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存账单数据
 */
function saveInvoices() {
    try {
        localStorage.setItem('billing_data', JSON.stringify(state.invoices));
    } catch (e) {
        console.warn('保存账单数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.invoices;
    
    if (state.filters.tenant) {
        const tenant = state.filters.tenant.toLowerCase();
        filtered = filtered.filter(i => i.tenantName.toLowerCase().includes(tenant));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(i => i.status === state.filters.status);
    }
    
    if (state.filters.dateFrom) {
        filtered = filtered.filter(i => i.dueDate >= state.filters.dateFrom);
    }
    
    if (state.filters.dateTo) {
        filtered = filtered.filter(i => i.dueDate <= state.filters.dateTo);
    }
    
    state.filteredInvoices = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.invoices.length;
    const paid = state.invoices.filter(i => i.status === 'paid').length;
    const unpaid = state.invoices.filter(i => i.status === 'unpaid').length;
    const overdue = state.invoices.filter(i => i.status === 'overdue').length;
    const totalAmount = state.invoices.reduce((sum, i) => sum + i.amount, 0);
    const paidAmount = state.invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);
    const unpaidAmount = state.invoices
        .filter(i => i.status === 'unpaid' || i.status === 'overdue')
        .reduce((sum, i) => sum + i.amount, 0);
    
    state.stats = { total, paid, unpaid, overdue, totalAmount, paidAmount, unpaidAmount };
}

/**
 * @private
 * @description 渲染账单列表
 */
function render() {
    const tbody = document.getElementById('billingListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredInvoices.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-file-invoice" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无账单数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(i => {
        const status = STATUS_MAP[i.status] || STATUS_MAP.unpaid;
        const isOverdue = i.status === 'overdue' || (i.status === 'unpaid' && new Date(i.dueDate) < new Date());
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${i.invoiceNo}</div>
                    <div style="font-size:12px;color:#6B7280;">${i.id}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${i.tenantName}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${i.items}
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#4F46E5;">
                    ¥${formatCurrency(i.amount)}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:${isOverdue ? '#EF4444' : '#6B7280'};">
                    ${formatDate(i.dueDate)}
                    ${isOverdue ? ' ⚠️' : ''}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${i.status === 'unpaid' || i.status === 'overdue' ? `
                            <button class="btn btn-sm btn-success" onclick="window.BillingModule.markPaid('${i.id}')" title="标记已支付">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.BillingModule.viewInvoice('${i.id}')" title="查看">
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
    
    document.getElementById('statTotal')?.textContent = stats.total;
    document.getElementById('statPaid')?.textContent = stats.paid;
    document.getElementById('statUnpaid')?.textContent = stats.unpaid;
    document.getElementById('statOverdue')?.textContent = stats.overdue;
    document.getElementById('statTotalAmount')?.textContent = '¥' + formatCurrency(stats.totalAmount);
    document.getElementById('statPaidAmount')?.textContent = '¥' + formatCurrency(stats.paidAmount);
    document.getElementById('statUnpaidAmount')?.textContent = '¥' + formatCurrency(stats.unpaidAmount);
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredInvoices.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条账单
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.BillingModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.BillingModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredInvoices.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 账单ID
 */
function viewInvoice(id) {
    const invoice = state.invoices.find(i => i.id === id);
    if (!invoice) {
        showToast('账单不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[invoice.status] || STATUS_MAP.unpaid;
    
    alert(`账单详情：
账单编号: ${invoice.invoiceNo}
租户: ${invoice.tenantName}
金额: ¥${formatCurrency(invoice.amount)}
项目: ${invoice.items}
状态: ${status.label}
到期日期: ${formatDate(invoice.dueDate)}
${invoice.paidDate ? '支付日期: ' + formatDate(invoice.paidDate) : ''}
备注: ${invoice.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 账单ID
 */
function markPaid(id) {
    const invoice = state.invoices.find(i => i.id === id);
    if (!invoice) {
        showToast('账单不存在', 'error');
        return;
    }
    
    invoice.status = 'paid';
    invoice.paidDate = new Date().toISOString().split('T')[0];
    invoice.updatedAt = new Date().toISOString();
    
    saveInvoices();
    applyFilters();
    render();
    showToast('账单已标记为已支付', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const tenantName = prompt('租户名称：');
    if (!tenantName) return;
    const amount = parseFloat(prompt('账单金额：', '199'));
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效金额', 'error');
        return;
    }
    const items = prompt('计费项目：') || '月度订阅费';
    const dueDate = prompt('到期日期 (YYYY-MM-DD)：', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const note = prompt('备注：') || '';
    const statusOptions = ['1. unpaid (未支付)', '2. paid (已支付)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, '1'));
    const statuses = ['unpaid', 'paid'];
    const status = statuses[statusIdx - 1] || 'unpaid';
    
    const newInvoice = {
        id: 'INV-' + Date.now().toString().slice(-6),
        invoiceNo: `INV${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        tenantId: 'TEN-' + String(Math.floor(Math.random() * 999) + 1).padStart(6, '0'),
        tenantName: tenantName.trim(),
        amount: amount,
        status: status,
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : '',
        items: items,
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.invoices.push(newInvoice);
    saveInvoices();
    applyFilters();
    render();
    showToast('账单已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.tenant = document.getElementById('searchTenant')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.dateFrom = document.getElementById('dateFrom')?.value || '';
    state.filters.dateTo = document.getElementById('dateTo')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const tenantInput = document.getElementById('searchTenant');
    const statusInput = document.getElementById('searchStatus');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (tenantInput) tenantInput.value = '';
    if (statusInput) statusInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    state.filters = { tenant: '', status: '', dateFrom: '', dateTo: '' };
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
    
    const createBtn = document.getElementById('createBtn');
    if (createBtn) createBtn.addEventListener('click', showCreateModal);
    
    document.querySelectorAll('#searchTenant, #searchStatus, #dateFrom, #dateTo').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📊 计费管理 初始化...');
    
    if (options?.data) {
        state.invoices = options.data;
        localStorage.setItem('billing_data', JSON.stringify(state.invoices));
    }
    
    loadInvoices();
    bindEvents();
    render();
    
    window.BillingModule = {
        state,
        loadInvoices,
        render,
        renderPagination,
        updateStats,
        viewInvoice,
        markPaid,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveInvoices,
        applyFilters
    };
    
    console.log('✅ 计费管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadInvoices,
    viewInvoice,
    markPaid,
    goToPage,
    showCreateModal,
    saveInvoices
};