// modules/04-products/products/products.js
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../../api/inventory.js';
import { formatCurrency, showToast } from '../../../js/utils.js';

const state = {
    products: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { name: '', category: '', status: '' },
    categories: ['洗车', '美容', '保养', '配件', '其他']
};

export async function init() {
    console.log('商品管理已加载');
    await loadProducts();
    bindEvents();
}

async function loadProducts() {
    state.loading = true;
    showLoading();

    try {
        const data = await getMockProducts();
        state.products = data.list;
        state.pagination.total = data.total;
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('加载商品失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockProducts() {
    const names = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂', '车蜡', '抛光剂', '纳米涂层', '轮毂清洁剂'];
    const categories = ['洗车', '美容', '保养', '配件', '其他'];
    const units = ['桶', '瓶', '个', '箱', '套'];
    
    const products = [];
    for (let i = 0; i < 30; i++) {
        const price = Math.floor(Math.random() * 500) + 50;
        const cost = Math.floor(price * 0.6);
        products.push({
            id: `PRD-${String(i + 1).padStart(6, '0')}`,
            name: names[i % names.length] + (i > 9 ? ` ${String.fromCharCode(65 + i % 26)}` : ''),
            category: categories[i % categories.length],
            price: price,
            cost: cost,
            stock: Math.floor(Math.random() * 1000),
            unit: units[i % units.length],
            status: Math.random() > 0.2 ? 'active' : 'inactive',
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return {
        list: products.slice(0, 10),
        total: products.length
    };
}

function renderTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (state.products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8">
                    <i class="fas fa-box-open text-4xl text-gray-300"></i>
                    <p class="mt-2 text-gray-500">暂无商品数据</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = state.products.map(product => `
        <tr>
            <td>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                        <i class="fas fa-box"></i>
                    </div>
                    <div>
                        <div class="font-medium">${product.name}</div>
                        <div class="text-xs text-gray-500">${product.id}</div>
                    </div>
                </div>
            </td>
            <td>${product.category}</td>
            <td class="text-right">¥${formatCurrency(product.price)}</td>
            <td class="text-right">¥${formatCurrency(product.cost)}</td>
            <td class="text-right">
                <span class="${product.stock < 50 ? 'text-red-500 font-bold' : 'text-gray-700'}">
                    ${product.stock}
                </span>
                ${product.stock < 50 ? '<span class="text-xs text-red-500 ml-1">⚠️</span>' : ''}
            </td>
            <td>${product.unit}</td>
            <td>
                <span class="badge ${product.status === 'active' ? 'badge-success' : 'badge-secondary'}">
                    ${product.status === 'active' ? '上架' : '下架'}
                </span>
            </td>
            <td>
                <div class="flex gap-1">
                    <button class="btn-sm btn-primary" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-danger" onclick="deleteProduct('${product.id}')">
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
                共 ${total} 件商品，第 ${page}/${totalPages} 页
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
    loadProducts();
};

window.editProduct = function(id) {
    showToast(`编辑商品: ${id}`, 'info');
};

window.deleteProduct = async function(id) {
    if (!confirm('确认删除该商品吗？')) return;
    try {
        await deleteProduct(id);
        showToast('删除成功', 'success');
        await loadProducts();
    } catch (error) {
        showToast('删除失败', 'error');
    }
};

function handleSearch() {
    state.pagination.page = 1;
    loadProducts();
}

function handleReset() {
    state.filters = { name: '', category: '', status: '' };
    document.getElementById('searchName').value = '';
    document.getElementById('searchCategory').value = '';
    document.getElementById('searchStatus').value = '';
    state.pagination.page = 1;
    loadProducts();
}

function showCreateProduct() {
    showToast('新建商品功能开发中', 'info');
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreateProduct);
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