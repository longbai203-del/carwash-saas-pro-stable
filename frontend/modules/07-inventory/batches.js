/**
 * @file batches.js
 * @module batches
 * @description 批次管理模块 - 商品批次的CRUD操作和跟踪
 * 
 * @example
 * import { init } from './batches.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Batch
 * @property {string} id - 批次ID
 * @property {string} batchNumber - 批次号
 * @property {string} productId - 商品ID
 * @property {string} productName - 商品名称
 * @property {number} quantity - 数量
 * @property {string} unit - 单位
 * @property {string} warehouse - 仓库
 * @property {string} supplier - 供应商
 * @property {string} manufactureDate - 生产日期
 * @property {string} expiryDate - 过期日期
 * @property {string} status - 状态 (active/expired/used)
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{batches: Batch[], filteredBatches: Batch[], filters: {number: string, product: string, status: string}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    batches: [],
    filteredBatches: [],
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
    active: { label: '有效', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    expired: { label: '已过期', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' },
    used: { label: '已使用', color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-check' }
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
 * @returns {Batch[]} 模拟批次数据
 */
function getMockBatches() {
    const products = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂'];
    const suppliers = ['供应商A', '供应商B', '供应商C'];
    const warehouses = ['总仓', '分仓A', '分仓B'];
    
    return Array.from({ length: 12 }, (_, i) => {
        const daysToExpiry = Math.floor(Math.random() * 90) - 10;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + daysToExpiry);
        
        const status = daysToExpiry < 0 ? 'expired' : daysToExpiry < 30 ? 'active' : 'active';
        
        return {
            id: `BATCH-${String(i + 1).padStart(6, '0')}`,
            batchNumber: `BN${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
            productId: `P${String(i % 5 + 1).padStart(3, '0')}`,
            productName: products[i % products.length],
            quantity: Math.floor(Math.random() * 200) + 10,
            unit: ['桶', '瓶', '个', '箱'][i % 4],
            warehouse: warehouses[i % warehouses.length],
            supplier: suppliers[i % suppliers.length],
            manufactureDate: new Date(Date.now() - (60 + Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            expiryDate: expiryDate.toISOString().split('T')[0],
            status: status,
            note: daysToExpiry < 30 && daysToExpiry >= 0 ? '即将过期，请优先使用' : '',
            createdAt: new Date(Date.now() - (30 + Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载批次数据
 */
function loadBatches() {
    try {
        const saved = localStorage.getItem('batch_data');
        if (saved) {
            state.batches = JSON.parse(saved);
        } else {
            state.batches = getMockBatches();
            localStorage.setItem('batch_data', JSON.stringify(state.batches));
        }
    } catch (e) {
        console.warn('加载批次数据失败:', e);
        state.batches = getMockBatches();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存批次数据
 */
function saveBatches() {
    try {
        localStorage.setItem('batch_data', JSON.stringify(state.batches));
    } catch (e) {
        console.warn('保存批次数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.batches;
    
    if (state.filters.number) {
        filtered = filtered.filter(b => b.batchNumber.includes(state.filters.number));
    }
    
    if (state.filters.product) {
        const product = state.filters.product.toLowerCase();
        filtered = filtered.filter(b => b.productName.toLowerCase().includes(product));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(b => b.status === state.filters.status);
    }
    
    state.filteredBatches = filtered;
}

/**
 * @private
 * @description 渲染批次列表
 */
function render() {
    const tbody = document.getElementById('batchListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredBatches.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-layer-group" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无批次数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(b => {
        const status = STATUS_MAP[b.status] || STATUS_MAP.active;
        const daysRemaining = getDaysRemaining(b.expiryDate);
        const expiryStatus = daysRemaining < 0 ? '已过期' : daysRemaining < 30 ? `${daysRemaining}天后过期` : `${daysRemaining}天`;
        const expiryColor = daysRemaining < 0 ? '#EF4444' : daysRemaining < 30 ? '#F59E0B' : '#10B981';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-family:monospace;font-weight:500;">${b.batchNumber}</td>
                <td style="padding:10px 16px;font-weight:500;">${b.productName}</td>
                <td style="padding:10px 16px;text-align:right;">${b.quantity} ${b.unit}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${b.warehouse}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${b.supplier}</td>
                <td style="padding:10px 16px;font-size:13px;color:${expiryColor};font-weight:600;">
                    ${expiryStatus}
                    <div style="font-size:11px;color:#6B7280;font-weight:400;">${formatDate(b.expiryDate)}</div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.BatchesModule.editBatch('${b.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.BatchesModule.viewBatch('${b.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.BatchesModule.deleteBatch('${b.id}')" title="删除">
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
    const total = state.batches.length;
    const active = state.batches.filter(b => b.status === 'active').length;
    const expired = state.batches.filter(b => b.status === 'expired').length;
    const used = state.batches.filter(b => b.status === 'used').length;
    const expiringSoon = state.batches.filter(b => {
        const days = getDaysRemaining(b.expiryDate);
        return days >= 0 && days < 30 && b.status === 'active';
    }).length;
    
    const elements = {
        'statTotal': total,
        'statActive': active,
        'statExpired': expired,
        'statUsed': used,
        'statExpiringSoon': expiringSoon
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

    const total = state.filteredBatches.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条批次
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
        <button onclick="window.BatchesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.BatchesModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.BatchesModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.BatchesModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.BatchesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredBatches.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 批次ID
 */
function viewBatch(id) {
    const batch = state.batches.find(b => b.id === id);
    if (!batch) {
        showToast('批次不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[batch.status] || STATUS_MAP.active;
    const daysRemaining = getDaysRemaining(batch.expiryDate);
    
    alert(`批次详情：
批次号: ${batch.batchNumber}
商品: ${batch.productName}
数量: ${batch.quantity} ${batch.unit}
仓库: ${batch.warehouse}
供应商: ${batch.supplier}
生产日期: ${formatDate(batch.manufactureDate)}
过期日期: ${formatDate(batch.expiryDate)}
剩余天数: ${daysRemaining < 0 ? '已过期' : daysRemaining + '天'}
状态: ${status.label}
备注: ${batch.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 批次ID
 */
function editBatch(id) {
    const batch = state.batches.find(b => b.id === id);
    if (!batch) {
        showToast('批次不存在', 'error');
        return;
    }
    
    const quantity = parseInt(prompt('数量：', batch.quantity));
    if (isNaN(quantity) || quantity < 0) {
        showToast('请输入有效数量', 'error');
        return;
    }
    
    const expiryDate = prompt('过期日期 (YYYY-MM-DD)：', batch.expiryDate);
    if (!expiryDate) return;
    
    const statusOptions = ['1. active (有效)', '2. expired (已过期)', '3. used (已使用)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, 
        batch.status === 'active' ? '1' : batch.status === 'expired' ? '2' : '3'));
    const statuses = ['active', 'expired', 'used'];
    
    batch.quantity = quantity;
    batch.expiryDate = expiryDate;
    batch.status = statuses[statusIdx - 1] || batch.status;
    batch.updatedAt = new Date().toISOString();
    
    saveBatches();
    applyFilters();
    render();
    showToast('批次已更新', 'success');
}

/**
 * @private
 * @param {string} id - 批次ID
 */
function deleteBatch(id) {
    const batch = state.batches.find(b => b.id === id);
    if (!batch) {
        showToast('批次不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除批次 "${batch.batchNumber}"？`)) return;
    
    state.batches = state.batches.filter(b => b.id !== id);
    saveBatches();
    applyFilters();
    render();
    showToast('批次已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const batchNumber = prompt('批次号：', `BN${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`);
    if (!batchNumber) return;
    const productName = prompt('商品名称：');
    if (!productName) return;
    const quantity = parseInt(prompt('数量：', '100'));
    if (isNaN(quantity) || quantity < 0) {
        showToast('请输入有效数量', 'error');
        return;
    }
    const unit = prompt('单位：', '桶') || '个';
    const warehouse = prompt('仓库：', '总仓') || '总仓';
    const supplier = prompt('供应商：') || '';
    const manufactureDate = prompt('生产日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
    const expiryDate = prompt('过期日期 (YYYY-MM-DD)：', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const note = prompt('备注：') || '';
    
    const newBatch = {
        id: 'BATCH-' + Date.now().toString().slice(-6),
        batchNumber: batchNumber.trim(),
        productId: 'P' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
        productName: productName.trim(),
        quantity: quantity,
        unit: unit,
        warehouse: warehouse,
        supplier: supplier,
        manufactureDate: manufactureDate,
        expiryDate: expiryDate,
        status: 'active',
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.batches.push(newBatch);
    saveBatches();
    applyFilters();
    render();
    showToast('批次已创建', 'success');
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
    console.log('📦 批次管理 初始化...');
    
    if (options?.data) {
        state.batches = options.data;
        localStorage.setItem('batch_data', JSON.stringify(state.batches));
    }
    
    loadBatches();
    bindEvents();
    render();
    
    window.BatchesModule = {
        state,
        loadBatches,
        render,
        renderPagination,
        updateStats,
        viewBatch,
        editBatch,
        deleteBatch,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveBatches,
        applyFilters
    };
    
    console.log('✅ 批次管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadBatches,
    viewBatch,
    editBatch,
    deleteBatch,
    goToPage,
    showCreateModal,
    saveBatches
};