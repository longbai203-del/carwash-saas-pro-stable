// modules/03-orders/list/orders.js
import { getOrders, updateOrderStatus, deleteOrder } from '../../../api/orders.js';
import { formatCurrency, formatDate, formatDateTime, showToast } from '../../../js/utils.js';

const state = {
    orders: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { orderNo: '', customer: '', status: '', dateRange: { start: '', end: '' } },
    selectedOrders: []
};

const STATUS_MAP = {
    pending: { label: '待处理', color: 'warning', icon: 'fa-clock' },
    processing: { label: '处理中', color: 'info', icon: 'fa-spinner' },
    completed: { label: '已完成', color: 'success', icon: 'fa-check' },
    cancelled: { label: '已取消', color: 'danger', icon: 'fa-times' }
};

export async function init() {
    console.log('订单管理已加载');
    await loadOrders();
    bindEvents();
    initDatePicker();
}

async function loadOrders() {
    state.loading = true;
    showLoading();

    try {
        const data = await getMockOrders();
        state.orders = data.list;
        state.pagination.total = data.total;
        renderTable();
        renderPagination();
        renderSummary();
    } catch (error) {
        console.error('加载订单失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockOrders() {
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
    const products = ['洗车套餐A', '洗车套餐B', '汽车美容', '抛光打蜡', '内饰清洁', '空调清洗'];
    const statuses = ['pending', 'processing', 'completed', 'cancelled'];
    
    const orders = [];
    for (let i = 0; i < 35; i++) {
        const items = [];
        const itemCount = Math.floor(Math.random() * 4) + 1;
        let total = 0;
        for (let j = 0; j < itemCount; j++) {
            const price = Math.floor(Math.random() * 500) + 100;
            const qty = Math.floor(Math.random() * 3) + 1;
            items.push({
                product: products[Math.floor(Math.random() * products.length)],
                price: price,
                qty: qty,
                subtotal: price * qty
            });
            total += price * qty;
        }
        
        orders.push({
            id: `ORD-${String(i + 1).padStart(6, '0')}`,
            customer: customers[i % customers.length],
            phone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
            items: items,
            total: total,
            status: statuses[i % statuses.length],
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return {
        list: orders.slice(0, 10),
        total: orders.length
    };
}

function renderTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (state.orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8">
                    <i class="fas fa-inbox text-4xl text-gray-300"></i>
                    <p class="mt-2 text-gray-500">暂无订单数据</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = state.orders.map((order, index) => `
        <tr>
            <td>
                <input type="checkbox" class="order-checkbox" data-id="${order.id}" />
            </td>
            <td class="font-mono text-sm">${order.id}</td>
            <td>
                <div class="font-medium">${order.customer}</div>
                <div class="text-xs text-gray-500">${order.phone}</div>
            </td>
            <td>
                ${order.items.map(item => 
                    `<div class="text-sm">${item.product} × ${item.qty}</div>`
                ).join('')}
            </td>
            <td class="text-right font-semibold">¥${formatCurrency(order.total)}</td>
            <td>
                <span class="badge badge-${STATUS_MAP[order.status]?.color || 'secondary'}">
                    <i class="fas ${STATUS_MAP[order.status]?.icon || 'fa-circle'}"></i>
                    ${STATUS_MAP[order.status]?.label || order.status}
                </span>
            </td>
            <td class="text-sm">${formatDateTime(order.createdAt)}</td>
            <td>
                <div class="flex gap-1">
                    <button class="btn-sm btn-primary" onclick="viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-sm btn-warning" onclick="editOrder('${order.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-danger" onclick="deleteOrder('${order.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // 绑定checkbox事件
    document.querySelectorAll('.order-checkbox').forEach(cb => {
        cb.addEventListener('change', updateSelectedOrders);
    });
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const { page, limit, total } = state.pagination;
    const totalPages = Math.ceil(total / limit);

    let html = `
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

    for (let i = 1; i <= Math.min(totalPages, 7); i++) {
        if (i === page) {
            html += `<button class="px-3 py-1 border rounded bg-blue-500 text-white">${i}</button>`;
        } else if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) {
            html += `<button class="px-3 py-1 border rounded" onclick="changePage(${i})">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            html += `<button class="px-3 py-1 border rounded" disabled>...</button>`;
        }
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
    const container = document.getElementById('summaryContainer');
    if (!container) return;

    const total = state.orders.reduce((sum, o) => sum + o.total, 0);
    const avg = state.orders.length > 0 ? total / state.orders.length : 0;

    container.innerHTML = `
        <div class="flex gap-6 text-sm">
            <span>订单数: <strong>${state.orders.length}</strong></span>
            <span>总金额: <strong>¥${formatCurrency(total)}</strong></span>
            <span>平均单价: <strong>¥${formatCurrency(avg)}</strong></span>
        </div>
    `;
}

function updateSelectedOrders() {
    const checkboxes = document.querySelectorAll('.order-checkbox:checked');
    state.selectedOrders = Array.from(checkboxes).map(cb => cb.dataset.id);
    
    const batchActions = document.getElementById('batchActions');
    if (batchActions) {
        batchActions.style.display = state.selectedOrders.length > 0 ? 'flex' : 'none';
        document.getElementById('selectedCount').textContent = state.selectedOrders.length;
    }
}

// 全局函数供HTML调用
window.changePage = function(page) {
    if (page < 1 || page > Math.ceil(state.pagination.total / state.pagination.limit)) return;
    state.pagination.page = page;
    loadOrders();
};

window.viewOrder = function(id) {
    // 跳转到详情页
    window.location.href = `../detail/detail.html?id=${id}`;
};

window.editOrder = function(id) {
    showToast(`编辑订单: ${id}`, 'info');
};

window.deleteOrder = async function(id) {
    if (!confirm('确认删除该订单吗？')) return;
    try {
        await deleteOrder(id);
        showToast('删除成功', 'success');
        await loadOrders();
    } catch (error) {
        showToast('删除失败', 'error');
    }
};

window.batchDelete = async function() {
    if (!confirm(`确认删除 ${state.selectedOrders.length} 个订单吗？`)) return;
    showToast(`批量删除 ${state.selectedOrders.length} 个订单`, 'success');
    state.selectedOrders = [];
    await loadOrders();
};

window.batchUpdateStatus = function() {
    // 显示状态选择下拉
    showToast('批量更新状态功能', 'info');
};

function handleSearch() {
    state.pagination.page = 1;
    loadOrders();
}

function handleReset() {
    state.filters = { orderNo: '', customer: '', status: '', dateRange: { start: '', end: '' } };
    document.getElementById('searchOrderNo').value = '';
    document.getElementById('searchCustomer').value = '';
    document.getElementById('searchStatus').value = '';
    document.querySelectorAll('.date-input').forEach(el => el.value = '');
    state.pagination.page = 1;
    loadOrders();
}

function initDatePicker() {
    // 简单的日期选择器，实际项目可以用插件
    const startInput = document.getElementById('dateStart');
    const endInput = document.getElementById('dateEnd');
    if (startInput && endInput) {
        startInput.type = 'date';
        endInput.type = 'date';
    }
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('batchDeleteBtn')?.addEventListener('click', window.batchDelete);
    document.getElementById('batchStatusBtn')?.addEventListener('click', window.batchUpdateStatus);
}

function showLoading() {
    document.getElementById('loadingSpinner')?.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner')?.classList.add('hidden');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}