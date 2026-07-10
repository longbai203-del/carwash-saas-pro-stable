/**
 * @file serial-numbers.js
 * @module serial-numbers
 * @description 序列号管理模块 - 商品序列号的跟踪和管理
 * 
 * @example
 * import { init } from './serial-numbers.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} SerialNumber
 * @property {string} id - 记录ID
 * @property {string} serialNumber - 序列号
 * @property {string} productId - 商品ID
 * @property {string} productName - 商品名称
 * @property {string} status - 状态 (in_stock/sold/returned/repair)
 * @property {string} warehouse - 仓库
 * @property {string} customer - 客户
 * @property {string} soldDate - 销售日期
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{items: SerialNumber[], filteredItems: SerialNumber[], filters: {number: string, product: string, status: string}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    items: [],
    filteredItems: [],
    filters: {
        number: '',
        product: '',
        status: ''
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    in_stock: { label: '在库', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-box' },
    sold: { label: '已售', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-shopping-bag' },
    returned: { label: '已退回', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-undo' },
    repair: { label: '维修中', color: '#EDE9FE', textColor: '#6D28D9', icon: 'fa-tools' }
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
 * @returns {SerialNumber[]} 模拟序列号数据
 */
function getMockSerialNumbers() {
    const products = ['洗车机', '抛光机', '吸尘器', '高压水枪', '蒸汽清洗机'];
    const statuses = ['in_stock', 'in_stock', 'sold', 'sold', 'returned', 'repair'];
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明'];
    const warehouses = ['总仓', '分仓A', '分仓B'];
    
    return Array.from({ length: 20 }, (_, i) => {
        const status = statuses[i % statuses.length];
        return {
            id: `SN-${String(i + 1).padStart(6, '0')}`,
            serialNumber: `SN${String(Math.floor(Math.random() * 1000000000)).padStart(10, '0')}`,
            productId: `P${String(i % 5 + 1).padStart(3, '0')}`,
            productName: products[i % products.length],
            status: status,
            warehouse: warehouses[i % warehouses.length],
            customer: status === 'sold' || status === 'returned' ? customers[i % customers.length] : '',
            soldDate: status === 'sold' || status === 'returned' 
                ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : '',
            note: status === 'repair' ? '客户返修' : '',
            createdAt: new Date(Date.now() - (30 + Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载序列号数据
 */
function loadSerialNumbers() {
    try {
        const saved = localStorage.getItem('serial_number_data');
        if (saved) {
            state.items = JSON.parse(saved);
        } else {
            state.items = getMockSerialNumbers();
            localStorage.setItem('serial_number_data', JSON.stringify(state.items));
        }
    } catch (e) {
        console.warn('加载序列号数据失败:', e);
        state.items = getMockSerialNumbers();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存序列号数据
 */
function saveSerialNumbers() {
    try {
        localStorage.setItem('serial_number_data', JSON.stringify(state.items));
    } catch (e) {
        console.warn('保存序列号数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.items;
    
    if (state.filters.number) {
        filtered = filtered.filter(item => item.serialNumber.includes(state.filters.number));
    }
    
    if (state.filters.product) {
        const product = state.filters.product.toLowerCase();
        filtered = filtered.filter(item => item.productName.toLowerCase().includes(product));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(item => item.status === state.filters.status);
    }
    
    state.filteredItems = filtered;
}

/**
 * @private
 * @description 渲染序列号列表
 */
function render() {
    const tbody = document.getElementById('serialNumberListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredItems.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-hashtag" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无序列号数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(item => {
        const status = STATUS_MAP[item.status] || STATUS_MAP.in_stock;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-family:monospace;font-weight:500;">${item.serialNumber}</td>
                <td style="padding:10px 16px;font-weight:500;">${item.productName}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${item.warehouse}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${item.customer || '-'}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(item.soldDate)}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.SerialNumbersModule.editSerial('${item.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.SerialNumbersModule.viewSerial('${item.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.SerialNumbersModule.deleteSerial('${item.id}')" title="删除">
                            <i class="fas fa-trash"></i>
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
    const inStock = state.items.filter(i => i.status === 'in_stock').length;
    const sold = state.items.filter(i => i.status === 'sold').length;
    const returned = state.items.filter(i => i.status === 'returned').length;
    const repair = state.items.filter(i => i.status === 'repair').length;
    
    const elements = {
        'statTotal': total,
        'statInStock': inStock,
        'statSold': sold,
        'statReturned': returned,
        'statRepair': repair
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
                共 ${total} 条序列号
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
        <button onclick="window.SerialNumbersModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.SerialNumbersModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.SerialNumbersModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.SerialNumbersModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.SerialNumbersModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @param {string} id - 记录ID
 */
function viewSerial(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) {
        showToast('序列号不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[item.status] || STATUS_MAP.in_stock;
    
    alert(`序列号详情：
序列号: ${item.serialNumber}
商品: ${item.productName}
状态: ${status.label}
仓库: ${item.warehouse}
客户: ${item.customer || '-'}
销售日期: ${formatDate(item.soldDate)}
备注: ${item.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 记录ID
 */
function editSerial(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) {
        showToast('序列号不存在', 'error');
        return;
    }
    
    const statusOptions = ['1. in_stock (在库)', '2. sold (已售)', '3. returned (已退回)', '4. repair (维修中)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, 
        item.status === 'in_stock' ? '1' : item.status === 'sold' ? '2' : item.status === 'returned' ? '3' : '4'));
    const statuses = ['in_stock', 'sold', 'returned', 'repair'];
    const newStatus = statuses[statusIdx - 1] || item.status;
    
    const customer = prompt('客户：', item.customer || '') || '';
    const soldDate = prompt('销售日期 (YYYY-MM-DD)：', item.soldDate || '') || '';
    const note = prompt('备注：', item.note || '') || '';
    
    item.status = newStatus;
    item.customer = customer;
    item.soldDate = soldDate;
    item.note = note;
    item.updatedAt = new Date().toISOString();
    
    saveSerialNumbers();
    applyFilters();
    render();
    showToast('序列号已更新', 'success');
}

/**
 * @private
 * @param {string} id - 记录ID
 */
function deleteSerial(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) {
        showToast('序列号不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除序列号 "${item.serialNumber}"？`)) return;
    
    state.items = state.items.filter(i => i.id !== id);
    saveSerialNumbers();
    applyFilters();
    render();
    showToast('序列号已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const serialNumber = prompt('序列号：', `SN${String(Math.floor(Math.random() * 1000000000)).padStart(10, '0')}`);
    if (!serialNumber) return;
    const productName = prompt('商品名称：');
    if (!productName) return;
    const warehouse = prompt('仓库：', '总仓') || '总仓';
    const statusOptions = ['1. in_stock (在库)', '2. sold (已售)', '3. returned (已退回)', '4. repair (维修中)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, '1'));
    const statuses = ['in_stock', 'sold', 'returned', 'repair'];
    const status = statuses[statusIdx - 1] || 'in_stock';
    const customer = prompt('客户：') || '';
    const soldDate = prompt('销售日期 (YYYY-MM-DD)：') || '';
    const note = prompt('备注：') || '';
    
    const newItem = {
        id: 'SN-' + Date.now().toString().slice(-6),
        serialNumber: serialNumber.trim(),
        productId: 'P' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
        productName: productName.trim(),
        status: status,
        warehouse: warehouse,
        customer: customer,
        soldDate: soldDate,
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.items.push(newItem);
    saveSerialNumbers();
    applyFilters();
    render();
    showToast('序列号已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.number = document.getElementById('searchNumber')?.value || '';
    state.filters.product = document.getElementById('searchProduct')?.value || '';
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
    const productInput = document.getElementById('searchProduct');
    const statusInput = document.getElementById('searchStatus');
    
    if (numberInput) numberInput.value = '';
    if (productInput) productInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { number: '', product: '', status: '' };
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
    
    document.querySelectorAll('#searchNumber, #searchProduct, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('🔢 序列号管理 初始化...');
    
    if (options?.data) {
        state.items = options.data;
        localStorage.setItem('serial_number_data', JSON.stringify(state.items));
    }
    
    loadSerialNumbers();
    bindEvents();
    render();
    
    window.SerialNumbersModule = {
        state,
        loadSerialNumbers,
        render,
        renderPagination,
        updateStats,
        viewSerial,
        editSerial,
        deleteSerial,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveSerialNumbers,
        applyFilters
    };
    
    console.log('✅ 序列号管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadSerialNumbers,
    viewSerial,
    editSerial,
    deleteSerial,
    goToPage,
    showCreateModal,
    saveSerialNumbers
};