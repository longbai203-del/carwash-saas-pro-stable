/**
 * @file tenants.js
 * @module tenants
 * @description 租户管理 - 多租户的CRUD操作
 * 
 * @example
 * import { init } from './tenants.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Tenant
 * @property {string} id - 租户ID
 * @property {string} code - 租户编码
 * @property {string} name - 租户名称
 * @property {string} contact - 联系人
 * @property {string} phone - 联系电话
 * @property {string} email - 邮箱
 * @property {string} address - 地址
 * @property {string} status - 状态 (active/inactive/suspended)
 * @property {string} plan - 套餐 (basic/pro/enterprise)
 * @property {string} dbName - 数据库名称
 * @property {number} userCount - 用户数量
 * @property {number} storageUsed - 已用存储(MB)
 * @property {number} storageLimit - 存储限制(MB)
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 * @property {string} expiredAt - 过期时间
 */

/** @type {{tenants: Tenant[], filteredTenants: Tenant[], filters: {name: string, status: string, plan: string}, stats: {total: number, active: number, inactive: number, suspended: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    tenants: [],
    filteredTenants: [],
    filters: {
        name: '',
        status: '',
        plan: ''
    },
    stats: {
        total: 0,
        active: 0,
        inactive: 0,
        suspended: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    active: { label: '活跃', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    inactive: { label: '未激活', color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-circle' },
    suspended: { label: '已暂停', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-pause-circle' }
};

/**
 * 套餐配置
 */
