/**
 * @file returns.js
 * @module returns
 * @description 退货管理 - 退货申请、处理和记录
 * 
 * @example
 * import { init } from './returns.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ReturnItem
 * @property {string} name - 商品名称
 * @property {number} price - 单价
 * @property {number} qty - 数量
 * @property {number} [subtotal] - 小计
 */

/**
 * @typedef {Object} ReturnRecord
 * @property {string} id - 退货单号
 * @property {string} orderId - 原订单号
 * @property {ReturnItem[]} items - 退货商品列表
 * @property {number} amount - 退货金额
 * @property {string} reason - 退货原因
 * @property {string} method - 退款方式
 * @property {string} note - 备注
 * @property {string} date - 日期
 * @property {string} status - 状态 (pending/processing/completed/rejected)
 * @property {string} [customer] - 客户名称
 * @property {string} [customerPhone] - 客户电话
 */

/**
 * @typedef {Object} ReturnState
 * @property {ReturnRecord[]} returns - 退货记录
 * @property {Object|null} currentOrder - 当前订单
 * @property {ReturnItem[]} returnItems - 当前退货商品
 * @property {string} searchQuery - 搜索关键词
 * @property {Object} filters - 筛选条件
 * @property {boolean} loading - 加载状态
 */

/** @type {ReturnState} 状态 */
const state = {
    returns: [],
    currentOrder: null,
    returnItems: [],
    searchQuery: '',
    filters: {
        status: 'all',
        startDate: '',
        endDate: ''
    },
    loading: false
};

/**
 * 状态标签和样式映射
 */
const STATUS_MAP = {
    'pending': { label: '待处理', color: '#F59E0B', bg: '#FEF3C7', icon: 'fa-clock' },
    'processing': { label: '处理中', color: '#3B82F6', bg: '#DBEAFE', icon: 'fa-spinner' },
    'completed': { label: '已完成', color: '#10B981', bg: '#D1FAE5', icon: 'fa-check-circle' },
    'rejected': { label: '已拒绝', color: '#EF4444', bg: '#FEE2E2', icon: 'fa-times-circle' }
};

/**
 * 退货原因选项
 */
const REASON_OPTIONS = [
    { value: 'quality', label: '商品质量问题' },
    { value: 'wrong', label: '发错商品' },
    { value: 'damaged', label: '运输损坏' },
    { value: 'dissatisfied', label: '客户不满意' },
    { value: 'other', label: '其他原因' }
];

/**
 * 退款方式选项
 */
const METHOD_OPTIONS = [
    { value: 'original', label: '原路返回' },
    { value: 'cash', label: '现金退款' },
    { value: 'bank', label: '银行转账' },
    { value: 'credit', label: '余额抵扣' }
];

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
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * @private
 * @param {string} id - 退货单号
 * @returns {ReturnRecord|null} 退货记录
 * @description 根据ID获取退货记录
 */
function getReturnById(id) {
    return state.returns.find(r => r.id === id) || null;
}

/**
 * @private
 * @returns {ReturnRecord[]} 待处理退货列表
 * @description 获取待处理退货
 */
function getPendingReturns() {
    return state.returns.filter(r => r.status === 'pending' || r.status === 'processing');
}

/**
 * @private
 * @returns {ReturnRecord[]} 模拟退货数据
 * @description 获取模拟退货数据
 */
function getMockReturns() {
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静'];
    const reasons = ['质量问题', '发错商品', '客户不满意', '运输损坏', '其他原因'];
    const methods = ['原路返回', '现金退款', '银行转账', '余额抵扣'];
    const services = ['抛光打蜡', '内饰清洗', '深度清洁', '精致洗车', '标准洗车'];
    const prices = [388, 328, 268, 128, 68];
    
    const returns = [];
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
        const date = new Date(now - Math.random() * 20 * 24 * 60 * 60 * 1000);
        const itemCount = Math.floor(Math.random() * 2) + 1;
        const items = [];
        let total = 0;
        
        for (let j = 0; j < itemCount; j++) {
            const idx = Math.floor(Math.random() * services.length);
            const qty = Math.floor(Math.random() * 2) + 1;
            const subtotal = prices[idx] * qty;
            items.push({
                name: services[idx],
                price: prices[idx],
                qty: qty,
                subtotal: subtotal
            });
            total += subtotal;
        }
        
        const statuses = ['pending', 'processing', 'completed', 'completed', 'completed', 'rejected'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        
        returns.push({
            id: 'RTN-' + String(100 + i).padStart(4, '0'),
            orderId: 'ORD-' + String(1000 + i).padStart(4, '0'),
            customer: customer,
            customerPhone: '1380000' + String(Math.floor(Math.random() * 9000) + 1000),
            items: items,
            amount: total,
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            method: methods[Math.floor(Math.random() * methods.length)],
            note: Math.random() > 0.7 ? '客户急用，请尽快处理' : '',
            date: date.toISOString(),
            status: status
        });
    }
    
    returns.sort((a, b) => new Date(b.date) - new Date(a.date));
    return returns;
}

