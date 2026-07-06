// ============================================================
// 模块：采购订单 (Purchasing Orders)
// 路径：frontend/modules/08-purchase/orders/orders.js
// 功能：订单列表、搜索、分页、CRUD操作
// ============================================================

import { getOrders, createOrder, updateOrder, deleteOrder } from '../../../api/orders.js';
import { showToast, formatDate, formatCurrency } from '../../../js/utils.js';

// ==================== 状态管理 ====================
const state = {
    orders: [],
    loading: false,
    pagination: {
        page: 1,
        limit: 10,
        total: 0
    },
    filters: {
        orderNo: '',
        supplier: '',
        status: ''
    }
};

// ==================== 常量配置 ====================
const STATUS_CONFIG = {
    draft: { label: '草稿', type: 'secondary', icon: 'fa-file' },
    pending: { label: '待审批', type: 'warning', icon: 'fa-clock' },
    approved: { label: '已批准', type: 'success', icon: 'fa-check-circle' },
    completed: { label: '已完成', type: 'primary', icon: 'fa-check-double' },
    cancelled: { label: '已取消', type: 'danger', icon: 'fa-times-circle' }
};

// ==================== 初始化 ====================
export async function init() {
    console.log('[采购订单] 模块初始化');
    await loadOrders();
    bindEvents();
    setupStatusFilter();
}

// ==================== API 调用 ====================

// 加载订单列表
async function loadOrders() {
    state.loading = true;
    showLoading();

    try {
        const params = {
            page: state.pagination.page,
            limit: state.pagination.limit,
            ...state.filters
        };
        
        // TODO: 后端API就绪后，切换到真实接口
        // const response = await getOrders(params);
        // const data = response.data;
        
        // 当前使用Mock数据
        const data = await getMockOrders(params);
        
        state.orders = data.list || [];
        state.pagination.total = data.total || 0;
        
        renderTable();
        renderPagination();
        updateStats();
    } catch (error) {
        console.error('[采购订单] 加载失败:', error);
        showToast('加载数据失败，请稍后重试', 'error');
        state.orders = [];
        renderTable();
    } finally {
        state.loading = false;
        hideLoading();
    }
}

