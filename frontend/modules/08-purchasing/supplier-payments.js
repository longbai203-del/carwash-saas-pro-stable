/**
 * @file supplier-payments.js
 * @module supplier-payments
 * @description 供应商付款 - 供应商付款管理
 * 
 * @example
 * import { init } from './supplier-payments.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} SupplierPayment
 * @property {string} id - 付款ID
 * @property {string} paymentNo - 付款编号
 * @property {string} supplierId - 供应商ID
 * @property {string} supplierName - 供应商名称
 * @property {string} orderId - 采购订单ID
 * @property {string} orderNo - 采购订单号
 * @property {number} amount - 付款金额
 * @property {string} method - 付款方式 (bank/transfer/cash)
 * @property {string} status - 状态 (pending/paid/cancelled)
 * @property {string} paymentDate - 付款日期
 * @property {string} dueDate - 到期日期
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{payments: SupplierPayment[], filteredPayments: SupplierPayment[], filters: {paymentNo: string, supplier: string, status: string, dateFrom: string, dateTo: string}, stats: {total: number, pending: number, paid: number, cancelled: number, totalAmount: number, paidAmount: number, pendingAmount: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    payments: [],
    filteredPayments: [],
    filters: {
        paymentNo: '',
        supplier: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    },
    stats: {
        total: 0,
        pending: 0,
        paid: 0,
        cancelled: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    pending: { label: '待付款', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    paid: { label: '已付款', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    cancelled: { label: '已取消', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
};

/**
 * 付款方式配置
 */
