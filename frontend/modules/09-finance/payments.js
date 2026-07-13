/**
 * @file payments.js
 * @module payments
 * @description 付款管理 - 付款记录和审批流程
 * 
 * @example
 * import { init } from './payments.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} PaymentRecord
 * @property {string} id - 付款ID
 * @property {string} paymentNo - 付款编号
 * @property {string} supplier - 供应商
 * @property {number} amount - 付款金额
 * @property {string} method - 付款方式 (cash/bank/transfer)
 * @property {string} category - 分类 (purchase/rent/payroll/other)
 * @property {string} status - 状态 (pending/approved/paid/cancelled)
 * @property {string} paymentDate - 付款日期
 * @property {string} dueDate - 到期日期
 * @property {string} approver - 审批人
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} approvedAt - 审批时间
 * @property {string} paidAt - 付款时间
 */

/** @type {{records: PaymentRecord[], filteredRecords: PaymentRecord[], filters: {supplier: string, status: string, category: string, dateFrom: string, dateTo: string}, stats: {totalAmount: number, pendingAmount: number, count: number, pendingCount: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        supplier: '',
        status: '',
        category: '',
        dateFrom: '',
        dateTo: ''
    },
    stats: {
        totalAmount: 0,
        pendingAmount: 0,
        count: 0,
        pendingCount: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    pending: { label: '待审批', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    approved: { label: '已审批', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-check-circle' },
    paid: { label: '已付款', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-credit-card' },
    cancelled: { label: '已取消', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
};

/**
 * 分类配置
 */
