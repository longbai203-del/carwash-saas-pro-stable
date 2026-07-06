// modules/11-saas/tenants/tenants.js
import { getTenants, deleteTenant } from '../../../api/saas.js';
import { formatCurrency, formatDate, showToast } from '../../../js/utils.js';

const state = {
    tenants: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { name: '', plan: '', status: '' }
};

const PLANS = {
    starter: { label: '入门版', color: 'info', price: 99 },
    professional: { label: '专业版', color: 'blue', price: 299 },
    enterprise: { label: '企业版', color: 'purple', price: 599 }
};

export async function init() {
    console.log('租户管理已加载');
    await loadTenants();
    bindEvents();
}

async function loadTenants() {
    state.loading = true;
    showLoading();

    try {
        const data = await getMockTenants();
        state.tenants = data.list;
        state.pagination.total = data.total;
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('加载租户失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockTenants() {
    const names = ['洗车行A', '洗车行B', '汽车美容C', '4S店D', '连锁洗车E', '高端美容F', '社区洗车G', '加盟店H'];
    const plans = ['starter', 'professional', 'enterprise'];
    const statuses = ['active', 'active', 'active', 'inactive', 'trial'];
    
    const tenants = [];
    for (let i = 0; i < 25; i++) {
        const plan = plans[i % plans.length];
        tenants.push({
            id: `TEN-${String(i + 1).padStart(6, '0')}`,
            name: names[i % names.length] + (i > 7 ? ` ${String.fromCharCode(65 + i % 26)}` : ''),
            plan: plan,
            price: PLANS[plan]?.price || 99,
            status: statuses[i % statuses.length],
            users: Math.floor(Math.random() * 20) + 1,
            storage: Math.floor(Math.random() * 50) + 10,
            createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + (Math.random() * 60 + 30) * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return {
        list: tenants.slice(0, 10),
        total: tenants.length
    };
}

function renderTable() {
    const tbody = document.getElementById('tenantsTableBody');
    if (!tbody) return;

    const statusMap = {
        active: { label: '已激活', color: 'success' },
        inactive: { label: '已停用', color: 'danger' },
        trial: { label: '试用中', color: 'warning' }
    };

    tbody.innerHTML = state.tenants.map(tenant => `
        <tr>
            <td>
                <div>
                    <div class="font-medium">${tenant.name}</div>
                    <div class="text-xs text-gray-500">${tenant.id}</div>
                </div>
            </td>
            <td>
                <span class="badge badge-${PLANS[tenant.plan]?.color || 'secondary'}">
                    ${PLANS[tenant.plan]?.label || tenant.plan}
                </span>
            </td>
            <td class="text-right">¥${tenant.price}/月</td>
            <td class="text-center">${tenant.users}</td>
            <td class="text-center">${tenant.storage}GB</td>
            <td class="text-sm">
                ${new Date(tenant.createdAt).toLocaleDateString()}
                <br>
                <span class="text-xs text-gray-500">到期: ${new Date(tenant.expiresAt).toLocaleDateString()}</span>
            </td>
            <td>
                <span class="badge badge-${statusMap[tenant.status]?.color || 'secondary'}">
                    ${statusMap[tenant.status]?.label || tenant.status}
                </span>
            </td>
            <td>
                <div class="flex gap-1">
                    <button class="btn-sm btn-primary" onclick="viewTenant('${tenant.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-sm btn-warning" onclick="editTenant('${tenant.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-danger" onclick="deleteTenant('${tenant.id}')">
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
            <div class="text-sm text-gray-500">共 ${total} 个租户，第 ${page}/${totalPages} 页</div>
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
    loadTenants();
};

window.viewTenant = function(id) {
    showToast(`查看租户: ${id}`, 'info');
};

window.editTenant = function(id) {
    showToast(`编辑租户: ${id}`, 'info');
};

window.deleteTenant = async function(id) {
    if (!confirm('确认删除该租户吗？')) return;
    try {
        await deleteTenant(id);
        showToast('删除成功', 'success');
        await loadTenants();
    } catch (error) {
        showToast('删除失败', 'error');
    }
};

function showCreateTenant() {
    showToast('新建租户功能开发中', 'info');
}

function handleSearch() {
    state.pagination.page = 1;
    loadTenants();
}

function handleReset() {
    state.filters = { name: '', plan: '', status: '' };
    document.getElementById('searchName').value = '';
    document.getElementById('searchPlan').value = '';
    document.getElementById('searchStatus').value = '';
    state.pagination.page = 1;
    loadTenants();
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreateTenant);
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