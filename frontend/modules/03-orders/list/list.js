/**
 * modules/03-orders/list/list.js - 订单列表
 * 使用数据服务层获取数据
 */

// ============================================================
// 1. 状态管理
// ============================================================

const state = {
    orders: [],
    loading: false,
    pagination: {
        page: 1,
        limit: 10,
        total: 0
    },
    filters: {
        orderNo: '',
        customer: '',
        status: ''
    }
};

const STATUS_MAP = {
    pending: { label: '待处理', color: 'warning' },
    processing: { label: '处理中', color: 'info' },
    completed: { label: '已完成', color: 'success' },
    cancelled: { label: '已取消', color: 'danger' }
};

// ============================================================
// 2. 工具函数
// ============================================================

function getServices() {
    if (typeof window !== 'undefined' && window.Services) {
        return window.Services;
    }
    return null;
}

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return Number(amount).toFixed(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function showToast(message, type) {
    var toast = document.createElement('div');
    var colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${colors[type] || '#4F46E5'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-size: 14px;
        max-width: 400px;
        animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);
}

// ============================================================
// 3. Mock 数据（备用）
// ============================================================

function getMockOrders() {
    var orders = [];
    var statuses = ['pending', 'processing', 'completed', 'cancelled'];
    var customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
    var products = ['洗车套餐A', '洗车套餐B', '汽车美容', '抛光打蜡', '内饰清洁', '空调清洗'];

    for (var i = 0; i < 25; i++) {
        var total = Math.floor(Math.random() * 1000) + 100;
        orders.push({
            id: 'ORD-' + String(i + 1).padStart(6, '0'),
            orderNo: 'ORD-2026-' + String(i + 1).padStart(4, '0'),
            customer: customers[i % customers.length],
            phone: '138' + String(Math.floor(Math.random() * 90000000) + 10000000),
            total: total,
            status: statuses[i % statuses.length],
            items: [{ name: products[i % products.length], qty: Math.floor(Math.random() * 3) + 1, price: Math.floor(Math.random() * 300) + 50 }],
            createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return orders;
}

// ============================================================
// 4. 核心功能
// ============================================================

export async function init() {
    console.log('📋 Orders 初始化...');

    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    await loadOrders();
    bindEvents();
}

async function loadOrders() {
    state.loading = true;
    showLoading();

    try {
        const services = getServices();
        let data = null;

        // 优先使用数据服务
        if (services && services.order) {
            try {
                console.log('📦 使用数据服务加载订单...');
                var params = {
                    page: state.pagination.page,
                    limit: state.pagination.limit,
                    orderNo: state.filters.orderNo,
                    customer: state.filters.customer,
                    status: state.filters.status
                };
                data = await services.order.getList(params);
                console.log('✅ 数据服务返回订单:', data);
            } catch (serviceError) {
                console.warn('⚠️ 数据服务加载失败，使用 Mock:', serviceError.message);
                data = { list: getMockOrders(), total: 25 };
            }
        } else {
            console.log('📦 使用 Mock 数据加载订单...');
            var allOrders = getMockOrders();
            var start = (state.pagination.page - 1) * state.pagination.limit;
            var end = start + state.pagination.limit;
            data = {
                list: allOrders.slice(start, end),
                total: allOrders.length
            };
        }

        if (data) {
            state.orders = data.list || [];
            state.pagination.total = data.total || 0;
        }

        renderTable();
        renderPagination();
        renderSummary();

    } catch (error) {
        console.error('❌ 加载订单失败:', error);
        showToast('加载数据失败，使用备用数据', 'warning');
        var fallback = getMockOrders();
        state.orders = fallback.slice(0, 10);
        state.pagination.total = fallback.length;
        renderTable();
        renderPagination();
        renderSummary();
    } finally {
        state.loading = false;
        hideLoading();
    }
}

// ============================================================
// 5. 渲染函数
// ============================================================

function renderTable() {
    var tbody = document.getElementById('ordersTableBody');
    if (!tbody) {
        console.warn('⚠️ ordersTableBody 不存在');
        return;
    }

    if (!state.orders || state.orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-3xl"></i>
                    <p class="mt-2">暂无订单数据</p>
                </td>
            </tr>
        `;
        return;
    }

    var html = '';
    for (var i = 0; i < state.orders.length; i++) {
        var order = state.orders[i];
        var status = STATUS_MAP[order.status] || { label: order.status || '未知', color: 'secondary' };
        var itemsText = order.items ? order.items.map(function(item) {
            return item.name + ' × ' + item.qty;
        }).join(', ') : '-';

        html += `
            <tr>
                <td class="font-mono">${order.orderNo || order.id}</td>
                <td>
                    <div class="font-medium">${order.customer || '-'}</div>
                    <div class="text-xs text-gray-500">${order.phone || ''}</div>
                </td>
                <td class="text-sm">${itemsText}</td>
                <td class="text-right font-semibold">¥${formatCurrency(order.total || 0)}</td>
                <td>
                    <span class="badge badge-${status.color}">
                        ${status.label}
                    </span>
                </td>
                <td class="text-sm">${formatDate(order.createTime)}</td>
                <td>
                    <div class="flex gap-1">
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
    }

    tbody.innerHTML = html;
}

function renderPagination() {
    var container = document.getElementById('paginationContainer');
    if (!container) return;

    var page = state.pagination.page || 1;
    var limit = state.pagination.limit || 10;
    var total = state.pagination.total || 0;
    var totalPages = Math.ceil(total / limit) || 1;

    var html = `
        <div class="flex items-center justify-between px-4 py-3">
            <div class="text-sm text-gray-500">
                共 ${total} 条记录，第 ${page}/${totalPages} 页
            </div>
            <div class="flex gap-1">
                <button class="px-3 py-1 border rounded ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                        onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
    `;

    var startPage = Math.max(1, page - 2);
    var endPage = Math.min(totalPages, page + 2);

    if (startPage > 1) {
        html += `<button class="px-3 py-1 border rounded" onclick="changePage(1)">1</button>`;
        if (startPage > 2) html += `<button class="px-3 py-1 border rounded" disabled>...</button>`;
    }

    for (var i = startPage; i <= endPage; i++) {
        html += `<button class="px-3 py-1 border rounded ${i === page ? 'bg-blue-500 text-white' : ''}" 
                        onclick="changePage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<button class="px-3 py-1 border rounded" disabled>...</button>`;
        html += `<button class="px-3 py-1 border rounded" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }

    html += `
                <button class="px-3 py-1 border rounded ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                        onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function renderSummary() {
    var container = document.getElementById('summaryContainer');
    if (!container) return;

    var total = state.orders.reduce(function(sum, o) { return sum + (o.total || 0); }, 0);
    var avg = state.orders.length > 0 ? total / state.orders.length : 0;

    container.innerHTML = `
        <div class="flex gap-6 text-sm">
            <span>订单数: <strong>${state.orders.length}</strong></span>
            <span>总金额: <strong>¥${formatCurrency(total)}</strong></span>
            <span>平均单价: <strong>¥${formatCurrency(avg)}</strong></span>
        </div>
    `;
}

// ============================================================
// 6. 全局函数（供 HTML 调用）
// ============================================================

window.changePage = function(page) {
    if (page < 1) return;
    var totalPages = Math.ceil(state.pagination.total / state.pagination.limit) || 1;
    if (page > totalPages) return;
    state.pagination.page = page;
    loadOrders();
};

window.viewOrder = function(id) {
    showToast('查看订单: ' + id, 'info');
    // 跳转到详情页
    // window.location.href = '../detail/detail.html?id=' + id;
};

window.deleteOrder = async function(id) {
    if (!confirm('确认删除该订单吗？')) return;
    try {
        var services = getServices();
        if (services && services.order) {
            await services.order.delete(id);
        }
        showToast('删除成功', 'success');
        await loadOrders();
    } catch (error) {
        console.error('删除失败:', error);
        showToast('删除失败', 'error');
    }
};

// ============================================================
// 7. 事件绑定
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
    var inputs = document.querySelectorAll('.search-bar input, .search-bar select');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = '';
    }
    loadOrders();
}

function bindEvents() {
    var searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);

    var resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', handleReset);

    // Enter 键搜索
    var inputs = document.querySelectorAll('.search-bar input');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
}

function showLoading() {
    var spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.remove('hidden');
}

function hideLoading() {
    var spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.add('hidden');
}

// ============================================================
// 8. 自动初始化
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('✅ Orders 模块加载完成');