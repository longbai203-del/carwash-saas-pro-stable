/**
 * @file refunds.js
 * @module refunds
 * @description 退款管理 - 退款申请和审批流程
 * 
 * @example
 * import { init } from './refunds.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} RefundRecord
 * @property {string} id - 退款ID
 * @property {string} refundNo - 退款编号
 * @property {string} orderId - 原订单号
 * @property {string} customer - 客户名称
 * @property {number} amount - 退款金额
 * @property {string} method - 退款方式
 * @property {string} reason - 退款原因
 * @property {string} status - 状态 (pending/approved/refunded/rejected)
 * @property {string} refundDate - 退款日期
 * @property {string} approver - 审批人
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} approvedAt - 审批时间
 * @property {string} refundedAt - 退款时间
 */

/** @type {{records: RefundRecord[], filteredRecords: RefundRecord[], filters: {orderId: string, customer: string, status: string, reason: string}, stats: {totalAmount: number, pendingAmount: number, count: number, pendingCount: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        orderId: '',
        customer: '',
        status: '',
        reason: ''
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
    refunded: { label: '已退款', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-undo' },
    rejected: { label: '已拒绝', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
};

/**
 * 退款原因配置
 */
const REASON_MAP = {
    quality: '质量问题',
    wrong: '发错商品',
    damage: '运输损坏',
    dissatisfied: '客户不满意',
    other: '其他'
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
 * @returns {RefundRecord[]} 模拟退款数据
 */
function getMockRefunds() {
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明'];
    const reasons = ['quality', 'wrong', 'damage', 'dissatisfied', 'other', 'quality'];
    const statuses = ['pending', 'approved', 'refunded', 'pending', 'refunded', 'rejected'];
    const orderIds = ['ORD-001', 'ORD-002', 'ORD-003', 'ORD-004', 'ORD-005', 'ORD-006'];
    const amounts = [388, 268, 128, 328, 188, 68];
    
    return amounts.map((amount, i) => ({
        id: `REF-${String(i + 1).padStart(6, '0')}`,
        refundNo: `RFD-${String(Math.floor(Math.random() * 10000)).padStart(6, '0')}`,
        orderId: orderIds[i % orderIds.length],
        customer: customers[i % customers.length],
        amount: amount,
        method: ['原路返回', '现金退款', '银行转账', '原路返回', '现金退款', '原路返回'][i],
        reason: reasons[i % reasons.length],
        status: statuses[i % statuses.length],
        refundDate: statuses[i % statuses.length] === 'refunded'
            ? new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : '',
        approver: statuses[i % statuses.length] !== 'pending' ? '张伟' : '',
        note: '',
        createdAt: new Date(Date.now() - (10 + i * 2) * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: statuses[i % statuses.length] === 'approved' || statuses[i % statuses.length] === 'refunded'
            ? new Date(Date.now() - (7 + i) * 24 * 60 * 60 * 1000).toISOString()
            : null,
        refundedAt: statuses[i % statuses.length] === 'refunded'
            ? new Date(Date.now() - (3 + i) * 24 * 60 * 60 * 1000).toISOString()
            : null
    }));
}

/**
 * @private
 * @description 加载退款数据
 */
function loadRefunds() {
    try {
        const saved = localStorage.getItem('refund_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockRefunds();
            localStorage.setItem('refund_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载退款数据失败:', e);
        state.records = getMockRefunds();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存退款数据
 */
function saveRefunds() {
    try {
        localStorage.setItem('refund_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存退款数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.records;
    
    if (state.filters.orderId) {
        filtered = filtered.filter(r => r.orderId.includes(state.filters.orderId));
    }
    
    if (state.filters.customer) {
        const customer = state.filters.customer.toLowerCase();
        filtered = filtered.filter(r => r.customer.toLowerCase().includes(customer));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    if (state.filters.reason) {
        filtered = filtered.filter(r => r.reason === state.filters.reason);
    }
    
    state.filteredRecords = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const totalAmount = state.filteredRecords.reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = state.filteredRecords
        .filter(r => r.status === 'pending' || r.status === 'approved')
        .reduce((sum, r) => sum + r.amount, 0);
    const count = state.filteredRecords.length;
    const pendingCount = state.filteredRecords
        .filter(r => r.status === 'pending' || r.status === 'approved')
        .length;
    
    state.stats = { totalAmount, pendingAmount, count, pendingCount };
}

/**
 * @private
 * @description 渲染退款列表
 */
function render() {
    const tbody = document.getElementById('refundListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-undo-alt" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无退款记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const status = STATUS_MAP[r.status] || STATUS_MAP.pending;
        const reasonLabel = REASON_MAP[r.reason] || r.reason;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${r.refundNo}</div>
                    <div style="font-size:12px;color:#6B7280;">${r.id}</div>
                </td>
                <td style="padding:10px 16px;font-family:monospace;font-size:13px;">${r.orderId}</td>
                <td style="padding:10px 16px;font-size:13px;">${r.customer}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#EF4444;">
                    ¥${formatCurrency(r.amount)}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${reasonLabel}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(r.refundDate || r.createdAt)}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${r.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.RefundsModule.approveRefund('${r.id}')" title="审批">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.RefundsModule.rejectRefund('${r.id}')" title="拒绝">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        ${r.status === 'approved' ? `
                            <button class="btn btn-sm btn-primary" onclick="window.RefundsModule.executeRefund('${r.id}')" title="执行退款">
                                <i class="fas fa-undo"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.RefundsModule.viewRefund('${r.id}')" title="查看">
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
                <button onclick="window.RefundsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.RefundsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @param {string} id - 退款ID
 */
function viewRefund(id) {
    const refund = state.records.find(r => r.id === id);
    if (!refund) {
        showToast('退款记录不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[refund.status] || STATUS_MAP.pending;
    const reasonLabel = REASON_MAP[refund.reason] || refund.reason;
    
    alert(`退款详情：
退款编号: ${refund.refundNo}
原订单: ${refund.orderId}
客户: ${refund.customer}
金额: ¥${formatCurrency(refund.amount)}
原因: ${reasonLabel}
方式: ${refund.method}
状态: ${status.label}
退款日期: ${formatDate(refund.refundDate || refund.createdAt)}
审批人: ${refund.approver || '-'}
备注: ${refund.note || '无'}
创建时间: ${formatDateTime(refund.createdAt)}
${refund.approvedAt ? '审批时间: ' + formatDateTime(refund.approvedAt) : ''}
${refund.refundedAt ? '退款时间: ' + formatDateTime(refund.refundedAt) : ''}`);
}

/**
 * @private
 * @param {string} id - 退款ID
 */
function approveRefund(id) {
    const refund = state.records.find(r => r.id === id);
    if (!refund) {
        showToast('退款记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认审批退款 ${refund.refundNo}？\n金额: ¥${formatCurrency(refund.amount)}`)) return;
    
    refund.status = 'approved';
    refund.approver = '张伟';
    refund.approvedAt = new Date().toISOString();
    
    saveRefunds();
    applyFilters();
    render();
    showToast('退款已审批', 'success');
}

/**
 * @private
 * @param {string} id - 退款ID
 */
function rejectRefund(id) {
    const refund = state.records.find(r => r.id === id);
    if (!refund) {
        showToast('退款记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认拒绝退款 ${refund.refundNo}？`)) return;
    
    refund.status = 'rejected';
    
    saveRefunds();
    applyFilters();
    render();
    showToast('退款已拒绝', 'success');
}

/**
 * @private
 * @param {string} id - 退款ID
 */
function executeRefund(id) {
    const refund = state.records.find(r => r.id === id);
    if (!refund) {
        showToast('退款记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认执行退款 ${refund.refundNo}？\n金额: ¥${formatCurrency(refund.amount)}`)) return;
    
    refund.status = 'refunded';
    refund.refundedAt = new Date().toISOString();
    refund.refundDate = new Date().toISOString().split('T')[0];
    
    saveRefunds();
    applyFilters();
    render();
    showToast('退款已执行', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const orderId = prompt('原订单号：');
    if (!orderId) return;
    const customer = prompt('客户名称：');
    if (!customer) return;
    const amount = parseFloat(prompt('退款金额：', '100'));
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效金额', 'error');
        return;
    }
    const reasonOptions = ['1. quality (质量问题)', '2. wrong (发错商品)', '3. damage (运输损坏)', '4. dissatisfied (客户不满意)', '5. other (其他)'];
    const reasonIdx = parseInt(prompt(`选择原因：\n${reasonOptions.join('\n')}`, '1'));
    const reasons = ['quality', 'wrong', 'damage', 'dissatisfied', 'other'];
    const reason = reasons[reasonIdx - 1] || 'other';
    const method = prompt('退款方式 (原路返回/现金退款/银行转账)：', '原路返回') || '原路返回';
    const note = prompt('备注：') || '';
    
    const newRefund = {
        id: 'REF-' + Date.now().toString().slice(-6),
        refundNo: `RFD-${String(Math.floor(Math.random() * 10000)).padStart(6, '0')}`,
        orderId: orderId.trim(),
        customer: customer.trim(),
        amount: amount,
        method: method,
        reason: reason,
        status: 'pending',
        refundDate: '',
        approver: '',
        note: note,
        createdAt: new Date().toISOString(),
        approvedAt: null,
        refundedAt: null
    };
    
    state.records.push(newRefund);
    saveRefunds();
    applyFilters();
    render();
    showToast('退款申请已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.orderId = document.getElementById('searchOrderId')?.value || '';
    state.filters.customer = document.getElementById('searchCustomer')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.reason = document.getElementById('searchReason')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const orderInput = document.getElementById('searchOrderId');
    const customerInput = document.getElementById('searchCustomer');
    const statusInput = document.getElementById('searchStatus');
    const reasonInput = document.getElementById('searchReason');
    
    if (orderInput) orderInput.value = '';
    if (customerInput) customerInput.value = '';
    if (statusInput) statusInput.value = '';
    if (reasonInput) reasonInput.value = '';
    
    state.filters = { orderId: '', customer: '', status: '', reason: '' };
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
    
    document.querySelectorAll('#searchOrderId, #searchCustomer, #searchStatus, #searchReason').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('↩️ 退款管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('refund_data', JSON.stringify(state.records));
    }
    
    loadRefunds();
    bindEvents();
    render();
    
    window.RefundsModule = {
        state,
        loadRefunds,
        render,
        renderPagination,
        updateStats,
        viewRefund,
        approveRefund,
        rejectRefund,
        executeRefund,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveRefunds,
        applyFilters
    };
    
    console.log('✅ 退款管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadRefunds,
    viewRefund,
    approveRefund,
    rejectRefund,
    executeRefund,
    goToPage,
    showCreateModal,
    saveRefunds
};