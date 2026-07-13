/**
 * @file roles.js
 * @module roles
 * @description 角色管理 - 角色定义和权限分配
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Role
 * @property {string} id - 角色ID
 * @property {string} name - 角色名称
 * @property {string} description - 描述
 * @property {string[]} permissions - 权限ID列表
 * @property {number} userCount - 用户数量
 * @property {string} status - 状态 (active/inactive)
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{roles: Role[], filteredRoles: Role[], filters: {name: string, status: string}, page: number, pageSize: number, editingRole: string|null, allPermissions: any[]}} */
const state = {
    roles: [],
    filteredRoles: [],
    filters: { name: '', status: '' },
    page: 1,
    pageSize: 10,
    editingRole: null,
    allPermissions: []
};

/**
 * @private
 */
function getMockRoles() {
    const roleTemplates = [
        { name: '超级管理员', description: '拥有系统所有权限', permissions: ['*'], userCount: 1 },
        { name: '管理员', description: '管理后台所有功能', permissions: ['dashboard:access', 'pos:access', 'orders:access', 'products:access', 'customers:access', 'inventory:access', 'finance:access', 'hr:access', 'system:access'], userCount: 3 },
        { name: '店长', description: '门店日常管理权限', permissions: ['dashboard:access', 'pos:access', 'orders:access', 'products:access', 'customers:access', 'inventory:access'], userCount: 5 },
        { name: '收银员', description: '收银和订单操作权限', permissions: ['pos:access', 'pos:create', 'pos:update', 'orders:access', 'orders:create', 'orders:update', 'customers:read'], userCount: 12 },
        { name: '库存管理员', description: '库存管理权限', permissions: ['inventory:access', 'inventory:create', 'inventory:update', 'inventory:read', 'products:read'], userCount: 4 },
        { name: '财务人员', description: '财务相关权限', permissions: ['finance:access', 'finance:read', 'finance:export', 'reports:access'], userCount: 2 },
        { name: '市场人员', description: '营销活动权限', permissions: ['marketing:access', 'marketing:create', 'marketing:update', 'customers:read'], userCount: 3 },
        { name: '观察员', description: '只读权限', permissions: ['dashboard:access', 'orders:read', 'products:read', 'customers:read', 'reports:read'], userCount: 6 }
    ];
    
    return roleTemplates.map((r, i) => ({
        id: `ROLE-${String(i + 1).padStart(6, '0')}`,
        name: r.name,
        description: r.description,
        permissions: r.permissions,
        userCount: r.userCount,
        status: i === 0 ? 'active' : (Math.random() > 0.15 ? 'active' : 'inactive'),
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
    }));
}

/**
 * @private
 */
function loadRoles() {
    try {
        const saved = localStorage.getItem('system_roles');
        if (saved) {
            state.roles = JSON.parse(saved);
        } else {
            state.roles = getMockRoles();
            localStorage.setItem('system_roles', JSON.stringify(state.roles));
        }
    } catch (e) {
        state.roles = getMockRoles();
    }
    loadAllPermissions();
    applyFilters();
}

/**
 * @private
 */
function loadAllPermissions() {
    try {
        const saved = localStorage.getItem('system_permissions');
        if (saved) {
            state.allPermissions = JSON.parse(saved);
        }
    } catch (e) {
        state.allPermissions = [];
    }
}

/**
 * @private
 */
function saveRoles() {
    try {
        localStorage.setItem('system_roles', JSON.stringify(state.roles));
    } catch (e) {}
}

/**
 * @private
 */
