/**
 * @file receiving.js
 * @module receiving
 * @description 收货管理 - 采购收货和验收
 * 
 * @example
 * import { init } from './receiving.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ReceivingItem
 * @property {string} productId - 商品ID
 * @property {string} productName - 商品名称
 * @property {number} ordered - 订购数量
 * @property {number} received - 实收数量
 * @property {number} rejected - 拒收数量
 * @property {string} unit - 单位
 * @property {string} note - 备注
 */

/**
 * @typedef {Object} Receiving
 * @property {string} id - 收货单ID
 * @property {string} receiveNo - 收货单号
 * @property {string} orderId - 采购订单ID
 * @property {string} orderNo - 采购订单号
 * @property {string} supplierId - 供应商ID
 * @property {string} supplierName - 供应商名称
 * @property {ReceivingItem[]} items - 收货商品列表
 * @property {string} status - 状态 (pending/partial/complete)
 * @property {string} receiveDate - 收货日期
 * @property {string} inspector - 验收人
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{receivings: Receiving[], filteredReceivings: Receiving[], filters: {receiveNo: string, supplier: string, status: string, dateFrom: string, dateTo: string}, stats: {total: number, pending: number, partial: number, complete: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    receivings: [],
    filteredReceivings: [],
    filters: {
        receiveNo: '',
        supplier: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    },
    stats: {
        total: 0,
        pending: 0,
        partial: 0,
        complete: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    pending: { label: '待收货', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    partial: { label: '部分收货', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-hourglass-half' },
    complete: { label: '已完成', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' }
};

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
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

/**
 * @private
 * @returns {Receiving[]} 模拟收货数据
 */
