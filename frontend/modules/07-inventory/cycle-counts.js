/**
 * @file cycle-counts.js
 * @module cycle-counts
 * @description 盘点管理模块 - 库存盘点的创建、执行和审核
 * 
 * @example
 * import { init } from './cycle-counts.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} CycleCountItem
 * @property {string} productId - 商品ID
 * @property {string} productName - 商品名称
 * @property {number} systemQuantity - 系统数量
 * @property {number} actualQuantity - 实际数量
 * @property {number} difference - 差异
 * @property {string} unit - 单位
 * @property {string} [note] - 备注
 */

/**
 * @typedef {Object} CycleCount
 * @property {string} id - 盘点单号
 * @property {string} name - 盘点名称
 * @property {string} warehouse - 仓库
 * @property {CycleCountItem[]} items - 盘点商品列表
 * @property {string} status - 状态 (draft/active/completed/closed)
 * @property {string} type - 类型 (full/partial)
 * @property {string} operator - 操作人
 * @property {string} supervisor - 监督人
 * @property {string} startDate - 开始日期
 * @property {string} endDate - 结束日期
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 * @property {string} completedAt - 完成时间
 */

/** @type {{counts: CycleCount[], filteredCounts: CycleCount[], filters: {number: string, status: string, warehouse: string}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    counts: [],
    filteredCounts: [],
    filters: {
        number: '',
        status: '',
        warehouse: ''
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
    active: { label: '进行中', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-play' },
    completed: { label: '已完成', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    closed: { label: '已关闭', color: '#F3F4F6', textColor: '#6B7280', icon: 'fa-lock' }
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
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

/**
 * @private
 * @returns {CycleCount[]} 模拟盘点数据
 */
