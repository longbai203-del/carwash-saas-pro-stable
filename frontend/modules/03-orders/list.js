/**
 * @file list.js
 * @module orders-list
 * @description 订单列表 - 订单查询、筛选、列表展示
 * 
 * @example
 * import { init } from './list.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} OrderItem
 * @property {string} id - 订单ID
 * @property {string} customer - 客户名称
 * @property {number} amount - 订单金额
 * @property {string} status - 订单状态 (pending/processing/completed/cancelled/refunded)
 * @property {string} paymentMethod - 支付方式
 * @property {string} createdAt - 创建时间
 * @property {string} [updatedAt] - 更新时间
 * @property {Array<{name: string, qty: number, price: number}>} items - 商品列表
 */

/**
 * @typedef {Object} OrderFilters
 * @property {string} status - 状态筛选
 * @property {string} startDate - 开始日期
 * @property {string} endDate - 结束日期
 * @property {string} search - 搜索关键词
 * @property {number} page - 页码
 * @property {number} limit - 每页数量
 */

/**
 * @typedef {Object} OrderListState
 * @property {OrderItem[]} orders - 订单列表
 * @property {OrderFilters} filters - 筛选条件
 * @property {number} total - 总数
 * @property {number} totalPages - 总页数
 * @property {boolean} loading - 加载状态
 * @property {string|null} error - 错误信息
 */

/** @type {OrderListState} 状态 */
const state = {
    orders: [],
    filters: {
        status: 'all',
        startDate: '',
        endDate: '',
        search: '',
        page: 1,
        limit: 20
    },
    total: 0,
    totalPages: 0,
    loading: false,
    error: null
};

/**
 * 状态颜色和标签映射
 */
const STATUS_MAP = {
    'pending': { label: '待处理', color: '#F59E0B', bg: '#FEF3C7' },
    'processing': { label: '处理中', color: '#3B82F6', bg: '#DBEAFE' },
    'completed': { label: '已完成', color: '#10B981', bg: '#D1FAE5' },
    'cancelled': { label: '已取消', color: '#EF4444', bg: '#FEE2E2' },
    'refunded': { label: '已退款', color: '#8B5CF6', bg: '#EDE9FE' }
};

/**
 * 支付方式标签映射
 */
