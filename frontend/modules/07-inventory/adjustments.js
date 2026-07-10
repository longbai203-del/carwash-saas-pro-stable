/**
 * @file adjustments.js
 * @module adjustments
 * @description 库存调整模块 - 库存调整的CRUD操作
 * 
 * @example
 * import { init } from './adjustments.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} AdjustmentItem
 * @property {string} productId - 商品ID
 * @property {string} productName - 商品名称
 * @property {number} oldQuantity - 原数量
 * @property {number} newQuantity - 新数量
 * @property {number} difference - 差异
 * @property {string} unit - 单位
 */

/**
 * @typedef {Object} Adjustment
 * @property {string} id - 调整单号
 * @property {AdjustmentItem[]} items - 调整商品列表
 * @property {string} type - 类型 (increase/decrease/correction)
 * @property {string} reason - 调整原因
 * @property {string} operator - 操作人
 * @property {string} status - 状态 (pending/approved/rejected)
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 * @property {string} approvedAt - 审核时间
 */

/** @type {{adjustments: Adjustment[], filteredAdjustments: Adjustment[], filters: {number: string, type: string, status: string}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    adjustments: [],
    filteredAdjustments: [],
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
 * 类型配置
 */
const TYPE_MAP = {
    increase: { label: '增加', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-plus-circle' },
    decrease: { label: '减少', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-minus-circle' },
    correction: { label: '修正', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-edit' }
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    pending: { label: '待审核', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    approved: { label: '已批准', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    rejected: { label: '已驳回', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
};

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
 * @returns {Adjustment[]} 模拟调整数据
 */
function getMockAdjustments() {
    const products = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂'];
    const operators = ['张伟', '李娜', '王强'];
    const types = ['increase', 'decrease', 'correction'];
    const statuses = ['pending', 'approved', 'approved', 'rejected'];
    const reasons = ['盘点差异', '损耗处理', '数据修正', '退货入库', '报废处理'];
    
    return Array.from({ length: 10 }, (_, i) => {
        const type = types[i % types.length];
        const diff = type === 'increase' ? Math.floor(Math.random() * 50) + 10 
            : type === 'decrease' ? -(Math.floor(Math.random() * 30) + 5) 
            : Math.floor(Math.random() * 20) - 10;
        
        const oldQty = Math.floor(Math.random() * 100) + 50;
        const newQty = oldQty + diff;
        
        return {
            id: `ADJ-${String(i + 1).padStart(6, '0')}`,
            items: [{
                productId: `P${String(i + 1).padStart(3, '0')}`,
                productName: products[i % products.length],
                oldQuantity: oldQty,
                newQuantity: newQty,
                difference: diff,
                unit: ['桶', '瓶', '个'][i % 3]
            }],
            type: type,
            reason: reasons[i % reasons.length],
            operator: operators[i % operators.length],
            status: statuses[i % statuses.length],
            note: Math.random() > 0.7 ? '需紧急处理' : '',
            createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
            approvedAt: statuses[i % statuses.length] === 'approved' 
                ? new Date(Date.now() - i * 6 * 60 * 60 * 1000).toISOString() 
                : null
        };
    });
}

/**
 * @private
 * @description 加载调整数据
 */
function loadAdjustments() {
    try {
        const saved = localStorage.getItem('adjustment_data');
        if (saved) {
            state.adjustments = JSON.parse(saved);
        } else {
            state.adjustments = getMockAdjustments();
            localStorage.setItem('adjustment_data', JSON.stringify(state.adjustments));
        }
    } catch (e) {
        console.warn('加载调整数据失败:', e);
        state.adjustments = getMockAdjustments();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存调整数据
 */
function saveAdjustments() {
    try {
        localStorage.setItem('adjustment_data', JSON.stringify(state.adjustments));
    } catch (e) {
        console.warn('保存调整数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.adjustments;
    
    if (state.filters.number) {
        filtered = filtered.filter(a => a.id.includes(state.filters.number));
    }
    
    if (state.filters.type) {
        filtered = filtered.filter(a => a.type === state.filters.type);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(a => a.status === state.filters.status);
    }
    
    state.filteredAdjustments = filtered;
}

/**
 * @private
 * @description 渲染调整列表
 */
function render() {
    const tbody = document.getElementById('adjustmentListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredAdjustments.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-sliders-h" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无调整数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(a => {
        const type = TYPE_MAP[a.type] || TYPE_MAP.correction;
        const status = STATUS_MAP[a.status] || STATUS_MAP.pending;
        const item = a.items[0] || {};
        const diffStr = item.difference > 0 ? `+${item.difference}` : `${item.difference}`;
        const diffColor = item.difference > 0 ? '#10B981' : item.difference < 0 ? '#EF4444' : '#6B7280';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-family:monospace;font-weight:500;">${a.id}</td>
                <td style="padding:10px 16px;font-weight:500;">${item.productName || '-'}</td>
                <td style="padding:10px 16px;text-align:center;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        <i class="fas ${type.icon}" style="margin-right:4px;"></i>
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:center;font-weight:700;color:${diffColor};">
                    ${diffStr} ${item.unit || ''}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${a.reason}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${a.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.AdjustmentsModule.updateStatus('${a.id}', 'approved')" title="批准">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.AdjustmentsModule.updateStatus('${a.id}', 'rejected')" title="驳回">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.AdjustmentsModule.viewAdjustment('${a.id}')" title="查看">
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
    const total = state.adjustments.length;
    const pending = state.adjustments.filter(a => a.status === 'pending').length;
    const approved = state.adjustments.filter(a => a.status === 'approved').length;
    const rejected = state.adjustments.filter(a => a.status === 'rejected').length;
    const totalDiff = state.adjustments.reduce((sum, a) => {
        const diff = a.items.reduce((s, item) => s + (item.difference || 0), 0);
        return sum + diff;
    }, 0);
    
    const elements = {
        'statTotal': total,
        'statPending': pending,
        'statApproved': approved,
        'statRejected': rejected,
        'statTotalDiff': totalDiff > 0 ? `+${totalDiff}` : `${totalDiff}`
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

    const total = state.filteredAdjustments.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条调整
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
        <button onclick="window.AdjustmentsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.AdjustmentsModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.AdjustmentsModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.AdjustmentsModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.AdjustmentsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredAdjustments.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 调整单号
 */
function viewAdjustment(id) {
    const adjustment = state.adjustments.find(a => a.id === id);
    if (!adjustment) {
        showToast('调整不存在', 'error');
        return;
    }
    
    const type = TYPE_MAP[adjustment.type] || TYPE_MAP.correction;
    const status = STATUS_MAP[adjustment.status] || STATUS_MAP.pending;
    const itemsStr = adjustment.items.map(item => 
        `${item.productName}: ${item.oldQuantity} → ${item.newQuantity} (${item.difference > 0 ? '+' : ''}${item.difference} ${item.unit})`
    ).join('\n');
    
    alert(`调整详情：
调整单号: ${adjustment.id}
类型: ${type.label}
原因: ${adjustment.reason}
状态: ${status.label}
操作人: ${adjustment.operator}
备注: ${adjustment.note || '无'}
创建时间: ${formatDate(adjustment.createdAt)}
${adjustment.approvedAt ? '审核时间: ' + formatDate(adjustment.approvedAt) : ''}

调整商品:
${itemsStr}`);
}

/**
 * @private
 * @param {string} id - 调整单号
 * @param {string} status - 新状态
 */
function updateStatus(id, status) {
    const adjustment = state.adjustments.find(a => a.id === id);
    if (!adjustment) {
        showToast('调整不存在', 'error');
        return;
    }
    
    adjustment.status = status;
    adjustment.updatedAt = new Date().toISOString();
    if (status === 'approved' || status === 'rejected') {
        adjustment.approvedAt = new Date().toISOString();
    }
    
    saveAdjustments();
    applyFilters();
    render();
    showToast(`状态已更新为: ${STATUS_MAP[status].label}`, 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const productName = prompt('商品名称：');
    if (!productName) return;
    const oldQuantity = parseInt(prompt('原数量：', '50'));
    if (isNaN(oldQuantity) || oldQuantity < 0) {
        showToast('请输入有效数量', 'error');
        return;
    }
    const newQuantity = parseInt(prompt('新数量：', '60'));
    if (isNaN(newQuantity) || newQuantity < 0) {
        showToast('请输入有效数量', 'error');
        return;
    }
    const unit = prompt('单位：', '桶') || '个';
    const reason = prompt('调整原因：') || '手动调整';
    const operator = prompt('操作人：', '张伟') || '张伟';
    const note = prompt('备注：') || '';
    
    const diff = newQuantity - oldQuantity;
    const type = diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'correction';
    
    const newAdjustment = {
        id: 'ADJ-' + Date.now().toString().slice(-6),
        items: [{
            productId: 'P' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
            productName: productName.trim(),
            oldQuantity: oldQuantity,
            newQuantity: newQuantity,
            difference: diff,
            unit: unit
        }],
        type: type,
        reason: reason,
        operator: operator.trim(),
        status: 'pending',
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        approvedAt: null
    };
    
    state.adjustments.push(newAdjustment);
    saveAdjustments();
    applyFilters();
    render();
    showToast('调整已创建', 'success');
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
    console.log('📊 库存调整 初始化...');
    
    if (options?.data) {
        state.adjustments = options.data;
        localStorage.setItem('adjustment_data', JSON.stringify(state.adjustments));
    }
    
    loadAdjustments();
    bindEvents();
    render();
    
    window.AdjustmentsModule = {
        state,
        loadAdjustments,
        render,
        renderPagination,
        updateStats,
        viewAdjustment,
        updateStatus,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveAdjustments,
        applyFilters
    };
    
    console.log('✅ 库存调整 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadAdjustments,
    viewAdjustment,
    updateStatus,
    goToPage,
    showCreateModal,
    saveAdjustments
};