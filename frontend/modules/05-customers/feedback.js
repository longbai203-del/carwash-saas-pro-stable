/**
 * @file feedback.js
 * @module feedback
 * @description 客户反馈模块 - 客户反馈的CRUD操作和数据管理
 * 
 * @example
 * import { init } from './feedback.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Feedback
 * @property {string} id - 反馈ID
 * @property {string} customer - 客户名称
 * @property {string} [customerPhone] - 客户电话
 * @property {number} rating - 评分 (1-5)
 * @property {string} content - 反馈内容
 * @property {string} [reply] - 回复内容
 * @property {string} status - 状态 (pending/replied/resolved/closed)
 * @property {string} type - 类型 (complaint/suggestion/praise/question)
 * @property {string} [orderId] - 关联订单ID
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 * @property {string} [repliedAt] - 回复时间
 */

/**
 * @typedef {Object} FeedbackState
 * @property {Feedback[]} feedbacks - 反馈列表
 * @property {Feedback[]} filteredFeedbacks - 过滤后的反馈列表
 * @property {string} searchQuery - 搜索关键词
 * @property {string} typeFilter - 类型筛选
 * @property {string} statusFilter - 状态筛选
 * @property {number} page - 页码
 * @property {number} limit - 每页数量
 * @property {string|null} editingId - 编辑中的反馈ID
 */

/** @type {FeedbackState} 状态 */
const state = {
    feedbacks: [],
    filteredFeedbacks: [],
    searchQuery: '',
    typeFilter: 'all',
    statusFilter: 'all',
    page: 1,
    limit: 10,
    editingId: null
};

/**
 * @private
 * @param {number} rating - 评分
 * @returns {string} 星标HTML
 */
function getStars(rating) {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

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
 * @returns {Feedback[]} 模拟反馈数据
 */
function getMockFeedbacks() {
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
    const contents = [
        '服务非常好，下次还会来！',
        '洗车效果一般，希望能改进。',
        '工作人员很专业，点赞！',
        '价格有点贵，希望能有优惠活动。',
        '非常满意，推荐给朋友了。',
        '等待时间有点长，希望能加快速度。',
        '内饰清洁做得很干净，好评！',
        '服务态度很好，环境也不错。',
        '希望能增加更多服务项目。',
        '整体体验很好，会继续支持。'
    ];
    const types = ['praise', 'complaint', 'suggestion', 'question', 'praise'];
    const statuses = ['pending', 'pending', 'replied', 'resolved', 'replied', 'closed'];
    
    const feedbacks = [];
    for (let i = 0; i < 15; i++) {
        const rating = Math.floor(Math.random() * 4) + 2;
        const daysAgo = Math.floor(Math.random() * 30);
        
        feedbacks.push({
            id: `FB-${String(i + 1).padStart(6, '0')}`,
            customer: customers[i % customers.length],
            customerPhone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
            rating: rating,
            content: contents[i % contents.length],
            reply: Math.random() > 0.5 ? '感谢您的反馈，我们会继续努力改进！' : '',
            status: statuses[i % statuses.length],
            type: types[i % types.length],
            orderId: Math.random() > 0.7 ? `ORD-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}` : '',
            createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
            repliedAt: Math.random() > 0.5 ? new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000).toISOString() : ''
        });
    }
    feedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return feedbacks;
}

/**
 * @private
 * @description 加载反馈数据
 */
