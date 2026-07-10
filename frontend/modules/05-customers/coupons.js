/**
 * @file coupons.js
 * @module coupons
 * @description 优惠券管理模块 - 优惠券的CRUD操作和数据管理
 * 
 * @example
 * import { init } from './coupons.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Coupon
 * @property {string} id - 优惠券ID
 * @property {string} name - 优惠券名称
 * @property {string} code - 优惠券代码
 * @property {string} type - 类型 (discount/percent/free)
 * @property {number} value - 优惠值
 * @property {number} minOrder - 最低消费金额
 * @property {number} maxDiscount - 最大优惠金额 (仅百分比类型)
 * @property {string} validFrom - 有效期开始
 * @property {string} validTo - 有效期结束
 * @property {string} status - 状态 (active/used/expired/inactive)
 * @property {number} usageLimit - 使用限制次数
 * @property {number} usedCount - 已使用次数
 * @property {string} [applicableProducts] - 适用商品 (all/category/特定ID)
 * @property {string} [description] - 描述
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} CouponState
 * @property {Coupon[]} coupons - 优惠券列表
 * @property {Coupon[]} filteredCoupons - 过滤后的优惠券列表
 * @property {string} searchQuery - 搜索关键词
 * @property {string} typeFilter - 类型筛选
 * @property {string} statusFilter - 状态筛选
 * @property {number} page - 页码
 * @property {number} limit - 每页数量
 * @property {string|null} editingId - 编辑中的优惠券ID
 */

