/**
 * @file invoices.js
 * @module invoices
 * @description 发票管理 - 发票记录和状态跟踪
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
 * @typedef {Object} Invoice
 * @property {string} id - 发票ID
 * @property {string} number - 发票号码
 * @property {string} type - 类型 (income/expense)
 * @property {string} customer - 客户/供应商
 * @property {number} amount - 金额
 * @property {number} tax - 税额
 * @property {number} total - 含税总额
 * @property {string} status - 状态 (draft/issued/paid/cancelled)
 * @property {string} issueDate - 开票日期
 * @property {string} dueDate - 到期日期
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{invoices: Invoice[], filteredInvoices: Invoice[], filters: {number: string, type: string, status: string}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    invoices: [],
    filteredInvoices: [],
    filters: {
        number: '',
        type: '',
        status: ''
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    draft: { label: '草稿', color: '#F3F4F6', textColor: '#4B5563' },
    issued: { label: '已开票', color: '#DBEAFE', textColor: '#1E40AF' },
    paid: { label: '已付款', color: '#D1FAE5', textColor: '#065F46' },
    cancelled: { label: '已作废', color: '#FEE2E2', textColor: '#991B1B' }
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
 * @returns {Invoice[]} 模拟发票数据
 */
function getMockInvoices() {
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽'];
    const types = ['income', 'income', 'expense', 'income', 'expense', 'income'];
    const statuses = ['draft', 'issued', 'paid', 'paid', 'issued', 'cancelled'];
    const amounts = [1000, 2500, 800, 3200, 1500, 4500, 1200];
    const taxes = [60, 150, 48, 192, 90, 270, 72];
    
    return Array.from({ length: 10 }, (_, i) => ({
        id: `INV-${String(i + 1).padStart(6, '0')}`,
        number: `INV${String(Math.floor(Math.random() * 100000)).padStart(8, '0')}`,
        type: types[i % types.length],
        customer: customers[i % customers.length],
        amount: amounts[i % amounts.length],
        tax: taxes[i % taxes.length],
        total: amounts[i % amounts.length] + taxes[i % taxes.length],
        status: statuses[i % statuses.length],
        issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        note: Math.random() > 0.7 ? '需确认' : '',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

/**
 * @private
 * @description 加载发票数据
 */
function loadInvoices() {
    try {
        const saved = localStorage.getItem('invoice_data');
        if (saved) {
            state.invoices = JSON.parse(saved);
        } else {
            state.invoices = getMockInvoices();
            localStorage.setItem('invoice_data', JSON.stringify(state.invoices));
        }
    } catch (e) {
        console.warn('加载发票数据失败:', e);
        state.invoices = getMockInvoices();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存发票数据
 */
function saveInvoices() {
    try {
        localStorage.setItem('invoice_data', JSON.stringify(state.invoices));
    } catch (e) {
        console.warn('保存发票数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.invoices;
    
    if (state.filters.number) {
        filtered = filtered.filter(inv => inv.number.includes(state.filters.number));
    }
    
    if (state.filters.type) {
        filtered = filtered.filter(inv => inv.type === state.filters.type);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(inv => inv.status === state.filters.status);
    }
    
    state.filteredInvoices = filtered;
}

/**
 * @private
 * @description 渲染发票列表
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
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-file-invoice" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无发票数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(inv => {
        const status = STATUS_MAP[inv.status] || STATUS_MAP.draft;
        const typeLabel = inv.type === 'income' ? '销售发票' : '采购发票';
        const typeColor = inv.type === 'income' ? '#10B981' : '#EF4444';
        const typeBg = inv.type === 'income' ? '#D1FAE5' : '#FEE2E2';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${inv.number}</div>
                    <div style="font-size:12px;color:#6B7280;">${inv.id}</div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${typeBg};color:${typeColor};">
                        ${typeLabel}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${inv.customer}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;">
                    ¥${formatCurrency(inv.total)}
                </td>
                <td style="padding:10px 16px;text-align:center;font-size:13px;color:#6B7280;">
                    ${formatDate(inv.issueDate)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.InvoicesModule.editInvoice('${inv.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.InvoicesModule.viewInvoice('${inv.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.InvoicesModule.deleteInvoice('${inv.id}')" title="删除">
                            <i class="fas fa-trash"></i>
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
    const total = state.filteredInvoices.length;
    const totalAmount = state.filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = state.filteredInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);
    const issued = state.filteredInvoices.filter(inv => inv.status === 'issued').length;
    const paid = state.filteredInvoices.filter(inv => inv.status === 'paid').length;
    const overdue = state.filteredInvoices.filter(inv => {
        return inv.status !== 'paid' && inv.dueDate < new Date().toISOString().split('T')[0];
    }).length;
    
    const elements = {
        'statTotal': total,
        'statTotalAmount': '¥' + formatCurrency(totalAmount),
        'statPaidAmount': '¥' + formatCurrency(paidAmount),
        'statIssued': issued,
        'statPaid': paid,
        'statOverdue': overdue
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

    const total = state.filteredInvoices.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 张发票
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 张，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
    `;
    
    html += `
        <button onclick="window.InvoicesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.InvoicesModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.InvoicesModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.InvoicesModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.InvoicesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredInvoices.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 发票ID
 */
function viewInvoice(id) {
    const invoice = state.invoices.find(inv => inv.id === id);
    if (!invoice) {
        showToast('发票不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[invoice.status] || STATUS_MAP.draft;
    const typeLabel = invoice.type === 'income' ? '销售发票' : '采购发票';
    
    alert(`发票详情：
发票号码: ${invoice.number}
类型: ${typeLabel}
客户/供应商: ${invoice.customer}
金额: ¥${formatCurrency(invoice.amount)}
税额: ¥${formatCurrency(invoice.tax)}
含税总额: ¥${formatCurrency(invoice.total)}
状态: ${status.label}
开票日期: ${formatDate(invoice.issueDate)}
到期日期: ${formatDate(invoice.dueDate)}
备注: ${invoice.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 发票ID
 */
function editInvoice(id) {
    const invoice = state.invoices.find(inv => inv.id === id);
    if (!invoice) {
        showToast('发票不存在', 'error');
        return;
    }
    
    const statusOptions = ['1. draft (草稿)', '2. issued (已开票)', '3. paid (已付款)', '4. cancelled (已作废)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, 
        invoice.status === 'draft' ? '1' : invoice.status === 'issued' ? '2' : invoice.status === 'paid' ? '3' : '4'));
    const statuses = ['draft', 'issued', 'paid', 'cancelled'];
    const newStatus = statuses[statusIdx - 1] || invoice.status;
    
    const note = prompt('备注：', invoice.note || '') || '';
    
    invoice.status = newStatus;
    invoice.note = note;
    invoice.updatedAt = new Date().toISOString();
    
    saveInvoices();
    applyFilters();
    render();
    showToast('发票已更新', 'success');
}

/**
 * @private
 * @param {string} id - 发票ID
 */
function deleteInvoice(id) {
    const invoice = state.invoices.find(inv => inv.id === id);
    if (!invoice) {
        showToast('发票不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除发票 "${invoice.number}"？`)) return;
    
    state.invoices = state.invoices.filter(inv => inv.id !== id);
    saveInvoices();
    applyFilters();
    render();
    showToast('发票已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const number = prompt('发票号码：', `INV${String(Math.floor(Math.random() * 100000)).padStart(8, '0')}`);
    if (!number) return;
    const typeOptions = ['1. income (销售发票)', '2. expense (采购发票)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
    const types = ['income', 'expense'];
    const type = types[typeIdx - 1] || 'income';
    const customer = prompt('客户/供应商：');
    if (!customer) return;
    const amount = parseFloat(prompt('金额：', '1000'));
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效金额', 'error');
        return;
    }
    const taxRate = parseFloat(prompt('税率 (%)：', '6')) / 100;
    const tax = amount * taxRate;
    const statusOptions = ['1. draft (草稿)', '2. issued (已开票)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, '2'));
    const statuses = ['draft', 'issued'];
    const status = statuses[statusIdx - 1] || 'issued';
    const dueDate = prompt('到期日期 (YYYY-MM-DD)：', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    const newInvoice = {
        id: 'INV-' + Date.now().toString().slice(-6),
        number: number.trim(),
        type: type,
        customer: customer.trim(),
        amount: amount,
        tax: tax,
        total: amount + tax,
        status: status,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        note: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.invoices.push(newInvoice);
    saveInvoices();
    applyFilters();
    render();
    showToast('发票已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.number = document.getElementById('searchNumber')?.value || '';
    state.filters.type = document.getElementById('searchType')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const numberInput = document.getElementById('searchNumber');
    const typeInput = document.getElementById('searchType');
    const statusInput = document.getElementById('searchStatus');
    
    if (numberInput) numberInput.value = '';
    if (typeInput) typeInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { number: '', type: '', status: '' };
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
    
    document.querySelectorAll('#searchNumber, #searchType, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📄 发票管理 初始化...');
    
    if (options?.data) {
        state.invoices = options.data;
        localStorage.setItem('invoice_data', JSON.stringify(state.invoices));
    }
    
    loadInvoices();
    bindEvents();
    render();
    
    window.InvoicesModule = {
        state,
        loadInvoices,
        render,
        renderPagination,
        updateStats,
        viewInvoice,
        editInvoice,
        deleteInvoice,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveInvoices,
        applyFilters
    };
    
    console.log('✅ 发票管理 初始化完成');
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
    editInvoice,
    deleteInvoice,
    goToPage,
    showCreateModal,
    saveInvoices
};