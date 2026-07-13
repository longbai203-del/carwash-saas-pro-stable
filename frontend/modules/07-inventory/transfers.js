/**
 * @file transfers.js
 * @module transfers
 * @description 调拨管理模块 - 库存调拨的CRUD操作
 * 
 * @example
 * import { init } from './transfers.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} TransferItem
 * @property {string} productId - 商品ID
 * @property {string} productName - 商品名称
 * @property {number} quantity - 数量
 * @property {string} unit - 单位
 */

/**
 * @typedef {Object} Transfer
 * @property {string} id - 调拨单号
 * @property {string} fromWarehouse - 源仓库
 * @property {string} toWarehouse - 目标仓库
 * @property {TransferItem[]} items - 调拨商品列表
 * @property {string} status - 状态 (pending/processing/completed/cancelled)
 * @property {string} operator - 操作人
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 * @property {string} completedAt - 完成时间
 */

/** @type {{transfers: Transfer[], filteredTransfers: Transfer[], filters: {number: string, status: string, fromWarehouse: string, toWarehouse: string}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    transfers: [],
    filteredTransfers: [],
    filters: {
        number: '',
        status: '',
        fromWarehouse: '',
        toWarehouse: ''
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    pending: { label: '待处理', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    processing: { label: '处理中', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-spinner' },
    completed: { label: '已完成', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    cancelled: { label: '已取消', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
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
 * @returns {Transfer[]} 模拟调拨数据
 */
function getMockTransfers() {
    const warehouses = ['总仓', '分仓A', '分仓B'];
    const products = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂'];
    const operators = ['张伟', '李娜', '王强'];
    const statuses = ['pending', 'processing', 'completed', 'completed', 'cancelled'];
    
    return Array.from({ length: 10 }, (_, i) => {
        const fromIdx = i % warehouses.length;
        let toIdx = (i + 1) % warehouses.length;
        if (toIdx === fromIdx) toIdx = (i + 2) % warehouses.length;
        
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const items = [];
        for (let j = 0; j < itemCount; j++) {
            items.push({
                productId: `P${String(j + 1).padStart(3, '0')}`,
                productName: products[(i + j) % products.length],
                quantity: Math.floor(Math.random() * 50) + 10,
                unit: ['桶', '瓶', '个'][j % 3]
            });
        }
        
        return {
            id: `TF-${String(i + 1).padStart(6, '0')}`,
            fromWarehouse: warehouses[fromIdx],
            toWarehouse: warehouses[toIdx],
            items: items,
            status: statuses[i % statuses.length],
            operator: operators[i % operators.length],
            note: Math.random() > 0.7 ? '紧急调拨' : '',
            createdAt: new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: statuses[i % statuses.length] === 'completed' 
                ? new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString() 
                : null
        };
    });
}

/**
 * @private
 * @description 加载调拨数据
 */