/** @type {CouponState} 状态 */
const state = {
    coupons: [],
    filteredCoupons: [],
    searchQuery: '',
    typeFilter: 'all',
    statusFilter: 'all',
    page: 1,
    limit: 10,
    editingId: null
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
 * @returns {Coupon[]} 模拟优惠券数据
 */
function getMockCoupons() {
    const names = ['新客优惠券', '满减优惠券', '折扣优惠券', '会员专享券', '节日特惠券'];
    const codes = ['WELCOME', 'SAVE20', 'DISCOUNT10', 'VIP2024', 'FESTIVAL'];
    const types = ['discount', 'discount', 'percent', 'discount', 'percent'];
    const statuses = ['active', 'active', 'used', 'active', 'expired'];
    const values = [20, 30, 10, 50, 15];
    const minOrders = [0, 100, 0, 200, 0];
    
    const coupons = [];
    for (let i = 0; i < 8; i++) {
        const daysFrom = Math.floor(Math.random() * 30);
        const daysTo = Math.floor(Math.random() * 60) + 30;
        
        coupons.push({
            id: `CPN-${String(i + 1).padStart(6, '0')}`,
            name: names[i % names.length],
            code: codes[i % codes.length] + String(Math.floor(Math.random() * 100)),
            type: types[i % types.length],
            value: values[i % values.length],
            minOrder: minOrders[i % minOrders.length],
            maxDiscount: types[i % types.length] === 'percent' ? 50 : 0,
            validFrom: new Date(Date.now() - daysFrom * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            validTo: new Date(Date.now() + daysTo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: statuses[i % statuses.length],
            usageLimit: Math.floor(Math.random() * 50) + 10,
            usedCount: Math.floor(Math.random() * 20),
            applicableProducts: 'all',
            description: names[i % names.length] + '优惠',
            createdAt: new Date(Date.now() - (30 + Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return coupons;
}

/**
 * @private
 * @description 加载优惠券数据
 */
function loadCoupons() {
    try {
        const saved = localStorage.getItem('coupon_data');
        if (saved) {
            state.coupons = JSON.parse(saved);
        } else {
            state.coupons = getMockCoupons();
            localStorage.setItem('coupon_data', JSON.stringify(state.coupons));
        }
    } catch (e) {
        console.warn('加载优惠券数据失败:', e);
        state.coupons = getMockCoupons();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存优惠券数据
 */
function saveCoupons() {
    try {
        localStorage.setItem('coupon_data', JSON.stringify(state.coupons));
    } catch (e) {
        console.warn('保存优惠券数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.coupons;
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(query) ||
            c.code.toLowerCase().includes(query) ||
            (c.description && c.description.toLowerCase().includes(query))
        );
    }
    
    if (state.typeFilter !== 'all') {
        filtered = filtered.filter(c => c.type === state.typeFilter);
    }
    
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(c => c.status === state.statusFilter);
    }
    
    state.filteredCoupons = filtered;
    renderCoupons();
    updateStats();
    renderPagination();
}

/**
 * @private
 * @description 渲染优惠券列表
 */
function renderCoupons() {
    const container = document.getElementById('couponListBody');
    if (!container) return;
    
    const start = (state.page - 1) * state.limit;
    const end = start + state.limit;
    const paginated = state.filteredCoupons.slice(start, end);
    
    if (paginated.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-ticket-alt" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无优惠券数据
                </td>
            </tr>
        `;
        return;
    }
    
    const statusMap = {
        'active': { label: '有效', color: '#065F46', bg: '#D1FAE5' },
        'used': { label: '已使用', color: '#92400E', bg: '#FEF3C7' },
        'expired': { label: '已过期', color: '#991B1B', bg: '#FEE2E2' },
        'inactive': { label: '已停用', color: '#6B7280', bg: '#F3F4F6' }
    };
    
    const typeMap = {
        'discount': '满减',
        'percent': '折扣',
        'free': '免费'
    };
    
    container.innerHTML = paginated.map(coupon => {
        const status = statusMap[coupon.status] || statusMap.active;
        const typeLabel = typeMap[coupon.type] || coupon.type;
        const usage = coupon.usageLimit > 0 ? `${coupon.usedCount}/${coupon.usageLimit}` : '不限';
        const valueDisplay = coupon.type === 'percent' ? `${coupon.value}%` : `¥${formatCurrency(coupon.value)}`;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${coupon.name}</td>
                <td style="padding:10px 16px;font-family:monospace;font-size:13px;background:#F9FAFB;border-radius:4px;">
                    ${coupon.code}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;background:#F3F4F6;color:#4B5563;">
                        ${typeLabel}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#4F46E5;">
                    ${valueDisplay}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">
                    ${coupon.minOrder > 0 ? '满¥' + formatCurrency(coupon.minOrder) : '无门槛'}
                </td>
                <td style="padding:10px 16px;text-align:center;font-size:13px;">${usage}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.bg};color:${status.color};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.CouponsModule.editCoupon('${coupon.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.CouponsModule.viewCoupon('${coupon.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.CouponsModule.deleteCoupon('${coupon.id}')" title="删除">
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
    
    const total = state.filteredCoupons.length;
    const totalPages = Math.ceil(total / state.limit);
    
    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 张优惠券
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 张优惠券，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
    `;
    
    html += `
        <button onclick="window.CouponsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.CouponsModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.CouponsModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.CouponsModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.CouponsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const total = state.coupons.length;
    const active = state.coupons.filter(c => c.status === 'active').length;
    const used = state.coupons.filter(c => c.status === 'used').length;
    const expired = state.coupons.filter(c => c.status === 'expired').length;
    const discountCoupons = state.coupons.filter(c => c.type === 'discount').length;
    const percentCoupons = state.coupons.filter(c => c.type === 'percent').length;
    const totalUsed = state.coupons.reduce((sum, c) => sum + c.usedCount, 0);
    
    const elements = {
        'statTotal': total,
        'statActive': active,
        'statUsed': used,
        'statExpired': expired,
        'statDiscount': discountCoupons,
        'statPercent': percentCoupons,
        'statTotalUsed': totalUsed
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @param {string} id - 优惠券ID
 * @description 查看优惠券详情
 */
function viewCoupon(id) {
    const coupon = state.coupons.find(c => c.id === id);
    if (!coupon) {
        showToast('优惠券不存在', 'error');
        return;
    }
    
    const statusMap = {
        'active': '有效',
        'used': '已使用',
        'expired': '已过期',
        'inactive': '已停用'
    };
    
    const typeMap = {
        'discount': '满减',
        'percent': '折扣',
        'free': '免费'
    };
    
    const valueDisplay = coupon.type === 'percent' ? `${coupon.value}%` : `¥${formatCurrency(coupon.value)}`;
    const usage = coupon.usageLimit > 0 ? `${coupon.usedCount}/${coupon.usageLimit}` : '不限';
    
    alert(`优惠券详情：
名称: ${coupon.name}
代码: ${coupon.code}
类型: ${typeMap[coupon.type] || coupon.type}
优惠: ${valueDisplay}
最低消费: ${coupon.minOrder > 0 ? '¥' + formatCurrency(coupon.minOrder) : '无门槛'}
有效期: ${formatDate(coupon.validFrom)} ~ ${formatDate(coupon.validTo)}
状态: ${statusMap[coupon.status] || coupon.status}
使用次数: ${usage}
描述: ${coupon.description || '无'}`);
}

/**
 * @private
 * @param {string} id - 优惠券ID
 * @description 编辑优惠券
 */
function editCoupon(id) {
    const coupon = state.coupons.find(c => c.id === id);
    if (!coupon) {
        showToast('优惠券不存在', 'error');
        return;
    }
    
    const modal = document.getElementById('couponModal');
    if (modal) {
        state.editingId = id;
        document.getElementById('modalTitle').textContent = '编辑优惠券';
        document.getElementById('couponName').value = coupon.name;
        document.getElementById('couponCode').value = coupon.code;
        document.getElementById('couponType').value = coupon.type || 'discount';
        document.getElementById('couponValue').value = coupon.value;
        document.getElementById('couponMinOrder').value = coupon.minOrder || 0;
        document.getElementById('couponMaxDiscount').value = coupon.maxDiscount || 0;
        document.getElementById('couponValidFrom').value = coupon.validFrom || '';
        document.getElementById('couponValidTo').value = coupon.validTo || '';
        document.getElementById('couponStatus').value = coupon.status || 'active';
        document.getElementById('couponUsageLimit').value = coupon.usageLimit || 0;
        document.getElementById('couponDescription').value = coupon.description || '';
        modal.style.display = 'flex';
    } else {
        // 降级方案
        const name = prompt('优惠券名称：', coupon.name);
        if (name === null) return;
        const code = prompt('优惠券代码：', coupon.code);
        if (code === null) return;
        const value = parseFloat(prompt('优惠值：', coupon.value));
        if (isNaN(value) || value < 0) {
            showToast('请输入有效优惠值', 'error');
            return;
        }
        
        coupon.name = name.trim() || coupon.name;
        coupon.code = code.trim().toUpperCase() || coupon.code;
        coupon.value = value;
        coupon.updatedAt = new Date().toISOString();
        
        saveCoupons();
        applyFilters();
        showToast('优惠券已更新', 'success');
    }
}

/**
 * @private
 * @param {string} id - 优惠券ID
 * @description 删除优惠券
 */
function deleteCoupon(id) {
    const coupon = state.coupons.find(c => c.id === id);
    if (!coupon) {
        showToast('优惠券不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除优惠券 "${coupon.name}"？`)) return;
    
    state.coupons = state.coupons.filter(c => c.id !== id);
    saveCoupons();
    applyFilters();
    showToast('优惠券已删除', 'success');
}

/**
 * @private
 * @description 保存优惠券（弹窗）
 */
function saveCoupon() {
    const name = document.getElementById('couponName').value.trim();
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const type = document.getElementById('couponType').value;
    const value = parseFloat(document.getElementById('couponValue').value);
    const minOrder = parseFloat(document.getElementById('couponMinOrder').value) || 0;
    const maxDiscount = parseFloat(document.getElementById('couponMaxDiscount').value) || 0;
    const validFrom = document.getElementById('couponValidFrom').value;
    const validTo = document.getElementById('couponValidTo').value;
    const status = document.getElementById('couponStatus').value;
    const usageLimit = parseInt(document.getElementById('couponUsageLimit').value) || 0;
    const description = document.getElementById('couponDescription').value.trim();

    if (!name) { showToast('请输入优惠券名称', 'warning'); return; }
    if (!code) { showToast('请输入优惠券代码', 'warning'); return; }
    if (isNaN(value) || value < 0) { showToast('请输入有效优惠值', 'warning'); return; }

    const data = { name, code, type, value, minOrder, maxDiscount, validFrom, validTo, status, usageLimit, description };

    if (state.editingId) {
        const coupon = state.coupons.find(c => c.id === state.editingId);
        if (coupon) {
            Object.assign(coupon, data);
            coupon.updatedAt = new Date().toISOString();
            showToast('优惠券已更新', 'success');
        }
    } else {
        const newCoupon = {
            id: `CPN-${String(Date.now()).slice(-6)}`,
            ...data,
            usedCount: 0,
            applicableProducts: 'all',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.coupons.push(newCoupon);
        showToast('优惠券已创建', 'success');
    }

    closeModal();
    saveCoupons();
    applyFilters();
}

/**
 * @private
 * @description 显示新建优惠券弹窗
 */
function showCreateModal() {
    state.editingId = null;
    const modal = document.getElementById('couponModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = '新建优惠券';
        document.getElementById('couponName').value = '';
        document.getElementById('couponCode').value = '';
        document.getElementById('couponType').value = 'discount';
        document.getElementById('couponValue').value = '';
        document.getElementById('couponMinOrder').value = '0';
        document.getElementById('couponMaxDiscount').value = '0';
        document.getElementById('couponValidFrom').value = new Date().toISOString().split('T')[0];
        document.getElementById('couponValidTo').value = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        document.getElementById('couponStatus').value = 'active';
        document.getElementById('couponUsageLimit').value = '0';
        document.getElementById('couponDescription').value = '';
        modal.style.display = 'flex';
    } else {
        // 降级方案
        const name = prompt('优惠券名称：');
        if (!name) return;
        const code = prompt('优惠券代码：')?.toUpperCase();
        if (!code) return;
        const type = prompt('类型 (discount/percent/free)：', 'discount');
        const value = parseFloat(prompt('优惠值：', '10'));
        if (isNaN(value) || value < 0) {
            showToast('请输入有效优惠值', 'error');
            return;
        }
        
        const newCoupon = {
            id: `CPN-${String(Date.now()).slice(-6)}`,
            name: name.trim(),
            code: code.trim(),
            type: type || 'discount',
            value: value,
            minOrder: 0,
            maxDiscount: 0,
            validFrom: new Date().toISOString().split('T')[0],
            validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
            usageLimit: 0,
            usedCount: 0,
            description: '',
            applicableProducts: 'all',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.coupons.push(newCoupon);
        saveCoupons();
        applyFilters();
        showToast('优惠券已创建', 'success');
    }
}

/**
 * @private
 * @description 关闭弹窗
 */
function closeModal() {
    const modal = document.getElementById('couponModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 * @param {number} page - 页码
 * @description 跳转到指定页
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredCoupons.length / state.limit);
    if (page < 1 || page > totalPages) return;
    state.page = page;
    renderCoupons();
    renderPagination();
}

/**
 * @private
 * @description 搜索优惠券
 */
function searchCoupons(query) {
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
    loadCoupons();
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
                searchCoupons(this.value);
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
    
    const refreshBtn = document.getElementById('refreshCoupons');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
    
    const createBtn = document.getElementById('createBtn');
    if (createBtn) {
        createBtn.addEventListener('click', showCreateModal);
    }
}

/**
 * @private
 * @description 初始化弹窗事件
 */
function initModalEvents() {
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    const cancelBtn = document.getElementById('cancelModal');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    const saveBtn = document.getElementById('saveCoupon');
    if (saveBtn) saveBtn.addEventListener('click', saveCoupon);
    
    const modal = document.getElementById('couponModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {Coupon[]} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('🎫 优惠券管理 初始化...');
    
    if (options?.data) {
        state.coupons = options.data;
        localStorage.setItem('coupon_data', JSON.stringify(state.coupons));
    }
    
    loadCoupons();
    bindEvents();
    initModalEvents();
    
    window.CouponsModule = {
        state,
        loadCoupons,
        renderCoupons,
        renderPagination,
        updateStats,
        viewCoupon,
        editCoupon,
        deleteCoupon,
        goToPage,
        showCreateModal,
        closeModal,
        searchCoupons,
        applyFilters: applyFiltersAndRender,
        resetFilters,
        refresh,
        saveCoupons
    };
    
    console.log('✅ 优惠券管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadCoupons,
    viewCoupon,
    editCoupon,
    deleteCoupon,
    goToPage,
    showCreateModal,
    saveCoupon,
    refresh,
    saveCoupons
};