/**
 * @file history.js
 * @module history
 * @description 库存历史模块 - 库存变动历史记录
 * 
 * @example
 * import { init } from './history.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} HistoryRecord
 * @property {string} id - 记录ID
 * @property {string} productName - 商品名称
 * @property {string} type - 类型 (stock_in/stock_out/adjustment/transfer/return)
 * @property {number} quantity - 数量
 * @property {string} unit - 单位
 * @property {number} beforeQuantity - 变动前数量
 * @property {number} afterQuantity - 变动后数量
 * @property {string} operator - 操作人
 * @property {string} warehouse - 仓库
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 */

/** @type {{records: HistoryRecord[], filteredRecords: HistoryRecord[], filters: {product: string, type: string, operator: string}, page: number, pageSize: number}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        product: '',
        type: '',
        operator: ''
    },
    page: 1,
    pageSize: 10
};

/**
 * 类型配置
 */
const TYPE_MAP = {
    stock_in: { label: '入库', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-arrow-down' },
    stock_out: { label: '出库', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-arrow-up' },
    adjustment: { label: '调整', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-sliders-h' },
    transfer: { label: '调拨', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-exchange-alt' },
    return: { label: '退货', color: '#EDE9FE', textColor: '#6D28D9', icon: 'fa-undo' }
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
 * @returns {HistoryRecord[]} 模拟历史数据
 */
function getMockHistory() {
    const products = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂'];
    const types = ['stock_in', 'stock_out', 'adjustment', 'transfer', 'return'];
    const operators = ['张伟', '李娜', '王强', '刘洋', '陈静'];
    const warehouses = ['总仓', '分仓A', '分仓B'];
    const notes = ['正常入库', '客户订单', '盘点调整', '仓库调拨', '客户退货'];
    
    return Array.from({ length: 30 }, (_, i) => {
        const type = types[i % types.length];
        const quantity = Math.floor(Math.random() * 50) + 5;
        const beforeQty = Math.floor(Math.random() * 100) + 50;
        const afterQty = type === 'stock_in' ? beforeQty + quantity 
            : type === 'stock_out' ? beforeQty - quantity 
            : beforeQty + (Math.random() > 0.5 ? quantity : -quantity);
        
        return {
            id: `HIST-${String(i + 1).padStart(6, '0')}`,
            productName: products[i % products.length],
            type: type,
            quantity: Math.abs(quantity),
            unit: ['桶', '瓶', '个', '箱'][i % 4],
            beforeQuantity: beforeQty,
            afterQuantity: Math.max(0, afterQty),
            operator: operators[i % operators.length],
            warehouse: warehouses[i % warehouses.length],
            note: notes[i % notes.length],
            createdAt: new Date(Date.now() - (i + 1) * 6 * 60 * 60 * 1000).toISOString()
        };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * @private
 * @description 加载历史数据
 */
function loadHistory() {
    try {
        const saved = localStorage.getItem('history_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockHistory();
            localStorage.setItem('history_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载历史数据失败:', e);
        state.records = getMockHistory();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存历史数据
 */
function saveHistory() {
    try {
        localStorage.setItem('history_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存历史数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.records;
    
    if (state.filters.product) {
        const product = state.filters.product.toLowerCase();
        filtered = filtered.filter(r => r.productName.toLowerCase().includes(product));
    }
    
    if (state.filters.type) {
        filtered = filtered.filter(r => r.type === state.filters.type);
    }
    
    if (state.filters.operator) {
        const operator = state.filters.operator.toLowerCase();
        filtered = filtered.filter(r => r.operator.toLowerCase().includes(operator));
    }
    
    state.filteredRecords = filtered;
}

/**
 * @private
 * @description 渲染历史列表
 */
function render() {
    const tbody = document.getElementById('historyListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-history" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无历史记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const type = TYPE_MAP[r.type] || TYPE_MAP.stock_in;
        const diff = r.afterQuantity - r.beforeQuantity;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${r.productName}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        <i class="fas ${type.icon}" style="margin-right:4px;"></i>
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:700;color:${r.type === 'stock_in' ? '#10B981' : r.type === 'stock_out' ? '#EF4444' : '#F59E0B'};">
                    ${r.type === 'stock_in' ? '+' : r.type === 'stock_out' ? '-' : ''}${r.quantity} ${r.unit}
                </td>
                <td style="padding:10px 16px;text-align:center;font-size:13px;">
                    ${formatNumber(r.beforeQuantity)} → ${formatNumber(r.afterQuantity)}
                    <div style="font-size:11px;color:#6B7280;">${diff > 0 ? '+' : ''}${diff}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.operator}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.warehouse}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(r.createdAt)}</td>
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
    const total = state.records.length;
    const stockIn = state.records.filter(r => r.type === 'stock_in').length;
    const stockOut = state.records.filter(r => r.type === 'stock_out').length;
    const adjustment = state.records.filter(r => r.type === 'adjustment').length;
    const transfer = state.records.filter(r => r.type === 'transfer').length;
    const totalQuantity = state.records.reduce((sum, r) => sum + r.quantity, 0);
    
    const elements = {
        'statTotal': total,
        'statStockIn': stockIn,
        'statStockOut': stockOut,
        'statAdjustment': adjustment,
        'statTransfer': transfer,
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
    `;
    
    html += `
        <button onclick="window.HistoryModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.HistoryModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.HistoryModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.HistoryModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.HistoryModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredRecords.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function handleSearch() {
    state.filters.product = document.getElementById('searchProduct')?.value || '';
    state.filters.type = document.getElementById('searchType')?.value || '';
    state.filters.operator = document.getElementById('searchOperator')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const productInput = document.getElementById('searchProduct');
    const typeInput = document.getElementById('searchType');
    const operatorInput = document.getElementById('searchOperator');
    
    if (productInput) productInput.value = '';
    if (typeInput) typeInput.value = '';
    if (operatorInput) operatorInput.value = '';
    
    state.filters = { product: '', type: '', operator: '' };
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
    
    document.querySelectorAll('#searchProduct, #searchType, #searchOperator').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📜 库存历史 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('history_data', JSON.stringify(state.records));
    }
    
    loadHistory();
    bindEvents();
    render();
    
    window.HistoryModule = {
        state,
        loadHistory,
        render,
        renderPagination,
        updateStats,
        goToPage,
        handleSearch,
        handleReset,
        saveHistory,
        applyFilters
    };
    
    console.log('✅ 库存历史 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadHistory,
    goToPage,
    saveHistory
};