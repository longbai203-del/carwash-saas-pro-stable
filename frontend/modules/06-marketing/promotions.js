/**
 * @file promotions.js
 * @module promotions
 * @description 促销管理模块 - 促销活动的CRUD操作、状态管理、统计
 * 
 * @example
 * import { init } from './promotions.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Promotion
 * @property {string} id - 促销ID
 * @property {string} name - 促销名称
 * @property {string} type - 类型 (discount/coupon/bundle/member)
 * @property {string} value - 优惠值
 * @property {string} status - 状态 (active/pending/ended)
 * @property {string} startDate - 开始日期
 * @property {string} endDate - 结束日期
 * @property {string} [desc] - 描述
 * @property {string} [applicableProducts] - 适用商品
 * @property {number} [usageCount] - 使用次数
 * @property {number} [usageLimit] - 使用限制
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} PromotionState
 * @property {Promotion[]} promotions - 促销列表
 * @property {Promotion[]} filteredPromotions - 过滤后的促销列表
 * @property {Object} filters - 筛选条件
 * @property {number} page - 页码
 * @property {number} pageSize - 每页数量
 * @property {string|null} editingId - 编辑中的促销ID
 * @property {boolean} loading - 加载状态
 */

/** @type {PromotionState} 状态 */
const state = {
    promotions: [],
    filteredPromotions: [],
    filters: {
        name: '',
        type: '',
        status: ''
    },
    page: 1,
    pageSize: 10,
    editingId: null,
    loading: false
};

/**
 * 类型配置
 */
