/**
 * @file warehouses.js
 * @module warehouses
 * @description 仓库管理模块 - 仓库的CRUD操作
 * 
 * @example
 * import { init } from './warehouses.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Warehouse
 * @property {string} id - 仓库ID
 * @property {string} name - 仓库名称
 * @property {string} code - 仓库编码
 * @property {string} address - 地址
 * @property {string} manager - 负责人
 * @property {string} phone - 联系电话
 * @property {string} status - 状态 (active/inactive)
 * @property {number} capacity - 容量
 * @property {number} used - 已用容量
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{warehouses: Warehouse[], filteredWarehouses: Warehouse[], filters: {name: string, status: string}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    warehouses: [],
    filteredWarehouses: [],
    filters: {
        name: '',
        status: ''
    },
    page: 1,
    pageSize: 10,
    editingId: null
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
 * @returns {Warehouse[]} 模拟仓库数据
 */
function getMockWarehouses() {
    return [
        { id: 'WH-001', name: '总仓', code: 'WH001', address: '北京市朝阳区XX路1号', manager: '张伟', phone: '13800001111', status: 'active', capacity: 10000, used: 6500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'WH-002', name: '分仓A', code: 'WH002', address: '上海市浦东新区XX路2号', manager: '李娜', phone: '13800002222', status: 'active', capacity: 5000, used: 3200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'WH-003', name: '分仓B', code: 'WH003', address: '广州市天河区XX路3号', manager: '王强', phone: '13800003333', status: 'inactive', capacity: 3000, used: 1200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
}

/**
 * @private
 * @description 加载仓库数据
 */
function loadWarehouses() {
    try {
        const saved = localStorage.getItem('warehouse_data');
        if (saved) {
            state.warehouses = JSON.parse(saved);
        } else {
            state.warehouses = getMockWarehouses();
            localStorage.setItem('warehouse_data', JSON.stringify(state.warehouses));
        }
    } catch (e) {
        console.warn('加载仓库数据失败:', e);
        state.warehouses = getMockWarehouses();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存仓库数据
 */
function saveWarehouses() {
    try {
        localStorage.setItem('warehouse_data', JSON.stringify(state.warehouses));
    } catch (e) {
        console.warn('保存仓库数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.warehouses;
    
    if (state.filters.name) {
        const name = state.filters.name.toLowerCase();
        filtered = filtered.filter(w => w.name.toLowerCase().includes(name) || w.code.toLowerCase().includes(name));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(w => w.status === state.filters.status);
    }
    
    state.filteredWarehouses = filtered;
}

/**
 * @private
 * @description 渲染仓库列表
 */
function render() {
    const tbody = document.getElementById('warehouseListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredWarehouses.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-building" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无仓库数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(w => {
        const usage = w.capacity > 0 ? Math.round((w.used / w.capacity) * 100) : 0;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${w.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${w.code}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${w.address}</td>
                <td style="padding:10px 16px;">${w.manager}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${w.phone}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="flex:1;height:6px;background:#F3F4F6;border-radius:9999px;overflow:hidden;min-width:80px;">
                            <div style="height:100%;background:${usage > 80 ? '#EF4444' : usage > 50 ? '#F59E0B' : '#10B981'};border-radius:9999px;width:${Math.min(usage, 100)}%;"></div>
                        </div>
                        <span style="font-size:12px;color:#6B7280;">${usage}%</span>
                    </div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${w.status === 'active' ? '#D1FAE5' : '#FEE2E2'};color:${w.status === 'active' ? '#065F46' : '#991B1B'};">
                        ${w.status === 'active' ? '启用' : '禁用'}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.WarehousesModule.editWarehouse('${w.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.WarehousesModule.viewWarehouse('${w.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.WarehousesModule.deleteWarehouse('${w.id}')" title="删除">
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
    const total = state.warehouses.length;
    const active = state.warehouses.filter(w => w.status === 'active').length;
    const inactive = state.warehouses.filter(w => w.status === 'inactive').length;
    const totalCapacity = state.warehouses.reduce((sum, w) => sum + w.capacity, 0);
    const totalUsed = state.warehouses.reduce((sum, w) => sum + w.used, 0);
    
    const elements = {
        'statTotal': total,
        'statActive': active,
        'statInactive': inactive,
        'statTotalCapacity': totalCapacity,
        'statTotalUsed': totalUsed
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

    const total = state.filteredWarehouses.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 个仓库
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.WarehousesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.WarehousesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
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
    const totalPages = Math.ceil(state.filteredWarehouses.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 仓库ID
 */
function viewWarehouse(id) {
    const warehouse = state.warehouses.find(w => w.id === id);
    if (!warehouse) {
        showToast('仓库不存在', 'error');
        return;
    }
    
    alert(`仓库详情：
名称: ${warehouse.name}
编码: ${warehouse.code}
地址: ${warehouse.address}
负责人: ${warehouse.manager}
电话: ${warehouse.phone}
容量: ${warehouse.capacity}
已用: ${warehouse.used}
状态: ${warehouse.status === 'active' ? '启用' : '禁用'}`);
}

/**
 * @private
 * @param {string} id - 仓库ID
 */
function editWarehouse(id) {
    const warehouse = state.warehouses.find(w => w.id === id);
    if (!warehouse) {
        showToast('仓库不存在', 'error');
        return;
    }
    
    const name = prompt('仓库名称：', warehouse.name);
    if (name === null) return;
    const code = prompt('仓库编码：', warehouse.code);
    if (code === null) return;
    const address = prompt('地址：', warehouse.address) || '';
    const manager = prompt('负责人：', warehouse.manager) || '';
    const phone = prompt('电话：', warehouse.phone) || '';
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"禁用');
    
    warehouse.name = name.trim() || warehouse.name;
    warehouse.code = code.trim() || warehouse.code;
    warehouse.address = address;
    warehouse.manager = manager;
    warehouse.phone = phone;
    warehouse.status = status ? 'active' : 'inactive';
    warehouse.updatedAt = new Date().toISOString();
    
    saveWarehouses();
    applyFilters();
    render();
    showToast('仓库已更新', 'success');
}

/**
 * @private
 * @param {string} id - 仓库ID
 */
function deleteWarehouse(id) {
    const warehouse = state.warehouses.find(w => w.id === id);
    if (!warehouse) {
        showToast('仓库不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除仓库 "${warehouse.name}"？`)) return;
    
    state.warehouses = state.warehouses.filter(w => w.id !== id);
    saveWarehouses();
    applyFilters();
    render();
    showToast('仓库已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const name = prompt('仓库名称：');
    if (!name) return;
    const code = prompt('仓库编码：');
    if (!code) return;
    const address = prompt('地址：') || '';
    const manager = prompt('负责人：') || '';
    const phone = prompt('电话：') || '';
    const capacity = parseInt(prompt('容量：', '1000'));
    const status = confirm('是否启用？');
    
    const newWarehouse = {
        id: 'WH-' + Date.now().toString().slice(-6),
        name: name.trim(),
        code: code.trim(),
        address: address,
        manager: manager,
        phone: phone,
        capacity: isNaN(capacity) ? 1000 : capacity,
        used: 0,
        status: status ? 'active' : 'inactive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.warehouses.push(newWarehouse);
    saveWarehouses();
    applyFilters();
    render();
    showToast('仓库已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
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
    const statusInput = document.getElementById('searchStatus');
    
    if (nameInput) nameInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { name: '', status: '' };
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
    
    document.querySelectorAll('#searchName, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('🏭 仓库管理 初始化...');
    
    if (options?.data) {
        state.warehouses = options.data;
        localStorage.setItem('warehouse_data', JSON.stringify(state.warehouses));
    }
    
    loadWarehouses();
    bindEvents();
    render();
    
    window.WarehousesModule = {
        state,
        loadWarehouses,
        render,
        renderPagination,
        updateStats,
        viewWarehouse,
        editWarehouse,
        deleteWarehouse,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveWarehouses,
        applyFilters
    };
    
    console.log('✅ 仓库管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadWarehouses,
    viewWarehouse,
    editWarehouse,
    deleteWarehouse,
    goToPage,
    showCreateModal,
    saveWarehouses
};