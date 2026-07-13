/**
 * @file permissions.js
 * @module permissions
 * @description 权限管理 - 细粒度权限控制和权限矩阵
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Permission
 * @property {string} id - 权限ID
 * @property {string} name - 权限名称
 * @property {string} code - 权限编码
 * @property {string} module - 所属模块
 * @property {string} description - 描述
 * @property {string} type - 类型 (menu/action/data)
 * @property {string} status - 状态 (active/inactive)
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{permissions: Permission[], filteredPermissions: Permission[], filters: {name: string, module: string, type: string, status: string}, page: number, pageSize: number, selectedPermissions: Set}} */
const state = {
    permissions: [],
    filteredPermissions: [],
    filters: { name: '', module: '', type: '', status: '' },
    page: 1,
    pageSize: 15,
    selectedPermissions: new Set()
};

/**
 * @private
 */
function getMockPermissions() {
    const modules = ['dashboard', 'pos', 'orders', 'products', 'customers', 'marketing', 'inventory', 'finance', 'hr', 'saas', 'system', 'analytics'];
    const types = ['menu', 'action', 'data'];
    const moduleNames = {
        dashboard: '仪表盘',
        pos: 'POS收银',
        orders: '订单管理',
        products: '商品管理',
        customers: '客户管理',
        marketing: '营销管理',
        inventory: '库存管理',
        finance: '财务管理',
        hr: '人力资源',
        saas: '多租户管理',
        system: '系统管理',
        analytics: '数据分析'
    };
    
    const permissionTemplates = [
        { name: '查看', code: 'read', type: 'data' },
        { name: '创建', code: 'create', type: 'action' },
        { name: '编辑', code: 'update', type: 'action' },
        { name: '删除', code: 'delete', type: 'action' },
        { name: '导出', code: 'export', type: 'action' },
        { name: '导入', code: 'import', type: 'action' },
        { name: '审批', code: 'approve', type: 'action' },
        { name: '查看列表', code: 'list', type: 'menu' },
        { name: '查看详情', code: 'detail', type: 'menu' },
        { name: '全部权限', code: '*', type: 'menu' }
    ];
    
    const permissions = [];
    let id = 1;
    
    modules.forEach(module => {
        // 模块菜单权限
        permissions.push({
            id: `PERM-${String(id++).padStart(6, '0')}`,
            name: `访问${moduleNames[module] || module}`,
            code: `${module}:access`,
            module: module,
            description: `允许访问${moduleNames[module] || module}模块`,
            type: 'menu',
            status: 'active',
            createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        // 每个模块取2-4个操作权限
        const count = Math.floor(Math.random() * 3) + 2;
        const shuffled = [...permissionTemplates].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(count, shuffled.length); i++) {
            const t = shuffled[i];
            permissions.push({
                id: `PERM-${String(id++).padStart(6, '0')}`,
                name: `${t.name}${moduleNames[module] || module}`,
                code: `${module}:${t.code}`,
                module: module,
                description: `${t.name}${moduleNames[module] || module}的权限`,
                type: t.type,
                status: Math.random() > 0.2 ? 'active' : 'inactive',
                createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
    });
    
    return permissions;
}

/**
 * @private
 */
function loadPermissions() {
    try {
        const saved = localStorage.getItem('system_permissions');
        if (saved) {
            state.permissions = JSON.parse(saved);
        } else {
            state.permissions = getMockPermissions();
            localStorage.setItem('system_permissions', JSON.stringify(state.permissions));
        }
    } catch (e) {
        state.permissions = getMockPermissions();
    }
    applyFilters();
}

/**
 * @private
 */
function savePermissions() {
    try {
        localStorage.setItem('system_permissions', JSON.stringify(state.permissions));
    } catch (e) {}
}

/**
 * @private
 */
function applyFilters() {
    let filtered = state.permissions;
    const f = state.filters;
    
    if (f.name) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(f.name.toLowerCase()) || p.code.toLowerCase().includes(f.name.toLowerCase()));
    }
    if (f.module) {
        filtered = filtered.filter(p => p.module === f.module);
    }
    if (f.type) {
        filtered = filtered.filter(p => p.type === f.type);
    }
    if (f.status) {
        filtered = filtered.filter(p => p.status === f.status);
    }
    
    state.filteredPermissions = filtered;
}

/**
 * @private
 * @param {string} type - 权限类型
 * @returns {object} 类型样式
 */
function getTypeStyle(type) {
    const map = {
        menu: { color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-folder', label: '菜单' },
        action: { color: '#FEF3C7', textColor: '#92400E', icon: 'fa-bolt', label: '操作' },
        data: { color: '#D1FAE5', textColor: '#065F46', icon: 'fa-database', label: '数据' }
    };
    return map[type] || map.menu;
}

/**
 * @private
 * @param {string} status - 状态
 * @returns {object} 状态样式
 */
function getStatusStyle(status) {
    const map = {
        active: { color: '#D1FAE5', textColor: '#065F46', label: '✅ 启用' },
        inactive: { color: '#F3F4F6', textColor: '#6B7280', label: '⛔ 停用' }
    };
    return map[status] || map.inactive;
}

/**
 * @private
 * @param {string} module - 模块名
 * @returns {string} 模块中文名
 */
function getModuleName(module) {
    const map = {
        dashboard: '仪表盘',
        pos: 'POS收银',
        orders: '订单管理',
        products: '商品管理',
        customers: '客户管理',
        marketing: '营销管理',
        inventory: '库存管理',
        finance: '财务管理',
        hr: '人力资源',
        saas: '多租户管理',
        system: '系统管理',
        analytics: '数据分析'
    };
    return map[module] || module;
}

/**
 * @private
 */
function render() {
    const tbody = document.getElementById('permissionListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredPermissions.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-lock" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无权限数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(p => {
        const type = getTypeStyle(p.type);
        const status = getStatusStyle(p.status);
        const isSelected = state.selectedPermissions.has(p.id);
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;${isSelected ? 'background:#EEF2FF;' : ''}"
                onmouseover="this.style.background='${isSelected ? '#E0E7FF' : '#F9FAFB'}'"
                onmouseout="this.style.background='${isSelected ? '#EEF2FF' : ''}'">
                <td style="padding:8px 12px;">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="window.SystemPermissionsModule.toggleSelect('${p.id}')"
                           style="width:16px;height:16px;cursor:pointer;">
                </td>
                <td style="padding:8px 12px;">
                    <div style="font-weight:500;font-size:13px;">${p.name}</div>
                    <div style="font-size:11px;color:#6B7280;font-family:monospace;">${p.code}</div>
                </td>
                <td style="padding:8px 12px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:500;background:#F3F4F6;color:#4B5563;">
                        ${getModuleName(p.module)}
                    </span>
                </td>
                <td style="padding:8px 12px;">
                    <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        <i class="fas ${type.icon}"></i>
                        ${type.label}
                    </span>
                </td>
                <td style="padding:8px 12px;font-size:13px;color:#6B7280;">${p.description || '-'}</td>
                <td style="padding:8px 12px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:8px 12px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.SystemPermissionsModule.toggleStatus('${p.id}')" title="切换状态">
                            <i class="fas ${p.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.SystemPermissionsModule.deletePermission('${p.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderPagination();
    updateStats();
}

/**
 * @private
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredPermissions.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条权限，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SystemPermissionsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SystemPermissionsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * @private
 */
function updateStats() {
    const total = state.permissions.length;
    const active = state.permissions.filter(p => p.status === 'active').length;
    const inactive = state.permissions.filter(p => p.status === 'inactive').length;
    const menuCount = state.permissions.filter(p => p.type === 'menu').length;
    const actionCount = state.permissions.filter(p => p.type === 'action').length;
    const dataCount = state.permissions.filter(p => p.type === 'data').length;
    
    const el = document.getElementById('permissionStats');
    if (el) {
        el.innerHTML = `
            <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:13px;">
                <span>📊 总计: ${total}</span>
                <span style="color:#065F46;">✅ 启用: ${active}</span>
                <span style="color:#6B7280;">⛔ 停用: ${inactive}</span>
                <span style="color:#1E40AF;">📁 菜单: ${menuCount}</span>
                <span style="color:#92400E;">⚡ 操作: ${actionCount}</span>
                <span style="color:#065F46;">💾 数据: ${dataCount}</span>
            </div>
        `;
    }
}

/**
 * @private
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredPermissions.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 权限ID
 */
function toggleSelect(id) {
    if (state.selectedPermissions.has(id)) {
        state.selectedPermissions.delete(id);
    } else {
        state.selectedPermissions.add(id);
    }
    render();
}

/**
 * @private
 */
function selectAll() {
    const pageIds = state.filteredPermissions.slice(
        (state.page - 1) * state.pageSize,
        state.page * state.pageSize
    ).map(p => p.id);
    
    const allSelected = pageIds.every(id => state.selectedPermissions.has(id));
    
    if (allSelected) {
        pageIds.forEach(id => state.selectedPermissions.delete(id));
    } else {
        pageIds.forEach(id => state.selectedPermissions.add(id));
    }
    render();
}

/**
 * @private
 */
function batchDelete() {
    if (state.selectedPermissions.size === 0) {
        showToast('请先选择要删除的权限', 'warning');
        return;
    }
    
    if (!confirm(`确认删除选中的 ${state.selectedPermissions.size} 条权限？`)) return;
    
    state.permissions = state.permissions.filter(p => !state.selectedPermissions.has(p.id));
    state.selectedPermissions.clear();
    savePermissions();
    applyFilters();
    render();
    showToast(`已删除 ${state.selectedPermissions.size} 条权限`, 'success');
}

/**
 * @private
 */
function toggleStatus(id) {
    const perm = state.permissions.find(p => p.id === id);
    if (!perm) { showToast('权限不存在', 'error'); return; }
    
    perm.status = perm.status === 'active' ? 'inactive' : 'active';
    perm.updatedAt = new Date().toISOString();
    savePermissions();
    applyFilters();
    render();
    showToast(`权限 "${perm.name}" 已${perm.status === 'active' ? '启用' : '停用'}`, 'success');
}

/**
 * @private
 */
function deletePermission(id) {
    const perm = state.permissions.find(p => p.id === id);
    if (!perm) { showToast('权限不存在', 'error'); return; }
    if (!confirm(`确认删除权限 "${perm.name}"？`)) return;
    
    state.permissions = state.permissions.filter(p => p.id !== id);
    state.selectedPermissions.delete(id);
    savePermissions();
    applyFilters();
    render();
    showToast(`权限 "${perm.name}" 已删除`, 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const name = prompt('权限名称：');
    if (!name) return;
    
    const code = prompt('权限编码（如: module:action）：');
    if (!code) return;
    
    const moduleOptions = ['dashboard', 'pos', 'orders', 'products', 'customers', 'marketing', 'inventory', 'finance', 'hr', 'saas', 'system', 'analytics'];
    const moduleIdx = parseInt(prompt(`选择模块：\n${moduleOptions.map((m, i) => `${i+1}. ${getModuleName(m)}`).join('\n')}`, '1'));
    const module = moduleOptions[moduleIdx - 1] || 'system';
    
    const typeOptions = ['1. menu (菜单)', '2. action (操作)', '3. data (数据)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
    const types = ['menu', 'action', 'data'];
    const type = types[typeIdx - 1] || 'menu';
    
    const description = prompt('描述：') || '';
    
    const newPerm = {
        id: `PERM-${Date.now().toString().slice(-6)}`,
        name: name.trim(),
        code: code.trim(),
        module: module,
        description: description,
        type: type,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.permissions.push(newPerm);
    savePermissions();
    applyFilters();
    render();
    showToast(`✅ 权限 "${newPerm.name}" 已创建`, 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.module = document.getElementById('searchModule')?.value || '';
    state.filters.type = document.getElementById('searchType')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    ['searchName', 'searchModule', 'searchType', 'searchStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    state.filters = { name: '', module: '', type: '', status: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreateModal);
    document.getElementById('selectAllBtn')?.addEventListener('click', selectAll);
    document.getElementById('batchDeleteBtn')?.addEventListener('click', batchDelete);
    
    document.querySelectorAll('#searchName, #searchModule, #searchType, #searchStatus').forEach(el => {
        el?.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 */
export async function init(options) {
    console.log('🔐 权限管理 初始化...');
    loadPermissions();
    bindEvents();
    render();
    
    window.SystemPermissionsModule = {
        state,
        loadPermissions,
        savePermissions,
        render,
        renderPagination,
        updateStats,
        goToPage,
        toggleSelect,
        selectAll,
        batchDelete,
        toggleStatus,
        deletePermission,
        showCreateModal,
        handleSearch,
        handleReset,
        applyFilters
    };
    
    console.log('✅ 权限管理 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadPermissions,
    savePermissions,
    showCreateModal,
    toggleStatus,
    deletePermission,
    batchDelete,
    goToPage
};