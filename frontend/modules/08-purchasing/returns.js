/**
 * @file returns.js
 * @module purchasing-returns
 * @description 采购退货 - 采购退货管理
 * 
 * @example
 * import { init } from './returns.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ReturnItem
 * @property {string} productId - 商品ID
 * @property {string} productName - 商品名称
 * @property {number} quantity - 退货数量
 * @property {number} unitPrice - 单价
 * @property {number} total - 小计
 * @property {string} unit - 单位
 * @property {string} reason - 退货原因
 */

/**
 * @typedef {Object} PurchaseReturn
 * @property {string} id - 退货单ID
 * @property {string} returnNo - 退货单号
 * @property {string} orderId - 采购订单ID
 * @property {string} orderNo - 采购订单号
 * @property {string} supplierId - 供应商ID
 * @property {string} supplierName - 供应商名称
 * @property {ReturnItem[]} items - 退货商品列表
 * @property {number} total - 退货总金额
 * @property {string} status - 状态 (pending/approved/shipped/received)
 * @property {string} returnDate - 退货日期
 * @property {string} reason - 退货原因
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{returns: PurchaseReturn[], filteredReturns: PurchaseReturn[], filters: {returnNo: string, supplier: string, status: string}, stats: {total: number, pending: number, approved: number, shipped: number, received: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    returns: [],
    filteredReturns: [],
    filters: {
        returnNo: '',
        supplier: '',
        status: ''
    },
    stats: {
        total: 0,
        pending: 0,
        approved: 0,
        shipped: 0,
        received: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    pending: { label: '待审批', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    approved: { label: '已审批', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-check-circle' },
    shipped: { label: '已发货', color: '#EDE9FE', textColor: '#6D28D9', icon: 'fa-truck' },
    received: { label: '已收货', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-box' }
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
 * @returns {PurchaseReturn[]} 模拟退货数据
 */
