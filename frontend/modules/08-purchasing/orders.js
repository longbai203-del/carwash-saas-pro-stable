/**
 * @file orders.js
 * @module purchasing-orders
 * @description 采购订单管理 - 采购订单的CRUD操作
 * 
 * @example
 * import { init } from './orders.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} PurchaseItem
 * @property {string} productId - 商品ID
 * @property {string} productName - 商品名称
 * @property {number} quantity - 数量
 * @property {number} unitPrice - 单价
 * @property {number} total - 小计
 * @property {string} unit - 单位
 */

/**
 * @typedef {Object} PurchaseOrder
 * @property {string} id - 订单ID
 * @property {string} orderNo - 订单编号
 * @property {string} supplierId - 供应商ID
 * @property {string} supplierName - 供应商名称
 * @property {PurchaseItem[]} items - 采购商品列表
 * @property {number} subtotal - 小计
 * @property {number} tax - 税费
 * @property {number} total - 总计
 * @property {string} status - 状态 (draft/pending/approved/shipped/received/cancelled)
 * @property {string} orderDate - 下单日期
 * @property {string} expectedDate - 预计到货日期
 * @property {string} receivedDate - 收货日期
 * @property {string} approver - 审批人
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{orders: PurchaseOrder[], filteredOrders: PurchaseOrder[], filters: {orderNo: string, supplier: string, status: string, dateFrom: string, dateTo: string}, stats: {total: number, pending: number, approved: number, received: number, cancelled: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    orders: [],
    filteredOrders: [],
    filters: {
        orderNo: '',
        supplier: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    },
    stats: {
        total: 0,
        pending: 0,
        approved: 0,
        received: 0,
        cancelled: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    draft: { label: '草稿', color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-pen-fancy' },
    pending: { label: '待审批', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    approved: { label: '已审批', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-check-circle' },
    shipped: { label: '已发货', color: '#EDE9FE', textColor: '#6D28D9', icon: 'fa-truck' },
    received: { label: '已收货', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-box' },
    cancelled: { label: '已取消', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
};

/**
 * @private
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return amount.toFixed(2);
}

/**
 * @private
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
}

/**
 * @private
 * @returns {PurchaseOrder[]} 模拟采购订单数据
 */