function loadFeedbacks() {
    try {
        const saved = localStorage.getItem('feedback_data');
        if (saved) {
            state.feedbacks = JSON.parse(saved);
        } else {
            state.feedbacks = getMockFeedbacks();
            localStorage.setItem('feedback_data', JSON.stringify(state.feedbacks));
        }
    } catch (e) {
        console.warn('加载反馈数据失败:', e);
        state.feedbacks = getMockFeedbacks();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存反馈数据
 */
function saveFeedbacks() {
    try {
        localStorage.setItem('feedback_data', JSON.stringify(state.feedbacks));
    } catch (e) {
        console.warn('保存反馈数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.feedbacks;
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(f => 
            f.customer.toLowerCase().includes(query) ||
            f.content.toLowerCase().includes(query) ||
            (f.reply && f.reply.toLowerCase().includes(query))
        );
    }
    
    if (state.typeFilter !== 'all') {
        filtered = filtered.filter(f => f.type === state.typeFilter);
    }
    
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(f => f.status === state.statusFilter);
    }
    
    state.filteredFeedbacks = filtered;
    renderFeedbacks();
    updateStats();
    renderPagination();
}

/**
 * @private
 * @description 渲染反馈列表
 */
function renderFeedbacks() {
    const container = document.getElementById('feedbackListBody');
    if (!container) return;
    
    const start = (state.page - 1) * state.limit;
    const end = start + state.limit;
    const paginated = state.filteredFeedbacks.slice(start, end);
    
    if (paginated.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-comment-dots" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无反馈数据
                </td>
            </tr>
        `;
        return;
    }
    
    const statusMap = {
        'pending': { label: '待回复', color: '#F59E0B', bg: '#FEF3C7' },
        'replied': { label: '已回复', color: '#3B82F6', bg: '#DBEAFE' },
        'resolved': { label: '已解决', color: '#10B981', bg: '#D1FAE5' },
        'closed': { label: '已关闭', color: '#6B7280', bg: '#F3F4F6' }
    };
    
    const typeMap = {
        'complaint': '投诉',
        'suggestion': '建议',
        'praise': '表扬',
        'question': '咨询'
    };
    
    container.innerHTML = paginated.map(feedback => {
        const status = statusMap[feedback.status] || statusMap.pending;
        const typeLabel = typeMap[feedback.type] || feedback.type;
        const stars = getStars(feedback.rating);
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${feedback.customer}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${stars}</td>
                <td style="padding:10px 16px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${feedback.content}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;background:#F3F4F6;color:#4B5563;">
                        ${typeLabel}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.bg};color:${status.color};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(feedback.createdAt)}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${feedback.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.FeedbackModule.replyFeedback('${feedback.id}')" title="回复">
                                <i class="fas fa-reply"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.FeedbackModule.viewFeedback('${feedback.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.FeedbackModule.deleteFeedback('${feedback.id}')" title="删除">
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
    
    const total = state.filteredFeedbacks.length;
    const totalPages = Math.ceil(total / state.limit);
    
    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条反馈
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条反馈，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
    `;
    
    html += `
        <button onclick="window.FeedbackModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.FeedbackModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.FeedbackModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.FeedbackModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.FeedbackModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const total = state.feedbacks.length;
    const pending = state.feedbacks.filter(f => f.status === 'pending').length;
    const replied = state.feedbacks.filter(f => f.status === 'replied').length;
    const resolved = state.feedbacks.filter(f => f.status === 'resolved').length;
    const avgRating = state.feedbacks.length > 0 
        ? state.feedbacks.reduce((sum, f) => sum + f.rating, 0) / state.feedbacks.length 
        : 0;
    const praise = state.feedbacks.filter(f => f.type === 'praise').length;
    const complaint = state.feedbacks.filter(f => f.type === 'complaint').length;
    
    const elements = {
        'statTotal': total,
        'statPending': pending,
        'statReplied': replied,
        'statResolved': resolved,
        'statAvgRating': avgRating.toFixed(1) + '⭐',
        'statPraise': praise,
        'statComplaint': complaint
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @param {string} id - 反馈ID
 * @description 查看反馈详情
 */
function viewFeedback(id) {
    const feedback = state.feedbacks.find(f => f.id === id);
    if (!feedback) {
        showToast('反馈不存在', 'error');
        return;
    }
    
    const statusMap = {
        'pending': '待回复',
        'replied': '已回复',
        'resolved': '已解决',
        'closed': '已关闭'
    };
    
    const typeMap = {
        'complaint': '投诉',
        'suggestion': '建议',
        'praise': '表扬',
        'question': '咨询'
    };
    
    alert(`反馈详情：
客户: ${feedback.customer}
电话: ${feedback.customerPhone || '-'}
评分: ${getStars(feedback.rating)}
内容: ${feedback.content}
类型: ${typeMap[feedback.type] || feedback.type}
状态: ${statusMap[feedback.status] || feedback.status}
订单号: ${feedback.orderId || '-'}
创建时间: ${formatDate(feedback.createdAt)}
${feedback.reply ? `回复: ${feedback.reply}\n回复时间: ${formatDate(feedback.repliedAt)}` : '暂无回复'}`);
}

/**
 * @private
 * @param {string} id - 反馈ID
 * @description 回复反馈
 */
function replyFeedback(id) {
    const feedback = state.feedbacks.find(f => f.id === id);
    if (!feedback) {
        showToast('反馈不存在', 'error');
        return;
    }
    
    const reply = prompt('请输入回复内容：');
    if (reply === null) return;
    if (!reply.trim()) {
        showToast('回复内容不能为空', 'warning');
        return;
    }
    
    feedback.reply = reply.trim();
    feedback.status = 'replied';
    feedback.repliedAt = new Date().toISOString();
    feedback.updatedAt = new Date().toISOString();
    
    saveFeedbacks();
    applyFilters();
    showToast('回复已发送', 'success');
}

/**
 * @private
 * @param {string} id - 反馈ID
 * @description 删除反馈
 */
function deleteFeedback(id) {
    const feedback = state.feedbacks.find(f => f.id === id);
    if (!feedback) {
        showToast('反馈不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除反馈 "${feedback.content.substring(0, 30)}..."？`)) return;
    
    state.feedbacks = state.feedbacks.filter(f => f.id !== id);
    saveFeedbacks();
    applyFilters();
    showToast('反馈已删除', 'success');
}

/**
 * @private
 * @param {number} page - 页码
 * @description 跳转到指定页
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredFeedbacks.length / state.limit);
    if (page < 1 || page > totalPages) return;
    state.page = page;
    renderFeedbacks();
    renderPagination();
}

/**
 * @private
 * @description 搜索反馈
 */
function searchFeedbacks(query) {
    state.searchQuery = query;
    state.page = 1;
    applyFilters();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFiltersAndRender() {
    applyFilters();
}

/**
 * @private
 * @description 重置筛选
 */
function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.value = '';
    if (typeFilter) typeFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    
    state.searchQuery = '';
    state.typeFilter = 'all';
    state.statusFilter = 'all';
    state.page = 1;
    applyFilters();
}

/**
 * @private
 * @description 刷新数据
 */
function refresh() {
    loadFeedbacks();
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
                searchFeedbacks(this.value);
            }, 300);
        });
    }
    
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', applyFiltersAndRender);
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFiltersAndRender);
    }
    
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    const refreshBtn = document.getElementById('refreshFeedbacks');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {Feedback[]} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('💬 客户反馈 初始化...');
    
    if (options?.data) {
        state.feedbacks = options.data;
        localStorage.setItem('feedback_data', JSON.stringify(state.feedbacks));
    }
    
    loadFeedbacks();
    bindEvents();
    
    window.FeedbackModule = {
        state,
        loadFeedbacks,
        renderFeedbacks,
        renderPagination,
        updateStats,
        viewFeedback,
        replyFeedback,
        deleteFeedback,
        goToPage,
        searchFeedbacks,
        applyFilters: applyFiltersAndRender,
        resetFilters,
        refresh,
        saveFeedbacks
    };
    
    console.log('✅ 客户反馈 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadFeedbacks,
    viewFeedback,
    replyFeedback,
    deleteFeedback,
    goToPage,
    refresh,
    saveFeedbacks
};