const PAYMENT_MAP = {
    'cash': '现金',
    'card': '刷卡',
    'wechat': '微信支付',
    'alipay': '支付宝',
    'bank': '银行转账'
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
 * @returns {Promise<void>}
 * @description 加载订单列表
 */
async function loadOrders() {
    try {
        state.loading = true;
        state.error = null;
        
        const params = {
            status: state.filters.status === 'all' ? '' : state.filters.status,
            startDate: state.filters.startDate,
            endDate: state.filters.endDate,
            search: state.filters.search,
            page: state.filters.page,
            limit: state.filters.limit
        };
        
        const response = await apiClient.get('/orders', params);
        
        if (response && response.success) {
            state.orders = response.data || [];
            state.total = response.total || 0;
            state.totalPages = response.totalPages || 0;
        } else {
            // 使用模拟数据
            state.orders = getMockOrders();
            state.total = state.orders.length;
            state.totalPages = 1;
        }
        
        state.loading = false;
        renderOrders();
        updateStats();
        renderPagination();
        
    } catch (error) {
        console.error('❌ 加载订单失败:', error);
        state.loading = false;
        state.error = error.message || '加载订单失败';
        showToast('加载订单失败: ' + state.error, 'error');
        // 使用模拟数据
        state.orders = getMockOrders();
        state.total = state.orders.length;
        state.totalPages = 1;
        renderOrders();
        updateStats();
    }
}

/**
 * @private
 * @returns {OrderItem[]} 模拟订单数据
 * @description 获取模拟订单数据
 */
function getMockOrders() {
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵敏', '孙鹏', '周婷'];
    const statuses = ['pending', 'processing', 'completed', 'completed', 'completed', 'cancelled', 'refunded'];
    const payments = ['cash', 'card', 'wechat', 'alipay', 'wechat', 'card', 'cash'];
    const services = ['标准洗车', '精致洗车', '深度清洁', '抛光打蜡', '内饰清洗', '发动机清洗', '空调清洗', '轮胎养护'];
    
    const orders = [];
    const now = Date.now();
    
    for (let i = 0; i < 25; i++) {
        const date = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const items = [];
        const itemCount = Math.floor(Math.random() * 3) + 1;
        let total = 0;
        
        for (let j = 0; j < itemCount; j++) {
            const price = [68, 128, 268, 388, 328, 188, 158, 88][Math.floor(Math.random() * 8)];
            const qty = Math.floor(Math.random() * 2) + 1;
            items.push({
                name: services[Math.floor(Math.random() * services.length)],
                price: price,
                qty: qty
            });
            total += price * qty;
        }
        
        orders.push({
            id: 'ORD-' + String(1000 + i).padStart(4, '0'),
            customer: customers[Math.floor(Math.random() * customers.length)],
            amount: total,
            status: status,
            paymentMethod: payments[Math.floor(Math.random() * payments.length)],
            createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
            items: items
        });
    }
    
    // 按时间排序（最新的在前）
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return orders;
}

/**
 * @private
 * @description 渲染订单列表
 */
function renderOrders() {
    const container = document.getElementById('orderListBody');
    if (!container) return;
    
    if (state.orders.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无订单数据
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = state.orders.map(order => {
        const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
        const payment = PAYMENT_MAP[order.paymentMethod] || order.paymentMethod;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;" 
                onmouseover="this.style.background='#F9FAFB'" 
                onmouseout="this.style.background=''"
                onclick="window.OrdersModule.viewOrder('${order.id}')">
                <td style="padding:12px;font-family:monospace;font-weight:500;">${order.id}</td>
                <td style="padding:12px;">${order.customer}</td>
                <td style="padding:12px;text-align:right;font-weight:600;">¥${formatCurrency(order.amount)}</td>
                <td style="padding:12px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.bg};color:${status.color};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:12px;">${payment}</td>
                <td style="padding:12px;font-size:13px;color:#6B7280;">${formatDate(order.createdAt)}</td>
                <td style="padding:12px;text-align:center;">
                    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();window.OrdersModule.viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${order.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="event.stopPropagation();window.OrdersModule.updateStatus('${order.id}', 'processing')">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * @private
 * @description 更新统计数据
 */
function updateStats() {
    const totalEl = document.getElementById('orderTotal');
    const pendingEl = document.getElementById('orderPending');
    const processingEl = document.getElementById('orderProcessing');
    const completedEl = document.getElementById('orderCompleted');
    
    const total = state.orders.length;
    const pending = state.orders.filter(o => o.status === 'pending').length;
    const processing = state.orders.filter(o => o.status === 'processing').length;
    const completed = state.orders.filter(o => o.status === 'completed').length;
    
    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (processingEl) processingEl.textContent = processing;
    if (completedEl) completedEl.textContent = completed;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    if (state.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div style="display:flex;gap:4px;align-items:center;justify-content:center;">';
    
    // 上一页
    html += `
        <button class="btn btn-sm btn-outline" onclick="window.OrdersModule.goToPage(${state.filters.page - 1})" 
                ${state.filters.page <= 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // 页码
    const startPage = Math.max(1, state.filters.page - 2);
    const endPage = Math.min(state.totalPages, state.filters.page + 2);
    
    if (startPage > 1) {
        html += `<button class="btn btn-sm btn-outline" onclick="window.OrdersModule.goToPage(1)">1</button>`;
        if (startPage > 2) html += '<span style="color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.filters.page;
        html += `
            <button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}" 
                    onclick="window.OrdersModule.goToPage(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < state.totalPages) {
        if (endPage < state.totalPages - 1) html += '<span style="color:#9CA3AF;">...</span>';
        html += `<button class="btn btn-sm btn-outline" onclick="window.OrdersModule.goToPage(${state.totalPages})">${state.totalPages}</button>`;
    }
    
    // 下一页
    html += `
        <button class="btn btn-sm btn-outline" onclick="window.OrdersModule.goToPage(${state.filters.page + 1})" 
                ${state.filters.page >= state.totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * @private
 * @param {string} id - 订单ID
 * @description 查看订单详情
 */
function viewOrder(id) {
    // 跳转到订单详情页
    if (typeof window.router !== 'undefined') {
        window.router.navigate('/orders/detail/' + id);
    } else {
        window.location.hash = '#/orders/detail/' + id;
    }
}

/**
 * @private
 * @param {string} id - 订单ID
 * @param {string} status - 新状态
 * @description 更新订单状态
 */
async function updateStatus(id, status) {
    try {
        const response = await apiClient.put(`/orders/${id}/status`, { status });
        if (response && response.success) {
            showToast('订单状态已更新', 'success');
            await loadOrders();
        } else {
            throw new Error(response.message || '更新失败');
        }
    } catch (error) {
        console.error('❌ 更新订单状态失败:', error);
        showToast('更新失败: ' + error.message, 'error');
    }
}

/**
 * @private
 * @param {number} page - 页码
 * @description 跳转到指定页
 */
function goToPage(page) {
    if (page < 1 || page > state.totalPages) return;
    state.filters.page = page;
    loadOrders();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const searchInput = document.getElementById('searchInput');
    
    state.filters.status = statusFilter ? statusFilter.value : 'all';
    state.filters.startDate = startDate ? startDate.value : '';
    state.filters.endDate = endDate ? endDate.value : '';
    state.filters.search = searchInput ? searchInput.value : '';
    state.filters.page = 1;
    
    loadOrders();
}

/**
 * @private
 * @description 重置筛选
 */
function resetFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const searchInput = document.getElementById('searchInput');
    
    if (statusFilter) statusFilter.value = 'all';
    if (startDate) startDate.value = '';
    if (endDate) endDate.value = '';
    if (searchInput) searchInput.value = '';
    
    state.filters = {
        status: 'all',
        startDate: '',
        endDate: '',
        search: '',
        page: 1,
        limit: 20
    };
    
    loadOrders();
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    // 搜索输入（防抖）
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                applyFilters();
            }, 500);
        });
    }
    
    // 状态筛选
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    // 日期筛选
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    if (startDate) startDate.addEventListener('change', applyFilters);
    if (endDate) endDate.addEventListener('change', applyFilters);
    
    // 重置按钮
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    // 刷新按钮
    const refreshBtn = document.getElementById('refreshOrders');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadOrders();
            showToast('数据已刷新', 'success');
        });
    }
}

/**
 * @public
 * @returns {Promise<void>}
 * @description 初始化订单列表
 */
export async function init() {
    console.log('📋 订单列表 初始化...');
    
    bindEvents();
    await loadOrders();
    
    // 暴露全局方法
    window.OrdersModule = {
        state,
        loadOrders,
        viewOrder,
        updateStatus,
        goToPage,
        applyFilters,
        resetFilters,
        renderOrders,
        renderPagination
    };
    
    console.log('✅ 订单列表 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadOrders,
    viewOrder,
    updateStatus,
    goToPage,
    applyFilters,
    resetFilters
};