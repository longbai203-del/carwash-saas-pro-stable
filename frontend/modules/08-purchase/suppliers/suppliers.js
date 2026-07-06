// modules/08-purchase/suppliers/suppliers.js
import { getSuppliers, deleteSupplier } from '../../../api/purchase.js';
import { showToast } from '../../../js/utils.js';

const state = {
    suppliers: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { name: '', contact: '' }
};

export async function init() {
    console.log('供应商管理已加载');
    await loadSuppliers();
    bindEvents();
}

async function loadSuppliers() {
    state.loading = true;
    showLoading();

    try {
        const data = await getMockSuppliers();
        state.suppliers = data.list;
        state.pagination.total = data.total;
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('加载供应商失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockSuppliers() {
    const names = ['上海供应商有限公司', '深圳科技材料公司', '广州五金制品厂', '北京电子元件商行', '成都建材批发中心'];
    const contacts = ['张经理', '李总监', '王主管', '刘总', '陈经理'];
    
    const suppliers = [];
    for (let i = 0; i < 15; i++) {
        suppliers.push({
            id: `SUP-${String(i + 1).padStart(6, '0')}`,
            name: names[i % names.length] + (i > 4 ? ` (${i + 1})` : ''),
            contact: contacts[i % contacts.length],
            phone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
            email: `supplier${i + 1}@example.com`,
            address: `中国${['上海', '深圳', '广州', '北京', '成都'][i % 5]}市${['浦东', '南山', '天河', '海淀', '武侯'][i % 5]}区XX路${i + 1}号`,
            status: Math.random() > 0.2 ? 'active' : 'inactive',
            createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return {
        list: suppliers.slice(0, 10),
        total: suppliers.length
    };
}

function renderTable() {
    const tbody = document.getElementById('suppliersTableBody');
    if (!tbody) return;

    tbody.innerHTML = state.suppliers.map(supplier => `
        <tr>
            <td>
                <div>
                    <div class="font-medium">${supplier.name}</div>
                    <div class="text-xs text-gray-500">${supplier.id}</div>
                </div>
            </td>
            <td>${supplier.contact}</td>
            <td>${supplier.phone}</td>
            <td class="text-sm">${supplier.email}</td>
            <td>
                <span class="badge ${supplier.status === 'active' ? 'badge-success' : 'badge-secondary'}">
                    ${supplier.status === 'active' ? '启用' : '停用'}
                </span>
            </td>
            <td class="text-sm">${supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : '-'}</td>
            <td>
                <div class="flex gap-1">
                    <button class="btn-sm btn-primary" onclick="editSupplier('${supplier.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-danger" onclick="deleteSupplier('${supplier.id}')">
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
            <div class="text-sm text-gray-500">共 ${total} 家供应商，第 ${page}/${totalPages} 页</div>
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
    loadSuppliers();
};

window.editSupplier = function(id) {
    showToast(`编辑供应商: ${id}`, 'info');
};

window.deleteSupplier = async function(id) {
    if (!confirm('确认删除该供应商吗？')) return;
    try {
        await deleteSupplier(id);
        showToast('删除成功', 'success');
        await loadSuppliers();
    } catch (error) {
        showToast('删除失败', 'error');
    }
};

function showCreateSupplier() {
    showToast('新建供应商功能开发中', 'info');
}

function handleSearch() {
    state.pagination.page = 1;
    loadSuppliers();
}

function handleReset() {
    state.filters = { name: '', contact: '' };
    document.getElementById('searchName').value = '';
    document.getElementById('searchContact').value = '';
    state.pagination.page = 1;
    loadSuppliers();
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreateSupplier);
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