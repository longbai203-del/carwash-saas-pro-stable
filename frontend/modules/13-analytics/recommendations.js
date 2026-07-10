/**
 * @file recommendations.js
 * @module recommendations
 * @description 智能推荐 - AI驱动的业务建议
 * 
 * @example
 * import { init } from './recommendations.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Recommendation
 * @property {string} id - 推荐ID
 * @property {string} title - 标题
 * @property {string} description - 描述
 * @property {string} category - 分类 (sales/marketing/inventory/customer/hr)
 * @property {string} priority - 优先级 (high/medium/low)
 * @property {string} impact - 影响 (high/medium/low)
 * @property {string} status - 状态 (pending/applied/dismissed)
 * @property {number} confidence - 置信度 (0-100)
 * @property {string} createdAt - 创建时间
 * @property {string} expiresAt - 过期时间
 */

/** @type {{recommendations: Recommendation[], filteredRecommendations: Recommendation[], filters: {category: string, priority: string, status: string}, stats: {total: number, pending: number, applied: number, dismissed: number}, page: number, pageSize: number}} 状态 */
const state = {
    recommendations: [],
    filteredRecommendations: [],
    filters: {
        category: '',
        priority: '',
        status: ''
    },
    stats: {
        total: 0,
        pending: 0,
        applied: 0,
        dismissed: 0
    },
    page: 1,
    pageSize: 10
};

/**
 * 分类配置
 */
