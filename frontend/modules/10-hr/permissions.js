/**
 * @file permissions.js
 * @module permissions
 * @description 权限管理 - 员工角色和权限配置
 * 
 * @example
 * import { init } from './permissions.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Permission
 * @property {string} id - 权限ID
 * @property {string} name - 权限名称
 * @property {string} module - 所属模块
 * @property {string} action - 操作 (view/create/edit/delete)
 * @property {string} description - 权限描述
 * @property {string} status - 状态 (active/inactive)
 * @property {string} createdAt - 创建时间
 */

/**
 * @typedef {Object} Role
 * @property {string} id - 角色ID
 * @property {string} name - 角色名称
 * @property {string} [description] - 角色描述
 * @property {string[]} permissions - 权限列表
 * @property {number} employeeCount - 员工数量
 * @property {string} status - 状态 (active/inactive)
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} PermissionState
 * @property {Role[]} roles - 角色列表
 * @property {Permission[]} permissions - 权限列表
 * @property {Object} filters - 筛选条件
 * @property {number} page - 页码
 * @property {number} pageSize - 每页数量
 * @property {string|null} editingRoleId - 编辑中的角色ID
 * @property {boolean} loading - 加载状态
 */

/** @type {PermissionState} 状态 */
const state = {
    roles: [],
    permissions: [],
    filters: {
        name: '',
        module: '',
        status: ''
    },
    page: 1,
    pageSize: 10,
    editingRoleId: null,
    loading: false
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
 * @returns {{roles: Role[], permissions: Permission[]}} 模拟权限数据
 */
function getMockData() {
    const permissions = [
        { id: 'PERM-001', name: '查看仪表板', module: 'dashboard', action: 'view', description: '查看仪表板数据', status: 'active', createdAt: new Date().toISOString() },
        { id: 'PERM-002', name: '管理订单', module: 'orders', action: 'edit', description: '创建、编辑、删除订单', status: 'active', createdAt: new Date().toISOString() },
        { id: 'PERM-003', name: '查看订单', module: 'orders', action: 'view', description: '查看订单列表', status: 'active', createdAt: new Date().toISOString() },
        { id: 'PERM-004', name: '管理商品', module: 'products', action: 'edit', description: '创建、编辑、删除商品', status: 'active', createdAt: new Date().toISOString() },
        { id: 'PERM-005', name: '查看商品', module: 'products', action: 'view', description: '查看商品列表', status: 'active', createdAt: new Date().toISOString() },
        { id: 'PERM-006', name: '管理客户', module: 'customers', action: 'edit', description: '创建、编辑、删除客户', status: 'active', createdAt: new Date().toISOString() },
        { id: 'PERM-007', name: '查看客户', module: 'customers', action: 'view', description: '查看客户列表', status: 'active', createdAt: new Date().toISOString() },
        { id: 'PERM-008', name: '管理员工', module: 'hr', action: 'edit', description: '创建、编辑、删除员工', status: 'active', createdAt: new Date().toISOString() },
        { id: 'PERM-009', name: '查看员工', module: 'hr', action: 'view', description: '查看员工列表', status: 'active', createdAt: new Date().toISOString() },
        { id: 'PERM-010', name: '查看报表', module: 'reports', action: 'view', description: '查看所有报表', status: 'active', createdAt: new Date().toISOString() },
        { id: 'PERM-011', name: '导出数据', module: 'reports', action: 'export', description: '导出报表数据', status: 'active', createdAt: new Date().toISOString() },
        { id: 'PERM-012', name: '系统设置', module: 'settings', action: 'edit', description: '修改系统设置', status: 'inactive', createdAt: new Date().toISOString() }
    ];

    const roles = [
        { id: 'ROLE-001', name: '管理员', description: '系统管理员，拥有所有权限', permissions: permissions.map(p => p.id), employeeCount: 2, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'ROLE-002', name: '经理', description: '部门经理，拥有业务管理权限', permissions: ['PERM-001', 'PERM-002', 'PERM-003', 'PERM-006', 'PERM-007', 'PERM-009', 'PERM-010'], employeeCount: 3, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'ROLE-003', name: '员工', description: '普通员工，基础操作权限', permissions: ['PERM-001', 'PERM-003', 'PERM-005', 'PERM-007', 'PERM-009'], employeeCount: 8, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'ROLE-004', name: '实习生', description: '实习生，只读权限', permissions: ['PERM-001', 'PERM-003', 'PERM-005', 'PERM-007'], employeeCount: 2, status: 'inactive', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];

    return { roles, permissions };
}

/**
 * @private
 * @description 加载权限数据
 */
function loadPermissions() {
    state.loading = true;
    
    try {
        const savedRoles = localStorage.getItem('role_data');
        const savedPermissions = localStorage.getItem('permission_data');
        
        if (savedRoles && savedPermissions) {
            state.roles = JSON.parse(savedRoles);
            state.permissions = JSON.parse(savedPermissions);
        } else {
            const data = getMockData();
            state.roles = data.roles;
            state.permissions = data.permissions;
            localStorage.setItem('role_data', JSON.stringify(data.roles));
            localStorage.setItem('permission_data', JSON.stringify(data.permissions));
        }
    } catch (e) {
        console.warn('加载权限数据失败:', e);
        const data = getMockData();
        state.roles = data.roles;
        state.permissions = data.permissions;
    }
    
    state.loading = false;
    applyFilters();
}

/**
 * @private
 * @description 保存权限数据
 */
function savePermissions() {
    try {
        localStorage.setItem('role_data', JSON.stringify(state.roles));
        localStorage.setItem('permission_data', JSON.stringify(state.permissions));
    } catch (e) {
        console.warn('保存权限数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.roles;
    
    if (state.filters.name) {
        const name = state.filters.name.toLowerCase();
        filtered = filtered.filter(r => r.name.toLowerCase().includes(name));
    }
    
    if (state.filters.module) {
        // 根据模块筛选角色（检查角色是否包含该模块的权限）
        const modulePerms = state.permissions
            .filter(p => p.module === state.filters.module)
            .map(p => p.id);
        filtered = filtered.filter(r => 
            r.permissions.some(p => modulePerms.includes(p))
        );
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    state.filteredRoles = filtered;
    render();
    updateStats();
    renderPagination();
}

/**
 * @private
 * @description 渲染角色列表
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
                    <i class="fas fa-lock" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    ${state.loading ? '加载中...' : '暂无角色数据'}
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        active: { label: '启用', color: '#D1FAE5', textColor: '#065F46' },
        inactive: { label: '停用', color: '#FEE2E2', textColor: '#991B1B' }
    };

    tbody.innerHTML = pageData.map(r => {
        const status = statusMap[r.status] || statusMap.inactive;
        const permCount = r.permissions ? r.permissions.length : 0;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${r.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${r.description || ''}</div>
                </td>
                <td style="padding:10px 16px;text-align:center;font-weight:600;">${permCount}</td>
                <td style="padding:10px 16px;text-align:center;">${r.employeeCount || 0}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(r.createdAt)}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.PermissionsModule.editRole('${r.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.PermissionsModule.viewRole('${r.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.PermissionsModule.deleteRole('${r.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * @private
 * @description 更新统计
 */
function updateStats() {
    const total = state.roles.length;
    const active = state.roles.filter(r => r.status === 'active').length;
    const inactive = state.roles.filter(r => r.status === 'inactive').length;
    const totalPermissions = state.permissions.length;
    const activePermissions = state.permissions.filter(p => p.status === 'active').length;
    
    document.getElementById('statTotalRoles')?.textContent = total;
    document.getElementById('statActiveRoles')?.textContent = active;
    document.getElementById('statInactiveRoles')?.textContent = inactive;
    document.getElementById('statTotalPermissions')?.textContent = totalPermissions;
    document.getElementById('statActivePermissions')?.textContent = activePermissions;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredRoles.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 个角色
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.PermissionsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.PermissionsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredRoles.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 角色ID
 */
function viewRole(id) {
    const role = state.roles.find(r => r.id === id);
    if (!role) {
        showToast('角色不存在', 'error');
        return;
    }
    
    const statusMap = { active: '启用', inactive: '停用' };
    const permNames = role.permissions
        .map(p => {
            const perm = state.permissions.find(pm => pm.id === p);
            return perm ? `${perm.module}.${perm.action}` : p;
        })
        .join(', ');
    
    alert(`角色详情：
名称: ${role.name}
描述: ${role.description || '无'}
状态: ${statusMap[role.status] || role.status}
权限数量: ${role.permissions.length}
员工数量: ${role.employeeCount || 0}
权限列表: ${permNames || '无'}`);
}

/**
 * @private
 * @param {string} id - 角色ID
 */
function editRole(id) {
    const role = state.roles.find(r => r.id === id);
    if (!role) {
        showToast('角色不存在', 'error');
        return;
    }
    
    const name = prompt('角色名称：', role.name);
    if (name === null) return;
    const description = prompt('角色描述：', role.description || '') || '';
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"停用');
    
    role.name = name.trim() || role.name;
    role.description = description;
    role.status = status ? 'active' : 'inactive';
    role.updatedAt = new Date().toISOString();
    
    savePermissions();
    applyFilters();
    render();
    showToast('角色已更新', 'success');
}

/**
 * @private
 * @param {string} id - 角色ID
 */
function deleteRole(id) {
    const role = state.roles.find(r => r.id === id);
    if (!role) {
        showToast('角色不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除角色 "${role.name}"？`)) return;
    
    state.roles = state.roles.filter(r => r.id !== id);
    savePermissions();
    applyFilters();
    render();
    showToast('角色已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const name = prompt('角色名称：');
    if (!name) return;
    const description = prompt('角色描述：') || '';
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"停用');
    
    // 选择权限
    const permOptions = state.permissions
        .filter(p => p.status === 'active')
        .map((p, i) => `${i + 1}. ${p.name} (${p.module}.${p.action})`)
        .join('\n');
    const permIndices = prompt(`选择权限（输入编号，用逗号分隔）：\n${permOptions}`);
    const permissions = [];
    if (permIndices) {
        const indices = permIndices.split(',').map(s => parseInt(s.trim()) - 1);
        const activePerms = state.permissions.filter(p => p.status === 'active');
        indices.forEach(i => {
            if (i >= 0 && i < activePerms.length) {
                permissions.push(activePerms[i].id);
            }
        });
    }
    
    const newRole = {
        id: 'ROLE-' + Date.now().toString().slice(-6),
        name: name.trim(),
        description: description,
        permissions: permissions,
        employeeCount: 0,
        status: status ? 'active' : 'inactive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.roles.push(newRole);
    savePermissions();
    applyFilters();
    render();
    showToast('角色已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.module = document.getElementById('searchModule')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    applyFilters();
}

/**
 * @private
 */
function handleReset() {
    const nameInput = document.getElementById('searchName');
    const moduleInput = document.getElementById('searchModule');
    const statusInput = document.getElementById('searchStatus');
    
    if (nameInput) nameInput.value = '';
    if (moduleInput) moduleInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { name: '', module: '', status: '' };
    state.page = 1;
    applyFilters();
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
    
    document.querySelectorAll('#searchName, #searchModule, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('🔐 权限管理 初始化...');
    
    if (options?.data) {
        state.roles = options.data.roles || [];
        state.permissions = options.data.permissions || [];
        localStorage.setItem('role_data', JSON.stringify(state.roles));
        localStorage.setItem('permission_data', JSON.stringify(state.permissions));
    }
    
    loadPermissions();
    bindEvents();
    render();
    
    window.PermissionsModule = {
        state,
        loadPermissions,
        render,
        renderPagination,
        updateStats,
        viewRole,
        editRole,
        deleteRole,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        savePermissions,
        applyFilters
    };
    
    console.log('✅ 权限管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadPermissions,
    viewRole,
    editRole,
    deleteRole,
    goToPage,
    showCreateModal,
    savePermissions
};