/**
 * @private
 * @description 加载退货数据
 */
function loadReturns() {
    try {
        const saved = localStorage.getItem('return_history');
        if (saved) {
            state.returns = JSON.parse(saved);
        } else {
            state.returns = getMockReturns();
            localStorage.setItem('return_history', JSON.stringify(state.returns));
        }
    } catch (e) {
        console.warn('加载退货数据失败:', e);
        state.returns = getMockReturns();
    }
    renderReturns();
    updateStats();
}

/**
 * @private
 * @description 保存退货数据到本地
 */
function saveReturns() {
    try {
        localStorage.setItem('return_history', JSON.stringify(state.returns));
    } catch (e) {
        console.warn('保存退货数据失败:', e);
    }
}

/**
 * @private
 * @description 渲染退货列表
 */
function renderReturns() {
    const container = document.getElementById('returnListBody') || document.getElementById('returnHistoryBody');
    if (!container) return;
    
    // 应用筛选
    let filtered = state.returns;
    
    if (state.filters.status !== 'all') {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    if (state.filters.startDate) {
        filtered = filtered.filter(r => r.date >= state.filters.startDate);
    }
    
    if (state.filters.endDate) {
        filtered = filtered.filter(r => r.date <= state.filters.endDate + 'T23:59:59');
    }
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(r => 
            r.id.toLowerCase().includes(query) ||
            r.orderId.toLowerCase().includes(query) ||
            (r.customer && r.customer.includes(query))
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无退货记录
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(record => {
        const status = STATUS_MAP[record.status] || STATUS_MAP.pending;
        const itemsSummary = record.items.map(i => i.name).join('、');
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:12px;font-family:monospace;font-weight:500;">${record.id}</td>
                <td style="padding:12px;font-family:monospace;">${record.orderId}</td>
                <td style="padding:12px;">${record.customer || '-'}</td>
                <td style="padding:12px;text-align:right;font-weight:600;">¥${formatCurrency(record.amount)}</td>
                <td style="padding:12px;font-size:13px;color:#6B7280;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${itemsSummary}
                </td>
                <td style="padding:12px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.bg};color:${status.color};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:12px;font-size:13px;color:#6B7280;">${formatDate(record.date)}</td>
                <td style="padding:12px;text-align:center;">
                    <button class="btn btn-sm btn-outline" onclick="window.ReturnsModule.viewDetail('${record.id}')" title="查看详情">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${record.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="window.ReturnsModule.updateStatus('${record.id}', 'processing')" title="处理">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.ReturnsModule.updateStatus('${record.id}', 'rejected')" title="拒绝">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    ${record.status === 'processing' ? `
                        <button class="btn btn-sm btn-success" onclick="window.ReturnsModule.updateStatus('${record.id}', 'completed')" title="完成">
                            <i class="fas fa-check-circle"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * @private
 * @description 更新统计数据
 */
function updateStats() {
    const total = state.returns.length;
    const pending = state.returns.filter(r => r.status === 'pending').length;
    const processing = state.returns.filter(r => r.status === 'processing').length;
    const completed = state.returns.filter(r => r.status === 'completed').length;
    const rejected = state.returns.filter(r => r.status === 'rejected').length;
    const totalAmount = state.returns.reduce((sum, r) => sum + r.amount, 0);
    
    const elements = {
        'statTotal': total,
        'statPending': pending,
        'statProcessing': processing,
        'statCompleted': completed,
        'statRejected': rejected,
        'statTotalAmount': '¥' + formatCurrency(totalAmount)
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @param {string} id - 退货单号
 * @description 查看退货详情
 */
function viewDetail(id) {
    const record = getReturnById(id);
    if (!record) {
        showToast('退货记录不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[record.status] || STATUS_MAP.pending;
    
    // 如果有详情弹窗，使用弹窗
    const modal = document.getElementById('returnDetailModal');
    if (modal) {
        const content = document.getElementById('returnDetailContent');
        if (content) {
            content.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div><span style="color:#6B7280;">退货单号</span><br><strong>${record.id}</strong></div>
                    <div><span style="color:#6B7280;">原订单</span><br><strong>${record.orderId}</strong></div>
                    <div><span style="color:#6B7280;">客户</span><br><strong>${record.customer || '-'}</strong></div>
                    <div><span style="color:#6B7280;">电话</span><br><strong>${record.customerPhone || '-'}</strong></div>
                    <div><span style="color:#6B7280;">退货金额</span><br><strong style="color:#EF4444;">¥${formatCurrency(record.amount)}</strong></div>
                    <div><span style="color:#6B7280;">状态</span><br><span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.bg};color:${status.color};">${status.label}</span></div>
                    <div><span style="color:#6B7280;">原因</span><br><strong>${record.reason}</strong></div>
                    <div><span style="color:#6B7280;">退款方式</span><br><strong>${record.method}</strong></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">日期</span><br><strong>${formatDate(record.date)}</strong></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">备注</span><br><strong>${record.note || '无'}</strong></div>
                    <div style="grid-column:span 2;">
                        <span style="color:#6B7280;">商品明细</span><br>
                        ${record.items.map(i => 
                            `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #F3F4F6;font-size:13px;">
                                <span>${i.name} × ${i.qty}</span>
                                <span>¥${formatCurrency(i.subtotal || i.price * i.qty)}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        modal.style.display = 'flex';
        return;
    }
    
    // 降级方案：使用alert
    const itemsSummary = record.items.map(i => `${i.name} × ${i.qty} ¥${formatCurrency(i.subtotal || i.price * i.qty)}`).join('\n');
    alert(`退货详情：
退货单号: ${record.id}
原订单: ${record.orderId}
客户: ${record.customer || '-'}
日期: ${formatDate(record.date)}
状态: ${status.label}
退货金额: ¥${formatCurrency(record.amount)}
原因: ${record.reason}
退款方式: ${record.method}
备注: ${record.note || '无'}

商品明细:
${itemsSummary}`);
}

/**
 * @private
 * @param {string} id - 退货单号
 * @param {string} status - 新状态
 * @description 更新退货状态
 */
async function updateStatus(id, status) {
    const record = getReturnById(id);
    if (!record) {
        showToast('退货记录不存在', 'error');
        return;
    }
    
    try {
        // 尝试调用API
        const response = await apiClient.put(`/returns/${id}/status`, { status });
        if (response && response.success) {
            record.status = status;
            saveReturns();
            renderReturns();
            updateStats();
            showToast('退货状态已更新为: ' + (STATUS_MAP[status]?.label || status), 'success');
        } else {
            // 如果API失败，直接更新本地
            record.status = status;
            saveReturns();
            renderReturns();
            updateStats();
            showToast('退货状态已更新为: ' + (STATUS_MAP[status]?.label || status), 'success');
        }
    } catch (error) {
        console.warn('API更新失败，使用本地更新:', error);
        record.status = status;
        saveReturns();
        renderReturns();
        updateStats();
        showToast('退货状态已更新为: ' + (STATUS_MAP[status]?.label || status), 'success');
    }
}

/**
 * @private
 * @description 创建新退货
 */
function newReturn() {
    const orderId = prompt('输入原订单号：', 'ORD-2024-001');
    if (!orderId) return;
    
    const reason = prompt('输入退货原因（1-质量问题 2-发错商品 3-运输损坏 4-客户不满意 5-其他）：', '1');
    const reasonMap = {
        '1': '质量问题',
        '2': '发错商品', 
        '3': '运输损坏',
        '4': '客户不满意',
        '5': '其他原因'
    };
    const reasonText = reasonMap[reason] || reason || '其他原因';
    
    const amount = parseFloat(prompt('输入退货金额：', '100'));
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效金额', 'error');
        return;
    }
    
    const customer = prompt('输入客户名称：', '客户') || '客户';
    
    const record = {
        id: 'RTN-' + Date.now().toString().slice(-8),
        orderId: orderId,
        customer: customer,
        customerPhone: '',
        items: [{ name: '退货商品', price: amount, qty: 1, subtotal: amount }],
        amount: amount,
        reason: reasonText,
        method: '原路返回',
        note: '手动创建',
        date: new Date().toISOString(),
        status: 'pending'
    };
    
    state.returns.push(record);
    saveReturns();
    renderReturns();
    updateStats();
    showToast('退货已创建: ' + record.id, 'success');
}

/**
 * @private
 * @description 搜索退货
 */
function searchReturns(query) {
    state.searchQuery = query;
    renderReturns();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    state.filters.status = statusFilter ? statusFilter.value : 'all';
    state.filters.startDate = startDate ? startDate.value : '';
    state.filters.endDate = endDate ? endDate.value : '';
    
    renderReturns();
}

/**
 * @private
 * @description 重置筛选
 */
function resetFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const searchInput = document.getElementById('searchInput');
    
    if (statusFilter) statusFilter.value = 'all';
    if (startDate) startDate.value = '';
    if (endDate) endDate.value = '';
    if (searchInput) searchInput.value = '';
    
    state.filters = { status: 'all', startDate: '', endDate: '' };
    state.searchQuery = '';
    renderReturns();
}

/**
 * @private
 * @description 关闭详情弹窗
 */
function closeDetail() {
    const modal = document.getElementById('returnDetailModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 * @description 刷新数据
 */
function refresh() {
    loadReturns();
    showToast('数据已刷新', 'success');
}

/**
 * @private
 * @description 导出退货数据
 */
function exportData() {
    if (state.returns.length === 0) {
        showToast('暂无数据可导出', 'warning');
        return;
    }
    
    const headers = ['退货单号', '原订单', '客户', '金额', '原因', '方式', '状态', '日期', '备注'];
    const rows = state.returns.map(r => [
        r.id,
        r.orderId,
        r.customer || '',
        r.amount.toFixed(2),
        r.reason,
        r.method,
        STATUS_MAP[r.status]?.label || r.status,
        formatDate(r.date),
        r.note || ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '退货记录_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    showToast('数据已导出', 'success');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                searchReturns(this.value);
            }, 300);
        });
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    if (startDate) startDate.addEventListener('change', applyFilters);
    if (endDate) endDate.addEventListener('change', applyFilters);
    
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    const refreshBtn = document.getElementById('refreshReturns');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
    
    const newBtn = document.getElementById('newReturn');
    if (newBtn) {
        newBtn.addEventListener('click', newReturn);
    }
    
    const exportBtn = document.getElementById('exportReturns');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // 点击弹窗外关闭
    const modal = document.getElementById('returnDetailModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeDetail();
            }
        });
    }
    
    // ESC关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDetail();
        }
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {ReturnRecord[]} options.data - 初始数据
 * @returns {Promise<void>}
 * @description 初始化退货管理
 */
export async function init(options) {
    console.log('↩️ 退货管理 初始化...');
    
    // 如果传入了数据，使用传入数据
    if (options?.data) {
        state.returns = options.data;
        saveReturns();
    } else {
        loadReturns();
    }
    
    // 渲染统计
    updateStats();
    
    // 绑定事件
    bindEvents();
    
    // 暴露全局方法
    window.ReturnsModule = {
        state,
        loadReturns,
        renderReturns,
        updateStats,
        viewDetail,
        updateStatus,
        newReturn,
        searchReturns,
        applyFilters,
        resetFilters,
        closeDetail,
        refresh,
        exportData,
        getReturnById,
        getPendingReturns,
        saveReturns
    };
    
    console.log('✅ 退货管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadReturns,
    renderReturns,
    viewDetail,
    updateStatus,
    newReturn,
    searchReturns,
    applyFilters,
    resetFilters,
    refresh,
    exportData,
    getReturnById,
    getPendingReturns,
    saveReturns
};