// Mock数据生成器
function getMockOrders(params) {
    return new Promise((resolve) => {
        const mockData = [];
        const statuses = ['draft', 'pending', 'approved', 'completed', 'cancelled'];
        const suppliers = [
            '上海鑫源供应链有限公司',
            '深圳华强电子材料公司',
            '广州白云五金制品厂',
            '北京北方电子元件商行',
            '成都锦城建材批发中心',
            '武汉长江商贸有限公司',
            '西安秦川物资供应站',
            '杭州西湖包装材料厂'
        ];
        const products = ['洗车液', '泡沫蜡', '玻璃水', '轮胎蜡', '内饰清洁剂', '纳米镀膜', '洗车海绵', '超细纤维布'];
        
        for (let i = 0; i < 35; i++) {
            const status = statuses[i % statuses.length];
            const itemCount = Math.floor(Math.random() * 8) + 1;
            let amount = 0;
            for (let j = 0; j < itemCount; j++) {
                amount += Math.floor(Math.random() * 800) + 50;
            }
            
            mockData.push({
                id: `PO-${String(i + 1).padStart(6, '0')}`,
                orderNo: `PO-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
                supplierName: suppliers[i % suppliers.length],
                totalAmount: amount,
                status: status,
                items: itemCount,
                createTime: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
                creator: ['张经理', '李主管', '王采购', '赵总监', '刘专员'][i % 5],
                expectedDelivery: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
                productNames: products.slice(0, itemCount).join('、')
            });
        }

        // 排序（按创建时间倒序）
        mockData.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

        // 过滤
        let filtered = mockData;
        if (params.orderNo) {
            filtered = filtered.filter(item => item.orderNo.includes(params.orderNo));
        }
        if (params.supplier) {
            filtered = filtered.filter(item => item.supplierName.includes(params.supplier));
        }
        if (params.status) {
            filtered = filtered.filter(item => item.status === params.status);
        }

        // 分页
        const start = (params.page - 1) * params.limit;
        const end = Math.min(start + params.limit, filtered.length);
        const list = filtered.slice(start, end);

        resolve({
            list: list,
            total: filtered.length,
            page: params.page,
            limit: params.limit
        });
    });
}

// ==================== 渲染函数 ====================

// 渲染表格
function renderTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (state.loading) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8">
                    <div class="flex justify-center items-center gap-3">
                        <i class="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                        <span class="text-gray-500">加载中...</span>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    if (state.orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-12">
                    <div class="flex flex-col items-center text-gray-400">
                        <i class="fas fa-inbox text-5xl mb-3"></i>
                        <p class="text-lg">暂无采购订单</p>
                        <p class="text-sm">点击「新建订单」创建第一条采购订单</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = state.orders.map(order => {
        const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                        <span class="font-mono text-sm font-semibold text-blue-600">${order.orderNo}</span>
                        <span class="text-xs text-gray-400">#${order.id}</span>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="font-medium">${order.supplierName}</div>
                    <div class="text-xs text-gray-400">${order.creator}</div>
                </td>
                <td class="px-4 py-3 text-right">
                    <span class="font-bold text-lg text-gray-800">¥${formatCurrency(order.totalAmount)}</span>
                </td>
                <td class="px-4 py-3">
                    <span class="badge badge-${status.type}">
                        <i class="fas ${status.icon} mr-1"></i>
                        ${status.label}
                    </span>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">
                        ${order.items}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                    <div>${formatDate(order.createTime)}</div>
                    <div class="text-xs text-gray-400">预计 ${formatDate(order.expectedDelivery)}</div>
                </td>
                <td class="px-4 py-3">
                    <span class="text-xs text-gray-400">${order.productNames || '-'}</span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex gap-1">
                        <button class="btn-icon btn-icon-sm btn-primary" onclick="window.viewOrder('${order.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-icon-sm btn-warning" onclick="window.editOrder('${order.id}')" title="编辑">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn-icon btn-icon-sm btn-danger" onclick="window.deleteOrder('${order.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// 渲染分页
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const { page, limit, total } = state.pagination;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);

    let html = `
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t">
            <div class="text-sm text-gray-500">
                共 <span class="font-semibold text-gray-700">${total}</span> 条记录
                <span class="mx-2">|</span>
                第 <span class="font-semibold text-gray-700">${currentPage}</span> / ${totalPages} 页
                <span class="mx-2">|</span>
                每页 <select id="pageSizeSelect" class="form-select form-select-sm inline w-16">
                    ${[10, 20, 50, 100].map(size => 
                        `<option value="${size}" ${size === limit ? 'selected' : ''}>${size}</option>`
                    ).join('')}
                </select> 条
            </div>
            <div class="flex gap-1">
                <button class="btn-page" onclick="window.changePage(1)" ${currentPage <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-angle-double-left"></i>
                </button>
                <button class="btn-page" onclick="window.changePage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-angle-left"></i>
                </button>
    `;

    // 页码按钮（最多显示7个）
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, currentPage + 3);
    if (endPage - startPage < 6) {
        if (startPage === 1) endPage = Math.min(totalPages, startPage + 6);
        else startPage = Math.max(1, endPage - 6);
    }

    if (startPage > 1) {
        html += `<button class="btn-page" onclick="window.changePage(${startPage - 1})">...</button>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        html += `
            <button class="btn-page ${isActive ? 'btn-page-active' : ''}" 
                    onclick="window.changePage(${i})">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        html += `<button class="btn-page" onclick="window.changePage(${endPage + 1})">...</button>`;
    }

    html += `
                <button class="btn-page" onclick="window.changePage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
                    <i class="fas fa-angle-right"></i>
                </button>
                <button class="btn-page" onclick="window.changePage(${totalPages})" ${currentPage >= totalPages ? 'disabled' : ''}>
                    <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // 绑定每页条数变更事件
    document.getElementById('pageSizeSelect')?.addEventListener('change', function(e) {
        state.pagination.limit = parseInt(e.target.value);
        state.pagination.page = 1;
        loadOrders();
    });
}

// 更新统计信息
function updateStats() {
    const statsEl = document.getElementById('orderStats');
    if (!statsEl) return;
    
    const total = state.pagination.total;
    const statusCount = {};
    state.orders.forEach(order => {
        statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    
    statsEl.innerHTML = `
        <div class="flex gap-4 text-sm">
            <span class="text-gray-600">总计: <strong class="text-gray-800">${total}</strong></span>
            ${Object.keys(STATUS_CONFIG).map(key => 
                `<span class="text-gray-600">${STATUS_CONFIG[key].label}: <strong class="text-gray-800">${statusCount[key] || 0}</strong></span>`
            ).join('')}
        </div>
    `;
}

// 设置状态筛选下拉
function setupStatusFilter() {
    const select = document.getElementById('searchStatus');
    if (!select) return;
    
    select.innerHTML = `
        <option value="">全部状态</option>
        ${Object.keys(STATUS_CONFIG).map(key => 
            `<option value="${key}">${STATUS_CONFIG[key].label}</option>`
        ).join('')}
    `;
}

// ==================== 全局函数（暴露给HTML） ====================

window.changePage = function(page) {
    const { page: currentPage, limit, total } = state.pagination;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (page < 1 || page > totalPages) return;
    if (page === currentPage) return;
    state.pagination.page = page;
    loadOrders();
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.viewOrder = function(id) {
    const order = state.orders.find(o => o.id === id);
    if (!order) {
        showToast('订单不存在', 'error');
        return;
    }
    // TODO: 打开详情弹窗
    showToast(`查看订单: ${order.orderNo}`, 'info');
    console.log('[采购订单] 查看详情:', order);
};

window.editOrder = function(id) {
    const order = state.orders.find(o => o.id === id);
    if (!order) {
        showToast('订单不存在', 'error');
        return;
    }
    // TODO: 打开编辑弹窗
    showToast(`编辑订单: ${order.orderNo}`, 'info');
    console.log('[采购订单] 编辑:', order);
};

window.deleteOrder = async function(id) {
    if (!confirm('⚠️ 确认要删除该采购订单吗？此操作不可恢复！')) return;
    
    try {
        // TODO: 真实API调用
        // await deleteOrder(id);
        
        showToast('✅ 订单已删除', 'success');
        await loadOrders();
    } catch (error) {
        console.error('[采购订单] 删除失败:', error);
        showToast('删除失败，请重试', 'error');
    }
};

// ==================== 事件绑定 ====================

function bindEvents() {
    // 搜索
    document.getElementById('searchBtn')?.addEventListener('click', () => {
        state.filters.orderNo = document.getElementById('searchOrderNo')?.value || '';
        state.filters.supplier = document.getElementById('searchSupplier')?.value || '';
        state.filters.status = document.getElementById('searchStatus')?.value || '';
        state.pagination.page = 1;
        loadOrders();
    });

    // 回车搜索
    document.getElementById('searchOrderNo')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('searchBtn')?.click();
    });
    document.getElementById('searchSupplier')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('searchBtn')?.click();
    });

    // 重置
    document.getElementById('resetBtn')?.addEventListener('click', () => {
        document.getElementById('searchOrderNo').value = '';
        document.getElementById('searchSupplier').value = '';
        document.getElementById('searchStatus').value = '';
        state.filters = { orderNo: '', supplier: '', status: '' };
        state.pagination.page = 1;
        loadOrders();
    });

    // 新建订单
    document.getElementById('createBtn')?.addEventListener('click', () => {
        // TODO: 打开新建订单弹窗
        showToast('📝 新建订单功能开发中', 'info');
    });

    // 快捷键 Ctrl+K 快速搜索
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchOrderNo')?.focus();
        }
    });
}

// ==================== 工具函数 ====================

function showLoading() {
    const container = document.getElementById('ordersTableBody');
    if (container) {
        container.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8">
                    <div class="flex justify-center items-center gap-3">
                        <div class="spinner-border text-blue-500" role="status">
                            <span class="visually-hidden">加载中...</span>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }
}

function hideLoading() {
    // 由renderTable处理
}

// ==================== 导出 ====================
export default { init };