const CATEGORY_MAP = {
    sales: { label: '销售', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-chart-line' },
    marketing: { label: '营销', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-bullhorn' },
    inventory: { label: '库存', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-warehouse' },
    customer: { label: '客户', color: '#EDE9FE', textColor: '#6D28D9', icon: 'fa-users' },
    hr: { label: '人力', color: '#FCE4EC', textColor: '#DC2626', icon: 'fa-user-tie' }
};

/**
 * 优先级配置
 */
const PRIORITY_MAP = {
    high: { label: '高', color: '#FEE2E2', textColor: '#991B1B' },
    medium: { label: '中', color: '#FEF3C7', textColor: '#92400E' },
    low: { label: '低', color: '#DBEAFE', textColor: '#1E40AF' }
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    pending: { label: '待处理', color: '#FEF3C7', textColor: '#92400E' },
    applied: { label: '已应用', color: '#D1FAE5', textColor: '#065F46' },
    dismissed: { label: '已忽略', color: '#F3F4F6', textColor: '#4B5563' }
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
 * @returns {Recommendation[]} 模拟推荐数据
 */
function getMockRecommendations() {
    return [
        { id: 'REC-001', title: '推出夏季洗车套餐', description: '根据历史数据，夏季洗车需求增加30%，建议推出"夏日清凉"套餐', category: 'sales', priority: 'high', impact: 'high', status: 'pending', confidence: 92, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'REC-002', title: 'VIP客户生日优惠', description: '本月有23位VIP客户生日，建议发送专属生日优惠券', category: 'marketing', priority: 'high', impact: 'medium', status: 'pending', confidence: 88, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'REC-003', title: '库存优化建议', description: '泡沫洗车液库存积压，建议进行促销清仓', category: 'inventory', priority: 'medium', impact: 'medium', status: 'applied', confidence: 85, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'REC-004', title: '员工培训计划', description: '新员工入职率提升，建议安排服务标准化培训', category: 'hr', priority: 'medium', impact: 'high', status: 'pending', confidence: 78, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'REC-005', title: '客户复购激励', description: '复购率下降3%，建议推出"老客户专享"活动', category: 'customer', priority: 'high', impact: 'high', status: 'dismissed', confidence: 82, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() }
    ];
}

/**
 * @private
 * @description 加载推荐数据
 */
function loadRecommendations() {
    try {
        const saved = localStorage.getItem('recommendation_data');
        if (saved) {
            state.recommendations = JSON.parse(saved);
        } else {
            state.recommendations = getMockRecommendations();
            localStorage.setItem('recommendation_data', JSON.stringify(state.recommendations));
        }
    } catch (e) {
        console.warn('加载推荐数据失败:', e);
        state.recommendations = getMockRecommendations();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存推荐数据
 */
function saveRecommendations() {
    try {
        localStorage.setItem('recommendation_data', JSON.stringify(state.recommendations));
    } catch (e) {
        console.warn('保存推荐数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.recommendations;
    
    if (state.filters.category) {
        filtered = filtered.filter(r => r.category === state.filters.category);
    }
    
    if (state.filters.priority) {
        filtered = filtered.filter(r => r.priority === state.filters.priority);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    state.filteredRecommendations = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.recommendations.length;
    const pending = state.recommendations.filter(r => r.status === 'pending').length;
    const applied = state.recommendations.filter(r => r.status === 'applied').length;
    const dismissed = state.recommendations.filter(r => r.status === 'dismissed').length;
    
    state.stats = { total, pending, applied, dismissed };
}

/**
 * @private
 * @description 渲染推荐列表
 */
function render() {
    const tbody = document.getElementById('recommendationListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecommendations.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-lightbulb" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无智能推荐
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const category = CATEGORY_MAP[r.category] || CATEGORY_MAP.sales;
        const priority = PRIORITY_MAP[r.priority] || PRIORITY_MAP.medium;
        const status = STATUS_MAP[r.status] || STATUS_MAP.pending;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${r.title}</div>
                    <div style="font-size:12px;color:#6B7280;">${r.description}</div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${category.color};color:${category.textColor};">
                        <i class="fas ${category.icon}" style="margin-right:4px;"></i>
                        ${category.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:center;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${priority.color};color:${priority.textColor};">
                        ${priority.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:center;font-weight:700;color:#4F46E5;">
                    ${r.confidence}%
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${r.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.RecommendationsModule.applyRecommendation('${r.id}')" title="应用">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.RecommendationsModule.dismissRecommendation('${r.id}')" title="忽略">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.RecommendationsModule.viewRecommendation('${r.id}')" title="查看">
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
    document.getElementById('statPending')?.textContent = stats.pending;
    document.getElementById('statApplied')?.textContent = stats.applied;
    document.getElementById('statDismissed')?.textContent = stats.dismissed;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredRecommendations.length;
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
                <button onclick="window.RecommendationsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.RecommendationsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredRecommendations.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 推荐ID
 */
function viewRecommendation(id) {
    const rec = state.recommendations.find(r => r.id === id);
    if (!rec) {
        showToast('推荐不存在', 'error');
        return;
    }
    
    const category = CATEGORY_MAP[rec.category] || CATEGORY_MAP.sales;
    const priority = PRIORITY_MAP[rec.priority] || PRIORITY_MAP.medium;
    const status = STATUS_MAP[rec.status] || STATUS_MAP.pending;
    
    alert(`智能推荐详情：
标题: ${rec.title}
描述: ${rec.description}
分类: ${category.label}
优先级: ${priority.label}
影响: ${rec.impact}
状态: ${status.label}
置信度: ${rec.confidence}%
创建时间: ${formatDate(rec.createdAt)}
过期时间: ${formatDate(rec.expiresAt)}`);
}

/**
 * @private
 * @param {string} id - 推荐ID
 */
function applyRecommendation(id) {
    const rec = state.recommendations.find(r => r.id === id);
    if (!rec) {
        showToast('推荐不存在', 'error');
        return;
    }
    
    rec.status = 'applied';
    saveRecommendations();
    applyFilters();
    render();
    showToast(`已应用推荐: ${rec.title}`, 'success');
}

/**
 * @private
 * @param {string} id - 推荐ID
 */
function dismissRecommendation(id) {
    const rec = state.recommendations.find(r => r.id === id);
    if (!rec) {
        showToast('推荐不存在', 'error');
        return;
    }
    
    rec.status = 'dismissed';
    saveRecommendations();
    applyFilters();
    render();
    showToast(`已忽略推荐: ${rec.title}`, 'info');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.category = document.getElementById('searchCategory')?.value || '';
    state.filters.priority = document.getElementById('searchPriority')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const categoryInput = document.getElementById('searchCategory');
    const priorityInput = document.getElementById('searchPriority');
    const statusInput = document.getElementById('searchStatus');
    
    if (categoryInput) categoryInput.value = '';
    if (priorityInput) priorityInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { category: '', priority: '', status: '' };
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
    
    document.querySelectorAll('#searchCategory, #searchPriority, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('💡 智能推荐 初始化...');
    
    if (options?.data) {
        state.recommendations = options.data;
        localStorage.setItem('recommendation_data', JSON.stringify(state.recommendations));
    }
    
    loadRecommendations();
    bindEvents();
    render();
    
    window.RecommendationsModule = {
        state,
        loadRecommendations,
        render,
        renderPagination,
        updateStats,
        viewRecommendation,
        applyRecommendation,
        dismissRecommendation,
        goToPage,
        handleSearch,
        handleReset,
        saveRecommendations,
        applyFilters
    };
    
    console.log('✅ 智能推荐 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadRecommendations,
    viewRecommendation,
    applyRecommendation,
    dismissRecommendation,
    goToPage,
    saveRecommendations
};