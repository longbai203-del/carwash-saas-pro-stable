// modules/05-customers/customers/customers.js
import { getCustomers, deleteCustomer } from '../../../api/customers.js';
import { formatDate, showToast } from '../../../js/utils.js';

const state = {
    customers: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { name: '', phone: '', level: '' }
};

const LEVEL_MAP = {
    gold: { label: '黄金', color: '#F59E0B' },
    silver: { label: '白银', color: '#9CA3AF' },
    bronze: { label: '青铜', color: '#D97706' },
    vip: { label: 'VIP', color: '#8B5CF6' }
};

export async function init() {
    console.log('客户管理已加载');
    await loadCustomers();
    bindEvents();
}

async function loadCustomers() {
    state.loading = true;
    showLoading();

    try {
        const data = await getMockCustomers();
        state.customers = data.list;
        state.pagination.total = data.total;
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('加载客户失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockCustomers() {
    const names = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛', '吴刚', '徐洁'];
    const levels = ['gold', 'silver', 'bronze', 'vip'];
    
    const customers = [];
    for (let i = 0; i < 28; i++) {
        const totalSpent = Math.floor(Math.random() * 50000) + 1000;
        customers.push({
            id: `CUS-${String(i + 1).padStart(6, '0')}`,
            name: names[i % names.length] + (i > 9 ? i : ''),
            phone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
            email: `user${i + 1}@example.com`,
            level: levels[i % levels.length],
            totalSpent: totalSpent,
            orderCount: Math.floor(Math.random() * 50) + 1,
            lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return {
        list: customers.slice(0, 10),
        total: customers.length
    };
}

function renderTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    if (state.customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8">
                    <i class="fas fa-user-plus text-4xl text-gray-300"></i>
                    <p class="mt-2 text-gray-500">暂无客户数据</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = state.customers.map(customer => `
        <tr>
            <td>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        ${customer.name.charAt(0)}
                    </div>
                    <div>
                        <div class="font-medium">${customer.name}</div>
                        <div class="text-xs text-gray-500">${customer.id}</div>
                    </div>
                </div>
            </td>
            <td>${customer.phone}</td>
            <td class="text-sm">${customer.email}</td>
            <td>
                <span class="badge" style="background:${LEVEL_MAP[customer.level]?.color || '#9CA3AF'}20; color:${LEVEL_MAP[customer.level]?.color || '#6B7280'}">
                    ${LEVEL_MAP[customer.level]?.label || customer.level}
                </span>
            </td>
            <td class="text-right font-semibold">¥${customer.totalSpent.toFixed(2)}</td>
            <td class="text-center">${customer.orderCount}</td>
            <td class="text-sm">${formatDate(customer.lastVisit)}</td>
            <td>
                <div class="flex gap-1">
                    <button class="btn-sm btn-primary" onclick="viewCustomer('${customer.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-sm btn-danger" onclick="deleteCustomer('${customer.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
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
            <div class="text-sm text-gray-500">
                共 ${total} 位客户，第 ${page}/${totalPages} 页
            </div>
            <div class="flex gap-1">
                <button class="px-3 py-1 border rounded ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                        onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>
                    上一页
                </button>
                ${Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
                    const p = i + 1;
                    return `<button class="px-3 py-1 border rounded ${p === page ? 'bg-blue-500 text-white' : ''}" 
                            onclick="changePage(${p})">${p}</button>`;
                }).join('')}
                <button class="px-3 py-1 border rounded ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                        onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>
                    下一页
                </button>
            </div>
        </div>
    `;
}

window.changePage = function(page) {
    if (page < 1 || page > Math.ceil(state.pagination.total / state.pagination.limit)) return;
    state.pagination.page = page;
    loadCustomers();
};

window.viewCustomer = function(id) {
    showToast(`查看客户: ${id}`, 'info');
};

window.deleteCustomer = async function(id) {
    if (!confirm('确认删除该客户吗？')) return;
    try {
        await deleteCustomer(id);
        showToast('删除成功', 'success');
        await loadCustomers();
    } catch (error) {
        showToast('删除失败', 'error');
    }
};

function handleSearch() {
    state.pagination.page = 1;
    loadCustomers();
}

function handleReset() {
    state.filters = { name: '', phone: '', level: '' };
    document.getElementById('searchName').value = '';
    document.getElementById('searchPhone').value = '';
    document.getElementById('searchLevel').value = '';
    state.pagination.page = 1;
    loadCustomers();
}

function showCreateCustomer() {
    showToast('新建客户功能开发中', 'info');
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreateCustomer);
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