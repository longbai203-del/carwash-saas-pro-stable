/**
 * modules/03-orders/list/list.js - 订单列表模块
 * @module orders
 * @description 订单管理，包含列表、搜索、分页、状态管理
 * 
 * @example
 * import { init } from './list.js';
 * init();
 */

import { apiClient } from '../../../js/api/api-client.js/index.js';
import { appStore } from '../../../js/core/store.js';

/**
 * 订单状态
 */
const state = {
    orders: [],
    loading: false,
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    },
    filters: {
        status: '',
        customer: '',
        orderNo: ''
    },
    selectedOrders: []
};

const STATUS_MAP = {
    pending: { label: '待处理', color: '#FEF3C7', textColor: '#92400E' },
    processing: { label: '处理中', color: '#DBEAFE', textColor: '#1E40AF' },
    completed: { label: '已完成', color: '#D1FAE5', textColor: '#065F46' },
    cancelled: { label: '已取消', color: '#FEE2E2', textColor: '#991B1B' }
};

/**
 * 初始化订单列表
 * @returns {Promise<void>}
 */
export async function init() {
    console.log('📋 订单列表模块初始化...');
    
    try {
        await loadOrders();
        renderTable();
        renderPagination();
        renderStats();
        bindEvents();
        console.log('✅ 订单列表初始化完成');
    } catch (error) {
        console.error('❌ 订单列表初始化失败:', error);
        showError('加载订单数据失败');
    }
}

/**
 * 加载订单数据
 * @returns {Promise<void>}
 */
async function loadOrders() {
    state.loading = true;
    showLoading();

    try {
        const params = {
            page: state.pagination.page,
            limit: state.pagination.limit,
            status: state.filters.status,
            customer: state.filters.customer,
            orderNo: state.filters.orderNo
        };

        const response = await apiClient.getOrders(params);
        
        if (response && response.code === 200) {
            state.orders = response.data || [];
            state.pagination.total = response.total || 0;
            state.pagination.totalPages = response.totalPages || 1;
        } else {
            state.orders = getMockOrders();
            state.pagination.total = state.orders.length;
        }
    } catch (error) {
        console.warn('⚠️ API获取失败，使用模拟数据:', error);
        state.orders = getMockOrders();
        state.pagination.total = state.orders.length;
    } finally {
        state.loading = false;
        hideLoading();
    }
}

/**
 * 获取模拟订单数据
 * @returns {Array} 订单数组
 */
function getMockOrders() {
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静'];
    const statuses = ['pending', 'processing', 'completed', 'cancelled'];
    const products = ['标准洗车', '精致洗车', '抛光打蜡', '内饰清洗', '发动机清洗'];
    
    return Array.from({ length: 25 }, (_, i) => ({
        id: `ORD-${String(i + 1).padStart(6, '0')}`,
        customer: customers[i % customers.length],
        phone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        items: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
            name: products[Math.floor(Math.random() * products.length)],
            qty: Math.floor(Math.random() * 2) + 1,
            price: Math.floor(Math.random() * 300) + 50
        })),
        total: Math.floor(Math.random() * 800) + 100,
        status: statuses[i % statuses.length],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

/**
 * 渲染表格
 * @returns {void}
 */
function renderTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (state.orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无订单数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = state.orders.map(order => {
        const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
        const itemsText = order.items.map(i => `${i.name} × ${i.qty}`).join(', ');
        
        return `
            <tr>
                <td style="font-family:monospace;font-size:14px;padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    ${order.id}
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <div style="font-weight:500;">${order.customer}</div>
                    <div style="font-size:12px;color:#6B7280;">${order.phone}</div>
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;font-size:14px;">
                    ${itemsText}
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;text-align:right;font-weight:600;">
                    ¥${order.total.toFixed(2)}
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;font-size:14px;">
                    ${new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn-sm btn-primary" onclick="viewOrder('${order.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-sm btn-danger" onclick="deleteOrder('${order.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * 渲染分页
 * @returns {void}
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const { page, total, totalPages } = state.pagination;

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
    `;

    for (let i = 1; i <= Math.min(totalPages, 7); i++) {
        if (i === page) {
            html += `<span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${i}</span>`;
        } else if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) {
            html += `<button onclick="changePage(${i})" style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            html += `<span style="padding:4px 8px;color:#9CA3AF;">...</span>`;
        }
    }

    html += `
                <button onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * 渲染统计
 * @returns {void}
 */
function renderStats() {
    const container = document.getElementById('orderStats');
    if (!container) return;

    const total = state.orders.reduce((sum, o) => sum + o.total, 0);
    const avg = state.orders.length > 0 ? total / state.orders.length : 0;

    container.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;padding:8px 0;">
            <span>总订单: <strong>${state.orders.length}</strong></span>
            <span>总金额: <strong>¥${total.toFixed(2)}</strong></span>
            <span>平均单价: <strong>¥${avg.toFixed(2)}</strong></span>
        </div>
    `;
}

/**
 * 切换页面
 * @param {number} page - 页码
 * @returns {void}
 */
window.changePage = function(page) {
    const { totalPages } = state.pagination;
    if (page < 1 || page > totalPages) return;
    state.pagination.page = page;
    loadOrders().then(() => {
        renderTable();
        renderPagination();
        renderStats();
    });
};

/**
 * 查看订单
 * @param {string} id - 订单ID
 * @returns {void}
 */
window.viewOrder = function(id) {
    window.location.hash = `#/orders/detail?id=${id}`;
};

/**
 * 删除订单
 * @param {string} id - 订单ID
 * @returns {Promise<void>}
 */
window.deleteOrder = async function(id) {
    if (!confirm('确认删除该订单？')) return;
    try {
        await apiClient.deleteOrder(id);
        showToast('删除成功', 'success');
        await loadOrders();
        renderTable();
        renderPagination();
        renderStats();
    } catch (error) {
        showToast('删除失败', 'error');
    }
};

/**
 * 搜索订单
 * @returns {void}
 */
function handleSearch() {
    state.filters.orderNo = document.getElementById('searchOrderNo')?.value || '';
    state.filters.customer = document.getElementById('searchCustomer')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.pagination.page = 1;
    loadOrders().then(() => {
        renderTable();
        renderPagination();
        renderStats();
    });
}

/**
 * 重置搜索
 * @returns {void}
 */
function handleReset() {
    document.getElementById('searchOrderNo').value = '';
    document.getElementById('searchCustomer').value = '';
    document.getElementById('searchStatus').value = '';
    state.filters = { orderNo: '', customer: '', status: '' };
    state.pagination.page = 1;
    loadOrders().then(() => {
        renderTable();
        renderPagination();
        renderStats();
    });
}

/**
 * 绑定事件
 * @returns {void}
 */
function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    
    document.querySelectorAll('#searchOrderNo, #searchCustomer, #searchStatus').forEach(el => {
        el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * 显示加载状态
 * @returns {void}
 */
function showLoading() {
    document.getElementById('loadingSpinner')?.classList.remove('hidden');
}

/**
 * 隐藏加载状态
 * @returns {void}
 */
function hideLoading() {
    document.getElementById('loadingSpinner')?.classList.add('hidden');
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 * @returns {void}
 */
function showError(message) {
    const container = document.querySelector('.orders-container');
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
window.viewOrder = window.viewOrder;
window.deleteOrder = window.deleteOrder;

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default { init };