const TYPE_MAP = {
    discount: { label: '折扣', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-percent' },
    coupon: { label: '优惠券', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-ticket-alt' },
    bundle: { label: '组合优惠', color: '#EDE9FE', textColor: '#6D28D9', icon: 'fa-object-group' },
    member: { label: '会员专享', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-crown' }
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    active: { label: '进行中', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-play' },
    pending: { label: '待开始', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    ended: { label: '已结束', color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-stop' }
};

/**
 * @private
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    return date;
}

/**
 * @private
 * @returns {Promotion[]} 模拟促销数据
 */
function getMockPromotions() {
    return [
        { id: 'PM-001', name: '夏日特惠', type: 'discount', value: '20%', status: 'active', startDate: '2024-06-01', endDate: '2024-08-31', desc: '夏季洗车服务8折优惠', applicableProducts: '全部', usageCount: 156, usageLimit: 500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'PM-002', name: '新客立减', type: 'coupon', value: '¥50', status: 'active', startDate: '2024-01-01', endDate: '2024-12-31', desc: '新客户首次洗车立减50元', applicableProducts: '标准洗车', usageCount: 89, usageLimit: 200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'PM-003', name: '会员折扣', type: 'member', value: '15%', status: 'ended', startDate: '2024-01-01', endDate: '2024-06-30', desc: '会员专享85折优惠', applicableProducts: '全部', usageCount: 234, usageLimit: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'PM-004', name: '国庆特惠', type: 'bundle', value: '满300减50', status: 'pending', startDate: '2024-10-01', endDate: '2024-10-07', desc: '国庆期间满300减50', applicableProducts: '全部', usageCount: 0, usageLimit: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'PM-005', name: '双十一优惠', type: 'discount', value: '30%', status: 'pending', startDate: '2024-11-01', endDate: '2024-11-11', desc: '双十一全场7折', applicableProducts: '全部', usageCount: 0, usageLimit: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
}

/**
 * @private
 * @description 加载促销数据
 */
function loadPromotions() {
    try {
        const saved = localStorage.getItem('promotion_data');
        if (saved) {
            state.promotions = JSON.parse(saved);
        } else {
            state.promotions = getMockPromotions();
            localStorage.setItem('promotion_data', JSON.stringify(state.promotions));
        }
    } catch (e) {
        console.warn('加载促销数据失败:', e);
        state.promotions = getMockPromotions();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存促销数据
 */
function savePromotions() {
    try {
        localStorage.setItem('promotion_data', JSON.stringify(state.promotions));
    } catch (e) {
        console.warn('保存促销数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.promotions;
    
    if (state.filters.name) {
        const name = state.filters.name.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(name));
    }
    
    if (state.filters.type) {
        filtered = filtered.filter(p => p.type === state.filters.type);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(p => p.status === state.filters.status);
    }
    
    state.filteredPromotions = filtered;
}

/**
 * @private
 * @description 渲染促销列表
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
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-tags" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    ${state.loading ? '加载中...' : '暂无促销数据'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(p => {
        const type = TYPE_MAP[p.type] || TYPE_MAP.discount;
        const status = STATUS_MAP[p.status] || STATUS_MAP.pending;
        const usageDisplay = p.usageLimit > 0 ? `${p.usageCount || 0}/${p.usageLimit}` : `${p.usageCount || 0}`;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${p.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${p.desc || ''}</div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        <i class="fas ${type.icon}" style="margin-right:4px;"></i>
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:center;font-weight:700;color:#4F46E5;">${p.value}</td>
                <td style="padding:10px 16px;text-align:center;font-size:13px;color:#6B7280;">${usageDisplay}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">
                    ${formatDate(p.startDate)} ~ ${formatDate(p.endDate)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.PromotionsModule.editPromotion('${p.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.PromotionsModule.togglePromotion('${p.id}')" title="切换状态"
                                style="${p.status === 'active' ? 'color:#F59E0B;' : p.status === 'pending' ? 'color:#10B981;' : 'color:#3B82F6;'}">
                            <i class="fas ${p.status === 'active' ? 'fa-pause' : p.status === 'pending' ? 'fa-play' : 'fa-undo'}"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.PromotionsModule.deletePromotion('${p.id}')" title="删除">
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
    const elements = {
        'totalPromotions': state.promotions.length,
        'activePromotions': state.promotions.filter(p => p.status === 'active').length,
        'pendingPromotions': state.promotions.filter(p => p.status === 'pending').length,
        'endedPromotions': state.promotions.filter(p => p.status === 'ended').length,
        'totalCount': state.filteredPromotions.length
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

    const total = state.filteredPromotions.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条促销
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
        <button onclick="window.PromotionsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.PromotionsModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.PromotionsModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.PromotionsModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.PromotionsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredPromotions.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 促销ID
 */
function editPromotion(id) {
    const promotion = state.promotions.find(p => p.id === id);
    if (!promotion) {
        showToast('促销不存在', 'error');
        return;
    }
    
    state.editingId = id;
    const modal = document.getElementById('promotionModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = '编辑促销';
        document.getElementById('formName').value = promotion.name;
        document.getElementById('formType').value = promotion.type || 'discount';
        document.getElementById('formValue').value = promotion.value || '';
        document.getElementById('formStatus').value = promotion.status || 'pending';
        document.getElementById('formStartDate').value = promotion.startDate || '';
        document.getElementById('formEndDate').value = promotion.endDate || '';
        document.getElementById('formDesc').value = promotion.desc || '';
        document.getElementById('formApplicable').value = promotion.applicableProducts || '全部';
        document.getElementById('formUsageLimit').value = promotion.usageLimit || 0;
        modal.style.display = 'flex';
    } else {
        // 降级方案
        const name = prompt('促销名称：', promotion.name);
        if (name === null) return;
        const value = prompt('优惠值：', promotion.value);
        if (value === null) return;
        const statusOptions = ['1. active (进行中)', '2. pending (待开始)', '3. ended (已结束)'];
        const statusIdx = prompt(`选择状态：\n${statusOptions.join('\n')}`, 
            promotion.status === 'active' ? '1' : promotion.status === 'pending' ? '2' : '3');
        if (statusIdx === null) return;
        const statuses = ['active', 'pending', 'ended'];
        
        promotion.name = name.trim() || promotion.name;
        promotion.value = value.trim() || promotion.value;
        promotion.status = statuses[parseInt(statusIdx) - 1] || promotion.status;
        promotion.updatedAt = new Date().toISOString();
        
        savePromotions();
        applyFilters();
        render();
        showToast('促销已更新', 'success');
    }
}

/**
 * @private
 * @param {string} id - 促销ID
 */
function togglePromotion(id) {
    const promotion = state.promotions.find(p => p.id === id);
    if (!promotion) {
        showToast('促销不存在', 'error');
        return;
    }
    
    const statusMap = { 
        active: 'ended', 
        pending: 'active', 
        ended: 'active' 
    };
    const newStatus = statusMap[promotion.status] || 'active';
    const statusLabels = { active: '进行中', pending: '待开始', ended: '已结束' };
    
    promotion.status = newStatus;
    promotion.updatedAt = new Date().toISOString();
    savePromotions();
    applyFilters();
    render();
    showToast(`状态已切换为: ${statusLabels[newStatus]}`, 'success');
}

/**
 * @private
 * @param {string} id - 促销ID
 */
function deletePromotion(id) {
    const promotion = state.promotions.find(p => p.id === id);
    if (!promotion) {
        showToast('促销不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除促销 "${promotion.name}"？`)) return;
    
    state.promotions = state.promotions.filter(p => p.id !== id);
    savePromotions();
    applyFilters();
    render();
    showToast('促销已删除', 'success');
}

/**
 * @private
 */
function savePromotion() {
    const name = document.getElementById('formName').value.trim();
    const type = document.getElementById('formType').value;
    const value = document.getElementById('formValue').value.trim();
    const status = document.getElementById('formStatus').value;
    const startDate = document.getElementById('formStartDate').value;
    const endDate = document.getElementById('formEndDate').value;
    const desc = document.getElementById('formDesc').value.trim();
    const applicableProducts = document.getElementById('formApplicable')?.value || '全部';
    const usageLimit = parseInt(document.getElementById('formUsageLimit')?.value) || 0;

    if (!name) { showToast('请输入促销名称', 'warning'); return; }
    if (!value) { showToast('请输入优惠值', 'warning'); return; }

    const data = { name, type, value, status, startDate, endDate, desc, applicableProducts, usageLimit };

    if (state.editingId) {
        const promotion = state.promotions.find(p => p.id === state.editingId);
        if (promotion) {
            Object.assign(promotion, data);
            promotion.updatedAt = new Date().toISOString();
            showToast('促销已更新', 'success');
        }
    } else {
        const newPromotion = {
            id: 'PM-' + Date.now().toString().slice(-6),
            ...data,
            usageCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.promotions.push(newPromotion);
        showToast('促销已创建', 'success');
    }

    savePromotions();
    applyFilters();
    closeModal();
    render();
}

/**
 * @private
 */
function showCreateModal() {
    state.editingId = null;
    const modal = document.getElementById('promotionModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = '新建促销';
        document.getElementById('formName').value = '';
        document.getElementById('formType').value = 'discount';
        document.getElementById('formValue').value = '';
        document.getElementById('formStatus').value = 'pending';
        document.getElementById('formStartDate').value = '';
        document.getElementById('formEndDate').value = '';
        document.getElementById('formDesc').value = '';
        document.getElementById('formApplicable').value = '全部';
        document.getElementById('formUsageLimit').value = '0';
        modal.style.display = 'flex';
    } else {
        // 降级方案
        const name = prompt('促销名称：');
        if (!name) return;
        const typeOptions = ['1. discount (折扣)', '2. coupon (优惠券)', '3. bundle (组合优惠)', '4. member (会员专享)'];
        const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
        const types = ['discount', 'coupon', 'bundle', 'member'];
        const type = types[typeIdx - 1] || 'discount';
        const value = prompt('优惠值：');
        if (!value) return;
        const statusOptions = ['1. active (进行中)', '2. pending (待开始)', '3. ended (已结束)'];
        const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, '2'));
        const statuses = ['active', 'pending', 'ended'];
        
        const newPromotion = {
            id: 'PM-' + Date.now().toString().slice(-6),
            name: name.trim(),
            type: type,
            value: value.trim(),
            status: statuses[statusIdx - 1] || 'pending',
            startDate: '',
            endDate: '',
            desc: '',
            applicableProducts: '全部',
            usageCount: 0,
            usageLimit: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.promotions.push(newPromotion);
        savePromotions();
        applyFilters();
        render();
        showToast('促销已创建', 'success');
    }
}

/**
 * @private
 */
function closeModal() {
    const modal = document.getElementById('promotionModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.type = document.getElementById('searchType')?.value || '';
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
    const typeInput = document.getElementById('searchType');
    const statusInput = document.getElementById('searchStatus');
    
    if (nameInput) nameInput.value = '';
    if (typeInput) typeInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { name: '', type: '', status: '' };
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
    
    document.querySelectorAll('#searchName, #searchType, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @private
 */
function initModalEvents() {
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    const cancelBtn = document.getElementById('cancelModal');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    const saveBtn = document.getElementById('savePromotion');
    if (saveBtn) saveBtn.addEventListener('click', savePromotion);
    
    const modal = document.getElementById('promotionModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {Promotion[]} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('🎯 促销管理模块初始化...');
    
    if (options?.data) {
        state.promotions = options.data;
        localStorage.setItem('promotion_data', JSON.stringify(state.promotions));
    }
    
    loadPromotions();
    bindEvents();
    initModalEvents();
    render();
    
    window.PromotionsModule = {
        state,
        loadPromotions,
        render,
        renderPagination,
        updateStats,
        editPromotion,
        togglePromotion,
        deletePromotion,
        goToPage,
        showCreateModal,
        closeModal,
        handleSearch,
        handleReset,
        savePromotions,
        applyFilters
    };
    
    console.log('✅ 促销管理初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadPromotions,
    editPromotion,
    togglePromotion,
    deletePromotion,
    goToPage,
    showCreateModal,
    savePromotion,
    savePromotions
};