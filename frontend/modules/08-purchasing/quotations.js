/**
 * @file quotations.js
 * @module quotations
 * @description 询价管理 - 供应商询价和报价管理
 * 
 * @example
 * import { init } from './quotations.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} QuotationItem
 * @property {string} productId - 商品ID
 * @property {string} productName - 商品名称
 * @property {number} quantity - 数量
 * @property {number} unitPrice - 报价单价
 * @property {number} total - 小计
 * @property {string} unit - 单位
 */

/**
 * @typedef {Object} Quotation
 * @property {string} id - 询价单ID
 * @property {string} quoteNo - 询价单号
 * @property {string} supplierId - 供应商ID
 * @property {string} supplierName - 供应商名称
 * @property {QuotationItem[]} items - 询价商品列表
 * @property {number} subtotal - 小计
 * @property {number} tax - 税费
 * @property {number} total - 总计
 * @property {string} status - 状态 (draft/sent/received/accepted/rejected)
 * @property {string} quoteDate - 询价日期
 * @property {string} validUntil - 有效期至
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{quotations: Quotation[], filteredQuotations: Quotation[], filters: {quoteNo: string, supplier: string, status: string}, stats: {total: number, sent: number, received: number, accepted: number, rejected: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    quotations: [],
    filteredQuotations: [],
    filters: {
        quoteNo: '',
        supplier: '',
        status: ''
    },
    stats: {
        total: 0,
        sent: 0,
        received: 0,
        accepted: 0,
        rejected: 0
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
    sent: { label: '已发送', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-paper-plane' },
    received: { label: '已报价', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-reply' },
    accepted: { label: '已接受', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    rejected: { label: '已拒绝', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
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
 * @returns {Quotation[]} 模拟询价数据
 */
