/**
 * modules/03-orders/list/list.js - 订单列表
 * 使用 Supabase 服务
 */

// ============================================================
// 1. 导入服务
// ============================================================

import {
    orderService,
    formatCurrency,
    formatDateTime,
    showToast
} from '../../../js/services/supabase.js';

// ============================================================
// 2. 状态管理
// ============================================================

const state = {
    orders: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { orderNo: '', customer: '', status: '' },
    _initialized: false
};

const STATUS_MAP = {
    pending: { label: '待处理', color: 'warning' },
    processing: { label: '处理中', color: 'info' },
    completed: { label: '已完成', color: 'success' },
    cancelled: { label: '已取消', color: 'danger' }
};

// ============================================================
// 3. 核心功能
// ============================================================

export async function init() {
    if (state._initialized) {
        console.log('📋 订单管理已初始化，跳过');
        return;
    }

    console.log('📋 订单管理初始化...');
    state._initialized = true;

    await loadOrders();
    bindEvents();

    console.log('✅ 订单管理初始化完成');
}

async function loadOrders() {
    state.loading = true;
    showLoading();

    try {
        const result = await orderService.getList({
            page: state.pagination.page,
            limit: state.pagination.limit,
            orderNo: state.filters.orderNo,
            customer: state.filters.customer,
            status: state.filters.status
        });

        console.log('📊 加载订单数据:', result);

        state.orders = result.list || [];
        state.pagination.total = result.total || 0;

        renderTable();
        renderPagination();
        renderSummary();

    } catch (error) {
        console.error('❌ 加载订单失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

// ============================================================
// 4. 渲染函数
// ============================================================

function renderTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (!state.orders || state.orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:#6B7280;">暂无订单数据</td></tr>';
        return;
    }

    let html = '';
    for (let i = 0; i < state.orders.length; i++) {
        const o = state.orders[i];
        const status = STATUS_MAP[o.status] || { label: o.status || '未知', color: 'secondary' };

        html += `<tr>
            <td style="font-family:monospace;">${o.order_number || o.id}</td>
            <td>
                <div style="font-weight:500;">${o.customer_name || '散客'}</div>
                <div style="font-size:12px;color:#6B7280;">${o.customer_phone || ''}</div>
            </td>
            <td style="font-size:14px;">${o.items ? o.items.length : 0} 件商品</td>
            <td style="text-align:right;font-weight:600;">¥${formatCurrency(o.total_amount || 0)}</td>
            <td><span class="badge badge-${status.color}">${status.label}</span></td>
            <td style="font-size:14px;">${formatDateTime(o.created_at)}</td>
            <td>
                <div style="display:flex;gap:4px;">
                    <button class="btn-sm btn-primary" onclick="viewOrder('${o.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-sm btn-danger" onclick="deleteOrder('${o.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }
    tbody.innerHTML = html;
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const page = state.pagination.page;
    const total = state.pagination.total;
    const limit = state.pagination.limit;
    const totalPages = Math.ceil(total / limit) || 1;

    let html = `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;">
        <div style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${page}/${totalPages} 页</div>
        <div style="display:flex;gap:4px;">
            <button class="btn-sm btn-secondary" onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="btn-sm ${i === page ? 'btn-primary' : 'btn-secondary'}" onclick="changePage(${i})">${i}</button>`;
    }

    html += `<button class="btn-sm btn-secondary" onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
        </div>
    </div>`;
    container.innerHTML = html;
}

function renderSummary() {
    const container = document.getElementById('summaryContainer');
    if (!container) return;

    const total = state.orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const avg = state.orders.length > 0 ? total / state.orders.length : 0;

    container.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;">
            <span>订单数: <strong>${state.orders.length}</strong></span>
            <span>总金额: <strong>¥${formatCurrency(total)}</strong></span>
            <span>平均单价: <strong>¥${formatCurrency(avg)}</strong></span>
        </div>
    `;
}

// ============================================================
// 5. 全局函数
// ============================================================

window.changePage = function(page) {
    const totalPages = Math.ceil(state.pagination.total / state.pagination.limit) || 1;
    if (page < 1 || page > totalPages) return;
    state.pagination.page = page;
    loadOrders();
};

window.viewOrder = function(id) {
    showToast('查看订单: ' + id, 'info');
};

window.deleteOrder = async function(id) {
    if (!confirm('确认删除该订单吗？')) return;
    try {
        await orderService.delete(id);
        showToast('删除成功', 'success');
        await loadOrders();
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
};

// ============================================================
// 6. 搜索/重置
// ============================================================

function handleSearch() {
    state.pagination.page = 1;
    state.filters.orderNo = document.getElementById('searchOrderNo')?.value || '';
    state.filters.customer = document.getElementById('searchCustomer')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    loadOrders();
}

function handleReset() {
    state.pagination.page = 1;
    state.filters = { orderNo: '', customer: '', status: '' };
    document.getElementById('searchOrderNo').value = '';
    document.getElementById('searchCustomer').value = '';
    document.getElementById('searchStatus').value = '';
    loadOrders();
}

// ============================================================
// 7. 事件绑定
// ============================================================

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.querySelectorAll('.search-bar input').forEach(el => {
        el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

function showLoading() {
    document.getElementById('loadingSpinner')?.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner')?.classList.add('hidden');
}

// ============================================================
// 8. 自动初始化
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 100);
}

console.log('✅ 订单管理模块加载完成');