/**
 * modules/04-products/products/products.js - 商品管理
 * 使用真实数据服务
 */

let productService = null;
let formatCurrency = null;
let showToast = null;

async function loadServices() {
    try {
        const services = await import('../../../js/services.js');
        productService = services.productService;
        formatCurrency = services.formatCurrency;
        showToast = window.showToast || function(msg) { alert(msg); };
        return true;
    } catch (error) {
        console.warn('⚠️ 服务加载失败:', error.message);
        formatCurrency = (n) => Number(n || 0).toFixed(2);
        showToast = (msg) => alert(msg);
        return false;
    }
}

const state = {
    products: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { name: '', category: '', status: '' }
};

export async function init() {
    console.log('📦 商品管理初始化...');
    await loadServices();
    await loadProducts();
    bindEvents();
}

async function loadProducts() {
    state.loading = true;
    showLoading();

    try {
        const result = await productService.getList({
            page: state.pagination.page,
            limit: state.pagination.limit,
            name: state.filters.name,
            category: state.filters.category,
            status: state.filters.status
        });

        state.products = result.list || [];
        state.pagination.total = result.total || 0;

        renderTable();
        renderPagination();

    } catch (error) {
        console.error('❌ 加载商品失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function renderTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (!state.products || state.products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:#6B7280;">暂无商品数据</td></tr>';
        return;
    }

    let html = '';
    for (let i = 0; i < state.products.length; i++) {
        const p = state.products[i];
        const statusText = p.status === 'active' ? '上架' : '下架';
        const statusColor = p.status === 'active' ? 'badge-success' : 'badge-secondary';
        const isLowStock = (p.stock_quantity || 0) < 50;

        html += `<tr>
            <td>
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:40px;height:40px;background:#F3F4F6;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#6B7280;">
                        <i class="fas fa-box"></i>
                    </div>
                    <div>
                        <div style="font-weight:500;">${p.name || '-'}</div>
                        <div style="font-size:12px;color:#6B7280;">${p.sku || p.id || ''}</div>
                    </div>
                </div>
            </td>
            <td>${p.category || '-'}</td>
            <td style="text-align:right;font-weight:600;">¥${formatCurrency(p.price || 0)}</td>
            <td style="text-align:right;">${formatCurrency(p.cost || 0)}</td>
            <td style="text-align:right;">
                <span style="${isLowStock ? 'color:#EF4444;font-weight:700;' : ''}">${p.stock_quantity || 0}</span>
                ${isLowStock ? '<span style="color:#EF4444;font-size:12px;margin-left:4px;">⚠️</span>' : ''}
            </td>
            <td>${p.unit || '-'}</td>
            <td><span class="badge ${statusColor}">${statusText}</span></td>
            <td>
                <div style="display:flex;gap:4px;">
                    <button class="btn-sm btn-primary" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-sm btn-danger" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
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
        <div style="font-size:14px;color:#6B7280;">共 ${total} 件，第 ${page}/${totalPages} 页</div>
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

window.changePage = function(page) {
    const totalPages = Math.ceil(state.pagination.total / state.pagination.limit) || 1;
    if (page < 1 || page > totalPages) return;
    state.pagination.page = page;
    loadProducts();
};

window.editProduct = function(id) {
    showToast('编辑商品: ' + id, 'info');
};

window.deleteProduct = async function(id) {
    if (!confirm('确认删除该商品吗？')) return;
    try {
        await productService.delete(id);
        showToast('删除成功', 'success');
        await loadProducts();
    } catch (error) {
        showToast('删除失败', 'error');
    }
};

function showCreateProduct() {
    showToast('新建商品功能开发中', 'info');
}

function handleSearch() {
    state.pagination.page = 1;
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.category = document.getElementById('searchCategory')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    loadProducts();
}

function handleReset() {
    state.pagination.page = 1;
    state.filters = { name: '', category: '', status: '' };
    document.getElementById('searchName').value = '';
    document.getElementById('searchCategory').value = '';
    document.getElementById('searchStatus').value = '';
    loadProducts();
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreateProduct);
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 100);
}