function getMockQuotations() {
    const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D'];
    const products = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂'];
    const statuses = ['draft', 'sent', 'received', 'accepted', 'rejected'];
    const units = ['桶', '瓶', '个', '箱'];
    
    return Array.from({ length: 10 }, (_, i) => {
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
        const dateOffset = Math.floor(Math.random() * 20);
        
        return {
            id: `QT-${String(i + 1).padStart(6, '0')}`,
            quoteNo: `QT${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
            supplierId: `SUP-${String(i % 4 + 1).padStart(3, '0')}`,
            supplierName: suppliers[i % suppliers.length],
            items: items,
            subtotal: subtotal,
            tax: tax,
            total: total,
            status: status,
            quoteDate: new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            validUntil: new Date(Date.now() + (30 - dateOffset) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            note: '',
            createdAt: new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * @private
 * @description 加载询价数据
 */
function loadQuotations() {
    try {
        const saved = localStorage.getItem('quotation_data');
        if (saved) {
            state.quotations = JSON.parse(saved);
        } else {
            state.quotations = getMockQuotations();
            localStorage.setItem('quotation_data', JSON.stringify(state.quotations));
        }
    } catch (e) {
        console.warn('加载询价数据失败:', e);
        state.quotations = getMockQuotations();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存询价数据
 */
function saveQuotations() {
    try {
        localStorage.setItem('quotation_data', JSON.stringify(state.quotations));
    } catch (e) {
        console.warn('保存询价数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.quotations;
    
    if (state.filters.quoteNo) {
        filtered = filtered.filter(q => q.quoteNo.includes(state.filters.quoteNo));
    }
    
    if (state.filters.supplier) {
        const supplier = state.filters.supplier.toLowerCase();
        filtered = filtered.filter(q => q.supplierName.toLowerCase().includes(supplier));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(q => q.status === state.filters.status);
    }
    
    state.filteredQuotations = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.quotations.length;
    const sent = state.quotations.filter(q => q.status === 'sent').length;
    const received = state.quotations.filter(q => q.status === 'received').length;
    const accepted = state.quotations.filter(q => q.status === 'accepted').length;
    const rejected = state.quotations.filter(q => q.status === 'rejected').length;
    
    state.stats = { total, sent, received, accepted, rejected };
}

/**
 * @private
 * @description 渲染询价列表
 */
function render() {
    const tbody = document.getElementById('quotationListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredQuotations.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-file-invoice" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无询价记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(q => {
        const status = STATUS_MAP[q.status] || STATUS_MAP.draft;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${q.quoteNo}</div>
                    <div style="font-size:12px;color:#6B7280;">${q.id}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${q.supplierName}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#4F46E5;">
                    ¥${formatCurrency(q.total)}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(q.quoteDate)}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${q.status === 'sent' ? `
                            <button class="btn btn-sm btn-success" onclick="window.QuotationsModule.receiveQuotation('${q.id}')" title="收到报价">
                                <i class="fas fa-reply"></i>
                            </button>
                        ` : ''}
                        ${q.status === 'received' ? `
                            <button class="btn btn-sm btn-primary" onclick="window.QuotationsModule.acceptQuotation('${q.id}')" title="接受报价">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.QuotationsModule.rejectQuotation('${q.id}')" title="拒绝报价">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.QuotationsModule.viewQuotation('${q.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${q.status === 'draft' ? `
                            <button class="btn btn-sm btn-danger" onclick="window.QuotationsModule.deleteQuotation('${q.id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
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
    document.getElementById('statSent')?.textContent = stats.sent;
    document.getElementById('statReceived')?.textContent = stats.received;
    document.getElementById('statAccepted')?.textContent = stats.accepted;
    document.getElementById('statRejected')?.textContent = stats.rejected;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredQuotations.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条询价
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.QuotationsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.QuotationsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredQuotations.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 询价单ID
 */
function viewQuotation(id) {
    const quotation = state.quotations.find(q => q.id === id);
    if (!quotation) {
        showToast('询价单不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[quotation.status] || STATUS_MAP.draft;
    const itemsStr = quotation.items.map(item => 
        `${item.productName} × ${item.quantity} = ¥${formatCurrency(item.total)}`
    ).join('\n');
    
    alert(`询价单详情：
询价单号: ${quotation.quoteNo}
供应商: ${quotation.supplierName}
状态: ${status.label}
询价日期: ${formatDate(quotation.quoteDate)}
有效期至: ${formatDate(quotation.validUntil)}
备注: ${quotation.note || '无'}

商品明细:
${itemsStr}

小计: ¥${formatCurrency(quotation.subtotal)}
税费: ¥${formatCurrency(quotation.tax)}
总计: ¥${formatCurrency(quotation.total)}`);
}

/**
 * @private
 * @param {string} id - 询价单ID
 */
function receiveQuotation(id) {
    const quotation = state.quotations.find(q => q.id === id);
    if (!quotation) {
        showToast('询价单不存在', 'error');
        return;
    }
    
    quotation.status = 'received';
    quotation.updatedAt = new Date().toISOString();
    
    saveQuotations();
    applyFilters();
    render();
    showToast('已收到供应商报价', 'success');
}

/**
 * @private
 * @param {string} id - 询价单ID
 */
function acceptQuotation(id) {
    const quotation = state.quotations.find(q => q.id === id);
    if (!quotation) {
        showToast('询价单不存在', 'error');
        return;
    }
    
    if (!confirm(`确认接受 ${quotation.supplierName} 的报价？`)) return;
    
    quotation.status = 'accepted';
    quotation.updatedAt = new Date().toISOString();
    
    saveQuotations();
    applyFilters();
    render();
    showToast('已接受供应商报价', 'success');
}

/**
 * @private
 * @param {string} id - 询价单ID
 */
function rejectQuotation(id) {
    const quotation = state.quotations.find(q => q.id === id);
    if (!quotation) {
        showToast('询价单不存在', 'error');
        return;
    }
    
    quotation.status = 'rejected';
    quotation.updatedAt = new Date().toISOString();
    
    saveQuotations();
    applyFilters();
    render();
    showToast('已拒绝供应商报价', 'success');
}

/**
 * @private
 * @param {string} id - 询价单ID
 */
function deleteQuotation(id) {
    const quotation = state.quotations.find(q => q.id === id);
    if (!quotation) {
        showToast('询价单不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除询价单 ${quotation.quoteNo}？`)) return;
    
    state.quotations = state.quotations.filter(q => q.id !== id);
    saveQuotations();
    applyFilters();
    render();
    showToast('询价单已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const supplierName = prompt('供应商名称：');
    if (!supplierName) return;
    const quoteDate = prompt('询价日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
    const validUntil = prompt('有效期至 (YYYY-MM-DD)：', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
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
        const unitPrice = parseFloat(prompt('报价单价：', '50'));
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
    
    const newQuotation = {
        id: 'QT-' + Date.now().toString().slice(-6),
        quoteNo: `QT${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        supplierId: 'SUP-' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
        supplierName: supplierName.trim(),
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: 'draft',
        quoteDate: quoteDate || new Date().toISOString().split('T')[0],
        validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.quotations.push(newQuotation);
    saveQuotations();
    applyFilters();
    render();
    showToast('询价单已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.quoteNo = document.getElementById('searchQuoteNo')?.value || '';
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
    const quoteInput = document.getElementById('searchQuoteNo');
    const supplierInput = document.getElementById('searchSupplier');
    const statusInput = document.getElementById('searchStatus');
    
    if (quoteInput) quoteInput.value = '';
    if (supplierInput) supplierInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { quoteNo: '', supplier: '', status: '' };
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
    
    document.querySelectorAll('#searchQuoteNo, #searchSupplier, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📄 询价管理 初始化...');
    
    if (options?.data) {
        state.quotations = options.data;
        localStorage.setItem('quotation_data', JSON.stringify(state.quotations));
    }
    
    loadQuotations();
    bindEvents();
    render();
    
    window.QuotationsModule = {
        state,
        loadQuotations,
        render,
        renderPagination,
        updateStats,
        viewQuotation,
        receiveQuotation,
        acceptQuotation,
        rejectQuotation,
        deleteQuotation,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveQuotations,
        applyFilters
    };
    
    console.log('✅ 询价管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadQuotations,
    viewQuotation,
    receiveQuotation,
    acceptQuotation,
    rejectQuotation,
    deleteQuotation,
    goToPage,
    showCreateModal,
    saveQuotations
};