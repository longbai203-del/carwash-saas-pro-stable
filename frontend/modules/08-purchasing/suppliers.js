/**
 * @file suppliers.js
 * @module suppliers
 * @description 供应商管理 - 供应商的CRUD操作
 * 
 * @example
 * import { init } from './suppliers.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Supplier
 * @property {string} id - 供应商ID
 * @property {string} code - 供应商编码
 * @property {string} name - 供应商名称
 * @property {string} contact - 联系人
 * @property {string} phone - 联系电话
 * @property {string} email - 邮箱
 * @property {string} address - 地址
 * @property {string} taxId - 税号
 * @property {string} bank - 开户银行
 * @property {string} account - 银行账号
 * @property {string} status - 状态 (active/inactive)
 * @property {string} rating - 评级 (A/B/C/D)
 * @property {number} totalPurchases - 累计采购额
 * @property {number} orderCount - 订单数量
 * @property {string} lastOrderDate - 最近订单日期
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{suppliers: Supplier[], filteredSuppliers: Supplier[], filters: {name: string, status: string, rating: string}, stats: {total: number, active: number, inactive: number, aCount: number, bCount: number, cCount: number, dCount: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    suppliers: [],
    filteredSuppliers: [],
    filters: {
        name: '',
        status: '',
        rating: ''
    },
    stats: {
        total: 0,
        active: 0,
        inactive: 0,
        aCount: 0,
        bCount: 0,
        cCount: 0,
        dCount: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 评级配置
 */
