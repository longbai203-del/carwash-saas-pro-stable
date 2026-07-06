// modules/08-purchase/receiving/receiving.js
import { getPurchaseOrders, receiveOrder } from '../../../api/orders.js';
import { formatCurrency, formatDate, showToast } from '../../../js/utils.js';

const state = {
    orders: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { orderNo: '', supplier: '', status: '' }
};

export async function init() {
    console.log('采购收货已加载');
    await loadOrders();
    bindEvents();
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
    } catch (error) {
        console.error('加载采购单失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockOrders() {
    const suppliers = ['上海供应商有限公司', '深圳科技材料公司', '广州五金制品厂'];
    const statuses = ['pending', 'received', 'partial'];
    
    const orders = [];
    for (let i = 0; i < 20; i++) {
        orders.push({
            id: `PO-${String(i + 1).padStart(6, '0')}`,
            orderNo: `PO-2026-${String(i + 1).padStart(4, '0')}`,
            supplier: suppliers[i % suppliers.length],
            totalAmount: Math.floor(Math.random() * 20000) + 1000,
            receivedAmount: Math.floor(Math.random() * 8000),
            status: statuses[i % statuses.length],
            items: [
                { name: '洗车液', ordered: 50, received: Math.floor(Math.random() * 50) },
                { name: '水蜡', ordered: 30, received: Math.floor(Math.random() * 30) }
            ],
            createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return {
        list: orders.slice(0, 10),
        total: orders.length
    };
}

function renderTable() {
    const tbody = document.getElementById('receivingTableBody');
    if (!tbody) return;

    const statusMap = {
        pending: { label: '待收货', color: 'warning' },
        received: { label: '已收货', color: 'success' },
        partial: { label: '部分收货', color: 'info' }
    };

    tbody.innerHTML = state.orders.map(order => `
        <tr>
            <td class="font-mono">${order.orderNo}</td>
            <td>${order.supplier}</td>
            <td class="text-right">¥${formatCurrency(order.totalAmount)}</td>
            <td class="text-right">¥${formatCurrency(order.receivedAmount || 0)}</td>
            <td>
                <span class="badge badge-${statusMap[order.status]?.color || 'secondary'}">
                    ${statusMap[order.status]?.label || order.status}
                </span>
            </td>
            <td class="text-sm">${formatDate(order.createTime)}</td>
            <td>
                ${order.status !== 'received' ? `
                    <button class="btn-sm btn-primary" onclick="receiveOrder('${order.id}')">
                        <i class="fas fa-boxes"></i> 收货
                    </button>
                ` : `
                    <span class="text-sm text-gray-500">已完成</span>
                `}
            </td>
        </tr>
    `).join('');
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const { page, limit, total } = state.pagination;
    const totalPages = Math.ceil(total / limit);

    container.innerHTML = `
        <div class="flex items-center justify-between px-4 py-3">
            <div class="text-sm text-gray-500">共 ${total} 条，第 ${page}/${totalPages} 页</div>
            <div class="flex gap-1">
                <button class="px-3 py-1 border rounded ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                        onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>上一页</button>
                ${Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
                    const p = i + 1;
                    return `<button class="px-3 py-1 border rounded ${p === page ? 'bg-blue-500 text-white' : ''}" 
                            onclick="changePage(${p})">${p}</button>`;
                }).join('')}
                <button class="px-3 py-1 border rounded ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                        onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
            </div>
        </div>
    `;
}

window.changePage = function(page) {
    if (page < 1 || page > Math.ceil(state.pagination.total / state.pagination.limit)) return;
    state.pagination.page = page;
    loadOrders();
};

window.receiveOrder = function(id) {
    showToast(`收货中: ${id}`, 'info');
    // 打开收货弹窗
    // TODO: 实现收货弹窗
};

function handleSearch() {
    state.pagination.page = 1;
    loadOrders();
}

function handleReset() {
    state.filters = { orderNo: '', supplier: '', status: '' };
    document.getElementById('searchOrderNo').value = '';
    document.getElementById('searchSupplier').value = '';
    document.getElementById('searchStatus').value = '';
    state.pagination.page = 1;
    loadOrders();
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
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