function getMockCycleCounts() {
    const warehouses = ['总仓', '分仓A', '分仓B'];
    const products = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂'];
    const operators = ['张伟', '李娜', '王强'];
    const supervisors = ['刘洋', '陈静', '赵明'];
    const types = ['full', 'partial'];
    const statuses = ['draft', 'active', 'completed', 'closed'];
    
    return Array.from({ length: 8 }, (_, i) => {
        const itemCount = Math.floor(Math.random() * 5) + 3;
        const items = [];
        for (let j = 0; j < Math.min(itemCount, products.length); j++) {
            const sysQty = Math.floor(Math.random() * 100) + 10;
            const actualQty = sysQty + (Math.floor(Math.random() * 20) - 10);
            items.push({
                productId: `P${String(j + 1).padStart(3, '0')}`,
                productName: products[j],
                systemQuantity: sysQty,
                actualQuantity: actualQty,
                difference: actualQty - sysQty,
                unit: ['桶', '瓶', '个', '箱'][j % 4],
                note: Math.abs(actualQty - sysQty) > 10 ? '差异较大，需复核' : ''
            });
        }
        
        return {
            id: `CC-${String(i + 1).padStart(6, '0')}`,
            name: `${warehouses[i % warehouses.length]}季度盘点`,
            warehouse: warehouses[i % warehouses.length],
            items: items,
            status: statuses[i % statuses.length],
            type: types[i % types.length],
            operator: operators[i % operators.length],
            supervisor: supervisors[i % supervisors.length],
            startDate: new Date(Date.now() - (i + 1) * 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            note: Math.random() > 0.7 ? '需注意贵重物品' : '',
            createdAt: new Date(Date.now() - (i + 1) * 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: statuses[i % statuses.length] === 'completed' || statuses[i % statuses.length] === 'closed'
                ? new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString()
                : null
        };
    });
}

/**
 * @private
 * @description 加载盘点数据
 */
function loadCycleCounts() {
    try {
        const saved = localStorage.getItem('cycle_count_data');
        if (saved) {
            state.counts = JSON.parse(saved);
        } else {
            state.counts = getMockCycleCounts();
            localStorage.setItem('cycle_count_data', JSON.stringify(state.counts));
        }
    } catch (e) {
        console.warn('加载盘点数据失败:', e);
        state.counts = getMockCycleCounts();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存盘点数据
 */
function saveCycleCounts() {
    try {
        localStorage.setItem('cycle_count_data', JSON.stringify(state.counts));
    } catch (e) {
        console.warn('保存盘点数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.counts;
    
    if (state.filters.number) {
        filtered = filtered.filter(c => c.id.includes(state.filters.number));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(c => c.status === state.filters.status);
    }
    
    if (state.filters.warehouse) {
        filtered = filtered.filter(c => c.warehouse === state.filters.warehouse);
    }
    
    state.filteredCounts = filtered;
}

/**
 * @private
 * @description 渲染盘点列表
 */
function render() {
    const tbody = document.getElementById('cycleCountListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredCounts.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-clipboard-check" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无盘点数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(c => {
        const status = STATUS_MAP[c.status] || STATUS_MAP.draft;
        const totalDiff = c.items.reduce((sum, item) => sum + Math.abs(item.difference), 0);
        const typeLabel = c.type === 'full' ? '全盘' : '抽盘';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${c.id}</div>
                    <div style="font-size:12px;color:#6B7280;">${c.name}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${c.warehouse}</td>
                <td style="padding:10px 16px;text-align:center;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;background:#F3F4F6;color:#4B5563;">
                        ${typeLabel}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:center;font-weight:600;color:${totalDiff > 0 ? '#F59E0B' : '#10B981'};">
                    ${totalDiff > 0 ? '⚠️ ' : '✅ '}${formatNumber(totalDiff)}项差异
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${c.operator}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${c.status === 'draft' ? `
                            <button class="btn btn-sm btn-success" onclick="window.CycleCountsModule.updateStatus('${c.id}', 'active')" title="开始盘点">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.CycleCountsModule.deleteCount('${c.id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                        ${c.status === 'active' ? `
                            <button class="btn btn-sm btn-success" onclick="window.CycleCountsModule.updateStatus('${c.id}', 'completed')" title="完成盘点">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${c.status === 'completed' ? `
                            <button class="btn btn-sm btn-primary" onclick="window.CycleCountsModule.updateStatus('${c.id}', 'closed')" title="关闭盘点">
                                <i class="fas fa-lock"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.CycleCountsModule.viewCount('${c.id}')" title="查看">
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
    const total = state.counts.length;
    const draft = state.counts.filter(c => c.status === 'draft').length;
    const active = state.counts.filter(c => c.status === 'active').length;
    const completed = state.counts.filter(c => c.status === 'completed').length;
    const closed = state.counts.filter(c => c.status === 'closed').length;
    const totalDiff = state.counts.reduce((sum, c) => {
        const diff = c.items.reduce((s, item) => s + Math.abs(item.difference), 0);
        return sum + diff;
    }, 0);
    
    const elements = {
        'statTotal': total,
        'statDraft': draft,
        'statActive': active,
        'statCompleted': completed,
        'statClosed': closed,
        'statTotalDiff': formatNumber(totalDiff)
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

    const total = state.filteredCounts.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条盘点
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
        <button onclick="window.CycleCountsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.CycleCountsModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.CycleCountsModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.CycleCountsModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.CycleCountsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredCounts.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 盘点单号
 */
function viewCount(id) {
    const count = state.counts.find(c => c.id === id);
    if (!count) {
        showToast('盘点不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[count.status] || STATUS_MAP.draft;
    const itemsStr = count.items.map(item => 
        `${item.productName}: 系统${item.systemQuantity} → 实际${item.actualQuantity} (${item.difference > 0 ? '+' : ''}${item.difference} ${item.unit})`
    ).join('\n');
    const typeLabel = count.type === 'full' ? '全盘' : '抽盘';
    const totalDiff = count.items.reduce((sum, item) => sum + Math.abs(item.difference), 0);
    
    alert(`盘点详情：
盘点单号: ${count.id}
名称: ${count.name}
仓库: ${count.warehouse}
类型: ${typeLabel}
状态: ${status.label}
操作人: ${count.operator}
监督人: ${count.supervisor}
日期: ${count.startDate || '-'} ~ ${count.endDate || '-'}
差异项数: ${formatNumber(totalDiff)}项
备注: ${count.note || '无'}
创建时间: ${formatDate(count.createdAt)}
${count.completedAt ? '完成时间: ' + formatDate(count.completedAt) : ''}

盘点商品:
${itemsStr}`);
}

/**
 * @private
 * @param {string} id - 盘点单号
 * @param {string} status - 新状态
 */
function updateStatus(id, status) {
    const count = state.counts.find(c => c.id === id);
    if (!count) {
        showToast('盘点不存在', 'error');
        return;
    }
    
    const oldStatus = count.status;
    count.status = status;
    count.updatedAt = new Date().toISOString();
    
    if (status === 'completed' || status === 'closed') {
        count.completedAt = new Date().toISOString();
    }
    
    // 如果状态从active变为completed，更新库存
    if (oldStatus === 'active' && status === 'completed') {
        updateInventoryFromCount(count);
    }
    
    saveCycleCounts();
    applyFilters();
    render();
    showToast(`状态已更新为: ${STATUS_MAP[status].label}`, 'success');
}

/**
 * @private
 * @param {CycleCount} count - 盘点数据
 * @description 根据盘点结果更新库存
 */
function updateInventoryFromCount(count) {
    try {
        const stockData = JSON.parse(localStorage.getItem('stock_data') || '[]');
        count.items.forEach(item => {
            const stockItem = stockData.find(s => s.id === item.productId);
            if (stockItem) {
                stockItem.quantity = item.actualQuantity;
                stockItem.lastUpdated = new Date().toISOString();
                stockItem.status = stockItem.quantity <= stockItem.minStock ? 'low' : 'normal';
            }
        });
        localStorage.setItem('stock_data', JSON.stringify(stockData));
        showToast('库存已根据盘点结果更新', 'success');
    } catch (e) {
        console.warn('更新库存失败:', e);
    }
}

/**
 * @private
 * @param {string} id - 盘点单号
 */
function deleteCount(id) {
    const count = state.counts.find(c => c.id === id);
    if (!count) {
        showToast('盘点不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除盘点 "${count.id}"？`)) return;
    
    state.counts = state.counts.filter(c => c.id !== id);
    saveCycleCounts();
    applyFilters();
    render();
    showToast('盘点已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const name = prompt('盘点名称：', '月度盘点');
    if (!name) return;
    const warehouse = prompt('仓库：', '总仓');
    if (!warehouse) return;
    const typeOptions = ['1. full (全盘)', '2. partial (抽盘)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
    const types = ['full', 'partial'];
    const type = types[typeIdx - 1] || 'full';
    const operator = prompt('操作人：', '张伟') || '张伟';
    const supervisor = prompt('监督人：', '刘洋') || '刘洋';
    const note = prompt('备注：') || '';
    
    // 获取库存数据
    const stockData = JSON.parse(localStorage.getItem('stock_data') || '[]');
    const items = stockData.slice(0, 5).map(s => ({
        productId: s.id,
        productName: s.name,
        systemQuantity: s.quantity || 0,
        actualQuantity: s.quantity || 0,
        difference: 0,
        unit: s.unit || '个',
        note: ''
    }));
    
    if (items.length === 0) {
        showToast('没有可盘点的商品', 'error');
        return;
    }
    
    const newCount = {
        id: 'CC-' + Date.now().toString().slice(-6),
        name: name.trim(),
        warehouse: warehouse.trim(),
        items: items,
        status: 'draft',
        type: type,
        operator: operator.trim(),
        supervisor: supervisor.trim(),
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null
    };
    
    state.counts.push(newCount);
    saveCycleCounts();
    applyFilters();
    render();
    showToast('盘点已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.number = document.getElementById('searchNumber')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.warehouse = document.getElementById('searchWarehouse')?.value || '';
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
    const warehouseInput = document.getElementById('searchWarehouse');
    
    if (numberInput) numberInput.value = '';
    if (statusInput) statusInput.value = '';
    if (warehouseInput) warehouseInput.value = '';
    
    state.filters = { number: '', status: '', warehouse: '' };
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
    
    document.querySelectorAll('#searchNumber, #searchStatus, #searchWarehouse').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📋 盘点管理 初始化...');
    
    if (options?.data) {
        state.counts = options.data;
        localStorage.setItem('cycle_count_data', JSON.stringify(state.counts));
    }
    
    loadCycleCounts();
    bindEvents();
    render();
    
    window.CycleCountsModule = {
        state,
        loadCycleCounts,
        render,
        renderPagination,
        updateStats,
        viewCount,
        updateStatus,
        deleteCount,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveCycleCounts,
        applyFilters
    };
    
    console.log('✅ 盘点管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadCycleCounts,
    viewCount,
    updateStatus,
    deleteCount,
    goToPage,
    showCreateModal,
    saveCycleCounts
};