const METHOD_MAP = {
    bank: { label: '银行转账', color: '#DBEAFE', textColor: '#1E40AF' },
    transfer: { label: '转账', color: '#EDE9FE', textColor: '#6D28D9' },
    cash: { label: '现金', color: '#D1FAE5', textColor: '#065F46' }
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
 * @returns {SupplierPayment[]} 模拟付款数据
 */
function getMockPayments() {
    const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D'];
    const methods = ['bank', 'transfer', 'cash'];
    const statuses = ['pending', 'paid', 'cancelled'];
    const orderNos = ['PO0001', 'PO0002', 'PO0003', 'PO0004', 'PO0005'];
    const amounts = [15000, 9800, 4500, 23000, 8200, 12600, 5400, 31000];
    
    return amounts.map((amount, i) => {
        const status = statuses[i % statuses.length];
        const dateOffset = Math.floor(Math.random() * 20);
        
        return {
            id: `SP-${String(i + 1).padStart(6, '0')}`,
            paymentNo: `SP${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
            supplierId: `SUP-${String(i % 4 + 1).padStart(3, '0')}`,
            supplierName: suppliers[i % suppliers.length],
            orderId: `PO-${String(i + 1).padStart(6, '0')}`,
            orderNo: orderNos[i % orderNos.length],
            amount: amount,
            method: methods[i % methods.length],
            status: status,
            paymentDate: status === 'paid' 
                ? new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : '',
            dueDate: new Date(Date.now() + (30 - dateOffset) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            note: '',
            createdAt: new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * @private
 * @description 加载付款数据
 */
function loadPayments() {
    try {
        const saved = localStorage.getItem('supplier_payment_data');
        if (saved) {
            state.payments = JSON.parse(saved);
        } else {
            state.payments = getMockPayments();
            localStorage.setItem('supplier_payment_data', JSON.stringify(state.payments));
        }
    } catch (e) {
        console.warn('加载付款数据失败:', e);
        state.payments = getMockPayments();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存付款数据
 */
function savePayments() {
    try {
        localStorage.setItem('supplier_payment_data', JSON.stringify(state.payments));
    } catch (e) {
        console.warn('保存付款数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.payments;
    
    if (state.filters.paymentNo) {
        filtered = filtered.filter(p => p.paymentNo.includes(state.filters.paymentNo));
    }
    
    if (state.filters.supplier) {
        const supplier = state.filters.supplier.toLowerCase();
        filtered = filtered.filter(p => p.supplierName.toLowerCase().includes(supplier));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(p => p.status === state.filters.status);
    }
    
    if (state.filters.dateFrom) {
        filtered = filtered.filter(p => p.paymentDate >= state.filters.dateFrom || p.dueDate >= state.filters.dateFrom);
    }
    
    if (state.filters.dateTo) {
        filtered = filtered.filter(p => p.paymentDate <= state.filters.dateTo || p.dueDate <= state.filters.dateTo);
    }
    
    state.filteredPayments = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.payments.length;
    const pending = state.payments.filter(p => p.status === 'pending').length;
    const paid = state.payments.filter(p => p.status === 'paid').length;
    const cancelled = state.payments.filter(p => p.status === 'cancelled').length;
    const totalAmount = state.payments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = state.payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = state.payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);
    
    state.stats = { total, pending, paid, cancelled, totalAmount, paidAmount, pendingAmount };
}

/**
 * @private
 * @description 渲染付款列表
 */
function render() {
    const tbody = document.getElementById('paymentListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredPayments.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-money-bill" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无付款记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(p => {
        const status = STATUS_MAP[p.status] || STATUS_MAP.pending;
        const method = METHOD_MAP[p.method] || METHOD_MAP.bank;
        const isOverdue = p.status === 'pending' && new Date(p.dueDate) < new Date();
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${p.paymentNo}</div>
                    <div style="font-size:12px;color:#6B7280;">${p.id}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${p.supplierName}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#4F46E5;">
                    ¥${formatCurrency(p.amount)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${method.color};color:${method.textColor};">
                        ${method.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:${isOverdue ? '#EF4444' : '#6B7280'};">
                    ${formatDate(p.dueDate)}
                    ${isOverdue ? ' ⚠️逾期' : ''}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${p.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.SupplierPaymentsModule.paySupplier('${p.id}')" title="确认付款">
                                <i class="fas fa-credit-card"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.SupplierPaymentsModule.cancelPayment('${p.id}')" title="取消">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.SupplierPaymentsModule.viewPayment('${p.id}')" title="查看">
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
    document.getElementById('statPending')?.textContent = stats.pending;
    document.getElementById('statPaid')?.textContent = stats.paid;
    document.getElementById('statCancelled')?.textContent = stats.cancelled;
    document.getElementById('statTotalAmount')?.textContent = '¥' + formatCurrency(stats.totalAmount);
    document.getElementById('statPaidAmount')?.textContent = '¥' + formatCurrency(stats.paidAmount);
    document.getElementById('statPendingAmount')?.textContent = '¥' + formatCurrency(stats.pendingAmount);
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredPayments.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条付款记录
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SupplierPaymentsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SupplierPaymentsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredPayments.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 付款ID
 */
function viewPayment(id) {
    const payment = state.payments.find(p => p.id === id);
    if (!payment) {
        showToast('付款记录不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[payment.status] || STATUS_MAP.pending;
    const method = METHOD_MAP[payment.method] || METHOD_MAP.bank;
    
    alert(`付款详情：
付款编号: ${payment.paymentNo}
供应商: ${payment.supplierName}
采购订单: ${payment.orderNo}
金额: ¥${formatCurrency(payment.amount)}
方式: ${method.label}
状态: ${status.label}
到期日期: ${formatDate(payment.dueDate)}
${payment.paymentDate ? '付款日期: ' + formatDate(payment.paymentDate) : ''}
备注: ${payment.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 付款ID
 */
function paySupplier(id) {
    const payment = state.payments.find(p => p.id === id);
    if (!payment) {
        showToast('付款记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认向 ${payment.supplierName} 付款 ¥${formatCurrency(payment.amount)}？`)) return;
    
    payment.status = 'paid';
    payment.paymentDate = new Date().toISOString().split('T')[0];
    payment.updatedAt = new Date().toISOString();
    
    savePayments();
    applyFilters();
    render();
    showToast('付款成功', 'success');
}

/**
 * @private
 * @param {string} id - 付款ID
 */
function cancelPayment(id) {
    const payment = state.payments.find(p => p.id === id);
    if (!payment) {
        showToast('付款记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认取消付款 ${payment.paymentNo}？`)) return;
    
    payment.status = 'cancelled';
    payment.updatedAt = new Date().toISOString();
    
    savePayments();
    applyFilters();
    render();
    showToast('付款已取消', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const supplierName = prompt('供应商名称：');
    if (!supplierName) return;
    const amount = parseFloat(prompt('付款金额：', '1000'));
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效金额', 'error');
        return;
    }
    const methodOptions = ['1. bank (银行转账)', '2. transfer (转账)', '3. cash (现金)'];
    const methodIdx = parseInt(prompt(`选择付款方式：\n${methodOptions.join('\n')}`, '1'));
    const methods = ['bank', 'transfer', 'cash'];
    const method = methods[methodIdx - 1] || 'bank';
    const dueDate = prompt('到期日期 (YYYY-MM-DD)：', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const orderNo = prompt('采购订单号（可选）：') || '';
    const note = prompt('备注：') || '';
    
    const newPayment = {
        id: 'SP-' + Date.now().toString().slice(-6),
        paymentNo: `SP${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        supplierId: 'SUP-' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
        supplierName: supplierName.trim(),
        orderId: orderNo ? 'PO-' + Date.now().toString().slice(-6) : '',
        orderNo: orderNo,
        amount: amount,
        method: method,
        status: 'pending',
        paymentDate: '',
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.payments.push(newPayment);
    savePayments();
    applyFilters();
    render();
    showToast('付款记录已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.paymentNo = document.getElementById('searchPaymentNo')?.value || '';
    state.filters.supplier = document.getElementById('searchSupplier')?.value || '';
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
    const paymentInput = document.getElementById('searchPaymentNo');
    const supplierInput = document.getElementById('searchSupplier');
    const statusInput = document.getElementById('searchStatus');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (paymentInput) paymentInput.value = '';
    if (supplierInput) supplierInput.value = '';
    if (statusInput) statusInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    state.filters = { paymentNo: '', supplier: '', status: '', dateFrom: '', dateTo: '' };
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
    
    document.querySelectorAll('#searchPaymentNo, #searchSupplier, #searchStatus, #dateFrom, #dateTo').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('💰 供应商付款管理 初始化...');
    
    if (options?.data) {
        state.payments = options.data;
        localStorage.setItem('supplier_payment_data', JSON.stringify(state.payments));
    }
    
    loadPayments();
    bindEvents();
    render();
    
    window.SupplierPaymentsModule = {
        state,
        loadPayments,
        render,
        renderPagination,
        updateStats,
        viewPayment,
        paySupplier,
        cancelPayment,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        savePayments,
        applyFilters
    };
    
    console.log('✅ 供应商付款管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadPayments,
    viewPayment,
    paySupplier,
    cancelPayment,
    goToPage,
    showCreateModal,
    savePayments
};