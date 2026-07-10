/**
 * @file membership.js
 * @module membership
 * @description 会员管理模块 - 会员等级和会员信息的CRUD操作
 * 
 * @example
 * import { init } from './membership.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} MembershipLevel
 * @property {string} id - 等级ID
 * @property {string} name - 等级名称
 * @property {string} [description] - 等级描述
 * @property {number} minSpent - 最低消费门槛
 * @property {number} discountRate - 折扣率 (0-100)
 * @property {string} color - 颜色
 * @property {string} icon - 图标
 * @property {string[]} benefits - 权益列表
 * @property {string} status - 状态 (active/inactive)
 * @property {number} sortOrder - 排序
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} Member
 * @property {string} id - 会员ID
 * @property {string} customerId - 客户ID
 * @property {string} customerName - 客户名称
 * @property {string} levelId - 等级ID
 * @property {string} levelName - 等级名称
 * @property {number} totalSpent - 累计消费
 * @property {string} joinDate - 入会日期
 * @property {string} expiryDate - 到期日期
 * @property {string} status - 状态 (active/expired/frozen)
 * @property {string} notes - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} MembershipState
 * @property {MembershipLevel[]} levels - 等级列表
 * @property {Member[]} members - 会员列表
 * @property {string} searchQuery - 搜索关键词
 * @property {string} levelFilter - 等级筛选
 * @property {string} statusFilter - 状态筛选
 * @property {number} page - 页码
 * @property {number} limit - 每页数量
 * @property {string|null} editingLevelId - 编辑中的等级ID
 * @property {string|null} editingMemberId - 编辑中的会员ID
 */

/** @type {MembershipState} 状态 */
const state = {
    levels: [],
    members: [],
    searchQuery: '',
    levelFilter: 'all',
    statusFilter: 'all',
    page: 1,
    limit: 10,
    editingLevelId: null,
    editingMemberId: null
};

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
 * @param {string} date - 日期字符串
 * @returns {string} 格式化的完整日期
 */
function formatDateTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
}

/**
 * @private
 * @returns {MembershipLevel[]} 模拟等级数据
 */