const PLAN_MAP = {
    basic: { label: '基础版', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-star' },
    pro: { label: '专业版', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-star-half-alt' },
    enterprise: { label: '企业版', color: '#EDE9FE', textColor: '#6D28D9', icon: 'fa-crown' }
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
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的存储大小
 */
function formatStorage(bytes) {
    if (bytes === undefined || bytes === null) return '0 MB';
    if (bytes < 1024) return bytes + ' MB';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' GB';
    return (bytes / 1024 / 1024).toFixed(1) + ' TB';
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
 * @returns {Tenant[]} 模拟租户数据
 */
function getMockTenants() {
    const names = ['洗车店A', '洗车店B', '洗车店C', '洗车店D', '洗车店E', '洗车店F'];
    const statuses = ['active', 'active', 'inactive', 'active', 'suspended', 'active'];
    const plans = ['basic', 'pro', 'enterprise', 'pro', 'basic', 'enterprise'];
    const contacts = ['张经理', '李主管', '王总监', '刘经理', '陈主管', '赵总监'];
    
    return names.map((name, i) => {
        const storageUsed = Math.floor(Math.random() * 500) + 50;
        const storageLimit = [500, 1000, 5000][i % 3];
        return {
            id: `TEN-${String(i + 1).padStart(6, '0')}`,
            code: `TEN${String(1000 + i)}`,
            name: name,
            contact: contacts[i],
            phone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
            email: `tenant${i + 1}@carwash.com`,
            address: `深圳市${['南山区', '福田区', '罗湖区', '宝安区', '龙岗区', '盐田区'][i]}路${i + 1}号`,
            status: statuses[i],
            plan: plans[i],
            dbName: `db_tenant_${i + 1}`,
            userCount: Math.floor(Math.random() * 20) + 3,
            storageUsed: storageUsed,
            storageLimit: storageLimit,
            createdAt: new Date(Date.now() - (30 + Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            expiredAt: new Date(Date.now() + (90 + Math.random() * 180) * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载租户数据
 */
function loadTenants() {
    try {
        const saved = localStorage.getItem('tenant_data');
        if (saved) {
            state.tenants = JSON.parse(saved);
        } else {
            state.tenants = getMockTenants();
            localStorage.setItem('tenant_data', JSON.stringify(state.tenants));
        }
    } catch (e) {
        console.warn('加载租户数据失败:', e);
        state.tenants = getMockTenants();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存租户数据
 */
function saveTenants() {
    try {
        localStorage.setItem('tenant_data', JSON.stringify(state.tenants));
    } catch (e) {
        console.warn('保存租户数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.tenants;
    
    if (state.filters.name) {
        const name = state.filters.name.toLowerCase();
        filtered = filtered.filter(t => t.name.toLowerCase().includes(name) || t.code.toLowerCase().includes(name));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(t => t.status === state.filters.status);
    }
    
    if (state.filters.plan) {
        filtered = filtered.filter(t => t.plan === state.filters.plan);
    }
    
    state.filteredTenants = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.tenants.length;
    const active = state.tenants.filter(t => t.status === 'active').length;
    const inactive = state.tenants.filter(t => t.status === 'inactive').length;
    const suspended = state.tenants.filter(t => t.status === 'suspended').length;
    
    state.stats = { total, active, inactive, suspended };
}

/**
 * @private
 * @description 渲染租户列表
 */
function render() {
    const tbody = document.getElementById('tenantListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredTenants.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-building" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无租户数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(t => {
        const status = STATUS_MAP[t.status] || STATUS_MAP.inactive;
        const plan = PLAN_MAP[t.plan] || PLAN_MAP.basic;
        const storagePercent = t.storageLimit > 0 ? Math.round((t.storageUsed / t.storageLimit) * 100) : 0;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${t.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${t.code}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${t.contact}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${t.phone}</td>
                <td style="padding:10px 16px;text-align:center;font-weight:600;">${formatNumber(t.userCount)}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${plan.color};color:${plan.textColor};">
                        <i class="fas ${plan.icon}" style="margin-right:4px;"></i>
                        ${plan.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="flex:1;height:6px;background:#F3F4F6;border-radius:9999px;overflow:hidden;min-width:60px;">
                            <div style="height:100%;background:${storagePercent > 80 ? '#EF4444' : storagePercent > 50 ? '#F59E0B' : '#10B981'};border-radius:9999px;width:${Math.min(storagePercent, 100)}%;"></div>
                        </div>
                        <span style="font-size:11px;color:#6B7280;">${storagePercent}%</span>
                    </div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.TenantsModule.editTenant('${t.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.TenantsModule.viewTenant('${t.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.TenantsModule.deleteTenant('${t.id}')" title="删除">
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
    document.getElementById('statSuspended')?.textContent = stats.suspended;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredTenants.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 个租户
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.TenantsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.TenantsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredTenants.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 租户ID
 */
function viewTenant(id) {
    const tenant = state.tenants.find(t => t.id === id);
    if (!tenant) {
        showToast('租户不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[tenant.status] || STATUS_MAP.inactive;
    const plan = PLAN_MAP[tenant.plan] || PLAN_MAP.basic;
    const storagePercent = tenant.storageLimit > 0 ? Math.round((tenant.storageUsed / tenant.storageLimit) * 100) : 0;
    
    alert(`租户详情：
名称: ${tenant.name}
编码: ${tenant.code}
联系人: ${tenant.contact}
电话: ${tenant.phone}
邮箱: ${tenant.email}
地址: ${tenant.address}
状态: ${status.label}
套餐: ${plan.label}
数据库: ${tenant.dbName}
用户数: ${formatNumber(tenant.userCount)}
存储: ${formatStorage(tenant.storageUsed)} / ${formatStorage(tenant.storageLimit)} (${storagePercent}%)
创建时间: ${formatDate(tenant.createdAt)}
过期时间: ${formatDate(tenant.expiredAt)}`);
}

/**
 * @private
 * @param {string} id - 租户ID
 */
function editTenant(id) {
    const tenant = state.tenants.find(t => t.id === id);
    if (!tenant) {
        showToast('租户不存在', 'error');
        return;
    }
    
    const name = prompt('租户名称：', tenant.name);
    if (name === null) return;
    const contact = prompt('联系人：', tenant.contact) || tenant.contact;
    const phone = prompt('电话：', tenant.phone) || tenant.phone;
    const planOptions = ['1. basic (基础版)', '2. pro (专业版)', '3. enterprise (企业版)'];
    const planIdx = parseInt(prompt(`选择套餐：\n${planOptions.join('\n')}`, 
        tenant.plan === 'basic' ? '1' : tenant.plan === 'pro' ? '2' : '3'));
    const plans = ['basic', 'pro', 'enterprise'];
    const plan = plans[planIdx - 1] || tenant.plan;
    const statusOptions = ['1. active (活跃)', '2. inactive (未激活)', '3. suspended (已暂停)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, 
        tenant.status === 'active' ? '1' : tenant.status === 'inactive' ? '2' : '3'));
    const statuses = ['active', 'inactive', 'suspended'];
    const status = statuses[statusIdx - 1] || tenant.status;
    
    tenant.name = name.trim() || tenant.name;
    tenant.contact = contact;
    tenant.phone = phone;
    tenant.plan = plan;
    tenant.status = status;
    tenant.updatedAt = new Date().toISOString();
    
    saveTenants();
    applyFilters();
    render();
    showToast('租户已更新', 'success');
}

/**
 * @private
 * @param {string} id - 租户ID
 */
function deleteTenant(id) {
    const tenant = state.tenants.find(t => t.id === id);
    if (!tenant) {
        showToast('租户不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除租户 "${tenant.name}"？此操作不可恢复！`)) return;
    
    state.tenants = state.tenants.filter(t => t.id !== id);
    saveTenants();
    applyFilters();
    render();
    showToast('租户已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const name = prompt('租户名称：');
    if (!name) return;
    const code = prompt('租户编码：', `TEN${String(Math.floor(Math.random() * 9000) + 1000)}`) || '';
    const contact = prompt('联系人：') || '';
    const phone = prompt('电话：', '13800000000') || '13800000000';
    const planOptions = ['1. basic (基础版)', '2. pro (专业版)', '3. enterprise (企业版)'];
    const planIdx = parseInt(prompt(`选择套餐：\n${planOptions.join('\n')}`, '1'));
    const plans = ['basic', 'pro', 'enterprise'];
    const plan = plans[planIdx - 1] || 'basic';
    const status = confirm('是否激活？');
    
    const newTenant = {
        id: 'TEN-' + Date.now().toString().slice(-6),
        code: code.trim() || `TEN${String(Math.floor(Math.random() * 9000) + 1000)}`,
        name: name.trim(),
        contact: contact,
        phone: phone,
        email: '',
        address: '',
        status: status ? 'active' : 'inactive',
        plan: plan,
        dbName: `db_tenant_${Date.now().toString().slice(-6)}`,
        userCount: 0,
        storageUsed: 0,
        storageLimit: plan === 'basic' ? 500 : plan === 'pro' ? 1000 : 5000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiredAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    state.tenants.push(newTenant);
    saveTenants();
    applyFilters();
    render();
    showToast('租户已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.plan = document.getElementById('searchPlan')?.value || '';
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
    const planInput = document.getElementById('searchPlan');
    
    if (nameInput) nameInput.value = '';
    if (statusInput) statusInput.value = '';
    if (planInput) planInput.value = '';
    
    state.filters = { name: '', status: '', plan: '' };
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
    
    document.querySelectorAll('#searchName, #searchStatus, #searchPlan').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('🏢 租户管理 初始化...');
    
    if (options?.data) {
        state.tenants = options.data;
        localStorage.setItem('tenant_data', JSON.stringify(state.tenants));
    }
    
    loadTenants();
    bindEvents();
    render();
    
    window.TenantsModule = {
        state,
        loadTenants,
        render,
        renderPagination,
        updateStats,
        viewTenant,
        editTenant,
        deleteTenant,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveTenants,
        applyFilters
    };
    
    console.log('✅ 租户管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadTenants,
    viewTenant,
    editTenant,
    deleteTenant,
    goToPage,
    showCreateModal,
    saveTenants
};