function getMockReturns() {
    const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D'];
    const products = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂'];
    const statuses = ['pending', 'approved', 'shipped', 'received'];
    const reasons = ['质量问题', '发错商品', '运输损坏', '规格不符'];
    const units = ['桶', '瓶', '个', '箱'];
    const orderNos = ['PO0001', 'PO0002', 'PO0003', 'PO0004', 'PO0005'];
    
    return Array.from({ length: 8 }, (_, i) => {
        const itemCount = Math.floor(Math.random() * 2) + 1;
        const items = [];
        let total = 0;
        for (let j = 0; j < itemCount; j++) {
            const qty = Math.floor(Math.random() * 50) + 5;
            const price = Math.floor(Math.random() * 100) + 20;
            const itemTotal = qty * price;
            items.push({
                productId: `P${String(j + 1).padStart(3, '0')}`,
                productName: products[(i + j) % products.length],
                quantity: qty,
                unitPrice: price,
                total: itemTotal,
                unit: units[j % units.length],
                reason: reasons[Math.floor(Math.random() * reasons.length)]
            });
            total += itemTotal;
        }
        const status = statuses[i % statuses.length];
        const dateOffset = Math.floor(Math.random() * 15);
        
        return {
            id: `PR-${String(i + 1).padStart(6, '0')}`,
            returnNo: `PR${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
            orderId: `PO-${String(i + 1).padStart(6, '0')}`,
            orderNo: orderNos[i % orderNos.length],
            supplierId: `SUP-${String(i % 4 + 1).padStart(3, '0')}`,
            supplierName: suppliers[i % suppliers.length],
            items: items,
            total: total,
            status: status,
            returnDate: new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            reason: '商品质量问题',
            note: '',
            createdAt: new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * @private
 * @description 加载退货数据
 */
function loadReturns() {
    try {
        const saved = localStorage.getItem('purchase_return_data');
        if (saved) {
            state.returns = JSON.parse(saved);
        } else {
            state.returns = getMockReturns();
            localStorage.setItem('purchase_return_data', JSON.stringify(state.returns));
        }
    } catch (e) {
        console.warn('加载退货数据失败:', e);
        state.returns = getMockReturns();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存退货数据
 */
function saveReturns() {
    try {
        localStorage.setItem('purchase_return_data', JSON.stringify(state.returns));
    } catch (e) {
        console.warn('保存退货数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.returns;
    
    if (state.filters.returnNo) {
        filtered = filtered.filter(r => r.returnNo.includes(state.filters.returnNo));
    }
    
    if (state.filters.supplier) {
        const supplier = state.filters.supplier.toLowerCase();
        filtered = filtered.filter(r => r.supplierName.toLowerCase().includes(supplier));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    state.filteredReturns = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.returns.length;
    const pending = state.returns.filter(r => r.status === 'pending').length;
    const approved = state.returns.filter(r => r.status === 'approved').length;
    const shipped = state.returns.filter(r => r.status === 'shipped').length;
    const received = state.returns.filter(r => r.status === 'received').length;
    
    state.stats = { total, pending, approved, shipped, received };
}

/**
 * @private
 * @description 渲染退货列表
 */
function render() {
    const tbody = document.getElementById('returnListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredReturns.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-undo" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无退货记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const status = STATUS_MAP[r.status] || STATUS_MAP.pending;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${r.returnNo}</div>
                    <div style="font-size:12px;color:#6B7280;">${r.id}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${r.supplierName}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#EF4444;">
                    -¥${formatCurrency(r.total)}
                </td>
                <td style="padding:10px 16px;text-align:center;font-size:13px;">${r.items.length}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(r.returnDate)}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${r.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.PurchaseReturnsModule.approveReturn('${r.id}')" title="审批">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.PurchaseReturnsModule.rejectReturn('${r.id}')" title="拒绝">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        ${r.status === 'approved' ? `
                            <button class="btn btn-sm btn-primary" onclick="window.PurchaseReturnsModule.markShipped('${r.id}')" title="标记发货">
                                <i class="fas fa-truck"></i>
                            </button>
                        ` : ''}
                        ${r.status === 'shipped' ? `
                            <button class="btn btn-sm btn-success" onclick="window.PurchaseReturnsModule.markReceived('${r.id}')" title="确认收货">
                                <i class="fas fa-box"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.PurchaseReturnsModule.viewReturn('${r.id}')" title="查看">
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
    document.getElementById('statShipped')?.textContent = stats.shipped;
    document.getElementById('statReceived')?.textContent = stats.received;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredReturns.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条退货
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.PurchaseReturnsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.PurchaseReturnsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredReturns.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 退货单ID
 */
function viewReturn(id) {
    const ret = state.returns.find(r => r.id === id);
    if (!ret) {
        showToast('退货单不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[ret.status] || STATUS_MAP.pending;
    const itemsStr = ret.items.map(item => 
        `${item.productName} × ${item.quantity} ${item.unit} = -¥${formatCurrency(item.total)} (${item.reason})`
    ).join('\n');
    
    alert(`退货详情：
退货单号: ${ret.returnNo}
采购订单: ${ret.orderNo}
供应商: ${ret.supplierName}
状态: ${status.label}
退货日期: ${formatDate(ret.returnDate)}
退货原因: ${ret.reason}
备注: ${ret.note || '无'}

商品明细:
${itemsStr}
总计: -¥${formatCurrency(ret.total)}`);
}

/**
 * @private
 * @param {string} id - 退货单ID
 */
function approveReturn(id) {
    const ret = state.returns.find(r => r.id === id);
    if (!ret) {
        showToast('退货单不存在', 'error');
        return;
    }
    
    ret.status = 'approved';
    ret.updatedAt = new Date().toISOString();
    
    saveReturns();
    applyFilters();
    render();
    showToast('退货已审批', 'success');
}

/**
 * @private
 * @param {string} id - 退货单ID
 */
function rejectReturn(id) {
    const ret = state.returns.find(r => r.id === id);
    if (!ret) {
        showToast('退货单不存在', 'error');
        return;
    }
    
    ret.status = 'received';
    ret.updatedAt = new Date().toISOString();
    
    saveReturns();
    applyFilters();
    render();
    showToast('退货已拒绝', 'success');
}

/**
 * @private
 * @param {string} id - 退货单ID
 */
function markShipped(id) {
    const ret = state.returns.find(r => r.id === id);
    if (!ret) {
        showToast('退货单不存在', 'error');
        return;
    }
    
    ret.status = 'shipped';
    ret.updatedAt = new Date().toISOString();
    
    saveReturns();
    applyFilters();
    render();
    showToast('已标记为已发货', 'success');
}

/**
 * @private
 * @param {string} id - 退货单ID
 */
function markReceived(id) {
    const ret = state.returns.find(r => r.id === id);
    if (!ret) {
        showToast('退货单不存在', 'error');
        return;
    }
    
    ret.status = 'received';
    ret.updatedAt = new Date().toISOString();
    
    saveReturns();
    applyFilters();
    render();
    showToast('已确认收货', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const orderNo = prompt('采购订单号：');
    if (!orderNo) return;
    const supplierName = prompt('供应商名称：') || '供应商';
    const returnDate = prompt('退货日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
    const reason = prompt('退货原因：') || '质量问题';
    
    const items = [];
    let total = 0;
    while (true) {
        const productName = prompt('商品名称（输入空结束）：');
        if (!productName) break;
        const quantity = parseInt(prompt('退货数量：', '10'));
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
        const itemReason = prompt('退货原因（可选）：') || reason;
        const itemTotal = quantity * unitPrice;
        items.push({
            productId: 'P' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
            productName: productName.trim(),
            quantity: quantity,
            unitPrice: unitPrice,
            total: itemTotal,
            unit: unit,
            reason: itemReason
        });
        total += itemTotal;
    }
    
    if (items.length === 0) {
        showToast('至少需要一个商品', 'error');
        return;
    }
    
    const note = prompt('备注：') || '';
    
    const newReturn = {
        id: 'PR-' + Date.now().toString().slice(-6),
        returnNo: `PR${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        orderId: 'PO-' + Date.now().toString().slice(-6),
        orderNo: orderNo.trim(),
        supplierId: 'SUP-' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
        supplierName: supplierName.trim(),
        items: items,
        total: total,
        status: 'pending',
        returnDate: returnDate || new Date().toISOString().split('T')[0],
        reason: reason,
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.returns.push(newReturn);
    saveReturns();
    applyFilters();
    render();
    showToast('退货申请已提交', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.returnNo = document.getElementById('searchReturnNo')?.value || '';
    state.filters.supplier = document.getElementById('searchSupplier')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const returnInput = document.getElementById('searchReturnNo');
    const supplierInput = document.getElementById('searchSupplier');
    const statusInput = document.getElementById('searchStatus');
    
    if (returnInput) returnInput.value = '';
    if (supplierInput) supplierInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { returnNo: '', supplier: '', status: '' };
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
    
    document.querySelectorAll('#searchReturnNo, #searchSupplier, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('↩️ 采购退货管理 初始化...');
    
    if (options?.data) {
        state.returns = options.data;
        localStorage.setItem('purchase_return_data', JSON.stringify(state.returns));
    }
    
    loadReturns();
    bindEvents();
    render();
    
    window.PurchaseReturnsModule = {
        state,
        loadReturns,
        render,
        renderPagination,
        updateStats,
        viewReturn,
        approveReturn,
        rejectReturn,
        markShipped,
        markReceived,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveReturns,
        applyFilters
    };
    
    console.log('✅ 采购退货管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadReturns,
    viewReturn,
    approveReturn,
    rejectReturn,
    markShipped,
    markReceived,
    goToPage,
    showCreateModal,
    saveReturns
};