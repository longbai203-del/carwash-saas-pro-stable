/**
 * @file subscriptions.js
 * @module subscriptions
 * @description 订阅管理 - 租户订阅和套餐管理
 * 
 * @example
 * import { init } from './subscriptions.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Subscription
 * @property {string} id - 订阅ID
 * @property {string} tenantId - 租户ID
 * @property {string} tenantName - 租户名称
 * @property {string} plan - 套餐 (basic/pro/enterprise)
 * @property {string} status - 状态 (active/trial/expired/cancelled)
 * @property {number} price - 价格
 * @property {string} billingCycle - 计费周期 (monthly/quarterly/yearly)
 * @property {string} startDate - 开始日期
 * @property {string} endDate - 结束日期
 * @property {string} paymentMethod - 支付方式
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{subscriptions: Subscription[], filteredSubscriptions: Subscription[], filters: {tenant: string, plan: string, status: string}, stats: {total: number, active: number, trial: number, expired: number, cancelled: number, totalRevenue: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    subscriptions: [],
    filteredSubscriptions: [],
    filters: {
        tenant: '',
        plan: '',
        status: ''
    },
    stats: {
        total: 0,
        active: 0,
        trial: 0,
        expired: 0,
        cancelled: 0,
        totalRevenue: 0
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
    trial: { label: '试用中', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-clock' },
    expired: { label: '已过期', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' },
    cancelled: { label: '已取消', color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-ban' }
};

/**
 * 套餐配置
 */
const PLAN_MAP = {
    basic: { label: '基础版', price: 199, color: '#DBEAFE', textColor: '#1E40AF' },
    pro: { label: '专业版', price: 399, color: '#D1FAE5', textColor: '#065F46' },
    enterprise: { label: '企业版', price: 799, color: '#EDE9FE', textColor: '#6D28D9' }
};

/**
 * 计费周期配置
 */