function loadTransfers() {
    try {
        const saved = localStorage.getItem('transfer_data');
        if (saved) {
            state.transfers = JSON.parse(saved);
        } else {
            state.transfers = getMockTransfers();
            localStorage.setItem('transfer_data', JSON.stringify(state.transfers));
        }
    } catch (e) {
        console.warn('加载调拨数据失败:', e);
        state.transfers = getMockTransfers();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存调拨数据
 */
function saveTransfers() {
    try {
        localStorage.setItem('transfer_data', JSON.stringify(state.transfers));
    } catch (e) {
        console.warn('保存调拨数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.transfers;
    
    if (state.filters.number) {
        filtered = filtered.filter(t => t.id.includes(state.filters.number));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(t => t.status === state.filters.status);
    }
    
    if (state.filters.fromWarehouse) {
        filtered = filtered.filter(t => t.fromWarehouse === state.filters.fromWarehouse);
    }
    
    if (state.filters.toWarehouse) {
        filtered = filtered.filter(t => t.toWarehouse === state.filters.toWarehouse);
    }
    
    state.filteredTransfers = filtered;
}

/**
 * @private
 * @description 渲染调拨列表
 */
function render() {
    const tbody = document.getElementById('transferListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredTransfers.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-exchange-alt" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无调拨数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(t => {
        const status = STATUS_MAP[t.status] || STATUS_MAP.pending;
        const itemsSummary = t.items.map(item => `${item.productName}×${item.quantity}`).join('、');
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-family:monospace;font-weight:500;">${t.id}</td>
                <td style="padding:10px 16px;">
                    ${t.fromWarehouse} → ${t.toWarehouse}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${itemsSummary}
                </td>
                <td style="padding:10px 16px;">${t.operator}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(t.createdAt)}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${t.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.TransfersModule.updateStatus('${t.id}', 'processing')" title="开始处理">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : ''}
                        ${t.status === 'processing' ? `
                            <button class="btn btn-sm btn-success" onclick="window.TransfersModule.updateStatus('${t.id}', 'completed')" title="完成">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${t.status === 'pending' || t.status === 'processing' ? `
                            <button class="btn btn-sm btn-danger" onclick="window.TransfersModule.updateStatus('${t.id}', 'cancelled')" title="取消">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.TransfersModule.viewTransfer('${t.id}')" title="查看">
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
    const total = state.transfers.length;
    const pending = state.transfers.filter(t => t.status === 'pending').length;
    const processing = state.transfers.filter(t => t.status === 'processing').length;
    const completed = state.transfers.filter(t => t.status === 'completed').length;
    const cancelled = state.transfers.filter(t => t.status === 'cancelled').length;
    
    const elements = {
        'statTotal': total,
        'statPending': pending,
        'statProcessing': processing,
        'statCompleted': completed,
        'statCancelled': cancelled
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

    const total = state.filteredTransfers.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条调拨
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
        <button onclick="window.TransfersModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.TransfersModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.TransfersModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.TransfersModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.TransfersModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredTransfers.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 调拨单号
 */
function viewTransfer(id) {
    const transfer = state.transfers.find(t => t.id === id);
    if (!transfer) {
        showToast('调拨不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[transfer.status] || STATUS_MAP.pending;
    const itemsStr = transfer.items.map(item => 
        `${item.productName} × ${item.quantity} ${item.unit}`
    ).join('\n');
    
    alert(`调拨详情：
调拨单号: ${transfer.id}
源仓库: ${transfer.fromWarehouse}
目标仓库: ${transfer.toWarehouse}
状态: ${status.label}
操作人: ${transfer.operator}
备注: ${transfer.note || '无'}
创建时间: ${formatDate(transfer.createdAt)}
${transfer.completedAt ? '完成时间: ' + formatDate(transfer.completedAt) : ''}

调拨商品:
${itemsStr}`);
}

/**
 * @private
 * @param {string} id - 调拨单号
 * @param {string} status - 新状态
 */
function updateStatus(id, status) {
    const transfer = state.transfers.find(t => t.id === id);
    if (!transfer) {
        showToast('调拨不存在', 'error');
        return;
    }
    
    transfer.status = status;
    transfer.updatedAt = new Date().toISOString();
    if (status === 'completed') {
        transfer.completedAt = new Date().toISOString();
    }
    
    saveTransfers();
    applyFilters();
    render();
    showToast(`状态已更新为: ${STATUS_MAP[status].label}`, 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const fromWarehouse = prompt('源仓库：', '总仓');
    if (!fromWarehouse) return;
    const toWarehouse = prompt('目标仓库：', '分仓A');
    if (!toWarehouse) return;
    const operator = prompt('操作人：', '张伟') || '张伟';
    const note = prompt('备注：') || '';
    
    const items = [];
    while (true) {
        const productName = prompt('商品名称（输入空结束）：');
        if (!productName) break;
        const quantity = parseInt(prompt('数量：', '10'));
        if (isNaN(quantity) || quantity <= 0) {
            showToast('请输入有效数量', 'error');
            continue;
        }
        const unit = prompt('单位：', '桶') || '个';
        items.push({
            productId: 'P' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
            productName: productName,
            quantity: quantity,
            unit: unit
        });
    }
    
    if (items.length === 0) {
        showToast('至少需要一个商品', 'error');
        return;
    }
    
    const newTransfer = {
        id: 'TF-' + Date.now().toString().slice(-6),
        fromWarehouse: fromWarehouse.trim(),
        toWarehouse: toWarehouse.trim(),
        items: items,
        status: 'pending',
        operator: operator.trim(),
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null
    };
    
    state.transfers.push(newTransfer);
    saveTransfers();
    applyFilters();
    render();
    showToast('调拨已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.number = document.getElementById('searchNumber')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.fromWarehouse = document.getElementById('searchFrom')?.value || '';
    state.filters.toWarehouse = document.getElementById('searchTo')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const numberInput = document.getElementById('searchNumber');
    const statusInput = document.getElementById('searchStatus');
    const fromInput = document.getElementById('searchFrom');
    const toInput = document.getElementById('searchTo');
    
    if (numberInput) numberInput.value = '';
    if (statusInput) statusInput.value = '';
    if (fromInput) fromInput.value = '';
    if (toInput) toInput.value = '';
    
    state.filters = { number: '', status: '', fromWarehouse: '', toWarehouse: '' };
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
    
    document.querySelectorAll('#searchNumber, #searchStatus, #searchFrom, #searchTo').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📤 调拨管理 初始化...');
    
    if (options?.data) {
        state.transfers = options.data;
        localStorage.setItem('transfer_data', JSON.stringify(state.transfers));
    }
    
    loadTransfers();
    bindEvents();
    render();
    
    window.TransfersModule = {
        state,
        loadTransfers,
        render,
        renderPagination,
        updateStats,
        viewTransfer,
        updateStatus,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveTransfers,
        applyFilters
    };
    
    console.log('✅ 调拨管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadTransfers,
    viewTransfer,
    updateStatus,
    goToPage,
    showCreateModal,
    saveTransfers
};