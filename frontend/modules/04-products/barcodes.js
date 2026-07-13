/**
 * @file barcodes.js
 * @module barcodes
 * @description 条码管理 - 商品条码生成、打印和管理
 * 
 * @example
 * import { init } from './barcodes.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} BarcodeItem
 * @property {string} id - 条码ID
 * @property {string} productId - 商品ID
 * @property {string} productName - 商品名称
 * @property {string} barcode - 条码编号
 * @property {number} price - 商品价格
 * @property {string} format - 条码格式 (EAN-13/Code128/QR)
 * @property {string} createdAt - 创建时间
 */

/**
 * @typedef {Object} BarcodeState
 * @property {BarcodeItem[]} barcodes - 条码列表
 * @property {string} searchQuery - 搜索关键词
 * @property {string} formatFilter - 格式筛选
 * @property {BarcodeItem|null} selectedBarcode - 选中的条码
 */

/** @type {BarcodeState} 状态 */
const state = {
    barcodes: [],
    searchQuery: '',
    formatFilter: 'all',
    selectedBarcode: null
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
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * @private
 * @returns {BarcodeItem[]} 模拟条码数据
 */
function getMockBarcodes() {
    const products = ['标准洗车', '精致洗车', '深度清洁', '抛光打蜡', '内饰清洗', '发动机清洗'];
    const prices = [68, 128, 268, 388, 328, 188];
    const formats = ['EAN-13', 'Code128', 'QR'];
    
    const barcodes = [];
    for (let i = 0; i < 12; i++) {
        const idx = i % products.length;
        const prefix = ['690', '691', '692', '693', '694', '695'][i % 6];
        const number = String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
        barcodes.push({
            id: 'BC' + String(i + 1).padStart(4, '0'),
            productId: 'P' + String(idx + 1).padStart(3, '0'),
            productName: products[idx],
            barcode: prefix + number + String(Math.floor(Math.random() * 10)),
            price: prices[idx],
            format: formats[Math.floor(Math.random() * formats.length)],
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return barcodes;
}

/**
 * @private
 * @description 加载条码数据
 */
function loadBarcodes() {
    try {
        const saved = localStorage.getItem('barcode_data');
        if (saved) {
            state.barcodes = JSON.parse(saved);
        } else {
            state.barcodes = getMockBarcodes();
            localStorage.setItem('barcode_data', JSON.stringify(state.barcodes));
        }
    } catch (e) {
        console.warn('加载条码数据失败:', e);
        state.barcodes = getMockBarcodes();
    }
    renderBarcodes();
    updateStats();
}

/**
 * @private
 * @description 保存条码数据
 */
function saveBarcodes() {
    try {
        localStorage.setItem('barcode_data', JSON.stringify(state.barcodes));
    } catch (e) {
        console.warn('保存条码数据失败:', e);
    }
}

/**
 * @private
 * @description 渲染条码列表
 */
function renderBarcodes() {
    const container = document.getElementById('barcodeListBody');
    if (!container) return;
    
    let filtered = state.barcodes;
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(b => 
            b.productName.toLowerCase().includes(query) ||
            b.barcode.includes(query) ||
            b.id.toLowerCase().includes(query)
        );
    }
    
    if (state.formatFilter !== 'all') {
        filtered = filtered.filter(b => b.format === state.formatFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-barcode" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无条码数据
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(barcode => `
        <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
            onmouseover="this.style.background='#F9FAFB'"
            onmouseout="this.style.background=''">
            <td style="padding:12px;font-family:monospace;font-weight:500;">${barcode.id}</td>
            <td style="padding:12px;font-weight:500;">${barcode.productName}</td>
            <td style="padding:12px;font-family:monospace;font-size:14px;letter-spacing:1px;background:#F9FAFB;border-radius:4px;">
                ${barcode.barcode}
            </td>
            <td style="padding:12px;text-align:right;font-weight:600;">¥${formatCurrency(barcode.price)}</td>
            <td style="padding:12px;">
                <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;background:#DBEAFE;color:#1E40AF;">
                    ${barcode.format}
                </span>
            </td>
            <td style="padding:12px;text-align:center;">
                <button class="btn btn-sm btn-primary" onclick="window.BarcodesModule.printBarcode('${barcode.id}')" title="打印条码">
                    <i class="fas fa-print"></i>
                </button>
                <button class="btn btn-sm btn-outline" onclick="window.BarcodesModule.viewBarcode('${barcode.id}')" title="查看">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.BarcodesModule.deleteBarcode('${barcode.id}')" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * @private
 * @description 更新统计数据
 */
function updateStats() {
    const total = state.barcodes.length;
    const ean13 = state.barcodes.filter(b => b.format === 'EAN-13').length;
    const code128 = state.barcodes.filter(b => b.format === 'Code128').length;
    const qr = state.barcodes.filter(b => b.format === 'QR').length;
    
    const elements = {
        'statTotal': total,
        'statEAN13': ean13,
        'statCode128': code128,
        'statQR': qr
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @param {string} id - 条码ID
 * @description 查看条码详情
 */
function viewBarcode(id) {
    const barcode = state.barcodes.find(b => b.id === id);
    if (!barcode) {
        showToast('条码不存在', 'error');
        return;
    }
    
    const modal = document.getElementById('barcodeDetailModal');
    if (modal) {
        const content = document.getElementById('barcodeDetailContent');
        if (content) {
            content.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div style="grid-column:span 2;text-align:center;padding:16px 0;border:2px dashed #D1D5DB;border-radius:8px;">
                        <div style="font-family:monospace;font-size:32px;letter-spacing:2px;color:#1F2937;">
                            ${barcode.barcode}
                        </div>
                        <div style="margin-top:8px;font-size:12px;color:#6B7280;">
                            ${barcode.format} 格式
                        </div>
                    </div>
                    <div><span style="color:#6B7280;">条码ID</span><br><strong>${barcode.id}</strong></div>
                    <div><span style="color:#6B7280;">商品</span><br><strong>${barcode.productName}</strong></div>
                    <div><span style="color:#6B7280;">价格</span><br><strong style="color:#4F46E5;">¥${formatCurrency(barcode.price)}</strong></div>
                    <div><span style="color:#6B7280;">格式</span><br><strong>${barcode.format}</strong></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">创建时间</span><br><strong>${formatDate(barcode.createdAt)}</strong></div>
                </div>
            `;
        }
        modal.style.display = 'flex';
        return;
    }
    
    alert(`条码详情：
ID: ${barcode.id}
商品: ${barcode.productName}
条码: ${barcode.barcode}
价格: ¥${formatCurrency(barcode.price)}
格式: ${barcode.format}`);
}

/**
 * @private
 * @param {string} id - 条码ID
 * @description 打印条码
 */
function printBarcode(id) {
    const barcode = state.barcodes.find(b => b.id === id);
    if (!barcode) {
        showToast('条码不存在', 'error');
        return;
    }
    
    // 创建打印内容
    const printContent = `
        <html>
        <head>
            <style>
                body { font-family: 'Courier New', monospace; padding: 40px; }
                .barcode-container { text-align: center; border: 1px solid #ccc; padding: 30px; border-radius: 8px; max-width: 400px; margin: 0 auto; }
                .barcode-number { font-size: 28px; letter-spacing: 2px; margin: 20px 0; }
                .product-name { font-size: 18px; font-weight: bold; }
                .price { font-size: 16px; color: #4F46E5; }
                .label { font-size: 12px; color: #6B7280; }
                .barcode-line { display: flex; justify-content: center; gap: 2px; padding: 10px 0; }
                .line { height: 60px; width: 2px; background: #000; }
                .line.thick { width: 4px; }
                .line.thin { width: 1px; }
            </style>
        </head>
        <body>
            <div class="barcode-container">
                <div class="product-name">${barcode.productName}</div>
                <div class="price">¥${formatCurrency(barcode.price)}</div>
                <div class="barcode-number">${barcode.barcode}</div>
                <div class="barcode-line">
                    ${Array.from({length: 30}, (_, i) => 
                        `<div class="line ${i % 3 === 0 ? 'thick' : i % 2 === 0 ? 'thin' : ''}"></div>`
                    ).join('')}
                </div>
                <div class="label">${barcode.format} | ${barcode.id}</div>
            </div>
        </body>
        </html>
    `;
    
    const win = window.open('', '_blank', 'width=500,height=500');
    if (win) {
        win.document.write(printContent);
        win.document.close();
        setTimeout(() => {
            win.print();
        }, 500);
        showToast('条码打印中...', 'info');
    } else {
        showToast('请允许弹窗以打印条码', 'warning');
    }
}

/**
 * @private
 * @param {string} id - 条码ID
 * @description 删除条码
 */
function deleteBarcode(id) {
    const barcode = state.barcodes.find(b => b.id === id);
    if (!barcode) {
        showToast('条码不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除条码 "${barcode.productName}"？`)) return;
    
    state.barcodes = state.barcodes.filter(b => b.id !== id);
    saveBarcodes();
    renderBarcodes();
    updateStats();
    showToast('条码已删除', 'success');
}

/**
 * @private
 * @description 生成新条码
 */
function newBarcode() {
    const products = state.barcodes.map(b => b.productName);
    const uniqueProducts = [...new Set(products)];
    const productOptions = uniqueProducts.map((p, i) => `${i+1}. ${p}`).join('\n');
    
    const productIdx = parseInt(prompt(`选择商品：\n${productOptions}\n或输入自定义名称`, '1'));
    let productName;
    if (isNaN(productIdx) || productIdx < 1 || productIdx > uniqueProducts.length) {
        productName = prompt('输入商品名称：');
        if (!productName) return;
    } else {
        productName = uniqueProducts[productIdx - 1];
    }
    
    const price = parseFloat(prompt('商品价格：', '68'));
    if (isNaN(price) || price < 0) {
        showToast('请输入有效价格', 'error');
        return;
    }
    
    const formatOptions = ['1. EAN-13', '2. Code128', '3. QR'];
    const formatIdx = parseInt(prompt(`选择条码格式：\n${formatOptions.join('\n')}`, '1'));
    const formats = ['EAN-13', 'Code128', 'QR'];
    const format = formats[formatIdx - 1] || 'EAN-13';
    
    // 生成条码编号
    const prefix = ['690', '691', '692', '693', '694', '695'][Math.floor(Math.random() * 6)];
    const number = String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
    const checkDigit = String(Math.floor(Math.random() * 10));
    const barcodeNumber = prefix + number + checkDigit;
    
    const barcode = {
        id: 'BC' + String(state.barcodes.length + 1).padStart(4, '0'),
        productId: 'P' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
        productName: productName,
        barcode: barcodeNumber,
        price: price,
        format: format,
        createdAt: new Date().toISOString()
    };
    
    state.barcodes.push(barcode);
    saveBarcodes();
    renderBarcodes();
    updateStats();
    showToast('条码已生成: ' + barcode.id, 'success');
}

/**
 * @private
 * @description 搜索条码
 */
function searchBarcodes(query) {
    state.searchQuery = query;
    renderBarcodes();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    const formatFilter = document.getElementById('formatFilter');
    state.formatFilter = formatFilter ? formatFilter.value : 'all';
    renderBarcodes();
}

/**
 * @private
 * @description 重置筛选
 */
function resetFilters() {
    const formatFilter = document.getElementById('formatFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (formatFilter) formatFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    
    state.formatFilter = 'all';
    state.searchQuery = '';
    renderBarcodes();
}

/**
 * @private
 * @description 关闭详情弹窗
 */
function closeDetail() {
    const modal = document.getElementById('barcodeDetailModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 * @description 刷新数据
 */
function refresh() {
    loadBarcodes();
    showToast('数据已刷新', 'success');
}

/**
 * @private
 * @description 导出条码数据
 */
function exportData() {
    if (state.barcodes.length === 0) {
        showToast('暂无数据可导出', 'warning');
        return;
    }
    
    const headers = ['条码ID', '商品名称', '条码编号', '价格', '格式', '创建时间'];
    const rows = state.barcodes.map(b => [
        b.id,
        b.productName,
        b.barcode,
        b.price.toFixed(2),
        b.format,
        formatDate(b.createdAt)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '条码数据_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    showToast('数据已导出', 'success');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                searchBarcodes(this.value);
            }, 300);
        });
    }
    
    const formatFilter = document.getElementById('formatFilter');
    if (formatFilter) {
        formatFilter.addEventListener('change', applyFilters);
    }
    
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    const refreshBtn = document.getElementById('refreshBarcodes');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
    
    const newBtn = document.getElementById('newBarcode');
    if (newBtn) {
        newBtn.addEventListener('click', newBarcode);
    }
    
    const exportBtn = document.getElementById('exportBarcodes');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    const modal = document.getElementById('barcodeDetailModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeDetail();
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDetail();
        }
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('📊 条码管理 初始化...');
    
    if (options?.data) {
        state.barcodes = options.data;
        saveBarcodes();
    } else {
        loadBarcodes();
    }
    
    updateStats();
    bindEvents();
    
    window.BarcodesModule = {
        state,
        loadBarcodes,
        renderBarcodes,
        updateStats,
        viewBarcode,
        printBarcode,
        deleteBarcode,
        newBarcode,
        searchBarcodes,
        applyFilters,
        resetFilters,
        closeDetail,
        refresh,
        exportData,
        saveBarcodes
    };
    
    console.log('✅ 条码管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadBarcodes,
    viewBarcode,
    printBarcode,
    deleteBarcode,
    newBarcode,
    searchBarcodes,
    refresh,
    exportData,
    saveBarcodes
};