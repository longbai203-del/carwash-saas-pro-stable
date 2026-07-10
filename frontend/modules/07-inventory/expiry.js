/**
 * @file expiry.js
 * @module expiry
 * @description 过期管理模块 - 商品过期监控、预警和处理
 * 
 * @example
 * import { init } from './expiry.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ExpiryItem
 * @property {string} id - 商品ID
 * @property {string} batchNumber - 批次号
 * @property {string} productName - 商品名称
 * @property {number} quantity - 数量
 * @property {string} unit - 单位
 * @property {string} warehouse - 仓库
 * @property {string} expiryDate - 过期日期
 * @property {number} daysRemaining - 剩余天数
 * @property {string} status - 状态 (normal/warning/expired)
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 */

/** @type {{items: ExpiryItem[], filteredItems: ExpiryItem[], filters: {product: string, status: string, warehouse: string}, page: number, pageSize: number}} 状态 */
const state = {
    items: [],
    filteredItems: [],
    filters: {
        product: '',
        status: '',
        warehouse: ''
    },
    page: 1,
    pageSize: 10
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    normal: { label: '正常', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    warning: { label: '即将过期', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-exclamation-triangle' },
    expired: { label: '已过期', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
};

/**
 * @private
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    return date;
}

/**
 * @private
 * @param {string} date - 日期字符串
 * @returns {number} 剩余天数
 */
function getDaysRemaining(date) {
    if (!date) return 0;
    const now = new Date();
    const expiry = new Date(date);
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return diff;
}

/**
 * @private
 * @returns {ExpiryItem[]} 模拟过期数据
 */
function getMockExpiryItems() {
    const products = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂'];
    const warehouses = ['总仓', '分仓A', '分仓B'];
    const statuses = ['normal', 'warning', 'expired'];
    
    return Array.from({ length: 15 }, (_, i) => {
        const daysOffset = Math.floor(Math.random() * 60) - 15;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + daysOffset);
        const daysRemaining = getDaysRemaining(expiryDate.toISOString().split('T')[0]);
        
        let status;
        if (daysRemaining < 0) status = 'expired';
        else if (daysRemaining < 30) status = 'warning';
        else status = 'normal';
        
        return {
            id: `EXP-${String(i + 1).padStart(6, '0')}`,
            batchNumber: `BN${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
            productName: products[i % products.length],
            quantity: Math.floor(Math.random() * 100) + 5,
            unit: ['桶', '瓶', '个', '箱'][i % 4],
            warehouse: warehouses[i % warehouses.length],
            expiryDate: expiryDate.toISOString().split('T')[0],
            daysRemaining: daysRemaining,
            status: status,
            note: daysRemaining < 0 ? '已过期，请立即处理' : daysRemaining < 30 ? '即将过期，请优先使用' : '',
            createdAt: new Date(Date.now() - (30 + Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载过期数据
 */
function loadExpiryItems() {
    try {
        const saved = localStorage.getItem('expiry_data');
        if (saved) {
            state.items = JSON.parse(saved);
        } else {
            state.items = getMockExpiryItems();
            localStorage.setItem('expiry_data', JSON.stringify(state.items));
        }
    } catch (e) {
        console.warn('加载过期数据失败:', e);
        state.items = getMockExpiryItems();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存过期数据
 */
function saveExpiryItems() {
    try {
        localStorage.setItem('expiry_data', JSON.stringify(state.items));
    } catch (e) {
        console.warn('保存过期数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.items;
    
    if (state.filters.product) {
        const product = state.filters.product.toLowerCase();
        filtered = filtered.filter(item => item.productName.toLowerCase().includes(product));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(item => item.status === state.filters.status);
    }
    
    if (state.filters.warehouse) {
        filtered = filtered.filter(item => item.warehouse === state.filters.warehouse);
    }
    
    state.filteredItems = filtered;
}

/**
 * @private
 * @description 渲染过期列表
 */
function render() {
    const tbody = document.getElementById('expiryListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredItems.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#10B981;">
                    <i class="fas fa-check-circle" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无商品即将过期或已过期
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(item => {
        const status = STATUS_MAP[item.status] || STATUS_MAP.normal;
        const days = item.daysRemaining;
        const expiryStatus = days < 0 ? `已过期${Math.abs(days)}天` : `${days}天后过期`;
        const expiryColor = days < 0 ? '#EF4444' : days < 30 ? '#F59E0B' : '#10B981';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${item.productName}</td>
                <td style="padding:10px 16px;font-family:monospace;font-size:13px;">${item.batchNumber}</td>
                <td style="padding:10px 16px;text-align:right;">${item.quantity} ${item.unit}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${item.warehouse}</td>
                <td style="padding:10px 16px;font-size:13px;color:${expiryColor};font-weight:600;">
                    ${expiryStatus}
                    <div style="font-size:11px;color:#6B7280;font-weight:400;">${formatDate(item.expiryDate)}</div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${item.status === 'expired' ? `
                            <button class="btn btn-sm btn-danger" onclick="window.ExpiryModule.disposeItem('${item.id}')" title="处理报废">
                                <i class="fas fa-trash"></i> 报废
                            </button>
                        ` : ''}
                        ${item.status === 'warning' ? `
                            <button class="btn btn-sm btn-warning" onclick="window.ExpiryModule.useFirst('${item.id}')" title="优先使用">
                                <i class="fas fa-clock"></i> 优先使用
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.ExpiryModule.viewItem('${item.id}')" title="查看">
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
    const total = state.items.length;
    const normal = state.items.filter(i => i.status === 'normal').length;
    const warning = state.items.filter(i => i.status === 'warning').length;
    const expired = state.items.filter(i => i.status === 'expired').length;
    const totalQuantity = state.items.reduce((sum, i) => sum + i.quantity, 0);
    
    const elements = {
        'statTotal': total,
        'statNormal': normal,
        'statWarning': warning,
        'statExpired': expired,
        'statTotalQuantity': totalQuantity
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

    const total = state.filteredItems.length;
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
    `;
    
    html += `
        <button onclick="window.ExpiryModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.ExpiryModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.ExpiryModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.ExpiryModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.ExpiryModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredItems.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 商品ID
 */
function viewItem(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) {
        showToast('商品不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[item.status] || STATUS_MAP.normal;
    const days = item.daysRemaining;
    const expiryStatus = days < 0 ? `已过期${Math.abs(days)}天` : `${days}天后过期`;
    
    alert(`过期详情：
商品: ${item.productName}
批次号: ${item.batchNumber}
数量: ${item.quantity} ${item.unit}
仓库: ${item.warehouse}
过期日期: ${formatDate(item.expiryDate)}
状态: ${expiryStatus}
当前状态: ${status.label}
备注: ${item.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 商品ID
 */
function disposeItem(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) {
        showToast('商品不存在', 'error');
        return;
    }
    
    if (!confirm(`确认报废 "${item.productName}" (批次: ${item.batchNumber}) 共 ${item.quantity} ${item.unit}？`)) return;
    
    // 从列表中移除
    state.items = state.items.filter(i => i.id !== id);
    saveExpiryItems();
    applyFilters();
    render();
    showToast(`已报废 ${item.quantity} ${item.unit}`, 'success');
}

/**
 * @private
 * @param {string} id - 商品ID
 */
function useFirst(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) {
        showToast('商品不存在', 'error');
        return;
    }
    
    showToast(`已标记 "${item.productName}" 为优先使用`, 'info');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.product = document.getElementById('searchProduct')?.value || '';
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
    const productInput = document.getElementById('searchProduct');
    const statusInput = document.getElementById('searchStatus');
    const warehouseInput = document.getElementById('searchWarehouse');
    
    if (productInput) productInput.value = '';
    if (statusInput) statusInput.value = '';
    if (warehouseInput) warehouseInput.value = '';
    
    state.filters = { product: '', status: '', warehouse: '' };
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
    
    document.querySelectorAll('#searchProduct, #searchStatus, #searchWarehouse').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('⏰ 过期管理 初始化...');
    
    if (options?.data) {
        state.items = options.data;
        localStorage.setItem('expiry_data', JSON.stringify(state.items));
    }
    
    loadExpiryItems();
    bindEvents();
    render();
    
    window.ExpiryModule = {
        state,
        loadExpiryItems,
        render,
        renderPagination,
        updateStats,
        viewItem,
        disposeItem,
        useFirst,
        goToPage,
        handleSearch,
        handleReset,
        saveExpiryItems,
        applyFilters
    };
    
    console.log('✅ 过期管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadExpiryItems,
    viewItem,
    disposeItem,
    useFirst,
    goToPage,
    saveExpiryItems
};