const BILLING_MAP = {
    monthly: { label: '月度', multiplier: 1 },
    quarterly: { label: '季度', multiplier: 3 },
    yearly: { label: '年度', multiplier: 12 }
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
 * @returns {Subscription[]} 模拟订阅数据
 */
function getMockSubscriptions() {
    const tenants = ['洗车店A', '洗车店B', '洗车店C', '洗车店D', '洗车店E', '洗车店F'];
    const plans = ['basic', 'pro', 'enterprise', 'pro', 'basic', 'enterprise'];
    const statuses = ['active', 'active', 'trial', 'expired', 'active', 'cancelled'];
    const billingCycles = ['monthly', 'quarterly', 'yearly'];
    const paymentMethods = ['支付宝', '微信', '银行转账', '信用卡'];
    
    return tenants.map((name, i) => {
        const plan = plans[i];
        const price = PLAN_MAP[plan]?.price || 199;
        const cycle = billingCycles[i % billingCycles.length];
        const multiplier = BILLING_MAP[cycle]?.multiplier || 1;
        const startDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + (multiplier * 3));
        
        return {
            id: `SUB-${String(i + 1).padStart(6, '0')}`,
            tenantId: `TEN-${String(i + 1).padStart(6, '0')}`,
            tenantName: name,
            plan: plan,
            status: statuses[i],
            price: price * multiplier,
            billingCycle: cycle,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            paymentMethod: paymentMethods[i % paymentMethods.length],
            note: '',
            createdAt: startDate.toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载订阅数据
 */
function loadSubscriptions() {
    try {
        const saved = localStorage.getItem('subscription_data');
        if (saved) {
            state.subscriptions = JSON.parse(saved);
        } else {
            state.subscriptions = getMockSubscriptions();
            localStorage.setItem('subscription_data', JSON.stringify(state.subscriptions));
        }
    } catch (e) {
        console.warn('加载订阅数据失败:', e);
        state.subscriptions = getMockSubscriptions();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存订阅数据
 */
function saveSubscriptions() {
    try {
        localStorage.setItem('subscription_data', JSON.stringify(state.subscriptions));
    } catch (e) {
        console.warn('保存订阅数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.subscriptions;
    
    if (state.filters.tenant) {
        const tenant = state.filters.tenant.toLowerCase();
        filtered = filtered.filter(s => s.tenantName.toLowerCase().includes(tenant));
    }
    
    if (state.filters.plan) {
        filtered = filtered.filter(s => s.plan === state.filters.plan);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(s => s.status === state.filters.status);
    }
    
    state.filteredSubscriptions = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.subscriptions.length;
    const active = state.subscriptions.filter(s => s.status === 'active').length;
    const trial = state.subscriptions.filter(s => s.status === 'trial').length;
    const expired = state.subscriptions.filter(s => s.status === 'expired').length;
    const cancelled = state.subscriptions.filter(s => s.status === 'cancelled').length;
    const totalRevenue = state.subscriptions
        .filter(s => s.status === 'active' || s.status === 'trial')
        .reduce((sum, s) => sum + s.price, 0);
    
    state.stats = { total, active, trial, expired, cancelled, totalRevenue };
}

/**
 * @private
 * @description 渲染订阅列表
 */
function render() {
    const tbody = document.getElementById('subscriptionListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredSubscriptions.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-sync-alt" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无订阅数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(s => {
        const status = STATUS_MAP[s.status] || STATUS_MAP.inactive;
        const plan = PLAN_MAP[s.plan] || PLAN_MAP.basic;
        const billing = BILLING_MAP[s.billingCycle] || BILLING_MAP.monthly;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${s.tenantName}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${plan.color};color:${plan.textColor};">
                        ${plan.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#4F46E5;">
                    ¥${formatCurrency(s.price)}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${billing.label}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">
                    ${formatDate(s.startDate)} ~ ${formatDate(s.endDate)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${s.paymentMethod}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${s.status === 'active' || s.status === 'trial' ? `
                            <button class="btn btn-sm btn-success" onclick="window.SubscriptionsModule.renewSubscription('${s.id}')" title="续费">
                                <i class="fas fa-redo"></i>
                            </button>
                        ` : ''}
                        ${s.status === 'active' || s.status === 'trial' ? `
                            <button class="btn btn-sm btn-danger" onclick="window.SubscriptionsModule.cancelSubscription('${s.id}')" title="取消">
                                <i class="fas fa-ban"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.SubscriptionsModule.viewSubscription('${s.id}')" title="查看">
                            <i class="fas fa-eye"></i>
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
    document.getElementById('statTrial')?.textContent = stats.trial;
    document.getElementById('statExpired')?.textContent = stats.expired;
    document.getElementById('statCancelled')?.textContent = stats.cancelled;
    document.getElementById('statTotalRevenue')?.textContent = '¥' + formatCurrency(stats.totalRevenue);
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredSubscriptions.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条订阅
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SubscriptionsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SubscriptionsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredSubscriptions.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 订阅ID
 */
function viewSubscription(id) {
    const subscription = state.subscriptions.find(s => s.id === id);
    if (!subscription) {
        showToast('订阅不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[subscription.status] || STATUS_MAP.inactive;
    const plan = PLAN_MAP[subscription.plan] || PLAN_MAP.basic;
    const billing = BILLING_MAP[subscription.billingCycle] || BILLING_MAP.monthly;
    
    alert(`订阅详情：
租户: ${subscription.tenantName}
套餐: ${plan.label}
状态: ${status.label}
价格: ¥${formatCurrency(subscription.price)}
计费周期: ${billing.label}
开始日期: ${formatDate(subscription.startDate)}
结束日期: ${formatDate(subscription.endDate)}
支付方式: ${subscription.paymentMethod}
备注: ${subscription.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 订阅ID
 */
function renewSubscription(id) {
    const subscription = state.subscriptions.find(s => s.id === id);
    if (!subscription) {
        showToast('订阅不存在', 'error');
        return;
    }
    
    if (!confirm(`确认续费 ${subscription.tenantName} 的订阅？\n金额: ¥${formatCurrency(subscription.price)}`)) return;
    
    const newEndDate = new Date(subscription.endDate);
    const multiplier = BILLING_MAP[subscription.billingCycle]?.multiplier || 1;
    newEndDate.setMonth(newEndDate.getMonth() + multiplier * 3);
    subscription.endDate = newEndDate.toISOString().split('T')[0];
    subscription.updatedAt = new Date().toISOString();
    
    saveSubscriptions();
    applyFilters();
    render();
    showToast('订阅已续费', 'success');
}

/**
 * @private
 * @param {string} id - 订阅ID
 */
function cancelSubscription(id) {
    const subscription = state.subscriptions.find(s => s.id === id);
    if (!subscription) {
        showToast('订阅不存在', 'error');
        return;
    }
    
    if (!confirm(`确认取消 ${subscription.tenantName} 的订阅？`)) return;
    
    subscription.status = 'cancelled';
    subscription.updatedAt = new Date().toISOString();
    
    saveSubscriptions();
    applyFilters();
    render();
    showToast('订阅已取消', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const tenantName = prompt('租户名称：');
    if (!tenantName) return;
    const planOptions = ['1. basic (基础版 ¥199)', '2. pro (专业版 ¥399)', '3. enterprise (企业版 ¥799)'];
    const planIdx = parseInt(prompt(`选择套餐：\n${planOptions.join('\n')}`, '1'));
    const plans = ['basic', 'pro', 'enterprise'];
    const plan = plans[planIdx - 1] || 'basic';
    const price = PLAN_MAP[plan]?.price || 199;
    const billingOptions = ['1. monthly (月度)', '2. quarterly (季度)', '3. yearly (年度)'];
    const billingIdx = parseInt(prompt(`选择计费周期：\n${billingOptions.join('\n')}`, '1'));
    const billingCycles = ['monthly', 'quarterly', 'yearly'];
    const billingCycle = billingCycles[billingIdx - 1] || 'monthly';
    const multiplier = BILLING_MAP[billingCycle]?.multiplier || 1;
    const totalPrice = price * multiplier;
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (multiplier * 3));
    const paymentMethod = prompt('支付方式：', '支付宝') || '支付宝';
    const note = prompt('备注：') || '';
    
    const newSubscription = {
        id: 'SUB-' + Date.now().toString().slice(-6),
        tenantId: 'TEN-' + String(Math.floor(Math.random() * 999) + 1).padStart(6, '0'),
        tenantName: tenantName.trim(),
        plan: plan,
        status: 'active',
        price: totalPrice,
        billingCycle: billingCycle,
        startDate: startDate,
        endDate: endDate.toISOString().split('T')[0],
        paymentMethod: paymentMethod,
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.subscriptions.push(newSubscription);
    saveSubscriptions();
    applyFilters();
    render();
    showToast('订阅已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.tenant = document.getElementById('searchTenant')?.value || '';
    state.filters.plan = document.getElementById('searchPlan')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const tenantInput = document.getElementById('searchTenant');
    const planInput = document.getElementById('searchPlan');
    const statusInput = document.getElementById('searchStatus');
    
    if (tenantInput) tenantInput.value = '';
    if (planInput) planInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { tenant: '', plan: '', status: '' };
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
    
    document.querySelectorAll('#searchTenant, #searchPlan, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('🔄 订阅管理 初始化...');
    
    if (options?.data) {
        state.subscriptions = options.data;
        localStorage.setItem('subscription_data', JSON.stringify(state.subscriptions));
    }
    
    loadSubscriptions();
    bindEvents();
    render();
    
    window.SubscriptionsModule = {
        state,
        loadSubscriptions,
        render,
        renderPagination,
        updateStats,
        viewSubscription,
        renewSubscription,
        cancelSubscription,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveSubscriptions,
        applyFilters
    };
    
    console.log('✅ 订阅管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadSubscriptions,
    viewSubscription,
    renewSubscription,
    cancelSubscription,
    goToPage,
    showCreateModal,
    saveSubscriptions
};