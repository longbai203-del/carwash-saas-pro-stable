/**
 * @file referrals.js
 * @module referrals
 * @description 推荐管理模块 - 推荐记录的CRUD操作和转化跟踪
 * 
 * @example
 * import { init } from './referrals.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Referral
 * @property {string} id - 推荐ID
 * @property {string} referrer - 推荐人
 * @property {string} referee - 被推荐人
 * @property {string} [refereePhone] - 被推荐人电话
 * @property {number} reward - 奖励积分
 * @property {string} status - 状态 (pending/converted/expired)
 * @property {string} type - 类型 (customer/employee)
 * @property {string} convertedAt - 转化时间
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} ReferralState
 * @property {Referral[]} referrals - 推荐列表
 * @property {Referral[]} filteredReferrals - 过滤后的推荐列表
 * @property {Object} filters - 筛选条件
 * @property {number} page - 页码
 * @property {number} pageSize - 每页数量
 * @property {string|null} editingId - 编辑中的推荐ID
 */

/** @type {ReferralState} 状态 */
const state = {
    referrals: [],
    filteredReferrals: [],
    filters: {
        referrer: '',
        status: '',
        type: ''
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    pending: { label: '待转化', color: '#F59E0B', bg: '#FEF3C7', icon: 'fa-clock' },
    converted: { label: '已转化', color: '#10B981', bg: '#D1FAE5', icon: 'fa-check-circle' },
    expired: { label: '已过期', color: '#6B7280', bg: '#F3F4F6', icon: 'fa-times-circle' }
};

/**
 * 类型配置
 */
const TYPE_MAP = {
    customer: { label: '客户推荐', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-user-plus' },
    employee: { label: '员工推荐', color: '#EDE9FE', textColor: '#6D28D9', icon: 'fa-user-tie' }
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
 * @returns {Referral[]} 模拟推荐数据
 */
function getMockReferrals() {
    const referrers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明'];
    const referees = ['孙丽', '周涛', '吴刚', '徐洁', '黄海', '林峰'];
    const statuses = ['pending', 'converted', 'pending', 'converted', 'expired', 'converted'];
    const types = ['customer', 'customer', 'employee', 'customer', 'customer', 'employee'];
    
    return referrers.map((referrer, i) => ({
        id: `REF-${String(i + 1).padStart(4, '0')}`,
        referrer: referrer,
        referee: referees[i % referees.length],
        refereePhone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        reward: [50, 100, 30, 80, 60, 100][i],
        status: statuses[i % statuses.length],
        type: types[i % types.length],
        convertedAt: statuses[i % statuses.length] === 'converted' 
            ? new Date(Date.now() - (i + 1) * 5 * 24 * 60 * 60 * 1000).toISOString() 
            : null,
        createdAt: new Date(Date.now() - (i + 1) * 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

/**
 * @private
 * @description 加载推荐数据
 */
function loadReferrals() {
    try {
        const saved = localStorage.getItem('referral_data');
        if (saved) {
            state.referrals = JSON.parse(saved);
        } else {
            state.referrals = getMockReferrals();
            localStorage.setItem('referral_data', JSON.stringify(state.referrals));
        }
    } catch (e) {
        console.warn('加载推荐数据失败:', e);
        state.referrals = getMockReferrals();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存推荐数据
 */
function saveReferrals() {
    try {
        localStorage.setItem('referral_data', JSON.stringify(state.referrals));
    } catch (e) {
        console.warn('保存推荐数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.referrals;
    
    if (state.filters.referrer) {
        const referrer = state.filters.referrer.toLowerCase();
        filtered = filtered.filter(r => 
            r.referrer.toLowerCase().includes(referrer) ||
            r.referee.toLowerCase().includes(referrer)
        );
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    if (state.filters.type) {
        filtered = filtered.filter(r => r.type === state.filters.type);
    }
    
    state.filteredReferrals = filtered;
}

/**
 * @private
 * @description 渲染推荐列表
 */
function render() {
    const tbody = document.getElementById('referralListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredReferrals.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-share-alt" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无推荐数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const status = STATUS_MAP[r.status] || STATUS_MAP.pending;
        const type = TYPE_MAP[r.type] || TYPE_MAP.customer;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${r.referrer}</td>
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${r.referee}</div>
                    <div style="font-size:12px;color:#6B7280;">${r.refereePhone || '-'}</div>
                </td>
                <td style="padding:10px 16px;text-align:center;font-weight:700;color:#4F46E5;">
                    ${r.reward}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        <i class="fas ${type.icon}" style="margin-right:4px;"></i>
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.bg};color:${status.color};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">
                    ${r.status === 'converted' ? formatDate(r.convertedAt) : '-'}
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${r.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.ReferralsModule.convertReferral('${r.id}')" title="标记转化">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.ReferralsModule.editReferral('${r.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.ReferralsModule.deleteReferral('${r.id}')" title="删除">
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
    const total = state.referrals.length;
    const pending = state.referrals.filter(r => r.status === 'pending').length;
    const converted = state.referrals.filter(r => r.status === 'converted').length;
    const expired = state.referrals.filter(r => r.status === 'expired').length;
    const totalReward = state.referrals
        .filter(r => r.status === 'converted')
        .reduce((sum, r) => sum + r.reward, 0);
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    
    const elements = {
        'statTotal': total,
        'statPending': pending,
        'statConverted': converted,
        'statExpired': expired,
        'statTotalReward': totalReward,
        'statConversionRate': conversionRate + '%'
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

    const total = state.filteredReferrals.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条推荐
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
        <button onclick="window.ReferralsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.ReferralsModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.ReferralsModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.ReferralsModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.ReferralsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredReferrals.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 推荐ID
 */
function convertReferral(id) {
    const referral = state.referrals.find(r => r.id === id);
    if (!referral) {
        showToast('推荐不存在', 'error');
        return;
    }
    
    referral.status = 'converted';
    referral.convertedAt = new Date().toISOString();
    referral.updatedAt = new Date().toISOString();
    saveReferrals();
    applyFilters();
    render();
    showToast('推荐已标记为已转化', 'success');
}

/**
 * @private
 * @param {string} id - 推荐ID
 */
function editReferral(id) {
    const referral = state.referrals.find(r => r.id === id);
    if (!referral) {
        showToast('推荐不存在', 'error');
        return;
    }
    
    const referrer = prompt('推荐人：', referral.referrer);
    if (referrer === null) return;
    const referee = prompt('被推荐人：', referral.referee);
    if (referee === null) return;
    const reward = parseInt(prompt('奖励积分：', referral.reward));
    if (isNaN(reward) || reward < 0) {
        showToast('请输入有效积分', 'error');
        return;
    }
    const typeOptions = ['1. customer (客户推荐)', '2. employee (员工推荐)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, 
        referral.type === 'customer' ? '1' : '2'));
    const types = ['customer', 'employee'];
    
    referral.referrer = referrer.trim() || referral.referrer;
    referral.referee = referee.trim() || referral.referee;
    referral.reward = reward;
    referral.type = types[typeIdx - 1] || referral.type;
    referral.updatedAt = new Date().toISOString();
    
    saveReferrals();
    applyFilters();
    render();
    showToast('推荐已更新', 'success');
}

/**
 * @private
 * @param {string} id - 推荐ID
 */
function deleteReferral(id) {
    const referral = state.referrals.find(r => r.id === id);
    if (!referral) {
        showToast('推荐不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除推荐 "${referral.referrer} -> ${referral.referee}"？`)) return;
    
    state.referrals = state.referrals.filter(r => r.id !== id);
    saveReferrals();
    applyFilters();
    render();
    showToast('推荐已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const referrer = prompt('推荐人：');
    if (!referrer) return;
    const referee = prompt('被推荐人：');
    if (!referee) return;
    const reward = parseInt(prompt('奖励积分：', '50'));
    if (isNaN(reward) || reward < 0) {
        showToast('请输入有效积分', 'error');
        return;
    }
    const typeOptions = ['1. customer (客户推荐)', '2. employee (员工推荐)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
    const types = ['customer', 'employee'];
    const type = types[typeIdx - 1] || 'customer';
    
    const newReferral = {
        id: 'REF-' + Date.now().toString().slice(-6),
        referrer: referrer.trim(),
        referee: referee.trim(),
        refereePhone: '',
        reward: reward,
        status: 'pending',
        type: type,
        convertedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.referrals.push(newReferral);
    saveReferrals();
    applyFilters();
    render();
    showToast('推荐已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.referrer = document.getElementById('searchReferrer')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.type = document.getElementById('searchType')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const referrerInput = document.getElementById('searchReferrer');
    const statusInput = document.getElementById('searchStatus');
    const typeInput = document.getElementById('searchType');
    
    if (referrerInput) referrerInput.value = '';
    if (statusInput) statusInput.value = '';
    if (typeInput) typeInput.value = '';
    
    state.filters = { referrer: '', status: '', type: '' };
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
    
    document.querySelectorAll('#searchReferrer, #searchStatus, #searchType').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {Referral[]} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('📤 推荐管理 初始化...');
    
    if (options?.data) {
        state.referrals = options.data;
        localStorage.setItem('referral_data', JSON.stringify(state.referrals));
    }
    
    loadReferrals();
    bindEvents();
    render();
    
    window.ReferralsModule = {
        state,
        loadReferrals,
        render,
        renderPagination,
        updateStats,
        convertReferral,
        editReferral,
        deleteReferral,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveReferrals,
        applyFilters
    };
    
    console.log('✅ 推荐管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadReferrals,
    convertReferral,
    editReferral,
    deleteReferral,
    goToPage,
    showCreateModal,
    saveReferrals
};