function getMockLevels() {
    return [
        { id: 'LVL001', name: '普通会员', description: '基础会员权益', minSpent: 0, discountRate: 0, color: '#6B7280', icon: 'fa-user', benefits: ['注册即享'], sortOrder: 1, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'LVL002', name: '白银会员', description: '白银级会员权益', minSpent: 2000, discountRate: 5, color: '#9CA3AF', icon: 'fa-star-half-alt', benefits: ['消费95折', '生日礼包'], sortOrder: 2, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'LVL003', name: '黄金会员', description: '黄金级会员权益', minSpent: 5000, discountRate: 10, color: '#F59E0B', icon: 'fa-star', benefits: ['消费9折', '生日礼包', '优先预约'], sortOrder: 3, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'LVL004', name: '钻石会员', description: '钻石级会员权益', minSpent: 10000, discountRate: 15, color: '#3B82F6', icon: 'fa-gem', benefits: ['消费85折', '生日礼包', '优先预约', '免费洗车'], sortOrder: 4, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'LVL005', name: 'VIP会员', description: '尊享VIP会员权益', minSpent: 20000, discountRate: 20, color: '#8B5CF6', icon: 'fa-crown', benefits: ['消费8折', '生日礼包', '优先预约', '免费洗车', '专属客服'], sortOrder: 5, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
}

/**
 * @private
 * @returns {Member[]} 模拟会员数据
 */
function getMockMembers() {
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛', '吴刚', '徐洁'];
    const levels = ['LVL001', 'LVL002', 'LVL003', 'LVL004', 'LVL005'];
    const levelNames = ['普通会员', '白银会员', '黄金会员', '钻石会员', 'VIP会员'];
    const statuses = ['active', 'active', 'active', 'active', 'expired', 'frozen'];
    
    const members = [];
    for (let i = 0; i < 12; i++) {
        const levelIdx = Math.floor(Math.random() * levels.length);
        const spent = [500, 1500, 3000, 7000, 15000, 25000][Math.floor(Math.random() * 6)];
        const daysAgo = Math.floor(Math.random() * 60) + 10;
        
        members.push({
            id: `MEM-${String(i + 1).padStart(6, '0')}`,
            customerId: `CUS-${String(i + 1).padStart(6, '0')}`,
            customerName: customers[i % customers.length],
            levelId: levels[levelIdx],
            levelName: levelNames[levelIdx],
            totalSpent: spent,
            joinDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
            expiryDate: new Date(Date.now() + (365 - daysAgo) * 24 * 60 * 60 * 1000).toISOString(),
            status: statuses[i % statuses.length],
            notes: Math.random() > 0.7 ? '重要会员，需重点关注' : '',
            createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return members;
}

/**
 * @private
 * @description 加载等级数据
 */
function loadLevels() {
    try {
        const saved = localStorage.getItem('membership_levels_data');
        if (saved) {
            state.levels = JSON.parse(saved);
        } else {
            state.levels = getMockLevels();
            localStorage.setItem('membership_levels_data', JSON.stringify(state.levels));
        }
    } catch (e) {
        console.warn('加载等级数据失败:', e);
        state.levels = getMockLevels();
    }
}

/**
 * @private
 * @description 加载会员数据
 */
function loadMembers() {
    try {
        const saved = localStorage.getItem('membership_members_data');
        if (saved) {
            state.members = JSON.parse(saved);
        } else {
            state.members = getMockMembers();
            localStorage.setItem('membership_members_data', JSON.stringify(state.members));
        }
    } catch (e) {
        console.warn('加载会员数据失败:', e);
        state.members = getMockMembers();
    }
    renderMembers();
    updateStats();
    renderPagination();
}

/**
 * @private
 * @description 保存等级数据
 */
function saveLevels() {
    try {
        localStorage.setItem('membership_levels_data', JSON.stringify(state.levels));
    } catch (e) {
        console.warn('保存等级数据失败:', e);
    }
}

/**
 * @private
 * @description 保存会员数据
 */
function saveMembers() {
    try {
        localStorage.setItem('membership_members_data', JSON.stringify(state.members));
    } catch (e) {
        console.warn('保存会员数据失败:', e);
    }
}

/**
 * @private
 * @description 获取等级名称
 */
function getLevelName(levelId) {
    const level = state.levels.find(l => l.id === levelId);
    return level ? level.name : levelId;
}

/**
 * @private
 * @description 获取等级折扣率
 */
function getLevelDiscount(levelId) {
    const level = state.levels.find(l => l.id === levelId);
    return level ? level.discountRate : 0;
}

/**
 * @private
 * @description 渲染会员列表
 */
function renderMembers() {
    const container = document.getElementById('memberListBody');
    if (!container) return;
    
    let filtered = state.members;
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(m => 
            m.customerName.toLowerCase().includes(query) ||
            m.id.toLowerCase().includes(query) ||
            m.levelName.toLowerCase().includes(query)
        );
    }
    
    if (state.levelFilter !== 'all') {
        filtered = filtered.filter(m => m.levelId === state.levelFilter);
    }
    
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(m => m.status === state.statusFilter);
    }
    
    const start = (state.page - 1) * state.limit;
    const end = start + state.limit;
    const paginated = filtered.slice(start, end);
    
    if (paginated.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-crown" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无会员数据
                </td>
            </tr>
        `;
        return;
    }
    
    const statusMap = {
        'active': { label: '有效', color: '#065F46', bg: '#D1FAE5' },
        'expired': { label: '已过期', color: '#991B1B', bg: '#FEE2E2' },
        'frozen': { label: '已冻结', color: '#92400E', bg: '#FEF3C7' }
    };
    
    container.innerHTML = paginated.map(member => {
        const status = statusMap[member.status] || statusMap.active;
        const discount = getLevelDiscount(member.levelId);
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${member.customerName}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:#EDE9FE;color:#8B5CF6;">
                        ${member.levelName}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;">
                    ¥${formatCurrency(member.totalSpent)}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${discount}%</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(member.joinDate)}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.bg};color:${status.color};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.MembershipModule.editMember('${member.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.MembershipModule.viewMember('${member.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.MembershipModule.deleteMember('${member.id}')" title="删除">
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
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    let filtered = state.members;
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(m => 
            m.customerName.toLowerCase().includes(query) ||
            m.id.toLowerCase().includes(query) ||
            m.levelName.toLowerCase().includes(query)
        );
    }
    if (state.levelFilter !== 'all') {
        filtered = filtered.filter(m => m.levelId === state.levelFilter);
    }
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(m => m.status === state.statusFilter);
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / state.limit);
    
    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 位会员
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 位会员，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
    `;
    
    html += `
        <button onclick="window.MembershipModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.MembershipModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.MembershipModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.MembershipModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.MembershipModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @description 更新统计数据
 */
function updateStats() {
    const total = state.members.length;
    const active = state.members.filter(m => m.status === 'active').length;
    const expired = state.members.filter(m => m.status === 'expired').length;
    const frozen = state.members.filter(m => m.status === 'frozen').length;
    const totalSpent = state.members.reduce((sum, m) => sum + m.totalSpent, 0);
    const levels = state.levels.length;
    
    const elements = {
        'statTotal': total,
        'statActive': active,
        'statExpired': expired,
        'statFrozen': frozen,
        'statTotalSpent': '¥' + formatCurrency(totalSpent),
        'statLevels': levels
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @param {string} id - 会员ID
 * @description 查看会员详情
 */
function viewMember(id) {
    const member = state.members.find(m => m.id === id);
    if (!member) {
        showToast('会员不存在', 'error');
        return;
    }
    
    const statusMap = {
        'active': '有效',
        'expired': '已过期',
        'frozen': '已冻结'
    };
    
    alert(`会员详情：
会员ID: ${member.id}
客户: ${member.customerName}
等级: ${member.levelName}
累计消费: ¥${formatCurrency(member.totalSpent)}
折扣率: ${getLevelDiscount(member.levelId)}%
入会日期: ${formatDateTime(member.joinDate)}
到期日期: ${formatDateTime(member.expiryDate)}
状态: ${statusMap[member.status] || member.status}
备注: ${member.notes || '无'}`);
}

/**
 * @private
 * @param {string} id - 会员ID
 * @description 编辑会员
 */
function editMember(id) {
    const member = state.members.find(m => m.id === id);
    if (!member) {
        showToast('会员不存在', 'error');
        return;
    }
    
    const levelOptions = state.levels.map((l, i) => `${i+1}. ${l.name}`).join('\n');
    const levelIdx = prompt(`选择等级：\n${levelOptions}`, state.levels.findIndex(l => l.id === member.levelId) + 1);
    if (levelIdx === null) return;
    
    const level = state.levels[parseInt(levelIdx) - 1];
    if (level) {
        member.levelId = level.id;
        member.levelName = level.name;
    }
    
    const statusOptions = ['1. active (有效)', '2. expired (已过期)', '3. frozen (已冻结)'];
    const statusIdx = prompt(`选择状态：\n${statusOptions.join('\n')}`, 
        member.status === 'active' ? '1' : member.status === 'expired' ? '2' : '3');
    if (statusIdx !== null) {
        const statuses = ['active', 'expired', 'frozen'];
        const newStatus = statuses[parseInt(statusIdx) - 1];
        if (newStatus) member.status = newStatus;
    }
    
    const notes = prompt('备注：', member.notes || '') || '';
    member.notes = notes;
    member.updatedAt = new Date().toISOString();
    
    saveMembers();
    renderMembers();
    updateStats();
    renderPagination();
    showToast('会员已更新', 'success');
}

/**
 * @private
 * @param {string} id - 会员ID
 * @description 删除会员
 */
function deleteMember(id) {
    const member = state.members.find(m => m.id === id);
    if (!member) {
        showToast('会员不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除会员 "${member.customerName}"？`)) return;
    
    state.members = state.members.filter(m => m.id !== id);
    saveMembers();
    renderMembers();
    updateStats();
    renderPagination();
    showToast('会员已删除', 'success');
}

/**
 * @private
 * @param {number} page - 页码
 * @description 跳转到指定页
 */
function goToPage(page) {
    let filtered = state.members;
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(m => 
            m.customerName.toLowerCase().includes(query) ||
            m.id.toLowerCase().includes(query) ||
            m.levelName.toLowerCase().includes(query)
        );
    }
    if (state.levelFilter !== 'all') {
        filtered = filtered.filter(m => m.levelId === state.levelFilter);
    }
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(m => m.status === state.statusFilter);
    }
    const totalPages = Math.ceil(filtered.length / state.limit);
    if (page < 1 || page > totalPages) return;
    state.page = page;
    renderMembers();
    renderPagination();
}

