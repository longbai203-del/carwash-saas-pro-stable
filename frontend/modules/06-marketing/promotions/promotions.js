// modules/06-marketing/promotions/promotions.js
import { getPromotions, deletePromotion } from '../../../api/marketing.js';
import { formatCurrency, formatDate, showToast } from '../../../js/utils.js';

const state = {
    promotions: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { name: '', type: '', status: '' }
};

const PROMOTION_TYPES = {
    discount: { label: '折扣', color: 'blue' },
    coupon: { label: '优惠券', color: 'green' },
    bundle: { label: '组合优惠', color: 'purple' },
    flash: { label: '限时抢购', color: 'red' },
    loyalty: { label: '会员专享', color: 'gold' }
};

export async function init() {
    console.log('促销管理已加载');
    await loadPromotions();
    bindEvents();
}

async function loadPromotions() {
    state.loading = true;
    showLoading();

    try {
        const data = await getMockPromotions();
        state.promotions = data.list;
        state.pagination.total = data.total;
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('加载促销失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockPromotions() {
    const names = ['夏日特惠', '新客立减', '会员折扣', '满减优惠', '季节促销', '节日特惠', '周末特价', '组合套餐'];
    const types = ['discount', 'coupon', 'bundle', 'flash', 'loyalty'];
    const statuses = ['active', 'active', 'inactive', 'active', 'scheduled'];
    
    const promotions = [];
    for (let i = 0; i < 20; i++) {
        const startDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + (Math.random() * 14 + 7) * 24 * 60 * 60 * 1000);
        promotions.push({
            id: `PROM-${String(i + 1).padStart(6, '0')}`,
            name: names[i % names.length] + (i > 7 ? ` ${String.fromCharCode(65 + i % 26)}` : ''),
            type: types[i % types.length],
            discountValue: Math.floor(Math.random() * 50) + 5,
            minPurchase: Math.floor(Math.random() * 500) + 100,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: statuses[i % statuses.length],
            usageCount: Math.floor(Math.random() * 100),
            createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return {
        list: promotions.slice(0, 10),
        total: promotions.length
    };
}

function renderTable() {
    const tbody = document.getElementById('promotionsTableBody');
    if (!tbody) return;

    const statusMap = {
        active: { label: '进行中', color: 'success' },
        inactive: { label: '已结束', color: 'secondary' },
        scheduled: { label: '待开始', color: 'info' }
    };

    tbody.innerHTML = state.promotions.map(promo => `
        <tr>
            <td>
                <div>
                    <div class="font-medium">${promo.name}</div>
                    <div class="text-xs text-gray-500">${promo.id}</div>
                </div>
            </td>
            <td>
                <span class="badge badge-${PROMOTION_TYPES[promo.type]?.color || 'secondary'}">
                    ${PROMOTION_TYPES[promo.type]?.label || promo.type}
                </span>
            </td>
            <td class="text-center font-bold">
                ${promo.type === 'discount' ? `${promo.discountValue}%` :
                  promo.type === 'coupon' ? `¥${promo.discountValue}` :
                  promo.type === 'bundle' ? '组合优惠' :
                  promo.type === 'flash' ? '限时抢购' :
                  '会员专享'}
            </td>
            <td class="text-right">¥${formatCurrency(promo.minPurchase)}</td>
            <td class="text-sm">
                ${new Date(promo.startDate).toLocaleDateString()}
                <br>
                <span class="text-xs text-gray-500">至</span>
                ${new Date(promo.endDate).toLocaleDateString()}
            </td>
            <td class="text-center">${promo.usageCount}</td>
            <td>
                <span class="badge badge-${statusMap[promo.status]?.color || 'secondary'}">
                    ${statusMap[promo.status]?.label || promo.status}
                </span>
            </td>
            <td>
                <div class="flex gap-1">
                    <button class="btn-sm btn-primary" onclick="editPromotion('${promo.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm ${promo.status === 'active' ? 'btn-warning' : 'btn-primary'}" 
                            onclick="toggleStatus('${promo.id}')">
                        <i class="fas ${promo.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button class="btn-sm btn-danger" onclick="deletePromotion('${promo.id}')">
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
    loadPromotions();
};

window.editPromotion = function(id) {
    showToast(`编辑促销: ${id}`, 'info');
};

window.toggleStatus = function(id) {
    showToast(`切换状态: ${id}`, 'info');
};

window.deletePromotion = async function(id) {
    if (!confirm('确认删除该促销活动吗？')) return;
    try {
        await deletePromotion(id);
        showToast('删除成功', 'success');
        await loadPromotions();
    } catch (error) {
        showToast('删除失败', 'error');
    }
};

function showCreatePromotion() {
    showToast('新建促销功能开发中', 'info');
}

function handleSearch() {
    state.pagination.page = 1;
    loadPromotions();
}

function handleReset() {
    state.filters = { name: '', type: '', status: '' };
    document.getElementById('searchName').value = '';
    document.getElementById('searchType').value = '';
    document.getElementById('searchStatus').value = '';
    state.pagination.page = 1;
    loadPromotions();
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreatePromotion);
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