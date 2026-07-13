/**
 * @file loyalty.js
 * @module loyalty
 * @description 积分管理模块 - 积分规则和积分记录的CRUD操作
 * 
 * @example
 * import { init } from './loyalty.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} LoyaltyRule
 * @property {string} id - 规则ID
 * @property {string} name - 规则名称
 * @property {string} type - 类型 (earn/redeem)
 * @property {number} points - 积分数
 * @property {string} condition - 条件描述
 * @property {string} status - 状态 (active/inactive)
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} LoyaltyRecord
 * @property {string} id - 记录ID
 * @property {string} customer - 客户名称
 * @property {string} type - 类型 (income/expense)
 * @property {number} points - 积分数
 * @property {string} desc - 描述
 * @property {string} status - 状态 (success/pending)
 * @property {string} createdAt - 创建时间
 */

/**
 * @typedef {Object} LoyaltyState
 * @property {LoyaltyRule[]} rules - 积分规则
 * @property {LoyaltyRecord[]} records - 积分记录
 * @property {Object} filters - 筛选条件
 * @property {number} page - 页码
 * @property {number} pageSize - 每页数量
 * @property {string|null} editingRuleId - 编辑中的规则ID
 * @property {string|null} editingRecordId - 编辑中的记录ID
 */

/** @type {LoyaltyState} 状态 */
const state = {
    rules: [],
    records: [],
    filters: {
        customer: '',
        type: '',
        status: ''
    },
    page: 1,
    pageSize: 10,
    editingRuleId: null,
    editingRecordId: null
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
 * @returns {LoyaltyRule[]} 模拟积分规则
 */
function getMockRules() {
    return [
        { id: 'LR-001', name: '消费积分', type: 'earn', points: 10, condition: '每消费100元获得10积分', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'LR-002', name: '注册积分', type: 'earn', points: 50, condition: '新用户注册奖励50积分', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'LR-003', name: '积分兑换', type: 'redeem', points: 100, condition: '100积分兑换10元优惠券', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'LR-004', name: '推荐积分', type: 'earn', points: 30, condition: '推荐新用户获得30积分', status: 'inactive', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
}

/**
 * @private
 * @returns {LoyaltyRecord[]} 模拟积分记录
 */
function getMockRecords() {
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明'];
    const types = ['income', 'income', 'expense', 'income', 'expense'];
    const descs = ['消费获得积分', '注册奖励', '兑换优惠券', '推荐奖励', '积分兑换'];
    const statuses = ['success', 'success', 'success', 'pending', 'success'];
    
    const records = [];
    for (let i = 0; i < 12; i++) {
        records.push({
            id: `LREC-${String(i + 1).padStart(6, '0')}`,
            customer: customers[i % customers.length],
            type: types[i % types.length],
            points: [10, 20, 50, 100][Math.floor(Math.random() * 4)],
            desc: descs[i % descs.length],
            status: statuses[i % statuses.length],
            createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return records;
}

/**
 * @private
 * @description 加载积分规则
 */
function loadRules() {
    try {
        const saved = localStorage.getItem('loyalty_rules');
        if (saved) {
            state.rules = JSON.parse(saved);
        } else {
            state.rules = getMockRules();
            localStorage.setItem('loyalty_rules', JSON.stringify(state.rules));
        }
    } catch (e) {
        console.warn('加载积分规则失败:', e);
        state.rules = getMockRules();
    }
}

/**
 * @private
 * @description 加载积分记录
 */
function loadRecords() {
    try {
        const saved = localStorage.getItem('loyalty_records');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockRecords();
            localStorage.setItem('loyalty_records', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载积分记录失败:', e);
        state.records = getMockRecords();
    }
    renderRecords();
    updateStats();
    renderPagination();
}

/**
 * @private
 * @description 保存积分规则
 */
function saveRules() {
    try {
        localStorage.setItem('loyalty_rules', JSON.stringify(state.rules));
    } catch (e) {
        console.warn('保存积分规则失败:', e);
    }
}

/**
 * @private
 * @description 保存积分记录
 */
function saveRecords() {
    try {
        localStorage.setItem('loyalty_records', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存积分记录失败:', e);
    }
}

/**
 * @private
 * @description 渲染积分记录
 */
function renderRecords() {
    const container = document.getElementById('loyaltyRecordsBody');
    if (!container) return;
    
    let filtered = state.records;
    if (state.filters.customer) {
        filtered = filtered.filter(r => r.customer.includes(state.filters.customer));
    }
    if (state.filters.type) {
        filtered = filtered.filter(r => r.type === state.filters.type);
    }
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const paginated = filtered.slice(start, end);
    
    if (paginated.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-star" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无积分记录
                </td>
            </tr>
        `;
        return;
    }
    
    const typeMap = {
        'income': { label: '收入', color: '#10B981', bg: '#D1FAE5', icon: 'fa-arrow-down' },
        'expense': { label: '支出', color: '#EF4444', bg: '#FEE2E2', icon: 'fa-arrow-up' }
    };
    
    const statusMap = {
        'success': { label: '成功', color: '#065F46', bg: '#D1FAE5' },
        'pending': { label: '待处理', color: '#92400E', bg: '#FEF3C7' }
    };
    
    container.innerHTML = paginated.map(record => {
        const type = typeMap[record.type] || typeMap.income;
        const status = statusMap[record.status] || statusMap.success;
        const sign = record.type === 'income' ? '+' : '-';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${record.customer}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.bg};color:${type.color};">
                        <i class="fas ${type.icon}"></i> ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:center;font-weight:700;color:${record.type === 'income' ? '#10B981' : '#EF4444'};">
                    ${sign}${record.points}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${record.desc}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(record.createdAt)}</td>
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
    
    let filtered = state.records;
    if (state.filters.customer) {
        filtered = filtered.filter(r => r.customer.includes(state.filters.customer));
    }
    if (state.filters.type) {
        filtered = filtered.filter(r => r.type === state.filters.type);
    }
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    
    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条记录
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
        <button onclick="window.LoyaltyModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.LoyaltyModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.LoyaltyModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.LoyaltyModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.LoyaltyModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalRecords = state.records.length;
    const totalIncome = state.records
        .filter(r => r.type === 'income' && r.status === 'success')
        .reduce((sum, r) => sum + r.points, 0);
    const totalExpense = state.records
        .filter(r => r.type === 'expense' && r.status === 'success')
        .reduce((sum, r) => sum + r.points, 0);
    const pendingCount = state.records.filter(r => r.status === 'pending').length;
    const activeRules = state.rules.filter(r => r.status === 'active').length;
    
    const elements = {
        'statTotalRecords': totalRecords,
        'statTotalIncome': totalIncome,
        'statTotalExpense': totalExpense,
        'statPending': pendingCount,
        'statActiveRules': activeRules,
        'statTotalRules': state.rules.length
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @param {number} page - 页码
 */
function goToPage(page) {
    let filtered = state.records;
    if (state.filters.customer) {
        filtered = filtered.filter(r => r.customer.includes(state.filters.customer));
    }
    if (state.filters.type) {
        filtered = filtered.filter(r => r.type === state.filters.type);
    }
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    const totalPages = Math.ceil(filtered.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    renderRecords();
    renderPagination();
}

/**
 * @private
 * @description 搜索积分记录
 */
function handleSearch() {
    state.filters.customer = document.getElementById('searchCustomer')?.value || '';
    state.filters.type = document.getElementById('searchType')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    renderRecords();
    renderPagination();
}

/**
 * @private
 * @description 重置搜索
 */
function handleReset() {
    const customerInput = document.getElementById('searchCustomer');
    const typeInput = document.getElementById('searchType');
    const statusInput = document.getElementById('searchStatus');
    
    if (customerInput) customerInput.value = '';
    if (typeInput) typeInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { customer: '', type: '', status: '' };
    state.page = 1;
    renderRecords();
    renderPagination();
}

/**
 * @private
 * @description 新增积分规则
 */
function addRule() {
    const name = prompt('规则名称：');
    if (!name) return;
    const typeOptions = ['1. earn (赚取)', '2. redeem (兑换)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
    const types = ['earn', 'redeem'];
    const type = types[typeIdx - 1] || 'earn';
    const points = parseInt(prompt('积分数：', '10'));
    if (isNaN(points) || points <= 0) {
        showToast('请输入有效积分数', 'error');
        return;
    }
    const condition = prompt('条件描述：', '') || '';
    const status = confirm('是否启用？');
    
    const rule = {
        id: 'LR-' + Date.now().toString().slice(-6),
        name: name.trim(),
        type: type,
        points: points,
        condition: condition,
        status: status ? 'active' : 'inactive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.rules.push(rule);
    saveRules();
    updateStats();
    showToast('积分规则已创建', 'success');
}

/**
 * @private
 * @description 切换规则状态
 */
function toggleRule(id) {
    const rule = state.rules.find(r => r.id === id);
    if (!rule) {
        showToast('规则不存在', 'error');
        return;
    }
    rule.status = rule.status === 'active' ? 'inactive' : 'active';
    rule.updatedAt = new Date().toISOString();
    saveRules();
    updateStats();
    showToast(`规则已${rule.status === 'active' ? '启用' : '禁用'}`, 'success');
}

/**
 * @private
 * @description 删除积分规则
 */
function deleteRule(id) {
    const rule = state.rules.find(r => r.id === id);
    if (!rule) {
        showToast('规则不存在', 'error');
        return;
    }
    if (!confirm(`确认删除规则 "${rule.name}"？`)) return;
    state.rules = state.rules.filter(r => r.id !== id);
    saveRules();
    updateStats();
    showToast('规则已删除', 'success');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    
    const addRuleBtn = document.getElementById('addRuleBtn');
    if (addRuleBtn) addRuleBtn.addEventListener('click', addRule);
    
    document.querySelectorAll('#searchCustomer, #searchType, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('⭐ 积分管理 初始化...');
    
    if (options?.rules) {
        state.rules = options.rules;
        localStorage.setItem('loyalty_rules', JSON.stringify(state.rules));
    } else {
        loadRules();
    }
    
    if (options?.records) {
        state.records = options.records;
        localStorage.setItem('loyalty_records', JSON.stringify(state.records));
    } else {
        loadRecords();
    }
    
    updateStats();
    bindEvents();
    
    // 渲染规则列表
    const rulesContainer = document.getElementById('rulesListBody') || document.getElementById('rulesContainer');
    if (rulesContainer) {
        const typeMap = { earn: '赚取', redeem: '兑换' };
        rulesContainer.innerHTML = state.rules.map(rule => `
            <tr style="border-bottom:1px solid #F3F4F6;">
                <td style="padding:10px 16px;font-weight:500;">${rule.name}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;background:${rule.type === 'earn' ? '#D1FAE5' : '#DBEAFE'};color:${rule.type === 'earn' ? '#065F46' : '#1E40AF'};">
                        ${typeMap[rule.type] || rule.type}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:center;font-weight:700;">${rule.points}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${rule.condition || '-'}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${rule.status === 'active' ? '#D1FAE5' : '#FEE2E2'};color:${rule.status === 'active' ? '#065F46' : '#991B1B'};">
                        ${rule.status === 'active' ? '启用' : '禁用'}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.LoyaltyModule.toggleRule('${rule.id}')" title="切换状态">
                            <i class="fas ${rule.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.LoyaltyModule.deleteRule('${rule.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    window.LoyaltyModule = {
        state,
        loadRules,
        loadRecords,
        renderRecords,
        renderPagination,
        updateStats,
        goToPage,
        handleSearch,
        handleReset,
        addRule,
        toggleRule,
        deleteRule,
        saveRules,
        saveRecords
    };
    
    console.log('✅ 积分管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadRules,
    loadRecords,
    addRule,
    toggleRule,
    deleteRule,
    saveRules,
    saveRecords
};