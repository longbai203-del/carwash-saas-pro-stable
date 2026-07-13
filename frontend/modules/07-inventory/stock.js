/**
 * @file stock.js
 * @module stock
 * @description 库存管理模块 - 库存查看、预警、调拨管理
 * 
 * @example
 * import { init } from './stock.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} StockItem
 * @property {string} id - 库存ID
 * @property {string} name - 商品名称
 * @property {string} category - 分类
 * @property {number} quantity - 当前数量
 * @property {string} unit - 单位
 * @property {number} minStock - 最低库存
 * @property {number} maxStock - 最高库存
 * @property {string} status - 状态 (normal/low/out)
 * @property {string} location - 存放位置
 * @property {string} lastUpdated - 最后更新时间
 * @property {string} createdAt - 创建时间
 */

/**
 * @typedef {Object} StockState
 * @property {StockItem[]} items - 库存列表
 * @property {StockItem[]} filteredItems - 过滤后的库存列表
 * @property {Object} filters - 筛选条件
 * @property {number} page - 页码
 * @property {number} pageSize - 每页数量
 * @property {boolean} loading - 加载状态
 */

/** @type {StockState} 状态 */
const state = {
    items: [],
    filteredItems: [],
    filters: {
        name: '',
        category: '',
        status: ''
    },
    page: 1,
    pageSize: 10,
    loading: false
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    normal: { label: '正常', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    low: { label: '低库存', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-exclamation-triangle' },
    out: { label: '缺货', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
};

/**
 * 分类列表
 */
const CATEGORIES = ['洗车', '美容', '保养', '配件', '耗材'];

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
 * @returns {StockItem[]} 模拟库存数据
 */
function getMockStock() {
    const names = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂', '发动机清洗剂', '皮革护理剂', '划痕修复蜡', '镀晶液'];
    const units = ['桶', '瓶', '个', '箱', '罐'];
    const locations = ['A区-01', 'A区-02', 'B区-01', 'B区-02', 'C区-01'];
    
    return names.map((name, i) => {
        const quantity = Math.floor(Math.random() * 500) + 5;
        const minStock = 20;
        const status = quantity <= 10 ? 'out' : quantity <= minStock ? 'low' : 'normal';
        
        return {
            id: `STK-${String(i + 1).padStart(6, '0')}`,
            name: name,
            category: CATEGORIES[i % CATEGORIES.length],
            quantity: quantity,
            unit: units[i % units.length],
            minStock: minStock,
            maxStock: minStock * 10,
            status: status,
            location: locations[i % locations.length],
            lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - (30 + Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载库存数据
 */
function loadStockItems() {
    try {
        const saved = localStorage.getItem('stock_data');
        if (saved) {
            state.items = JSON.parse(saved);
        } else {
            state.items = getMockStock();
            localStorage.setItem('stock_data', JSON.stringify(state.items));
        }
    } catch (e) {
        console.warn('加载库存数据失败:', e);
        state.items = getMockStock();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存库存数据
 */
function saveStockItems() {
    try {
        localStorage.setItem('stock_data', JSON.stringify(state.items));
    } catch (e) {
        console.warn('保存库存数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.items;
    
    if (state.filters.name) {
        const name = state.filters.name.toLowerCase();
        filtered = filtered.filter(item => item.name.toLowerCase().includes(name));
    }
    
    if (state.filters.category) {
        filtered = filtered.filter(item => item.category === state.filters.category);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(item => item.status === state.filters.status);
    }
    
    state.filteredItems = filtered;
}

/**
 * @private
 * @description 渲染库存列表
 */
function render() {
    const tbody = document.getElementById('stockTableBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredItems.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-warehouse" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    ${state.loading ? '加载中...' : '暂无库存数据'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(item => {
        const status = STATUS_MAP[item.status] || STATUS_MAP.normal;
        const isLow = item.quantity <= item.minStock;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${item.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${item.id}</div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;background:#F3F4F6;color:#4B5563;">
                        ${item.category}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:700;${isLow ? 'color:#EF4444;' : 'color:#1F2937;'}">
                    ${item.quantity} ${item.unit}
                </td>
                <td style="padding:10px 16px;text-align:center;font-size:13px;color:#6B7280;">
                    ${item.minStock} ${item.unit}
                </td>
                <td style="padding:10px 16px;text-align:center;font-size:13px;color:#6B7280;">
                    ${item.location || '-'}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">
                    ${formatDate(item.lastUpdated)}
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.StockModule.editStock('${item.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.StockModule.viewStock('${item.id}')" title="查看">
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
    const low = state.items.filter(i => i.status === 'low').length;
    const out = state.items.filter(i => i.status === 'out').length;
    const totalQty = state.items.reduce((sum, i) => sum + i.quantity, 0);
    const totalValue = state.items.reduce((sum, i) => sum + i.quantity * (i.price || 0), 0);

    const elements = {
        'statTotalItems': total,
        'statLowStock': low,
        'statOutStock': out,
        'statTotalQuantity': totalQty,
        'statTotalValue': '¥' + formatCurrency(totalValue)
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
                共 ${total} 条库存
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
        <button onclick="window.StockModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.StockModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.StockModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.StockModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.StockModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @param {string} id - 库存ID
 * @description 查看库存详情
 */
function viewStock(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) {
        showToast('库存不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[item.status] || STATUS_MAP.normal;
    
    alert(`库存详情：
名称: ${item.name}
ID: ${item.id}
分类: ${item.category}
数量: ${item.quantity} ${item.unit}
最低库存: ${item.minStock} ${item.unit}
最高库存: ${item.maxStock} ${item.unit}
位置: ${item.location || '-'}
状态: ${status.label}
最后更新: ${formatDate(item.lastUpdated)}`);
}

/**
 * @private
 * @param {string} id - 库存ID
 * @description 编辑库存
 */
function editStock(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) {
        showToast('库存不存在', 'error');
        return;
    }
    
    const quantity = parseInt(prompt('当前数量：', item.quantity));
    if (isNaN(quantity) || quantity < 0) {
        showToast('请输入有效数量', 'error');
        return;
    }
    
    const minStock = parseInt(prompt('最低库存：', item.minStock));
    if (isNaN(minStock) || minStock < 0) {
        showToast('请输入有效最低库存', 'error');
        return;
    }
    
    const maxStock = parseInt(prompt('最高库存：', item.maxStock));
    if (isNaN(maxStock) || maxStock < 0) {
        showToast('请输入有效最高库存', 'error');
        return;
    }
    
    const location = prompt('存放位置：', item.location || '') || '';
    
    item.quantity = quantity;
    item.minStock = minStock;
    item.maxStock = maxStock;
    item.location = location;
    item.status = quantity <= 10 ? 'out' : quantity <= minStock ? 'low' : 'normal';
    item.lastUpdated = new Date().toISOString();
    
    saveStockItems();
    applyFilters();
    render();
    showToast('库存已更新', 'success');
}

/**
 * @private
 * @description 搜索库存
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.category = document.getElementById('searchCategory')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 * @description 重置搜索
 */
function handleReset() {
    const nameInput = document.getElementById('searchName');
    const categoryInput = document.getElementById('searchCategory');
    const statusInput = document.getElementById('searchStatus');
    
    if (nameInput) nameInput.value = '';
    if (categoryInput) categoryInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { name: '', category: '', status: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    
    document.querySelectorAll('#searchName, #searchCategory, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {StockItem[]} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('📦 库存管理模块初始化...');
    
    if (options?.data) {
        state.items = options.data;
        localStorage.setItem('stock_data', JSON.stringify(state.items));
    }
    
    loadStockItems();
    bindEvents();
    render();
    
    window.StockModule = {
        state,
        loadStockItems,
        render,
        renderPagination,
        updateStats,
        viewStock,
        editStock,
        goToPage,
        handleSearch,
        handleReset,
        saveStockItems,
        applyFilters
    };
    
    console.log('✅ 库存管理初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadStockItems,
    viewStock,
    editStock,
    goToPage,
    saveStockItems
};