function getMockOrders() {
    const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D'];
    const products = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂'];
    const statuses = ['draft', 'pending', 'approved', 'shipped', 'received', 'cancelled'];
    const units = ['桶', '瓶', '个', '箱'];
    
    return Array.from({ length: 12 }, (_, i) => {
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let subtotal = 0;
        for (let j = 0; j < itemCount; j++) {
            const qty = Math.floor(Math.random() * 100) + 10;
            const price = Math.floor(Math.random() * 200) + 20;
            const total = qty * price;
            items.push({
                productId: `P${String(j + 1).padStart(3, '0')}`,
                productName: products[(i + j) % products.length],
                quantity: qty,
                unitPrice: price,
                total: total,
                unit: units[j % units.length]
            });
            subtotal += total;
        }
        const tax = Math.round(subtotal * 0.06);
        const total = subtotal + tax;
        const status = statuses[i % statuses.length];
        const dateOffset = Math.floor(Math.random() * 30);
        
        return {
            id: `PO-${String(i + 1).padStart(6, '0')}`,
            orderNo: `PO${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
            supplierId: `SUP-${String(i % 4 + 1).padStart(3, '0')}`,
            supplierName: suppliers[i % suppliers.length],
            items: items,
            subtotal: subtotal,
            tax: tax,
            total: total,
            status: status,
            orderDate: new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            expectedDate: new Date(Date.now() + (20 - dateOffset) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            receivedDate: status === 'received' 
                ? new Date(Date.now() - (dateOffset - 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : '',
            approver: status !== 'draft' && status !== 'pending' ? '张伟' : '',
            note: Math.random() > 0.7 ? '紧急采购' : '',
            createdAt: new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * @private
 * @description 加载采购订单数据
 */
function loadOrders() {
    try {
        const saved = localStorage.getItem('purchase_order_data');
        if (saved) {
            state.orders = JSON.parse(saved);
        } else {
            state.orders = getMockOrders();
            localStorage.setItem('purchase_order_data', JSON.stringify(state.orders));
        }
    } catch (e) {
        console.warn('加载采购订单数据失败:', e);
        state.orders = getMockOrders();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存采购订单数据
 */
function saveOrders() {
    try {
        localStorage.setItem('purchase_order_data', JSON.stringify(state.orders));
    } catch (e) {
        console.warn('保存采购订单数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.orders;
    
    if (state.filters.orderNo) {
        filtered = filtered.filter(o => o.orderNo.includes(state.filters.orderNo));
    }
    
    if (state.filters.supplier) {
        const supplier = state.filters.supplier.toLowerCase();
        filtered = filtered.filter(o => o.supplierName.toLowerCase().includes(supplier));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(o => o.status === state.filters.status);
    }
    
    if (state.filters.dateFrom) {
        filtered = filtered.filter(o => o.orderDate >= state.filters.dateFrom);
    }
    
    if (state.filters.dateTo) {
        filtered = filtered.filter(o => o.orderDate <= state.filters.dateTo);
    }
    
    state.filteredOrders = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.orders.length;
    const pending = state.orders.filter(o => o.status === 'pending' || o.status === 'draft').length;
    const approved = state.orders.filter(o => o.status === 'approved').length;
    const received = state.orders.filter(o => o.status === 'received').length;
    const cancelled = state.orders.filter(o => o.status === 'cancelled').length;
    
    state.stats = { total, pending, approved, received, cancelled };
}

/**
 * @private
 * @description 渲染采购订单列表
 */
function render() {
    const tbody = document.getElementById('purchaseOrderListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredOrders.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-shopping-cart" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无采购订单
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(o => {
        const status = STATUS_MAP[o.status] || STATUS_MAP.draft;
        const itemCount = o.items ? o.items.length : 0;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${o.orderNo}</div>
                    <div style="font-size:12px;color:#6B7280;">${o.id}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${o.supplierName}</td>
                <td style="padding:10px 16px;text-align:center;font-size:13px;">${itemCount}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#4F46E5;">
                    ¥${formatCurrency(o.total)}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(o.orderDate)}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${o.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.PurchaseOrdersModule.approveOrder('${o.id}')" title="审批">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.PurchaseOrdersModule.cancelOrder('${o.id}')" title="取消">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        ${o.status === 'approved' ? `
                            <button class="btn btn-sm btn-primary" onclick="window.PurchaseOrdersModule.markShipped('${o.id}')" title="标记发货">
                                <i class="fas fa-truck"></i>
                            </button>
                        ` : ''}
                        ${o.status === 'shipped' ? `
                            <button class="btn btn-sm btn-success" onclick="window.PurchaseOrdersModule.markReceived('${o.id}')" title="确认收货">
                                <i class="fas fa-box"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.PurchaseOrdersModule.viewOrder('${o.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    updateStats();
    renderPagination();
}

/**
 * @private
 * @description 更新统计
 */
function updateStats() {
    const stats = state.stats;
    
    document.getElementById('statTotal')?.textContent = stats.total;
    document.getElementById('statPending')?.textContent = stats.pending;
    document.getElementById('statApproved')?.textContent = stats.approved;
    document.getElementById('statReceived')?.textContent = stats.received;
    document.getElementById('statCancelled')?.textContent = stats.cancelled;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredOrders.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条采购订单
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.PurchaseOrdersModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.PurchaseOrdersModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * @private
 * @param {number} page - 页码
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredOrders.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 订单ID
 */
function viewOrder(id) {
    const order = state.orders.find(o => o.id === id);
    if (!order) {
        showToast('订单不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[order.status] || STATUS_MAP.draft;
    const itemsStr = order.items.map(item => 
        `${item.productName} × ${item.quantity} = ¥${formatCurrency(item.total)}`
    ).join('\n');
    
    alert(`采购订单详情：
订单编号: ${order.orderNo}
供应商: ${order.supplierName}
状态: ${status.label}
下单日期: ${formatDate(order.orderDate)}
预计到货: ${formatDate(order.expectedDate)}
${order.receivedDate ? '收货日期: ' + formatDate(order.receivedDate) : ''}
审批人: ${order.approver || '-'}
备注: ${order.note || '无'}

商品明细:
${itemsStr}

小计: ¥${formatCurrency(order.subtotal)}
税费: ¥${formatCurrency(order.tax)}
总计: ¥${formatCurrency(order.total)}`);
}

/**
 * @private
 * @param {string} id - 订单ID
 */
function approveOrder(id) {
    const order = state.orders.find(o => o.id === id);
    if (!order) {
        showToast('订单不存在', 'error');
        return;
    }
    
    if (!confirm(`确认审批采购订单 ${order.orderNo}？`)) return;
    
    order.status = 'approved';
    order.approver = '张伟';
    order.updatedAt = new Date().toISOString();
    
    saveOrders();
    applyFilters();
    render();
    showToast('采购订单已审批', 'success');
}

/**
 * @private
 * @param {string} id - 订单ID
 */
function markShipped(id) {
    const order = state.orders.find(o => o.id === id);
    if (!order) {
        showToast('订单不存在', 'error');
        return;
    }
    
    order.status = 'shipped';
    order.updatedAt = new Date().toISOString();
    
    saveOrders();
    applyFilters();
    render();
    showToast('已标记为已发货', 'success');
}

/**
 * @private
 * @param {string} id - 订单ID
 */
function markReceived(id) {
    const order = state.orders.find(o => o.id === id);
    if (!order) {
        showToast('订单不存在', 'error');
        return;
    }
    
    if (!confirm(`确认收货 ${order.orderNo}？`)) return;
    
    order.status = 'received';
    order.receivedDate = new Date().toISOString().split('T')[0];
    order.updatedAt = new Date().toISOString();
    
    saveOrders();
    applyFilters();
    render();
    showToast('已确认收货', 'success');
}

/**
 * @private
 * @param {string} id - 订单ID
 */
function cancelOrder(id) {
    const order = state.orders.find(o => o.id === id);
    if (!order) {
        showToast('订单不存在', 'error');
        return;
    }
    
    if (!confirm(`确认取消采购订单 ${order.orderNo}？`)) return;
    
    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    
    saveOrders();
    applyFilters();
    render();
    showToast('采购订单已取消', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const supplierName = prompt('供应商名称：');
    if (!supplierName) return;
    const orderDate = prompt('下单日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
    const expectedDate = prompt('预计到货日期 (YYYY-MM-DD)：', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    const items = [];
    let subtotal = 0;
    while (true) {
        const productName = prompt('商品名称（输入空结束）：');
        if (!productName) break;
        const quantity = parseInt(prompt('数量：', '10'));
        if (isNaN(quantity) || quantity <= 0) {
            showToast('请输入有效数量', 'error');
            continue;
        }
        const unitPrice = parseFloat(prompt('单价：', '50'));
        if (isNaN(unitPrice) || unitPrice <= 0) {
            showToast('请输入有效单价', 'error');
            continue;
        }
        const unit = prompt('单位：', '个') || '个';
        const total = quantity * unitPrice;
        items.push({
            productId: 'P' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
            productName: productName.trim(),
            quantity: quantity,
            unitPrice: unitPrice,
            total: total,
            unit: unit
        });
        subtotal += total;
    }
    
    if (items.length === 0) {
        showToast('至少需要一个商品', 'error');
        return;
    }
    
    const tax = Math.round(subtotal * 0.06);
    const total = subtotal + tax;
    const note = prompt('备注：') || '';
    
    const newOrder = {
        id: 'PO-' + Date.now().toString().slice(-6),
        orderNo: `PO${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        supplierId: 'SUP-' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
        supplierName: supplierName.trim(),
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: 'pending',
        orderDate: orderDate || new Date().toISOString().split('T')[0],
        expectedDate: expectedDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        receivedDate: '',
        approver: '',
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.orders.push(newOrder);
    saveOrders();
    applyFilters();
    render();
    showToast('采购订单已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.orderNo = document.getElementById('searchOrderNo')?.value || '';
    state.filters.supplier = document.getElementById('searchSupplier')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.dateFrom = document.getElementById('dateFrom')?.value || '';
    state.filters.dateTo = document.getElementById('dateTo')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const orderInput = document.getElementById('searchOrderNo');
    const supplierInput = document.getElementById('searchSupplier');
    const statusInput = document.getElementById('searchStatus');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (orderInput) orderInput.value = '';
    if (supplierInput) supplierInput.value = '';
    if (statusInput) statusInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    state.filters = { orderNo: '', supplier: '', status: '', dateFrom: '', dateTo: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function bindEvents() {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    
    const createBtn = document.getElementById('createBtn');
    if (createBtn) createBtn.addEventListener('click', showCreateModal);
    
    document.querySelectorAll('#searchOrderNo, #searchSupplier, #searchStatus, #dateFrom, #dateTo').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📦 采购订单管理 初始化...');
    
    if (options?.data) {
        state.orders = options.data;
        localStorage.setItem('purchase_order_data', JSON.stringify(state.orders));
    }
    
    loadOrders();
    bindEvents();
    render();
    
    window.PurchaseOrdersModule = {
        state,
        loadOrders,
        render,
        renderPagination,
        updateStats,
        viewOrder,
        approveOrder,
        markShipped,
        markReceived,
        cancelOrder,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveOrders,
        applyFilters
    };
    
    console.log('✅ 采购订单管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadOrders,
    viewOrder,
    approveOrder,
    markShipped,
    markReceived,
    cancelOrder,
    goToPage,
    showCreateModal,
    saveOrders
};