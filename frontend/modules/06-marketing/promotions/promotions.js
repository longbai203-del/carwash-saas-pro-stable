/**
 * modules/06-marketing/promotions/promotions.js - 促销管理模块
 * @module promotions
 * @description 促销活动的CRUD操作、状态管理、统计
 * 
 * @example
 * import { init } from './promotions.js';
 * init();
 */

/**
 * 促销状态
 */
const state = {
    promotions: [],
    filteredPromotions: [],
    loading: false,
    page: 1,
    pageSize: 10,
    editingId: null,
    filters: {
        name: '',
        type: '',
        status: ''
    }
};

const TYPE_MAP = {
    discount: { label: '折扣', color: '#DBEAFE', textColor: '#1E40AF' },
    coupon: { label: '优惠券', color: '#D1FAE5', textColor: '#065F46' },
    bundle: { label: '组合优惠', color: '#EDE9FE', textColor: '#6D28D9' },
    member: { label: '会员专享', color: '#FEF3C7', textColor: '#92400E' }
};

const STATUS_MAP = {
    active: { label: '进行中', color: '#D1FAE5', textColor: '#065F46' },
    pending: { label: '待开始', color: '#FEF3C7', textColor: '#92400E' },
    ended: { label: '已结束', color: '#F3F4F6', textColor: '#4B5563' }
};

/**
 * 初始化促销管理
 * @returns {Promise<void>}
 */
export async function init() {
    console.log('🎯 促销管理模块初始化...');
    
    try {
        loadPromotions();
        render();
        bindEvents();
        initModalEvents();
        console.log('✅ 促销管理初始化完成');
    } catch (error) {
        console.error('❌ 促销管理初始化失败:', error);
        showError('加载促销数据失败');
    }
}

/**
 * 加载促销数据
 * @returns {void}
 */
function loadPromotions() {
    const saved = localStorage.getItem('promotion_data');
    if (saved) {
        try {
            state.promotions = JSON.parse(saved);
        } catch (e) {
            state.promotions = getMockPromotions();
        }
    } else {
        state.promotions = getMockPromotions();
        localStorage.setItem('promotion_data', JSON.stringify(state.promotions));
    }
    state.filteredPromotions = [...state.promotions];
}

/**
 * 获取模拟促销数据
 * @returns {Array} 促销数组
 */
function getMockPromotions() {
    return [
        { id: 'PM-001', name: '夏日特惠', type: 'discount', value: '20%', status: 'active', startDate: '2024-06-01', endDate: '2024-08-31', desc: '夏季洗车服务8折优惠' },
        { id: 'PM-002', name: '新客立减', type: 'coupon', value: '¥50', status: 'active', startDate: '2024-01-01', endDate: '2024-12-31', desc: '新客户首次洗车立减50元' },
        { id: 'PM-003', name: '会员折扣', type: 'member', value: '15%', status: 'ended', startDate: '2024-01-01', endDate: '2024-06-30', desc: '会员专享85折优惠' },
        { id: 'PM-004', name: '国庆特惠', type: 'bundle', value: '满300减50', status: 'pending', startDate: '2024-10-01', endDate: '2024-10-07', desc: '国庆期间满300减50' },
        { id: 'PM-005', name: '双十一优惠', type: 'discount', value: '30%', status: 'pending', startDate: '2024-11-01', endDate: '2024-11-11', desc: '双十一全场7折' }
    ];
}

/**
 * 渲染促销列表
 * @returns {void}
 */
