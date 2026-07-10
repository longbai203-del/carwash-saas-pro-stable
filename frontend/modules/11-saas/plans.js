/**
 * @file invoices.js
 * @module invoices
 * @description 账单管理 - SaaS账单生成和管理
 * 
 * @example
 * import { init } from './invoices.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} InvoiceItem
 * @property {string} description - 描述
 * @property {number} quantity - 数量
 * @property {number} unitPrice - 单价
 * @property {number} total - 小计
 */

/**
 * @typedef {Object} Invoice
 * @property {string} id - 账单ID
 * @property {string} invoiceNo - 账单编号
 * @property {string} tenantId - 租户ID
 * @property {string} tenantName - 租户名称
 * @property {InvoiceItem[]} items - 账单项目
 * @property {number} subtotal - 小计
 * @property {number} tax - 税费
 * @property {number} total - 总计
 * @property {string} status - 状态 (draft/sent/paid/overdue/cancelled)
 * @property {string} issueDate - 开具日期
 * @property {string} dueDate - 到期日期
 * @property {string} paidDate - 支付日期
 * @property {string} paymentMethod - 支付方式
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{invoices: Invoice[], filteredInvoices: Invoice[], filters: {invoiceNo: string, tenant: string, status: string, dateFrom: string, dateTo: string}, stats: {total: number, draft: number, sent: number, paid: number, overdue: number, cancelled: number, totalAmount: number, paidAmount: number, overdueAmount: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    invoices: [],
    filteredInvoices: [],
    filters: {
        invoiceNo: '',
        tenant: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    },
    stats: {
        total: 0,
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0,
        totalAmount: 0,
        paidAmount: 0,
        overdueAmount: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    draft: { label: '草稿', color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-pen-fancy' },
    sent: { label: '已发送', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-paper-plane' },
    paid: { label: '已支付', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    overdue: { label: '已逾期', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-exclamation-triangle' },
    cancelled: { label: '已取消', color: '#F3F4F6', textColor: '#6B7280', icon: 'fa-ban' }
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
    const statuses = ['draft', 'sent', 'paid', 'overdue', 'paid', 'cancelled', 'sent', 'paid'];
    const amounts = [199, 399, 199, 399, 799, 199, 399, 799];
    const items = [
        { description: '月度订阅费 - 基础版', quantity: 1, unitPrice: 199 },
        { description: '月度订阅费 - 专业版', quantity: 1, unitPrice: 399 },
        { description: '月度订阅费 - 基础版', quantity: 1, unitPrice: 199 },
        { description: '月度订阅费 - 专业版', quantity: 1, unitPrice: 399 },
        { description: '月度订阅费 - 企业版', quantity: 1, unitPrice: 799 },
        { description: '月度订阅费 - 基础版', quantity: 1, unitPrice: 199 },
        { description: '月度订阅费 - 专业版', quantity: 1, unitPrice: 399 },
        { description: '月度订阅费 - 企业版', quantity: 1, unitPrice: 799 }
    ];
    
    return tenants.map((name, i) => {
        const status = statuses[i % statuses.length];
        const dateOffset = Math.floor(Math.random() * 30);
        const issueDate = new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000);
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + 30);
        const paidDate = status === 'paid' 
            ? new Date(issueDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : '';
        const item = items[i % items.length];
        const subtotal = item.unitPrice * item.quantity;
        const tax = Math.round(subtotal * 0.06);
        const total = subtotal + tax;
        
        return {
            id: `SINV-${String(i + 1).padStart(6, '0')}`,
            invoiceNo: `SINV${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
            tenantId: `TEN-${String(i + 1).padStart(6, '0')}`,
            tenantName: name,
            items: [item],
            subtotal: subtotal,
            tax: tax,
            total: total,
            status: status,
            issueDate: issueDate.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            paidDate: paidDate,
            paymentMethod: status === 'paid' ? ['支付宝', '微信', '银行转账'][i % 3] : '',
            note: '',
            createdAt: issueDate.toISOString(),
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
        const saved = localStorage.getItem('saas_invoice_data');
        if (saved) {
            state.invoices = JSON.parse(saved);
        } else {
            state.invoices = getMockInvoices();
            localStorage.setItem('saas_invoice_data', JSON.stringify(state.invoices));
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
        localStorage.setItem('saas_invoice_data', JSON.stringify(state.invoices));
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
    
    if (state.filters.invoiceNo) {
        filtered = filtered.filter(i => i.invoiceNo.includes(state.filters.invoiceNo));
    }
    
    if (state.filters.tenant) {
        const tenant = state.filters.tenant.toLowerCase();
        filtered = filtered.filter(i => i.tenantName.toLowerCase().includes(tenant));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(i => i.status === state.filters.status);
    }
    
    if (state.filters.dateFrom) {
        filtered = filtered.filter(i => i.issueDate >= state.filters.dateFrom);
    }
    
    if (state.filters.dateTo) {
        filtered = filtered.filter(i => i.issueDate <= state.filters.dateTo);
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
    const draft = state.invoices.filter(i => i.status === 'draft').length;
    const sent = state.invoices.filter(i => i.status === 'sent').length;
    const paid = state.invoices.filter(i => i.status === 'paid').length;
    const overdue = state.invoices.filter(i => i.status === 'overdue').length;
    const cancelled = state.invoices.filter(i => i.status === 'cancelled').length;
    const totalAmount = state.invoices.reduce((sum, i) => sum + i.total, 0);
    const paidAmount = state.invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.total, 0);
    const overdueAmount = state.invoices
        .filter(i => i.status === 'overdue')
        .reduce((sum, i) => sum + i.total, 0);
    
    state.stats = { total, draft, sent, paid, overdue, cancelled, totalAmount, paidAmount, overdueAmount };
}

/**
 * @private
 * @description 渲染账单列表
 */