const RATING_MAP = {
    A: { label: 'A级', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-star' },
    B: { label: 'B级', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-star-half-alt' },
    C: { label: 'C级', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-star' },
    D: { label: 'D级', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-star' }
};

/**
 * @private
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
}

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
 * @returns {Supplier[]} 模拟供应商数据
 */
function getMockSuppliers() {
    const names = ['供应商A', '供应商B', '供应商C', '供应商D', '供应商E', '供应商F'];
    const contacts = ['张经理', '李主管', '王总监', '刘经理', '陈主管', '赵总监'];
    const ratings = ['A', 'B', 'C', 'D', 'A', 'B'];
    const statuses = ['active', 'active', 'inactive', 'active', 'active', 'inactive'];
    const amounts = [150000, 98000, 45000, 120000, 200000, 32000];
    
    return names.map((name, i) => ({
        id: `SUP-${String(i + 1).padStart(6, '0')}`,
        code: `SUP${String(1000 + i)}`,
        name: name,
        contact: contacts[i],
        phone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        email: `supplier${i + 1}@example.com`,
        address: `深圳市${['南山区', '福田区', '罗湖区', '宝安区', '龙岗区', '盐田区'][i]}路${i + 1}号`,
        taxId: `91440300MA5${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
        bank: ['中国银行', '工商银行', '建设银行', '招商银行'][i % 4],
        account: `6222${String(Math.floor(Math.random() * 1000000000)).padStart(10, '0')}`,
        status: statuses[i],
        rating: ratings[i],
        totalPurchases: amounts[i],
        orderCount: Math.floor(Math.random() * 50) + 5,
        lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        note: '',
        createdAt: new Date(Date.now() - (30 + Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

/**
 * @private
 * @description 加载供应商数据
 */
function loadSuppliers() {
    try {
        const saved = localStorage.getItem('supplier_data');
        if (saved) {
            state.suppliers = JSON.parse(saved);
        } else {
            state.suppliers = getMockSuppliers();
            localStorage.setItem('supplier_data', JSON.stringify(state.suppliers));
        }
    } catch (e) {
        console.warn('加载供应商数据失败:', e);
        state.suppliers = getMockSuppliers();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存供应商数据
 */
function saveSuppliers() {
    try {
        localStorage.setItem('supplier_data', JSON.stringify(state.suppliers));
    } catch (e) {
        console.warn('保存供应商数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.suppliers;
    
    if (state.filters.name) {
        const name = state.filters.name.toLowerCase();
        filtered = filtered.filter(s => s.name.toLowerCase().includes(name) || s.code.toLowerCase().includes(name));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(s => s.status === state.filters.status);
    }
    
    if (state.filters.rating) {
        filtered = filtered.filter(s => s.rating === state.filters.rating);
    }
    
    state.filteredSuppliers = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.suppliers.length;
    const active = state.suppliers.filter(s => s.status === 'active').length;
    const inactive = state.suppliers.filter(s => s.status === 'inactive').length;
    const aCount = state.suppliers.filter(s => s.rating === 'A').length;
    const bCount = state.suppliers.filter(s => s.rating === 'B').length;
    const cCount = state.suppliers.filter(s => s.rating === 'C').length;
    const dCount = state.suppliers.filter(s => s.rating === 'D').length;
    
    state.stats = { total, active, inactive, aCount, bCount, cCount, dCount };
}

/**
 * @private
 * @description 渲染供应商列表
 */
function render() {
    const tbody = document.getElementById('supplierListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredSuppliers.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-building" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无供应商数据
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        active: { label: '启用', color: '#D1FAE5', textColor: '#065F46' },
        inactive: { label: '停用', color: '#FEE2E2', textColor: '#991B1B' }
    };

    tbody.innerHTML = pageData.map(s => {
        const rating = RATING_MAP[s.rating] || RATING_MAP.C;
        const status = statusMap[s.status] || statusMap.inactive;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${s.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${s.code}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${s.contact}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${s.phone}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;">
                    ¥${formatCurrency(s.totalPurchases)}
                </td>
                <td style="padding:10px 16px;text-align:center;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${rating.color};color:${rating.textColor};">
                        <i class="fas ${rating.icon}" style="margin-right:4px;"></i>
                        ${rating.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(s.lastOrderDate)}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.SuppliersModule.editSupplier('${s.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.SuppliersModule.viewSupplier('${s.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.SuppliersModule.deleteSupplier('${s.id}')" title="删除">
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
    const stats = state.stats;
    
    document.getElementById('statTotal')?.textContent = stats.total;
    document.getElementById('statActive')?.textContent = stats.active;
    document.getElementById('statInactive')?.textContent = stats.inactive;
    document.getElementById('statARating')?.textContent = stats.aCount;
    document.getElementById('statBRating')?.textContent = stats.bCount;
    document.getElementById('statCRating')?.textContent = stats.cCount;
    document.getElementById('statDRating')?.textContent = stats.dCount;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredSuppliers.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 家供应商
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 家，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SuppliersModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SuppliersModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredSuppliers.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 供应商ID
 */
function viewSupplier(id) {
    const supplier = state.suppliers.find(s => s.id === id);
    if (!supplier) {
        showToast('供应商不存在', 'error');
        return;
    }
    
    const rating = RATING_MAP[supplier.rating] || RATING_MAP.C;
    const statusMap = { active: '启用', inactive: '停用' };
    
    alert(`供应商详情：
名称: ${supplier.name}
编码: ${supplier.code}
联系人: ${supplier.contact}
电话: ${supplier.phone}
邮箱: ${supplier.email}
地址: ${supplier.address}
税号: ${supplier.taxId}
开户银行: ${supplier.bank}
银行账号: ${supplier.account}
评级: ${rating.label}
状态: ${statusMap[supplier.status] || supplier.status}
累计采购: ¥${formatCurrency(supplier.totalPurchases)}
订单数量: ${supplier.orderCount}
最近订单: ${formatDate(supplier.lastOrderDate)}
备注: ${supplier.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 供应商ID
 */
function editSupplier(id) {
    const supplier = state.suppliers.find(s => s.id === id);
    if (!supplier) {
        showToast('供应商不存在', 'error');
        return;
    }
    
    const name = prompt('供应商名称：', supplier.name);
    if (name === null) return;
    const contact = prompt('联系人：', supplier.contact) || supplier.contact;
    const phone = prompt('电话：', supplier.phone) || supplier.phone;
    const ratingOptions = ['1. A', '2. B', '3. C', '4. D'];
    const ratingIdx = parseInt(prompt(`选择评级：\n${ratingOptions.join('\n')}`, 
        supplier.rating === 'A' ? '1' : supplier.rating === 'B' ? '2' : supplier.rating === 'C' ? '3' : '4'));
    const ratings = ['A', 'B', 'C', 'D'];
    const rating = ratings[ratingIdx - 1] || supplier.rating;
    const status = confirm('是否启用？');
    const note = prompt('备注：', supplier.note || '') || '';
    
    supplier.name = name.trim() || supplier.name;
    supplier.contact = contact;
    supplier.phone = phone;
    supplier.rating = rating;
    supplier.status = status ? 'active' : 'inactive';
    supplier.note = note;
    supplier.updatedAt = new Date().toISOString();
    
    saveSuppliers();
    applyFilters();
    render();
    showToast('供应商已更新', 'success');
}

/**
 * @private
 * @param {string} id - 供应商ID
 */
function deleteSupplier(id) {
    const supplier = state.suppliers.find(s => s.id === id);
    if (!supplier) {
        showToast('供应商不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除供应商 "${supplier.name}"？`)) return;
    
    state.suppliers = state.suppliers.filter(s => s.id !== id);
    saveSuppliers();
    applyFilters();
    render();
    showToast('供应商已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const name = prompt('供应商名称：');
    if (!name) return;
    const code = prompt('供应商编码：', `SUP${String(Math.floor(Math.random() * 9000) + 1000)}`) || '';
    const contact = prompt('联系人：') || '';
    const phone = prompt('电话：', '13800000000') || '13800000000';
    const ratingOptions = ['1. A', '2. B', '3. C', '4. D'];
    const ratingIdx = parseInt(prompt(`选择评级：\n${ratingOptions.join('\n')}`, '1'));
    const ratings = ['A', 'B', 'C', 'D'];
    const rating = ratings[ratingIdx - 1] || 'B';
    const status = confirm('是否启用？');
    const note = prompt('备注：') || '';
    
    const newSupplier = {
        id: 'SUP-' + Date.now().toString().slice(-6),
        code: code.trim() || `SUP${String(Math.floor(Math.random() * 9000) + 1000)}`,
        name: name.trim(),
        contact: contact,
        phone: phone,
        email: '',
        address: '',
        taxId: '',
        bank: '',
        account: '',
        status: status ? 'active' : 'inactive',
        rating: rating,
        totalPurchases: 0,
        orderCount: 0,
        lastOrderDate: '',
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.suppliers.push(newSupplier);
    saveSuppliers();
    applyFilters();
    render();
    showToast('供应商已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.rating = document.getElementById('searchRating')?.value || '';
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
    const ratingInput = document.getElementById('searchRating');
    
    if (nameInput) nameInput.value = '';
    if (statusInput) statusInput.value = '';
    if (ratingInput) ratingInput.value = '';
    
    state.filters = { name: '', status: '', rating: '' };
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
    
    document.querySelectorAll('#searchName, #searchStatus, #searchRating').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('🏢 供应商管理 初始化...');
    
    if (options?.data) {
        state.suppliers = options.data;
        localStorage.setItem('supplier_data', JSON.stringify(state.suppliers));
    }
    
    loadSuppliers();
    bindEvents();
    render();
    
    window.SuppliersModule = {
        state,
        loadSuppliers,
        render,
        renderPagination,
        updateStats,
        viewSupplier,
        editSupplier,
        deleteSupplier,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveSuppliers,
        applyFilters
    };
    
    console.log('✅ 供应商管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadSuppliers,
    viewSupplier,
    editSupplier,
    deleteSupplier,
    goToPage,
    showCreateModal,
    saveSuppliers
};