function applyFilters() {
    let filtered = state.roles;
    const f = state.filters;
    
    if (f.name) {
        filtered = filtered.filter(r => r.name.toLowerCase().includes(f.name.toLowerCase()));
    }
    if (f.status) {
        filtered = filtered.filter(r => r.status === f.status);
    }
    
    state.filteredRoles = filtered;
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
 * @param {string[]} perms - 权限列表
 * @returns {string} 权限摘要
 */
function getPermissionsSummary(perms) {
    if (!perms || perms.length === 0) return '无权限';
    if (perms.includes('*')) return '🔓 全部权限';
    if (perms.length > 3) return `${perms.slice(0, 3).join(', ')} +${perms.length - 3}...`;
    return perms.join(', ');
}

/**
 * @private
 */
function render() {
    const tbody = document.getElementById('roleListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRoles.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-user-tag" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无角色数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const status = getStatusStyle(r.status);
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:600;font-size:14px;color:#1F2937;">${r.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${r.id}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">
                    ${r.description || '-'}
                </td>
                <td style="padding:10px 16px;font-size:12px;color:#4B5563;max-width:200px;word-break:break-all;">
                    ${getPermissionsSummary(r.permissions)}
                </td>
                <td style="padding:10px 16px;text-align:center;font-size:14px;font-weight:500;color:#4F46E5;">
                    ${r.userCount}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.SystemRolesModule.editRole('${r.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.SystemRolesModule.toggleStatus('${r.id}')" title="切换状态">
                            <i class="fas ${r.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        ${r.name !== '超级管理员' ? `
                            <button class="btn btn-sm btn-danger" onclick="window.SystemRolesModule.deleteRole('${r.id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : `
                            <span style="font-size:11px;color:#9CA3AF;padding:4px 8px;">系统保护</span>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderPagination();
}

/**
 * @private
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredRoles.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个角色，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SystemRolesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SystemRolesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredRoles.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function createRole() {
    const name = prompt('角色名称：');
    if (!name) return;
    
    const description = prompt('角色描述：') || '';
    
    // 简单权限选择
    const permOptions = state.allPermissions.slice(0, 10).map((p, i) => `${i+1}. ${p.name} (${p.code})`).join('\n');
    const permInput = prompt(`选择权限（用逗号分隔编号，如: 1,3,5）：\n${permOptions}\n\n也可直接输入权限编码，用逗号分隔`);
    
    let permissions = [];
    if (permInput) {
        // 尝试解析编号
        const parts = permInput.split(',').map(s => s.trim());
        const numericParts = parts.filter(p => /^\d+$/.test(p));
        if (numericParts.length > 0) {
            numericParts.forEach(n => {
                const idx = parseInt(n) - 1;
                if (idx >= 0 && idx < state.allPermissions.length) {
                    permissions.push(state.allPermissions[idx].code);
                }
            });
        } else {
            permissions = parts.filter(p => p);
        }
    }
    
    const statusOptions = ['1. active (启用)', '2. inactive (停用)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, '1'));
    const status = statusIdx === 2 ? 'inactive' : 'active';
    
    const newRole = {
        id: `ROLE-${Date.now().toString().slice(-6)}`,
        name: name.trim(),
        description: description,
        permissions: permissions,
        userCount: 0,
        status: status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.roles.push(newRole);
    saveRoles();
    applyFilters();
    render();
    showToast(`✅ 角色 "${newRole.name}" 已创建`, 'success');
}

/**
 * @private
 * @param {string} id - 角色ID
 */
function editRole(id) {
    const role = state.roles.find(r => r.id === id);
    if (!role) { showToast('角色不存在', 'error'); return; }
    
    const newName = prompt('角色名称：', role.name);
    if (!newName) return;
    
    const newDesc = prompt('角色描述：', role.description) || '';
    
    const currentPerms = role.permissions.join(', ');
    const newPermsInput = prompt(`权限编码（用逗号分隔）：\n当前权限: ${currentPerms}`, currentPerms);
    const newPerms = newPermsInput ? newPermsInput.split(',').map(p => p.trim()).filter(p => p) : [];
    
    role.name = newName.trim();
    role.description = newDesc;
    role.permissions = newPerms;
    role.updatedAt = new Date().toISOString();
    
    saveRoles();
    applyFilters();
    render();
    showToast(`✅ 角色 "${role.name}" 已更新`, 'success');
}

/**
 * @private
 * @param {string} id - 角色ID
 */
function toggleStatus(id) {
    const role = state.roles.find(r => r.id === id);
    if (!role) { showToast('角色不存在', 'error'); return; }
    if (role.name === '超级管理员') {
        showToast('超级管理员不能被停用', 'warning');
        return;
    }
    
    role.status = role.status === 'active' ? 'inactive' : 'active';
    role.updatedAt = new Date().toISOString();
    saveRoles();
    applyFilters();
    render();
    showToast(`角色 "${role.name}" 已${role.status === 'active' ? '启用' : '停用'}`, 'success');
}

/**
 * @private
 * @param {string} id - 角色ID
 */
function deleteRole(id) {
    const role = state.roles.find(r => r.id === id);
    if (!role) { showToast('角色不存在', 'error'); return; }
    if (role.name === '超级管理员') {
        showToast('超级管理员不能被删除', 'warning');
        return;
    }
    if (role.userCount > 0) {
        if (!confirm(`角色 "${role.name}" 有 ${role.userCount} 个用户，确认删除？`)) return;
    } else {
        if (!confirm(`确认删除角色 "${role.name}"？`)) return;
    }
    
    state.roles = state.roles.filter(r => r.id !== id);
    saveRoles();
    applyFilters();
    render();
    showToast(`角色 "${role.name}" 已删除`, 'success');
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
    ['searchName', 'searchStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    state.filters = { name: '', status: '' };
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
    document.getElementById('createBtn')?.addEventListener('click', createRole);
    
    document.querySelectorAll('#searchName, #searchStatus').forEach(el => {
        el?.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 */
export async function init(options) {
    console.log('👤 角色管理 初始化...');
    loadRoles();
    bindEvents();
    render();
    
    window.SystemRolesModule = {
        state,
        loadRoles,
        saveRoles,
        render,
        renderPagination,
        goToPage,
        createRole,
        editRole,
        toggleStatus,
        deleteRole,
        handleSearch,
        handleReset,
        applyFilters
    };
    
    console.log('✅ 角色管理 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadRoles,
    saveRoles,
    createRole,
    editRole,
    toggleStatus,
    deleteRole,
    goToPage
};