const CATEGORY_MAP = {
    purchase: { label: '采购付款', color: '#3B82F6' },
    rent: { label: '租金', color: '#F59E0B' },
    payroll: { label: '薪资', color: '#10B981' },
    other: { label: '其他', color: '#6B7280' }
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
 * @returns {PaymentRecord[]} 模拟付款数据
 */
function getMockPayments() {
    const suppliers = ['供应商A', '供应商B', '物业公司', '员工', '供应商C', '广告公司'];
    const categories = ['purchase', 'rent', 'payroll', 'purchase', 'other', 'purchase'];
    const statuses = ['pending', 'approved', 'paid', 'pending', 'paid', 'cancelled'];
    const methods = ['bank', 'cash', 'transfer', 'bank', 'cash', 'transfer'];
    const amounts = [15000, 8000, 25000, 12000, 5000, 3000];
    
    return amounts.map((amount, i) => ({
        id: `PAY-${String(i + 1).padStart(6, '0')}`,
        paymentNo: `PMT-${String(Math.floor(Math.random() * 10000)).padStart(6, '0')}`,
        supplier: suppliers[i % suppliers.length],
        amount: amount,
        method: methods[i % methods.length],
        category: categories[i % categories.length],
        status: statuses[i % statuses.length],
        paymentDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dueDate: new Date(Date.now() + (i + 1) * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        approver: statuses[i % statuses.length] !== 'pending' ? '张伟' : '',
        note: '',
        createdAt: new Date(Date.now() - (20 + i * 2) * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: statuses[i % statuses.length] === 'approved' || statuses[i % statuses.length] === 'paid'
            ? new Date(Date.now() - (15 + i) * 24 * 60 * 60 * 1000).toISOString()
            : null,
        paidAt: statuses[i % statuses.length] === 'paid'
            ? new Date(Date.now() - (5 + i) * 24 * 60 * 60 * 1000).toISOString()
            : null
    }));
}

/**
 * @private
 * @description 加载付款数据
 */
function loadPayments() {
    try {
        const saved = localStorage.getItem('payment_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockPayments();
            localStorage.setItem('payment_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载付款数据失败:', e);
        state.records = getMockPayments();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存付款数据
 */
function savePayments() {
    try {
        localStorage.setItem('payment_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存付款数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.records;
    
    if (state.filters.supplier) {
        const supplier = state.filters.supplier.toLowerCase();
        filtered = filtered.filter(p => p.supplier.toLowerCase().includes(supplier));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(p => p.status === state.filters.status);
    }
    
    if (state.filters.category) {
        filtered = filtered.filter(p => p.category === state.filters.category);
    }
    
    if (state.filters.dateFrom) {
        filtered = filtered.filter(p => p.paymentDate >= state.filters.dateFrom);
    }
    
    if (state.filters.dateTo) {
        filtered = filtered.filter(p => p.paymentDate <= state.filters.dateTo);
    }
    
    state.filteredRecords = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const totalAmount = state.filteredRecords.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = state.filteredRecords
        .filter(p => p.status === 'pending' || p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0);
    const count = state.filteredRecords.length;
    const pendingCount = state.filteredRecords
        .filter(p => p.status === 'pending' || p.status === 'approved')
        .length;
    
    state.stats = { totalAmount, pendingAmount, count, pendingCount };
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
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-credit-card" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无付款记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(p => {
        const status = STATUS_MAP[p.status] || STATUS_MAP.pending;
        const category = CATEGORY_MAP[p.category] || CATEGORY_MAP.other;
        const methodMap = { cash: '现金', bank: '银行转账', transfer: '转账' };
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${p.paymentNo}</div>
                    <div style="font-size:12px;color:#6B7280;">${p.id}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${p.supplier}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${category.color}20;color:${category.color};">
                        ${category.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#EF4444;">
                    ¥${formatCurrency(p.amount)}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${methodMap[p.method] || p.method}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(p.paymentDate)}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${p.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.PaymentsModule.approvePayment('${p.id}')" title="审批">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${p.status === 'approved' ? `
                            <button class="btn btn-sm btn-primary" onclick="window.PaymentsModule.executePayment('${p.id}')" title="执行付款">
                                <i class="fas fa-credit-card"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.PaymentsModule.viewPayment('${p.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${p.status === 'pending' ? `
                            <button class="btn btn-sm btn-danger" onclick="window.PaymentsModule.cancelPayment('${p.id}')" title="取消">
                                <i class="fas fa-times"></i>
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
    
    document.getElementById('statTotalAmount')?.textContent = '¥' + formatCurrency(stats.totalAmount);
    document.getElementById('statPendingAmount')?.textContent = '¥' + formatCurrency(stats.pendingAmount);
    document.getElementById('statCount')?.textContent = stats.count;
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
                <button onclick="window.PaymentsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.PaymentsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @param {string} id - 付款ID
 */
function viewPayment(id) {
    const payment = state.records.find(p => p.id === id);
    if (!payment) {
        showToast('付款记录不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[payment.status] || STATUS_MAP.pending;
    const category = CATEGORY_MAP[payment.category] || CATEGORY_MAP.other;
    const methodMap = { cash: '现金', bank: '银行转账', transfer: '转账' };
    
    alert(`付款详情：
付款编号: ${payment.paymentNo}
供应商: ${payment.supplier}
分类: ${category.label}
金额: ¥${formatCurrency(payment.amount)}
方式: ${methodMap[payment.method] || payment.method}
状态: ${status.label}
付款日期: ${formatDate(payment.paymentDate)}
到期日期: ${formatDate(payment.dueDate)}
审批人: ${payment.approver || '-'}
备注: ${payment.note || '无'}
创建时间: ${formatDateTime(payment.createdAt)}
${payment.approvedAt ? '审批时间: ' + formatDateTime(payment.approvedAt) : ''}
${payment.paidAt ? '付款时间: ' + formatDateTime(payment.paidAt) : ''}`);
}

/**
 * @private
 * @param {string} id - 付款ID
 */
function approvePayment(id) {
    const payment = state.records.find(p => p.id === id);
    if (!payment) {
        showToast('付款记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认审批付款 ${payment.paymentNo}？\n金额: ¥${formatCurrency(payment.amount)}`)) return;
    
    payment.status = 'approved';
    payment.approver = '张伟';
    payment.approvedAt = new Date().toISOString();
    
    savePayments();
    applyFilters();
    render();
    showToast('付款已审批', 'success');
}

/**
 * @private
 * @param {string} id - 付款ID
 */
function executePayment(id) {
    const payment = state.records.find(p => p.id === id);
    if (!payment) {
        showToast('付款记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认执行付款 ${payment.paymentNo}？\n金额: ¥${formatCurrency(payment.amount)}`)) return;
    
    payment.status = 'paid';
    payment.paidAt = new Date().toISOString();
    
    savePayments();
    applyFilters();
    render();
    showToast('付款已执行', 'success');
}

/**
 * @private
 * @param {string} id - 付款ID
 */
function cancelPayment(id) {
    const payment = state.records.find(p => p.id === id);
    if (!payment) {
        showToast('付款记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认取消付款 ${payment.paymentNo}？`)) return;
    
    payment.status = 'cancelled';
    
    savePayments();
    applyFilters();
    render();
    showToast('付款已取消', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const supplier = prompt('供应商：');
    if (!supplier) return;
    const amount = parseFloat(prompt('付款金额：', '1000'));
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效金额', 'error');
        return;
    }
    const categoryOptions = ['1. purchase (采购付款)', '2. rent (租金)', '3. payroll (薪资)', '4. other (其他)'];
    const catIdx = parseInt(prompt(`选择分类：\n${categoryOptions.join('\n')}`, '1'));
    const categories = ['purchase', 'rent', 'payroll', 'other'];
    const category = categories[catIdx - 1] || 'purchase';
    const methodOptions = ['1. cash (现金)', '2. bank (银行转账)', '3. transfer (转账)'];
    const methodIdx = parseInt(prompt(`选择方式：\n${methodOptions.join('\n')}`, '2'));
    const methods = ['cash', 'bank', 'transfer'];
    const method = methods[methodIdx - 1] || 'bank';
    const dueDate = prompt('到期日期 (YYYY-MM-DD)：', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const note = prompt('备注：') || '';
    
    const newPayment = {
        id: 'PAY-' + Date.now().toString().slice(-6),
        paymentNo: `PMT-${String(Math.floor(Math.random() * 10000)).padStart(6, '0')}`,
        supplier: supplier.trim(),
        amount: amount,
        method: method,
        category: category,
        status: 'pending',
        paymentDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        approver: '',
        note: note,
        createdAt: new Date().toISOString(),
        approvedAt: null,
        paidAt: null
    };
    
    state.records.push(newPayment);
    savePayments();
    applyFilters();
    render();
    showToast('付款申请已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.supplier = document.getElementById('searchSupplier')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.category = document.getElementById('searchCategory')?.value || '';
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
    const supplierInput = document.getElementById('searchSupplier');
    const statusInput = document.getElementById('searchStatus');
    const categoryInput = document.getElementById('searchCategory');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (supplierInput) supplierInput.value = '';
    if (statusInput) statusInput.value = '';
    if (categoryInput) categoryInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    state.filters = { supplier: '', status: '', category: '', dateFrom: '', dateTo: '' };
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
    
    document.querySelectorAll('#searchSupplier, #searchStatus, #searchCategory, #dateFrom, #dateTo').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('💳 付款管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('payment_data', JSON.stringify(state.records));
    }
    
    loadPayments();
    bindEvents();
    render();
    
    window.PaymentsModule = {
        state,
        loadPayments,
        render,
        renderPagination,
        updateStats,
        viewPayment,
        approvePayment,
        executePayment,
        cancelPayment,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        savePayments,
        applyFilters
    };
    
    console.log('✅ 付款管理 初始化完成');
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
    approvePayment,
    executePayment,
    cancelPayment,
    goToPage,
    showCreateModal,
    savePayments
};