function getMockReceivings() {
    const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D'];
    const products = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂'];
    const statuses = ['pending', 'partial', 'complete'];
    const units = ['桶', '瓶', '个', '箱'];
    const orderNos = ['PO0001', 'PO0002', 'PO0003', 'PO0004', 'PO0005', 'PO0006', 'PO0007', 'PO0008'];
    
    return Array.from({ length: 10 }, (_, i) => {
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const items = [];
        for (let j = 0; j < itemCount; j++) {
            const ordered = Math.floor(Math.random() * 100) + 10;
            const received = Math.floor(ordered * (0.7 + Math.random() * 0.3));
            const rejected = ordered - received;
            items.push({
                productId: `P${String(j + 1).padStart(3, '0')}`,
                productName: products[(i + j) % products.length],
                ordered: ordered,
                received: received > 0 ? received : 0,
                rejected: rejected > 0 ? rejected : 0,
                unit: units[j % units.length],
                note: rejected > 0 ? `${rejected}件损坏` : ''
            });
        }
        const status = statuses[i % statuses.length];
        const dateOffset = Math.floor(Math.random() * 10);
        
        return {
            id: `RCV-${String(i + 1).padStart(6, '0')}`,
            receiveNo: `RCV${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
            orderId: `PO-${String(i + 1).padStart(6, '0')}`,
            orderNo: orderNos[i % orderNos.length],
            supplierId: `SUP-${String(i % 4 + 1).padStart(3, '0')}`,
            supplierName: suppliers[i % suppliers.length],
            items: items,
            status: status,
            receiveDate: new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            inspector: status !== 'pending' ? '张伟' : '',
            note: '',
            createdAt: new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * @private
 * @description 加载收货数据
 */
function loadReceivings() {
    try {
        const saved = localStorage.getItem('receiving_data');
        if (saved) {
            state.receivings = JSON.parse(saved);
        } else {
            state.receivings = getMockReceivings();
            localStorage.setItem('receiving_data', JSON.stringify(state.receivings));
        }
    } catch (e) {
        console.warn('加载收货数据失败:', e);
        state.receivings = getMockReceivings();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存收货数据
 */
function saveReceivings() {
    try {
        localStorage.setItem('receiving_data', JSON.stringify(state.receivings));
    } catch (e) {
        console.warn('保存收货数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.receivings;
    
    if (state.filters.receiveNo) {
        filtered = filtered.filter(r => r.receiveNo.includes(state.filters.receiveNo));
    }
    
    if (state.filters.supplier) {
        const supplier = state.filters.supplier.toLowerCase();
        filtered = filtered.filter(r => r.supplierName.toLowerCase().includes(supplier));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    if (state.filters.dateFrom) {
        filtered = filtered.filter(r => r.receiveDate >= state.filters.dateFrom);
    }
    
    if (state.filters.dateTo) {
        filtered = filtered.filter(r => r.receiveDate <= state.filters.dateTo);
    }
    
    state.filteredReceivings = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.receivings.length;
    const pending = state.receivings.filter(r => r.status === 'pending').length;
    const partial = state.receivings.filter(r => r.status === 'partial').length;
    const complete = state.receivings.filter(r => r.status === 'complete').length;
    
    state.stats = { total, pending, partial, complete };
}

/**
 * @private
 * @description 渲染收货列表
 */
function render() {
    const tbody = document.getElementById('receivingListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredReceivings.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-clipboard-list" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无收货记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const status = STATUS_MAP[r.status] || STATUS_MAP.pending;
        const totalOrdered = r.items.reduce((sum, item) => sum + item.ordered, 0);
        const totalReceived = r.items.reduce((sum, item) => sum + item.received, 0);
        const completionRate = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${r.receiveNo}</div>
                    <div style="font-size:12px;color:#6B7280;">${r.id}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${r.supplierName}</td>
                <td style="padding:10px 16px;text-align:center;font-weight:600;">
                    ${formatNumber(totalReceived)}/${formatNumber(totalOrdered)}
                    <div style="font-size:11px;color:#6B7280;">${completionRate}%</div>
                </td>
                <td style="padding:10px 16px;text-align:center;font-size:13px;color:#6B7280;">
                    ${r.items.filter(item => item.rejected > 0).length} 项异常
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(r.receiveDate)}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${r.status === 'pending' || r.status === 'partial' ? `
                            <button class="btn btn-sm btn-success" onclick="window.ReceivingModule.completeReceiving('${r.id}')" title="完成收货">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.ReceivingModule.viewReceiving('${r.id}')" title="查看">
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
    document.getElementById('statPartial')?.textContent = stats.partial;
    document.getElementById('statComplete')?.textContent = stats.complete;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredReceivings.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条收货记录
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.ReceivingModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.ReceivingModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredReceivings.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 收货单ID
 */
function viewReceiving(id) {
    const receiving = state.receivings.find(r => r.id === id);
    if (!receiving) {
        showToast('收货单不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[receiving.status] || STATUS_MAP.pending;
    const itemsStr = receiving.items.map(item => 
        `${item.productName}: 订购${item.ordered} ${item.unit}，实收${item.received} ${item.unit}${item.rejected > 0 ? `，拒收${item.rejected} ${item.unit}` : ''}`
    ).join('\n');
    
    alert(`收货详情：
收货单号: ${receiving.receiveNo}
采购订单: ${receiving.orderNo}
供应商: ${receiving.supplierName}
状态: ${status.label}
收货日期: ${formatDate(receiving.receiveDate)}
验收人: ${receiving.inspector || '-'}
备注: ${receiving.note || '无'}

商品明细:
${itemsStr}`);
}

/**
 * @private
 * @param {string} id - 收货单ID
 */
function completeReceiving(id) {
    const receiving = state.receivings.find(r => r.id === id);
    if (!receiving) {
        showToast('收货单不存在', 'error');
        return;
    }
    
    // 检查是否有拒收商品
    const hasRejected = receiving.items.some(item => item.rejected > 0);
    
    receiving.status = 'complete';
    receiving.inspector = '张伟';
    receiving.updatedAt = new Date().toISOString();
    
    // 更新库存
    updateInventoryFromReceiving(receiving);
    
    saveReceivings();
    applyFilters();
    render();
    showToast(`收货已完成${hasRejected ? '（部分商品拒收）' : ''}`, 'success');
}

/**
 * @private
 * @param {Receiving} receiving - 收货单
 */
function updateInventoryFromReceiving(receiving) {
    try {
        const stockData = JSON.parse(localStorage.getItem('stock_data') || '[]');
        receiving.items.forEach(item => {
            if (item.received > 0) {
                const stockItem = stockData.find(s => s.id === item.productId);
                if (stockItem) {
                    stockItem.quantity = (stockItem.quantity || 0) + item.received;
                    stockItem.lastUpdated = new Date().toISOString();
                } else {
                    // 如果商品不存在，创建新库存记录
                    stockData.push({
                        id: item.productId,
                        name: item.productName,
                        quantity: item.received,
                        unit: item.unit,
                        minStock: 10,
                        status: 'normal',
                        lastUpdated: new Date().toISOString()
                    });
                }
            }
        });
        localStorage.setItem('stock_data', JSON.stringify(stockData));
    } catch (e) {
        console.warn('更新库存失败:', e);
    }
}

/**
 * @private
 */
function showCreateModal() {
    const orderNo = prompt('采购订单号：');
    if (!orderNo) return;
    const supplierName = prompt('供应商名称：') || '供应商';
    const receiveDate = prompt('收货日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
    
    const items = [];
    while (true) {
        const productName = prompt('商品名称（输入空结束）：');
        if (!productName) break;
        const ordered = parseInt(prompt('订购数量：', '10'));
        if (isNaN(ordered) || ordered <= 0) {
            showToast('请输入有效数量', 'error');
            continue;
        }
        const received = parseInt(prompt('实收数量：', ordered));
        if (isNaN(received) || received < 0) {
            showToast('请输入有效数量', 'error');
            continue;
        }
        const unit = prompt('单位：', '个') || '个';
        const rejected = ordered - received;
        items.push({
            productId: 'P' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
            productName: productName.trim(),
            ordered: ordered,
            received: received > 0 ? received : 0,
            rejected: rejected > 0 ? rejected : 0,
            unit: unit,
            note: rejected > 0 ? `${rejected}件异常` : ''
        });
    }
    
    if (items.length === 0) {
        showToast('至少需要一个商品', 'error');
        return;
    }
    
    const status = items.some(item => item.received < item.ordered) ? 'partial' : 'complete';
    const note = prompt('备注：') || '';
    
    const newReceiving = {
        id: 'RCV-' + Date.now().toString().slice(-6),
        receiveNo: `RCV${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        orderId: 'PO-' + Date.now().toString().slice(-6),
        orderNo: orderNo.trim(),
        supplierId: 'SUP-' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
        supplierName: supplierName.trim(),
        items: items,
        status: status,
        receiveDate: receiveDate || new Date().toISOString().split('T')[0],
        inspector: status === 'complete' ? '张伟' : '',
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.receivings.push(newReceiving);
    
    // 如果已完成，更新库存
    if (status === 'complete') {
        updateInventoryFromReceiving(newReceiving);
    }
    
    saveReceivings();
    applyFilters();
    render();
    showToast('收货单已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.receiveNo = document.getElementById('searchReceiveNo')?.value || '';
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
    const receiveInput = document.getElementById('searchReceiveNo');
    const supplierInput = document.getElementById('searchSupplier');
    const statusInput = document.getElementById('searchStatus');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (receiveInput) receiveInput.value = '';
    if (supplierInput) supplierInput.value = '';
    if (statusInput) statusInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    state.filters = { receiveNo: '', supplier: '', status: '', dateFrom: '', dateTo: '' };
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
    
    document.querySelectorAll('#searchReceiveNo, #searchSupplier, #searchStatus, #dateFrom, #dateTo').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📋 收货管理 初始化...');
    
    if (options?.data) {
        state.receivings = options.data;
        localStorage.setItem('receiving_data', JSON.stringify(state.receivings));
    }
    
    loadReceivings();
    bindEvents();
    render();
    
    window.ReceivingModule = {
        state,
        loadReceivings,
        render,
        renderPagination,
        updateStats,
        viewReceiving,
        completeReceiving,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveReceivings,
        applyFilters,
        updateInventoryFromReceiving
    };
    
    console.log('✅ 收货管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadReceivings,
    viewReceiving,
    completeReceiving,
    goToPage,
    showCreateModal,
    saveReceivings
};