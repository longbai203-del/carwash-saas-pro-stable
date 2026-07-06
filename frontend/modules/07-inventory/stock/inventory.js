// modules/07-inventory/stock/inventory.js
import { getInventory, updateStock, deleteStockItem } from '../../../api/inventory.js';
import { formatCurrency, showToast } from '../../../js/utils.js';

const state = {
    items: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { name: '', category: '', location: '' }
};

export async function init() {
    console.log('库存管理已加载');
    await loadInventory();
    bindEvents();
}

async function loadInventory() {
    state.loading = true;
    showLoading();

    try {
        const data = await getMockInventory();
        state.items = data.list;
        state.pagination.total = data.total;
        renderTable();
        renderPagination();
        renderSummary();
    } catch (error) {
        console.error('加载库存失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockInventory() {
    const names = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂', '车蜡', '抛光剂', '纳米涂层', '轮毂清洁剂'];
    const categories = ['洗车', '美容', '保养', '配件'];
    const locations = ['A区-1号', 'A区-2号', 'B区-1号', 'B区-2号', 'C区-1号'];
    
    const items = [];
    for (let i = 0; i < 25; i++) {
        const stock = Math.floor(Math.random() * 500) + 10;
        const minStock = Math.floor(Math.random() * 50) + 5;
        items.push({
            id: `INV-${String(i + 1).padStart(6, '0')}`,
            name: names[i % names.length] + (i > 9 ? ` ${String.fromCharCode(65 + i % 26)}` : ''),
            category: categories[i % categories.length],
            location: locations[i % locations.length],
            stock: stock,
            minStock: minStock,
            maxStock: minStock * 5 + Math.floor(Math.random() * 200),
            unit: '桶',
            cost: Math.floor(Math.random() * 300) + 50,
            lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return {
        list: items.slice(0, 10),
        total: items.length
    };
}

function renderTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    if (state.items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8">
                    <i class="fas fa-warehouse text-4xl text-gray-300"></i>
                    <p class="mt-2 text-gray-500">暂无库存数据</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = state.items.map(item => {
        const isLow = item.stock <= item.minStock;
        const isOver = item.stock >= item.maxStock;
        
        return `
            <tr>
                <td>
                    <div>
                        <div class="font-medium">${item.name}</div>
                        <div class="text-xs text-gray-500">${item.id}</div>
                    </div>
                </td>
                <td>${item.category}</td>
                <td>${item.location}</td>
                <td class="text-right">
                    <span class="${isLow ? 'text-red-500' : isOver ? 'text-yellow-500' : 'text-gray-700'} font-bold">
                        ${item.stock}
                    </span>
                    <div class="text-xs text-gray-400">${item.unit}</div>
                </td>
                <td class="text-right">${item.minStock}</td>
                <td class="text-right">${item.maxStock}</td>
                <td>
                    ${isLow ? '<span class="badge badge-danger">⚠️ 低库存</span>' : 
                      isOver ? '<span class="badge badge-warning">📦 超库存</span>' :
                      '<span class="badge badge-success">✅ 正常</span>'}
                </td>
                <td>
                    <div class="flex gap-1">
                        <button class="btn-sm btn-primary" onclick="adjustStock('${item.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-sm btn-danger" onclick="deleteItem('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const { page, limit, total } = state.pagination;
    const totalPages = Math.ceil(total / limit);

    container.innerHTML = `
        <div class="flex items-center justify-between px-4 py-3">
            <div class="text-sm text-gray-500">
                共 ${total} 项库存，第 ${page}/${totalPages} 页
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

function renderSummary() {
    const container = document.getElementById('summaryContainer');
    if (!container) return;

    const totalItems = state.items.length;
    const totalStock = state.items.reduce((sum, i) => sum + i.stock, 0);
    const lowStockItems = state.items.filter(i => i.stock <= i.minStock).length;
    const totalValue = state.items.reduce((sum, i) => sum + i.stock * i.cost, 0);

    container.innerHTML = `
        <div class="flex flex-wrap gap-6 text-sm">
            <span>总SKU: <strong>${totalItems}</strong></span>
            <span>总库存: <strong>${totalStock}</strong></span>
            <span class="text-red-500">低库存: <strong>${lowStockItems}</strong></span>
            <span>总价值: <strong>¥${formatCurrency(totalValue)}</strong></span>
        </div>
    `;
}

window.changePage = function(page) {
    if (page < 1 || page > Math.ceil(state.pagination.total / state.pagination.limit)) return;
    state.pagination.page = page;
    loadInventory();
};

window.adjustStock = function(id) {
    showToast(`调整库存: ${id}`, 'info');
};

window.deleteItem = async function(id) {
    if (!confirm('确认删除该库存项吗？')) return;
    try {
        await deleteStockItem(id);
        showToast('删除成功', 'success');
        await loadInventory();
    } catch (error) {
        showToast('删除失败', 'error');
    }
};

function handleSearch() {
    state.pagination.page = 1;
    loadInventory();
}

function handleReset() {
    state.filters = { name: '', category: '', location: '' };
    document.getElementById('searchName').value = '';
    document.getElementById('searchCategory').value = '';
    document.getElementById('searchLocation').value = '';
    state.pagination.page = 1;
    loadInventory();
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