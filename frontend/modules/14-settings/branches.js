/**
 * @file branches.js
 * @module branches
 * @description 分支管理 - 门店分支机构管理
 * 
 * @example
 * import { init } from './branches.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Branch
 * @property {string} id - 分支ID
 * @property {string} name - 分支名称
 * @property {string} code - 分支编码
 * @property {string} address - 地址
 * @property {string} phone - 电话
 * @property {string} manager - 负责人
 * @property {string} status - 状态 (active/inactive)
 * @property {number} employeeCount - 员工数量
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{branches: Branch[], filteredBranches: Branch[], filters: {name: string, status: string}, stats: {total: number, active: number, inactive: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    branches: [],
    filteredBranches: [],
    filters: {
        name: '',
        status: ''
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
 * @returns {Branch[]} 模拟分支数据
 */
function getMockBranches() {
    return [
        { id: 'BR-001', name: '总部', code: 'HQ', address: '深圳市南山区科技园路1号', phone: '0755-88880001', manager: '张伟', status: 'active', employeeCount: 15, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'BR-002', name: '福田分店', code: 'FT', address: '深圳市福田区中心路2号', phone: '0755-88880002', manager: '李娜', status: 'active', employeeCount: 8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'BR-003', name: '罗湖分店', code: 'LH', address: '深圳市罗湖区东门路3号', phone: '0755-88880003', manager: '王强', status: 'inactive', employeeCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'BR-004', name: '宝安分店', code: 'BA', address: '深圳市宝安区宝安大道4号', phone: '0755-88880004', manager: '刘洋', status: 'active', employeeCount: 6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
}

/**
 * @private
 * @description 加载分支数据
 */
function loadBranches() {
    try {
        const saved = localStorage.getItem('branch_data');
        if (saved) {
            state.branches = JSON.parse(saved);
        } else {
            state.branches = getMockBranches();
            localStorage.setItem('branch_data', JSON.stringify(state.branches));
        }
    } catch (e) {
        console.warn('加载分支数据失败:', e);
        state.branches = getMockBranches();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存分支数据
 */
function saveBranches() {
    try {
        localStorage.setItem('branch_data', JSON.stringify(state.branches));
    } catch (e) {
        console.warn('保存分支数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.branches;
    
    if (state.filters.name) {
        const name = state.filters.name.toLowerCase();
        filtered = filtered.filter(b => b.name.toLowerCase().includes(name) || b.code.toLowerCase().includes(name));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(b => b.status === state.filters.status);
    }
    
    state.filteredBranches = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.branches.length;
    const active = state.branches.filter(b => b.status === 'active').length;
    const inactive = state.branches.filter(b => b.status === 'inactive').length;
    
    state.stats = { total, active, inactive };
}

/**
 * @private
 * @description 渲染分支列表
 */
function render() {
    const tbody = document.getElementById('branchListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredBranches.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-code-branch" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无分支数据
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        active: { label: '运营中', color: '#D1FAE5', textColor: '#065F46' },
        inactive: { label: '已停用', color: '#FEE2E2', textColor: '#991B1B' }
    };

    tbody.innerHTML = pageData.map(b => {
        const status = statusMap[b.status] || statusMap.inactive;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${b.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${b.code}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${b.address}</td>
                <td style="padding:10px 16px;font-size:13px;">${b.phone}</td>
                <td style="padding:10px 16px;font-size:13px;">${b.manager}</td>
                <td style="padding:10px 16px;text-align:center;font-weight:600;">${b.employeeCount || 0}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
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

    const total = state.filteredBranches.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 个分支
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.BranchesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.BranchesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredBranches.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function showCreateModal() {
    const name = prompt('分支名称：');
    if (!name) return;
    const code = prompt('分支编码：');
    if (!code) return;
    const address = prompt('地址：') || '';
    const phone = prompt('电话：') || '';
    const manager = prompt('负责人：') || '';
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"停用');
    
    const newBranch = {
        id: 'BR-' + Date.now().toString().slice(-6),
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address,
        phone: phone,
        manager: manager,
        status: status ? 'active' : 'inactive',
        employeeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.branches.push(newBranch);
    saveBranches();
    applyFilters();
    render();
    showToast('分支已创建', 'success');
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
    console.log('🏪 分支管理 初始化...');
    
    if (options?.data) {
        state.branches = options.data;
        localStorage.setItem('branch_data', JSON.stringify(state.branches));
    }
    
    loadBranches();
    bindEvents();
    render();
    
    window.BranchesModule = {
        state,
        loadBranches,
        render,
        renderPagination,
        updateStats,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveBranches,
        applyFilters
    };
    
    console.log('✅ 分支管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadBranches,
    goToPage,
    showCreateModal,
    saveBranches
};