/**
 * modules/04-products/products/products.js - 商品管理
 * 使用数据服务层获取数据
 */

// ============================================================
// 1. 状态管理
// ============================================================

const state = {
    products: [],
    loading: false,
    pagination: {
        page: 1,
        limit: 10,
        total: 0
    },
    filters: {
        name: '',
        category: '',
        status: ''
    },
    categories: ['洗车', '美容', '保养', '配件', '其他']
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

function getMockProducts() {
    var products = [];
    var names = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂', '车蜡', '抛光剂', '纳米涂层', '轮毂清洁剂'];
    var categories = ['洗车', '美容', '保养', '配件'];
    var units = ['桶', '瓶', '个', '箱'];

    for (var i = 0; i < 20; i++) {
        products.push({
            id: 'PRD-' + String(i + 1).padStart(6, '0'),
            name: names[i % names.length],
            category: categories[i % categories.length],
            price: Math.floor(Math.random() * 500) + 50,
            cost: Math.floor(Math.random() * 300) + 20,
            stock: Math.floor(Math.random() * 500) + 10,
            unit: units[i % units.length],
            status: Math.random() > 0.2 ? 'active' : 'inactive',
            createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return products;
}

// ============================================================
// 4. 核心功能
// ============================================================

export async function init() {
    console.log('📦 Products 初始化...');

    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    await loadProducts();
    bindEvents();
}

async function loadProducts() {
    state.loading = true;
    showLoading();

    try {
        const services = getServices();
        let data = null;

        // 优先使用数据服务
        if (services && services.product) {
            try {
                console.log('📦 使用数据服务加载商品...');
                var params = {
                    page: state.pagination.page,
                    limit: state.pagination.limit,
                    name: state.filters.name,
                    category: state.filters.category,
                    status: state.filters.status
                };
                data = await services.product.getList(params);
                console.log('✅ 数据服务返回商品:', data);
            } catch (serviceError) {
                console.warn('⚠️ 数据服务加载失败，使用 Mock:', serviceError.message);
                data = { list: getMockProducts(), total: 20 };
            }
        } else {
            console.log('📦 使用 Mock 数据加载商品...');
            var allProducts = getMockProducts();
            var start = (state.pagination.page - 1) * state.pagination.limit;
            var end = start + state.pagination.limit;
            data = {
                list: allProducts.slice(start, end),
                total: allProducts.length
            };
        }

        if (data) {
            state.products = data.list || [];
            state.pagination.total = data.total || 0;
        }

        renderTable();
        renderPagination();

    } catch (error) {
        console.error('❌ 加载商品失败:', error);
        showToast('加载数据失败，使用备用数据', 'warning');
        var fallback = getMockProducts();
        state.products = fallback.slice(0, 10);
        state.pagination.total = fallback.length;
        renderTable();
        renderPagination();
    } finally {
        state.loading = false;
        hideLoading();
    }
}

// ============================================================
// 5. 渲染函数
// ============================================================

function renderTable() {
    var tbody = document.getElementById('productsTableBody');
    if (!tbody) {
        console.warn('⚠️ productsTableBody 不存在');
        return;
    }

    if (!state.products || state.products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8 text-gray-500">
                    <i class="fas fa-box-open text-3xl"></i>
                    <p class="mt-2">暂无商品数据</p>
                </td>
            </tr>
        `;
        return;
    }

    var html = '';
    for (var i = 0; i < state.products.length; i++) {
        var p = state.products[i];
        var statusText = p.status === 'active' ? '上架' : '下架';
        var statusColor = p.status === 'active' ? 'badge-success' : 'badge-secondary';
        var isLowStock = (p.stock || 0) < 50;

        html += `
            <tr>
                <td>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                            <i class="fas fa-box"></i>
                        </div>
                        <div>
                            <div class="font-medium">${p.name || '-'}</div>
                            <div class="text-xs text-gray-500">${p.id || ''}</div>
                        </div>
                    </div>
                </td>
                <td>${p.category || '-'}</td>
                <td class="text-right">¥${formatCurrency(p.price || 0)}</td>
                <td class="text-right">¥${formatCurrency(p.cost || 0)}</td>
                <td class="text-right">
                    <span class="${isLowStock ? 'text-red-500 font-bold' : 'text-gray-700'}">
                        ${p.stock || 0}
                    </span>
                    ${isLowStock ? '<span class="text-xs text-red-500 ml-1">⚠️</span>' : ''}
                </td>
                <td>${p.unit || '-'}</td>
                <td>
                    <span class="badge ${statusColor}">
                        ${statusText}
                    </span>
                </td>
                <td>
                    <div class="flex gap-1">
                        <button class="btn-sm btn-primary" onclick="editProduct('${p.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-sm btn-danger" onclick="deleteProduct('${p.id}')">
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
                共 ${total} 件商品，第 ${page}/${totalPages} 页
            </div>
            <div class="flex gap-1">
                <button class="px-3 py-1 border rounded ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                        onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>
                    上一页
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
                    下一页
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// ============================================================
// 6. 全局函数（供 HTML 调用）
// ============================================================

window.changePage = function(page) {
    if (page < 1) return;
    var totalPages = Math.ceil(state.pagination.total / state.pagination.limit) || 1;
    if (page > totalPages) return;
    state.pagination.page = page;
    loadProducts();
};

window.editProduct = function(id) {
    showToast('编辑商品: ' + id, 'info');
};

window.deleteProduct = async function(id) {
    if (!confirm('确认删除该商品吗？')) return;
    try {
        var services = getServices();
        if (services && services.product) {
            await services.product.delete(id);
        }
        showToast('删除成功', 'success');
        await loadProducts();
    } catch (error) {
        console.error('删除失败:', error);
        showToast('删除失败', 'error');
    }
};

function showCreateProduct() {
    showToast('新建商品功能开发中', 'info');
}

// ============================================================
// 7. 事件绑定
// ============================================================

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
    var inputs = document.querySelectorAll('.search-bar input, .search-bar select');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = '';
    }
    loadProducts();
}

function bindEvents() {
    var searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);

    var resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', handleReset);

    var createBtn = document.getElementById('createBtn');
    if (createBtn) createBtn.addEventListener('click', showCreateProduct);

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

console.log('✅ Products 模块加载完成');