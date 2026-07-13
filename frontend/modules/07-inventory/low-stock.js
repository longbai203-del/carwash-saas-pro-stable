/**
 * @file low-stock.js
 * @module low-stock
 * @description 低库存预警模块 - 低库存商品监控和预警
 * 
 * @example
 * import { init } from './low-stock.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} LowStockItem
 * @property {string} id - 商品ID
 * @property {string} name - 商品名称
 * @property {string} category - 分类
 * @property {number} quantity - 当前库存
 * @property {number} minStock - 最低库存
 * @property {string} unit - 单位
 * @property {string} status - 状态 (critical/low)
 * @property {string} location - 存放位置
 * @property {string} lastUpdated - 最后更新时间
 */

/** @type {{items: LowStockItem[], filteredItems: LowStockItem[], filters: {name: string, category: string, status: string}, page: number, pageSize: number}} 状态 */
const state = {
    items: [],
    filteredItems: [],
    filters: {
        name: '',
        category: '',
        status: ''
    },
    page: 1,
    pageSize: 10
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
 * @returns {LowStockItem[]} 模拟低库存数据
 */
function getMockLowStockItems() {
    const names = ['泡沫洗车液', '轮胎光亮剂', '内饰清洗剂', '玻璃清洁剂', '水蜡', '空调清洗剂'];
    const categories = ['洗车', '保养', '美容', '洗车', '美容', '保养'];
    
    return names.map((name, i) => {
        const quantity = Math.floor(Math.random() * 15) + 2;
        const minStock = 20;
        return {
            id: `STK-${String(i + 1).padStart(6, '0')}`,
            name: name,
            category: categories[i % categories.length],
            quantity: quantity,
            minStock: minStock,
            unit: ['桶', '瓶', '个', '箱'][i % 4],
            status: quantity <= 5 ? 'critical' : 'low',
            location: ['A区-01', 'B区-02', 'A区-03', 'C区-01'][i % 4],
            lastUpdated: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载低库存数据
 */
function loadLowStockItems() {
    try {
        const saved = localStorage.getItem('low_stock_data');
        if (saved) {
            state.items = JSON.parse(saved);
        } else {
            state.items = getMockLowStockItems();
            localStorage.setItem('low_stock_data', JSON.stringify(state.items));
        }
    } catch (e) {
        console.warn('加载低库存数据失败:', e);
        state.items = getMockLowStockItems();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存低库存数据
 */
function saveLowStockItems() {
    try {
        localStorage.setItem('low_stock_data', JSON.stringify(state.items));
    } catch (e) {
        console.warn('保存低库存数据失败:', e);
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
 * @description 渲染低库存列表
 */
function render() {
    const tbody = document.getElementById('lowStockListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredItems.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#10B981;">
                    <i class="fas fa-check-circle" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    所有商品库存充足
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        critical: { label: '⚠️ 紧急', color: '#FEE2E2', textColor: '#991B1B' },
        low: { label: '⚠️ 预警', color: '#FEF3C7', textColor: '#92400E' }
    };

    tbody.innerHTML = pageData.map(item => {
        const status = statusMap[item.status] || statusMap.low;
        const shortage = item.minStock - item.quantity;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${item.name}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;background:#F3F4F6;color:#4B5563;">
                        ${item.category}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:700;color:#EF4444;">
                    ${item.quantity} ${item.unit}
                </td>
                <td style="padding:10px 16px;text-align:right;color:#6B7280;">
                    ${item.minStock} ${item.unit}
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#EF4444;">
                    ${shortage} ${item.unit}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-primary" onclick="window.LowStockModule.orderStock('${item.id}')" title="补货">
                            <i class="fas fa-shopping-cart"></i> 补货
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.LowStockModule.viewItem('${item.id}')" title="查看">
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
    const critical = state.items.filter(i => i.status === 'critical').length;
    const low = state.items.filter(i => i.status === 'low').length;
    
    const elements = {
        'statTotal': total,
        'statCritical': critical,
        'statLow': low
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
                共 ${total} 条预警
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
        <button onclick="window.LowStockModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.LowStockModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.LowStockModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.LowStockModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.LowStockModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    
    const status = item.status === 'critical' ? '⚠️ 紧急' : '⚠️ 预警';
    
    alert(`低库存详情：
商品: ${item.name}
分类: ${item.category}
当前库存: ${item.quantity} ${item.unit}
最低库存: ${item.minStock} ${item.unit}
缺货量: ${item.minStock - item.quantity} ${item.unit}
状态: ${status}
位置: ${item.location || '-'}
最后更新: ${formatDate(item.lastUpdated)}`);
}

/**
 * @private
 * @param {string} id - 商品ID
 */
function orderStock(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) {
        showToast('商品不存在', 'error');
        return;
    }
    
    const quantity = parseInt(prompt(`请输入补货数量 (当前库存: ${item.quantity} ${item.unit})：`, item.minStock * 2));
    if (isNaN(quantity) || quantity <= 0) {
        showToast('请输入有效数量', 'error');
        return;
    }
    
    // 更新库存
    const stockData = JSON.parse(localStorage.getItem('stock_data') || '[]');
    const stockItem = stockData.find(s => s.id === id);
    if (stockItem) {
        stockItem.quantity += quantity;
        stockItem.lastUpdated = new Date().toISOString();
        stockItem.status = stockItem.quantity <= stockItem.minStock ? 'low' : 'normal';
        localStorage.setItem('stock_data', JSON.stringify(stockData));
    }
    
    // 更新低库存列表
    item.quantity += quantity;
    item.lastUpdated = new Date().toISOString();
    if (item.quantity > item.minStock) {
        state.items = state.items.filter(i => i.id !== id);
    } else {
        item.status = item.quantity <= 5 ? 'critical' : 'low';
    }
    
    saveLowStockItems();
    applyFilters();
    render();
    showToast(`已补货 ${quantity} ${item.unit}，当前库存: ${item.quantity} ${item.unit}`, 'success');
}

/**
 * @private
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
 */
export async function init(options) {
    console.log('⚠️ 低库存预警 初始化...');
    
    if (options?.data) {
        state.items = options.data;
        localStorage.setItem('low_stock_data', JSON.stringify(state.items));
    }
    
    loadLowStockItems();
    bindEvents();
    render();
    
    window.LowStockModule = {
        state,
        loadLowStockItems,
        render,
        renderPagination,
        updateStats,
        viewItem,
        orderStock,
        goToPage,
        handleSearch,
        handleReset,
        saveLowStockItems,
        applyFilters
    };
    
    console.log('✅ 低库存预警 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadLowStockItems,
    viewItem,
    orderStock,
    goToPage,
    saveLowStockItems
};