function render() {
    const tbody = document.getElementById('promotionsTableBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredPromotions.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-tags" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无促销数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(p => {
        const type = TYPE_MAP[p.type] || TYPE_MAP.discount;
        const status = STATUS_MAP[p.status] || STATUS_MAP.pending;
        
        return `
            <tr>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;"><strong>${p.name}</strong></td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <span style="display:inline-block;padding:4px 10px;border-radius:9999px;font-size:12px;background:${type.color};color:${type.textColor};">
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;text-align:center;font-weight:700;">${p.value}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#6B7280;">
                    ${p.startDate || '-'} ~ ${p.endDate || '-'}
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <span style="display:inline-block;padding:4px 10px;border-radius:9999px;font-size:12px;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn-sm btn-sm-primary" onclick="editPromotion('${p.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-sm ${p.status === 'active' ? 'btn-sm-warning' : 'btn-sm-success'}" 
                                onclick="togglePromotion('${p.id}')"
                                style="${p.status === 'active' ? 'background:#F59E0B;color:white;' : 'background:#10B981;color:white;'}">
                            <i class="fas ${p.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button class="btn-sm btn-sm-danger" onclick="deletePromotion('${p.id}')">
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
 * 更新统计
 * @returns {void}
 */
function updateStats() {
    document.getElementById('totalPromotions').textContent = state.promotions.length;
    document.getElementById('activePromotions').textContent = state.promotions.filter(p => p.status === 'active').length;
    document.getElementById('pendingPromotions').textContent = state.promotions.filter(p => p.status === 'pending').length;
    document.getElementById('endedPromotions').textContent = state.promotions.filter(p => p.status === 'ended').length;
    document.getElementById('totalCount').textContent = state.filteredPromotions.length;
}

/**
 * 渲染分页
 * @returns {void}
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredPromotions.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="changePage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="changePage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * 切换页面
 * @param {number} page - 页码
 * @returns {void}
 */
window.changePage = function(page) {
    const total = state.filteredPromotions.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
};

/**
 * 编辑促销
 * @param {string} id - 促销ID
 * @returns {void}
 */
window.editPromotion = function(id) {
    const promotion = state.promotions.find(p => p.id === id);
    if (!promotion) {
        showToast('促销不存在', 'error');
        return;
    }
    
    state.editingId = id;
    document.getElementById('modalTitle').textContent = '编辑促销';
    document.getElementById('formName').value = promotion.name;
    document.getElementById('formType').value = promotion.type;
    document.getElementById('formValue').value = promotion.value;
    document.getElementById('formStatus').value = promotion.status;
    document.getElementById('formStartDate').value = promotion.startDate || '';
    document.getElementById('formEndDate').value = promotion.endDate || '';
    document.getElementById('formDesc').value = promotion.desc || '';
    document.getElementById('promotionModal').style.display = 'flex';
};

/**
 * 切换促销状态
 * @param {string} id - 促销ID
 * @returns {void}
 */
window.togglePromotion = function(id) {
    const promotion = state.promotions.find(p => p.id === id);
    if (!promotion) return;
    
    const statusMap = { active: 'ended', pending: 'active', ended: 'active' };
    promotion.status = statusMap[promotion.status] || 'active';
    localStorage.setItem('promotion_data', JSON.stringify(state.promotions));
    state.filteredPromotions = [...state.promotions];
    render();
    showToast('状态已切换', 'success');
};

/**
 * 删除促销
 * @param {string} id - 促销ID
 * @returns {void}
 */
window.deletePromotion = function(id) {
    if (!confirm('确认删除该促销？')) return;
    state.promotions = state.promotions.filter(p => p.id !== id);
    state.filteredPromotions = [...state.promotions];
    localStorage.setItem('promotion_data', JSON.stringify(state.promotions));
    render();
    showToast('促销已删除', 'success');
};

/**
 * 保存促销
 * @returns {void}
 */
function savePromotion() {
    const name = document.getElementById('formName').value.trim();
    const type = document.getElementById('formType').value;
    const value = document.getElementById('formValue').value.trim();
    const status = document.getElementById('formStatus').value;
    const startDate = document.getElementById('formStartDate').value;
    const endDate = document.getElementById('formEndDate').value;
    const desc = document.getElementById('formDesc').value.trim();

    if (!name) { showToast('请输入促销名称', 'warning'); return; }
    if (!value) { showToast('请输入优惠值', 'warning'); return; }

    const data = { name, type, value, status, startDate, endDate, desc };

    if (state.editingId) {
        const promotion = state.promotions.find(p => p.id === state.editingId);
        if (promotion) {
            Object.assign(promotion, data);
            showToast('促销已更新', 'success');
        }
    } else {
        const newPromotion = {
            id: 'PM-' + Date.now().toString().slice(-6),
            ...data
        };
        state.promotions.push(newPromotion);
        showToast('促销已创建', 'success');
    }

    localStorage.setItem('promotion_data', JSON.stringify(state.promotions));
    state.filteredPromotions = [...state.promotions];
    closeModal();
    render();
}

/**
 * 显示新建促销弹窗
 * @returns {void}
 */
function showCreateModal() {
    state.editingId = null;
    document.getElementById('modalTitle').textContent = '新建促销';
    document.getElementById('formName').value = '';
    document.getElementById('formType').value = 'discount';
    document.getElementById('formValue').value = '';
    document.getElementById('formStatus').value = 'pending';
    document.getElementById('formStartDate').value = '';
    document.getElementById('formEndDate').value = '';
    document.getElementById('formDesc').value = '';
    document.getElementById('promotionModal').style.display = 'flex';
}

/**
 * 关闭弹窗
 * @returns {void}
 */
function closeModal() {
    document.getElementById('promotionModal').style.display = 'none';
}

/**
 * 搜索促销
 * @returns {void}
 */
function handleSearch() {
    const name = document.getElementById('searchName').value.toLowerCase();
    const type = document.getElementById('searchType').value;
    const status = document.getElementById('searchStatus').value;
    
    state.filteredPromotions = state.promotions.filter(p => {
        let match = true;
        if (name && !p.name.toLowerCase().includes(name)) match = false;
        if (type && p.type !== type) match = false;
        if (status && p.status !== status) match = false;
        return match;
    });
    state.page = 1;
    render();
}

/**
 * 重置搜索
 * @returns {void}
 */
function handleReset() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchType').value = '';
    document.getElementById('searchStatus').value = '';
    state.filteredPromotions = [...state.promotions];
    state.page = 1;
    render();
}

/**
 * 绑定事件
 * @returns {void}
 */
function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreateModal);
    document.querySelectorAll('#searchName, #searchType, #searchStatus').forEach(el => {
        el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * 初始化弹窗事件
 * @returns {void}
 */
function initModalEvents() {
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelModal')?.addEventListener('click', closeModal);
    document.getElementById('savePromotion')?.addEventListener('click', savePromotion);
    document.getElementById('promotionModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 * @returns {void}
 */
function showError(message) {
    const container = document.querySelector('.promotion-container');
    if (!container) return;
    container.innerHTML = `
        <div style="padding:40px;text-align:center;">
            <i class="fas fa-exclamation-circle" style="font-size:48px;color:#EF4444;"></i>
            <p style="color:#6B7280;">${message}</p>
            <button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;">
                重新加载
            </button>
        </div>
    `;
}

/**
 * 显示Toast提示
 * @param {string} message - 消息内容
 * @param {string} type - 类型
 * @returns {void}
 */
function showToast(message, type) {
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#4F46E5'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        background: ${colors[type] || '#4F46E5'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 暴露全局函数
window.changePage = window.changePage;
window.editPromotion = window.editPromotion;
window.togglePromotion = window.togglePromotion;
window.deletePromotion = window.deletePromotion;

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default { init };