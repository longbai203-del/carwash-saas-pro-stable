/**
 * @file packages.js
 * @module packages
 * @description 套餐管理 - 服务套餐的CRUD操作
 * 
 * @example
 * import { init } from './packages.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Package
 * @property {string} id - 套餐ID
 * @property {string} name - 套餐名称
 * @property {string} code - 套餐编码
 * @property {string} description - 套餐描述
 * @property {number} price - 价格
 * @property {string} billingCycle - 计费周期 (monthly/quarterly/yearly)
 * @property {string[]} features - 功能列表
 * @property {string} status - 状态 (active/inactive)
 * @property {number} userLimit - 用户数量限制
 * @property {number} storageLimit - 存储限制(MB)
 * @property {number} storeLimit - 门店数量限制
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{packages: Package[], filteredPackages: Package[], filters: {name: string, status: string, billingCycle: string}, stats: {total: number, active: number, inactive: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    packages: [],
    filteredPackages: [],
    filters: {
        name: '',
        status: '',
        billingCycle: ''
    },
    stats: {
        total: 0,
        active: 0,
        inactive: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 计费周期配置
 */
const BILLING_MAP = {
    monthly: { label: '月度', multiplier: 1, color: '#DBEAFE', textColor: '#1E40AF' },
    quarterly: { label: '季度', multiplier: 3, color: '#D1FAE5', textColor: '#065F46' },
    yearly: { label: '年度', multiplier: 12, color: '#EDE9FE', textColor: '#6D28D9' }
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
 * @param {string[]} features - 功能列表
 * @returns {string} 功能列表摘要
 */
function getFeatureSummary(features) {
    if (!features || features.length === 0) return '-';
    if (features.length <= 3) return features.join('、');
    return features.slice(0, 3).join('、') + ` +${features.length - 3}项`;
}

/**
 * @private
 * @returns {Package[]} 模拟套餐数据
 */
function getMockPackages() {
    return [
        { id: 'PKG-001', name: '基础版', code: 'BASIC', description: '适合小型洗车店，基础功能', price: 199, billingCycle: 'monthly', features: ['用户管理', '订单管理', '库存管理', '基础报表'], status: 'active', userLimit: 5, storageLimit: 500, storeLimit: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'PKG-002', name: '专业版', code: 'PRO', description: '适合中型洗车店，完整功能', price: 399, billingCycle: 'monthly', features: ['用户管理', '订单管理', '库存管理', '财务管理', '客户管理', '营销工具', '高级报表', 'API接口'], status: 'active', userLimit: 20, storageLimit: 2000, storeLimit: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'PKG-003', name: '企业版', code: 'ENTERPRISE', description: '适合大型连锁洗车店，全部功能', price: 799, billingCycle: 'monthly', features: ['用户管理', '订单管理', '库存管理', '财务管理', '客户管理', '营销工具', '高级报表', 'API接口', 'AI助手', '多门店管理', '定制开发', '专属客服'], status: 'active', userLimit: 0, storageLimit: 10000, storeLimit: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'PKG-004', name: '季度基础版', code: 'QBASIC', description: '基础版季度订阅', price: 597, billingCycle: 'quarterly', features: ['用户管理', '订单管理', '库存管理', '基础报表'], status: 'inactive', userLimit: 5, storageLimit: 500, storeLimit: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
}

/**
 * @private
 * @description 加载套餐数据
 */
function loadPackages() {
    try {
        const saved = localStorage.getItem('package_data');
        if (saved) {
            state.packages = JSON.parse(saved);
        } else {
            state.packages = getMockPackages();
            localStorage.setItem('package_data', JSON.stringify(state.packages));
        }
    } catch (e) {
        console.warn('加载套餐数据失败:', e);
        state.packages = getMockPackages();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存套餐数据
 */
function savePackages() {
    try {
        localStorage.setItem('package_data', JSON.stringify(state.packages));
    } catch (e) {
        console.warn('保存套餐数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.packages;
    
    if (state.filters.name) {
        const name = state.filters.name.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(name) || p.code.toLowerCase().includes(name));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(p => p.status === state.filters.status);
    }
    
    if (state.filters.billingCycle) {
        filtered = filtered.filter(p => p.billingCycle === state.filters.billingCycle);
    }
    
    state.filteredPackages = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.packages.length;
    const active = state.packages.filter(p => p.status === 'active').length;
    const inactive = state.packages.filter(p => p.status === 'inactive').length;
    
    state.stats = { total, active, inactive };
}

/**
 * @private
 * @description 渲染套餐列表
 */
function render() {
    const tbody = document.getElementById('packageListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredPackages.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-box" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无套餐数据
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        active: { label: '启用', color: '#D1FAE5', textColor: '#065F46' },
        inactive: { label: '停用', color: '#FEE2E2', textColor: '#991B1B' }
    };

    tbody.innerHTML = pageData.map(p => {
        const status = statusMap[p.status] || statusMap.inactive;
        const billing = BILLING_MAP[p.billingCycle] || BILLING_MAP.monthly;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${p.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${p.code}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${p.description || '-'}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#4F46E5;">
                    ¥${formatCurrency(p.price)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${billing.color};color:${billing.textColor};">
                        ${billing.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${getFeatureSummary(p.features)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.PackagesModule.editPackage('${p.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.PackagesModule.viewPackage('${p.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.PackagesModule.deletePackage('${p.id}')" title="删除">
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
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredPackages.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 个套餐
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.PackagesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.PackagesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredPackages.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 套餐ID
 */
function viewPackage(id) {
    const pkg = state.packages.find(p => p.id === id);
    if (!pkg) {
        showToast('套餐不存在', 'error');
        return;
    }
    
    const statusMap = { active: '启用', inactive: '停用' };
    const billing = BILLING_MAP[pkg.billingCycle] || BILLING_MAP.monthly;
    
    alert(`套餐详情：
名称: ${pkg.name}
编码: ${pkg.code}
描述: ${pkg.description || '无'}
价格: ¥${formatCurrency(pkg.price)}
计费周期: ${billing.label}
状态: ${statusMap[pkg.status] || pkg.status}
用户限制: ${pkg.userLimit === 0 ? '无限' : pkg.userLimit}人
存储限制: ${pkg.storageLimit === 0 ? '无限' : pkg.storageLimit + 'MB'}
门店限制: ${pkg.storeLimit === 0 ? '无限' : pkg.storeLimit}家
功能列表: ${(pkg.features || []).join('、') || '无'}`);
}

/**
 * @private
 * @param {string} id - 套餐ID
 */
function editPackage(id) {
    const pkg = state.packages.find(p => p.id === id);
    if (!pkg) {
        showToast('套餐不存在', 'error');
        return;
    }
    
    const name = prompt('套餐名称：', pkg.name);
    if (name === null) return;
    const code = prompt('套餐编码：', pkg.code) || pkg.code;
    const description = prompt('套餐描述：', pkg.description || '') || '';
    const price = parseFloat(prompt('价格：', pkg.price));
    if (isNaN(price) || price < 0) {
        showToast('请输入有效价格', 'error');
        return;
    }
    const billingOptions = ['1. monthly (月度)', '2. quarterly (季度)', '3. yearly (年度)'];
    const billingIdx = parseInt(prompt(`选择计费周期：\n${billingOptions.join('\n')}`, 
        pkg.billingCycle === 'monthly' ? '1' : pkg.billingCycle === 'quarterly' ? '2' : '3'));
    const billingCycles = ['monthly', 'quarterly', 'yearly'];
    const billingCycle = billingCycles[billingIdx - 1] || pkg.billingCycle;
    const userLimit = parseInt(prompt('用户限制（0为无限）：', pkg.userLimit));
    const storageLimit = parseInt(prompt('存储限制MB（0为无限）：', pkg.storageLimit));
    const status = confirm('是否启用？');
    const featuresStr = prompt('功能列表（用逗号分隔）：', (pkg.features || []).join('、')) || '';
    const features = featuresStr.split(/[,，、]/).map(s => s.trim()).filter(s => s);
    
    pkg.name = name.trim() || pkg.name;
    pkg.code = code.trim() || pkg.code;
    pkg.description = description;
    pkg.price = price;
    pkg.billingCycle = billingCycle;
    pkg.userLimit = isNaN(userLimit) ? pkg.userLimit : userLimit;
    pkg.storageLimit = isNaN(storageLimit) ? pkg.storageLimit : storageLimit;
    pkg.status = status ? 'active' : 'inactive';
    pkg.features = features.length > 0 ? features : pkg.features;
    pkg.updatedAt = new Date().toISOString();
    
    savePackages();
    applyFilters();
    render();
    showToast('套餐已更新', 'success');
}

/**
 * @private
 * @param {string} id - 套餐ID
 */
function deletePackage(id) {
    const pkg = state.packages.find(p => p.id === id);
    if (!pkg) {
        showToast('套餐不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除套餐 "${pkg.name}"？`)) return;
    
    state.packages = state.packages.filter(p => p.id !== id);
    savePackages();
    applyFilters();
    render();
    showToast('套餐已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const name = prompt('套餐名称：');
    if (!name) return;
    const code = prompt('套餐编码：', `PKG-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`) || '';
    const description = prompt('套餐描述：') || '';
    const price = parseFloat(prompt('价格：', '199'));
    if (isNaN(price) || price < 0) {
        showToast('请输入有效价格', 'error');
        return;
    }
    const billingOptions = ['1. monthly (月度)', '2. quarterly (季度)', '3. yearly (年度)'];
    const billingIdx = parseInt(prompt(`选择计费周期：\n${billingOptions.join('\n')}`, '1'));
    const billingCycles = ['monthly', 'quarterly', 'yearly'];
    const billingCycle = billingCycles[billingIdx - 1] || 'monthly';
    const userLimit = parseInt(prompt('用户限制（0为无限）：', '5'));
    const storageLimit = parseInt(prompt('存储限制MB（0为无限）：', '500'));
    const storeLimit = parseInt(prompt('门店限制（0为无限）：', '1'));
    const status = confirm('是否启用？');
    const featuresStr = prompt('功能列表（用逗号分隔）：', '用户管理,订单管理,库存管理') || '';
    const features = featuresStr.split(/[,，、]/).map(s => s.trim()).filter(s => s);
    
    const newPackage = {
        id: 'PKG-' + Date.now().toString().slice(-6),
        name: name.trim(),
        code: code.trim() || `PKG-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        description: description,
        price: price,
        billingCycle: billingCycle,
        features: features.length > 0 ? features : ['用户管理', '订单管理'],
        status: status ? 'active' : 'inactive',
        userLimit: isNaN(userLimit) ? 5 : userLimit,
        storageLimit: isNaN(storageLimit) ? 500 : storageLimit,
        storeLimit: isNaN(storeLimit) ? 1 : storeLimit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.packages.push(newPackage);
    savePackages();
    applyFilters();
    render();
    showToast('套餐已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.billingCycle = document.getElementById('searchBilling')?.value || '';
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
    const billingInput = document.getElementById('searchBilling');
    
    if (nameInput) nameInput.value = '';
    if (statusInput) statusInput.value = '';
    if (billingInput) billingInput.value = '';
    
    state.filters = { name: '', status: '', billingCycle: '' };
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
    
    document.querySelectorAll('#searchName, #searchStatus, #searchBilling').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📦 套餐管理 初始化...');
    
    if (options?.data) {
        state.packages = options.data;
        localStorage.setItem('package_data', JSON.stringify(state.packages));
    }
    
    loadPackages();
    bindEvents();
    render();
    
    window.PackagesModule = {
        state,
        loadPackages,
        render,
        renderPagination,
        updateStats,
        viewPackage,
        editPackage,
        deletePackage,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        savePackages,
        applyFilters
    };
    
    console.log('✅ 套餐管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadPackages,
    viewPackage,
    editPackage,
    deletePackage,
    goToPage,
    showCreateModal,
    savePackages
};