function render() {
    const tbody = document.getElementById('invoiceListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredInvoices.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-file-invoice" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无账单数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(i => {
        const status = STATUS_MAP[i.status] || STATUS_MAP.draft;
        const isOverdue = i.status === 'overdue' || (i.status === 'sent' && new Date(i.dueDate) < new Date());
        
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
                    ${i.items[0]?.description || '-'}
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#4F46E5;">
                    ¥${formatCurrency(i.total)}
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
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${i.paymentMethod || '-'}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${i.status === 'draft' ? `
                            <button class="btn btn-sm btn-success" onclick="window.SaasInvoicesModule.sendInvoice('${i.id}')" title="发送">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        ` : ''}
                        ${i.status === 'sent' || i.status === 'overdue' ? `
                            <button class="btn btn-sm btn-success" onclick="window.SaasInvoicesModule.markPaid('${i.id}')" title="标记已支付">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.SaasInvoicesModule.viewInvoice('${i.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${i.status === 'draft' ? `
                            <button class="btn btn-sm btn-danger" onclick="window.SaasInvoicesModule.deleteInvoice('${i.id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
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
    document.getElementById('statDraft')?.textContent = stats.draft;
    document.getElementById('statSent')?.textContent = stats.sent;
    document.getElementById('statPaid')?.textContent = stats.paid;
    document.getElementById('statOverdue')?.textContent = stats.overdue;
    document.getElementById('statCancelled')?.textContent = stats.cancelled;
    document.getElementById('statTotalAmount')?.textContent = '¥' + formatCurrency(stats.totalAmount);
    document.getElementById('statPaidAmount')?.textContent = '¥' + formatCurrency(stats.paidAmount);
    document.getElementById('statOverdueAmount')?.textContent = '¥' + formatCurrency(stats.overdueAmount);
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
                <button onclick="window.SaasInvoicesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SaasInvoicesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    
    const status = STATUS_MAP[invoice.status] || STATUS_MAP.draft;
    const itemsStr = invoice.items.map(item => 
        `${item.description} × ${item.quantity} = ¥${formatCurrency(item.total)}`
    ).join('\n');
    
    alert(`账单详情：
账单编号: ${invoice.invoiceNo}
租户: ${invoice.tenantName}
状态: ${status.label}
开具日期: ${formatDate(invoice.issueDate)}
到期日期: ${formatDate(invoice.dueDate)}
${invoice.paidDate ? '支付日期: ' + formatDate(invoice.paidDate) : ''}
支付方式: ${invoice.paymentMethod || '-'}
备注: ${invoice.note || '无'}

账单项目:
${itemsStr}

小计: ¥${formatCurrency(invoice.subtotal)}
税费: ¥${formatCurrency(invoice.tax)}
总计: ¥${formatCurrency(invoice.total)}`);
}

/**
 * @private
 * @param {string} id - 账单ID
 */
function sendInvoice(id) {
    const invoice = state.invoices.find(i => i.id === id);
    if (!invoice) {
        showToast('账单不存在', 'error');
        return;
    }
    
    invoice.status = 'sent';
    invoice.updatedAt = new Date().toISOString();
    
    saveInvoices();
    applyFilters();
    render();
    showToast('账单已发送', 'success');
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
 * @param {string} id - 账单ID
 */
function deleteInvoice(id) {
    const invoice = state.invoices.find(i => i.id === id);
    if (!invoice) {
        showToast('账单不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除账单 ${invoice.invoiceNo}？`)) return;
    
    state.invoices = state.invoices.filter(i => i.id !== id);
    saveInvoices();
    applyFilters();
    render();
    showToast('账单已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const tenantName = prompt('租户名称：');
    if (!tenantName) return;
    const description = prompt('账单项目描述：') || '月度订阅费';
    const quantity = parseInt(prompt('数量：', '1')) || 1;
    const unitPrice = parseFloat(prompt('单价：', '199'));
    if (isNaN(unitPrice) || unitPrice <= 0) {
        showToast('请输入有效单价', 'error');
        return;
    }
    const dueDate = prompt('到期日期 (YYYY-MM-DD)：', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const note = prompt('备注：') || '';
    const statusOptions = ['1. draft (草稿)', '2. sent (已发送)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, '1'));
    const statuses = ['draft', 'sent'];
    const status = statuses[statusIdx - 1] || 'draft';
    
    const subtotal = quantity * unitPrice;
    const tax = Math.round(subtotal * 0.06);
    const total = subtotal + tax;
    
    const newInvoice = {
        id: 'SINV-' + Date.now().toString().slice(-6),
        invoiceNo: `SINV${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        tenantId: 'TEN-' + String(Math.floor(Math.random() * 999) + 1).padStart(6, '0'),
        tenantName: tenantName.trim(),
        items: [{ description: description.trim(), quantity: quantity, unitPrice: unitPrice, total: subtotal }],
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: status,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paidDate: '',
        paymentMethod: '',
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
    state.filters.invoiceNo = document.getElementById('searchInvoiceNo')?.value || '';
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
    const invoiceInput = document.getElementById('searchInvoiceNo');
    const tenantInput = document.getElementById('searchTenant');
    const statusInput = document.getElementById('searchStatus');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (invoiceInput) invoiceInput.value = '';
    if (tenantInput) tenantInput.value = '';
    if (statusInput) statusInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    state.filters = { invoiceNo: '', tenant: '', status: '', dateFrom: '', dateTo: '' };
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
    
    document.querySelectorAll('#searchInvoiceNo, #searchTenant, #searchStatus, #dateFrom, #dateTo').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📄 SaaS账单管理 初始化...');
    
    if (options?.data) {
        state.invoices = options.data;
        localStorage.setItem('saas_invoice_data', JSON.stringify(state.invoices));
    }
    
    loadInvoices();
    bindEvents();
    render();
    
    window.SaasInvoicesModule = {
        state,
        loadInvoices,
        render,
        renderPagination,
        updateStats,
        viewInvoice,
        sendInvoice,
        markPaid,
        deleteInvoice,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveInvoices,
        applyFilters
    };
    
    console.log('✅ SaaS账单管理 初始化完成');
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
    sendInvoice,
    markPaid,
    deleteInvoice,
    goToPage,
    showCreateModal,
    saveInvoices
};