/**
 * @private
 * @description 搜索会员
 */
function searchMembers(query) {
    state.searchQuery = query;
    state.page = 1;
    renderMembers();
    renderPagination();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    const levelFilter = document.getElementById('levelFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    state.levelFilter = levelFilter ? levelFilter.value : 'all';
    state.statusFilter = statusFilter ? statusFilter.value : 'all';
    state.page = 1;
    renderMembers();
    renderPagination();
}

/**
 * @private
 * @description 重置筛选
 */
function resetFilters() {
    const levelFilter = document.getElementById('levelFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (levelFilter) levelFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    
    state.levelFilter = 'all';
    state.statusFilter = 'all';
    state.searchQuery = '';
    state.page = 1;
    renderMembers();
    renderPagination();
}

/**
 * @private
 * @description 刷新数据
 */
function refresh() {
    loadLevels();
    loadMembers();
    showToast('数据已刷新', 'success');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                searchMembers(this.value);
            }, 300);
        });
    }
    
    const levelFilter = document.getElementById('levelFilter');
    if (levelFilter) {
        levelFilter.addEventListener('change', applyFilters);
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    const refreshBtn = document.getElementById('refreshMembers');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('👑 会员管理 初始化...');
    
    if (options?.levels) {
        state.levels = options.levels;
        localStorage.setItem('membership_levels_data', JSON.stringify(state.levels));
    } else {
        loadLevels();
    }
    
    if (options?.members) {
        state.members = options.members;
        localStorage.setItem('membership_members_data', JSON.stringify(state.members));
    } else {
        loadMembers();
    }
    
    updateStats();
    bindEvents();
    
    // 更新等级筛选器
    const levelFilter = document.getElementById('levelFilter');
    if (levelFilter) {
        const currentValue = levelFilter.value;
        levelFilter.innerHTML = `<option value="all">全部等级</option>${state.levels.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}`;
        levelFilter.value = currentValue;
    }
    
    window.MembershipModule = {
        state,
        loadLevels,
        loadMembers,
        renderMembers,
        renderPagination,
        updateStats,
        viewMember,
        editMember,
        deleteMember,
        goToPage,
        searchMembers,
        applyFilters,
        resetFilters,
        refresh,
        saveLevels,
        saveMembers,
        getLevelName,
        getLevelDiscount
    };
    
    console.log('✅ 会员管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadLevels,
    loadMembers,
    viewMember,
    editMember,
    deleteMember,
    goToPage,
    refresh,
    saveLevels,
    saveMembers
};