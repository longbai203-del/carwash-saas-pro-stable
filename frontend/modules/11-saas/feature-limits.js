/**
 * @file feature-limits.js
 * @module feature-limits
 * @description 功能限制管理 - 套餐功能限制配置
 * 
 * @example
 * import { init } from './feature-limits.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} FeatureLimit
 * @property {string} id - 限制ID
 * @property {string} plan - 套餐 (basic/pro/enterprise)
 * @property {string} feature - 功能名称
 * @property {string} limit - 限制值
 * @property {string} description - 描述
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{limits: FeatureLimit[], filteredLimits: FeatureLimit[], filters: {plan: string, feature: string}, stats: {total: number, basic: number, pro: number, enterprise: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    limits: [],
    filteredLimits: [],
    filters: {
        plan: '',
        feature: ''
    },
    stats: {
        total: 0,
        basic: 0,
        pro: 0,
        enterprise: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 套餐配置
 */
const PLAN_MAP = {
    basic: { label: '基础版', color: '#DBEAFE', textColor: '#1E40AF' },
    pro: { label: '专业版', color: '#D1FAE5', textColor: '#065F46' },
    enterprise: { label: '企业版', color: '#EDE9FE', textColor: '#6D28D9' }
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
 * @returns {FeatureLimit[]} 模拟功能限制数据
 */
function getMockLimits() {
    const features = [
        { name: '用户数量', basic: '5', pro: '20', enterprise: '无限' },
        { name: '存储空间', basic: '500MB', pro: '2GB', enterprise: '10GB' },
        { name: 'API调用次数', basic: '1000/月', pro: '10000/月', enterprise: '100000/月' },
        { name: '门店数量', basic: '1', pro: '5', enterprise: '无限' },
        { name: '数据导出', basic: 'CSV', pro: 'CSV+Excel', enterprise: '所有格式' },
        { name: '高级报表', basic: '❌', pro: '✅', enterprise: '✅' },
        { name: 'AI助手', basic: '❌', pro: '✅', enterprise: '✅' },
        { name: '多语言支持', basic: '❌', pro: '✅', enterprise: '✅' },
        { name: '定制开发', basic: '❌', pro: '❌', enterprise: '✅' },
        { name: '专属客服', basic: '❌', pro: '❌', enterprise: '✅' }
    ];
    
    const limits = [];
    features.forEach(f => {
        ['basic', 'pro', 'enterprise'].forEach(plan => {
            const value = f[plan] || '-';
            limits.push({
                id: `FL-${String(limits.length + 1).padStart(6, '0')}`,
                plan: plan,
                feature: f.name,
                limit: value,
                description: `${f.name} - ${PLAN_MAP[plan].label}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        });
    });
    return limits;
}

/**
 * @private
 * @description 加载功能限制数据
 */
function loadLimits() {
    try {
        const saved = localStorage.getItem('feature_limit_data');
        if (saved) {
            state.limits = JSON.parse(saved);
        } else {
            state.limits = getMockLimits();
            localStorage.setItem('feature_limit_data', JSON.stringify(state.limits));
        }
    } catch (e) {
        console.warn('加载功能限制数据失败:', e);
        state.limits = getMockLimits();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存功能限制数据
 */
function saveLimits() {
    try {
        localStorage.setItem('feature_limit_data', JSON.stringify(state.limits));
    } catch (e) {
        console.warn('保存功能限制数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.limits;
    
    if (state.filters.plan) {
        filtered = filtered.filter(l => l.plan === state.filters.plan);
    }
    
    if (state.filters.feature) {
        const feature = state.filters.feature.toLowerCase();
        filtered = filtered.filter(l => l.feature.toLowerCase().includes(feature));
    }
    
    state.filteredLimits = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.limits.length;
    const basic = state.limits.filter(l => l.plan === 'basic').length;
    const pro = state.limits.filter(l => l.plan === 'pro').length;
    const enterprise = state.limits.filter(l => l.plan === 'enterprise').length;
    
    state.stats = { total, basic, pro, enterprise };
}

/**
 * @private
 * @description 渲染功能限制列表
 */
function render() {
    const tbody = document.getElementById('featureLimitListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredLimits.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-list" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无功能限制数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(l => {
        const plan = PLAN_MAP[l.plan] || PLAN_MAP.basic;
        const isUnlimited = l.limit === '无限' || l.limit === '不限';
        const isEnabled = l.limit === '✅';
        const isDisabled = l.limit === '❌';
        let limitColor = '#1F2937';
        if (isUnlimited) limitColor = '#10B981';
        else if (isEnabled) limitColor = '#10B981';
        else if (isDisabled) limitColor = '#6B7280';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${l.feature}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${plan.color};color:${plan.textColor};">
                        ${plan.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-weight:600;color:${limitColor};">
                    ${l.limit}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${l.description}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.FeatureLimitsModule.editLimit('${l.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
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
    document.getElementById('statBasic')?.textContent = stats.basic;
    document.getElementById('statPro')?.textContent = stats.pro;
    document.getElementById('statEnterprise')?.textContent = stats.enterprise;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredLimits.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条功能限制
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.FeatureLimitsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.FeatureLimitsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredLimits.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 限制ID
 */
function editLimit(id) {
    const limit = state.limits.find(l => l.id === id);
    if (!limit) {
        showToast('功能限制不存在', 'error');
        return;
    }
    
    const newLimit = prompt(`修改 "${limit.feature}" 的限制值：`, limit.limit);
    if (newLimit === null) return;
    
    limit.limit = newLimit.trim() || limit.limit;
    limit.description = `${limit.feature} - ${PLAN_MAP[limit.plan]?.label || ''}`;
    limit.updatedAt = new Date().toISOString();
    
    saveLimits();
    applyFilters();
    render();
    showToast('功能限制已更新', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.plan = document.getElementById('searchPlan')?.value || '';
    state.filters.feature = document.getElementById('searchFeature')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const planInput = document.getElementById('searchPlan');
    const featureInput = document.getElementById('searchFeature');
    
    if (planInput) planInput.value = '';
    if (featureInput) featureInput.value = '';
    
    state.filters = { plan: '', feature: '' };
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
    
    document.querySelectorAll('#searchPlan, #searchFeature').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📋 功能限制管理 初始化...');
    
    if (options?.data) {
        state.limits = options.data;
        localStorage.setItem('feature_limit_data', JSON.stringify(state.limits));
    }
    
    loadLimits();
    bindEvents();
    render();
    
    window.FeatureLimitsModule = {
        state,
        loadLimits,
        render,
        renderPagination,
        updateStats,
        editLimit,
        goToPage,
        handleSearch,
        handleReset,
        saveLimits,
        applyFilters
    };
    
    console.log('✅ 功能限制管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadLimits,
    editLimit,
    goToPage,
    saveLimits
};