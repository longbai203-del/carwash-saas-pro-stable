/**
 * @file receipt.js
 * @module receipt
 * @description 小票打印 - 小票生成、打印和记录管理
 * 
 * @example
 * import { init } from './receipt.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ReceiptItem
 * @property {string} name - 商品名称
 * @property {number} price - 单价
 * @property {number} qty - 数量
 */

/**
 * @typedef {Object} Receipt
 * @property {string} id - 小票ID
 * @property {ReceiptItem[]} items - 商品列表
 * @property {number} subtotal - 小计
 * @property {number} discount - 折扣
 * @property {number} tax - 税费
 * @property {number} total - 总计
 * @property {string} payment - 支付方式
 * @property {string} customer - 客户名称
 * @property {string} date - 日期
 * @property {string} [printedAt] - 打印时间
 * @property {string} [savedAt] - 保存时间
 */

/**
 * @typedef {Object} PrintSettings
 * @property {string} printer - 打印机类型
 * @property {string} format - 小票格式
 * @property {number} copies - 副本数量
 */

/**
 * @typedef {Object} ReceiptState
 * @property {Receipt[]} receipts - 小票历史
 * @property {Receipt|null} currentReceipt - 当前小票
 * @property {string} template - 模板类型 (default/vip/simple)
 * @property {PrintSettings} settings - 打印设置
 */

/** @type {ReceiptState} 状态 */
const state = {
    receipts: [],
    currentReceipt: null,
    template: 'default',
    settings: {
        printer: 'default',
        format: 'standard',
        copies: 1
    }
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
 * @param {string} id - 小票ID
 * @param {string} date - 日期
 * @param {string} customer - 客户名称
 * @param {string} payment - 支付方式
 * @description 创建新小票
 */
function newReceipt(id, date, customer, payment) {
    const items = [
        { name: '标准洗车', price: 68, qty: 1 },
        { name: '抛光打蜡', price: 388, qty: 1 }
    ];
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const discount = 0;
    const tax = subtotal * 0.06;
    const total = subtotal + tax - discount;
    
    state.currentReceipt = {
        id: id || 'RCP-' + Date.now().toString().slice(-8),
        items: items,
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total,
        payment: payment || '现金',
        customer: customer || '散客',
        date: date || new Date().toLocaleString()
    };
    updatePreview();
}

/**
 * @private
 * @description 更新预览
 */
function updatePreview() {
    const receipt = state.currentReceipt;
    if (!receipt || !receipt.items) {
        newReceipt();
        return;
    }
    
    const orderNo = document.getElementById('receiptOrderNo');
    const dateEl = document.getElementById('receiptDate');
    const paymentEl = document.getElementById('receiptPayment');
    const customerEl = document.getElementById('receiptCustomer');
    const subtotalEl = document.getElementById('receiptSubtotal');
    const discountEl = document.getElementById('receiptDiscount');
    const taxEl = document.getElementById('receiptTax');
    const totalEl = document.getElementById('receiptTotal');
    const container = document.getElementById('receiptItems');
    
    if (orderNo) orderNo.textContent = receipt.id;
    if (dateEl) dateEl.textContent = receipt.date;
    if (paymentEl) paymentEl.textContent = receipt.payment;
    if (customerEl) customerEl.textContent = receipt.customer;
    if (subtotalEl) subtotalEl.textContent = '¥' + formatCurrency(receipt.subtotal);
    if (discountEl) discountEl.textContent = '-¥' + formatCurrency(receipt.discount);
    if (taxEl) taxEl.textContent = '¥' + formatCurrency(receipt.tax);
    if (totalEl) totalEl.textContent = '¥' + formatCurrency(receipt.total);
    
    if (!container) return;
    
    if (receipt.items.length === 0) {
        container.innerHTML = `<div class="empty-receipt"><i class="fas fa-receipt"></i><p>暂无商品</p></div>`;
        return;
    }
    
    let html = '';
    receipt.items.forEach(item => {
        html += `
            <div class="receipt-item">
                <span>${item.name} × ${item.qty}</span>
                <span>¥${formatCurrency(item.price * item.qty)}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

/**
 * @private
 * @description 打印小票
 */
function printReceipt() {
    if (!state.currentReceipt) {
        newReceipt();
    }
    const copy = state.settings.copies || 1;
    for (let i = 0; i < copy; i++) {
        window.print();
    }
    // 添加到历史
    state.receipts.push({ 
        ...state.currentReceipt, 
        printedAt: new Date().toLocaleString() 
    });
    updateHistory();
    showToast('小票已打印 (' + copy + '份)', 'success');
}

/**
 * @private
 * @description 保存小票
 */
function saveReceipt() {
    if (!state.currentReceipt) return;
    state.receipts.push({ 
        ...state.currentReceipt, 
        savedAt: new Date().toLocaleString() 
    });
    updateHistory();
    localStorage.setItem('receipt_history', JSON.stringify(state.receipts));
    showToast('小票已保存', 'success');
}

/**
 * @private
 * @param {string} template - 模板类型
 * @description 选择模板
 */
function selectTemplate(template) {
    state.template = template;
    document.querySelectorAll('.template-btn').forEach(btn => {
        const label = btn.textContent.trim();
        const isActive = 
            (template === 'default' && label === '标准') ||
            (template === 'vip' && label === 'VIP') ||
            (template === 'simple' && label === '简洁');
        btn.classList.toggle('active', isActive);
    });
    
    // 应用模板样式
    const paper = document.querySelector('.receipt-paper');
    if (paper) {
        const sizeMap = { default: '12px', vip: '14px', simple: '10px' };
        paper.style.fontSize = sizeMap[template] || '12px';
    }
    showToast('已切换到: ' + template + ' 模板', 'info');
}

/**
 * @private
 * @description 更新历史记录
 */
function updateHistory() {
    const container = document.getElementById('receiptHistory');
    if (!container) return;
    
    if (state.receipts.length === 0) {
        container.innerHTML = '<div class="empty-history">暂无小票记录</div>';
        return;
    }
    
    let html = '';
    state.receipts.slice().reverse().forEach(r => {
        html += `
            <div class="history-item">
                <span>${r.id}</span>
                <span>¥${formatCurrency(r.total)}</span>
                <span style="font-size:11px;color:#9ca3af;">${r.date || r.savedAt || r.printedAt || ''}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

/**
 * @private
 * @description 加载小票历史
 */
function loadReceiptHistory() {
    try {
        const saved = localStorage.getItem('receipt_history');
        if (saved) {
            state.receipts = JSON.parse(saved);
            updateHistory();
        }
    } catch (e) {
        console.warn('加载小票历史失败:', e);
    }
}

/**
 * @private
 * @description 加载打印设置
 */
function loadPrintSettings() {
    try {
        const saved = localStorage.getItem('receipt_print_settings');
        if (saved) {
            state.settings = JSON.parse(saved);
            const printerSelect = document.getElementById('printerSelect');
            const formatSelect = document.getElementById('receiptFormat');
            const copySelect = document.getElementById('copyCount');
            if (printerSelect) printerSelect.value = state.settings.printer || 'default';
            if (formatSelect) formatSelect.value = state.settings.format || 'standard';
            if (copySelect) copySelect.value = state.settings.copies || '1';
        }
    } catch (e) {
        console.warn('加载打印设置失败:', e);
    }
}

/**
 * @private
 * @description 保存打印设置
 */
function savePrintSettings() {
    const printerSelect = document.getElementById('printerSelect');
    const formatSelect = document.getElementById('receiptFormat');
    const copySelect = document.getElementById('copyCount');
    
    state.settings.printer = printerSelect ? printerSelect.value : 'default';
    state.settings.format = formatSelect ? formatSelect.value : 'standard';
    state.settings.copies = copySelect ? parseInt(copySelect.value) || 1 : 1;
    
    localStorage.setItem('receipt_print_settings', JSON.stringify(state.settings));
}

/**
 * @private
 * @param {string} id - 小票ID
 * @description 删除小票
 */
function deleteReceipt(id) {
    state.receipts = state.receipts.filter(r => r.id !== id);
    localStorage.setItem('receipt_history', JSON.stringify(state.receipts));
    updateHistory();
    showToast('小票已删除', 'info');
}

/**
 * @private
 * @returns {Receipt[]} 小票历史
 */
function getReceiptHistory() {
    return state.receipts;
}

/**
 * @private
 * @param {Receipt} receipt - 小票数据
 * @description 添加小票
 */
function addReceipt(receipt) {
    state.receipts.push(receipt);
    localStorage.setItem('receipt_history', JSON.stringify(state.receipts));
    updateHistory();
}

/**
 * @public
 * @returns {Promise<void>}
 * @description 初始化小票打印
 */
export async function init() {
    console.log('🧾 小票打印 初始化...');
    
    loadReceiptHistory();
    loadPrintSettings();
    newReceipt();
    
    // 绑定设置保存事件
    const printerSelect = document.getElementById('printerSelect');
    const formatSelect = document.getElementById('receiptFormat');
    const copySelect = document.getElementById('copyCount');
    
    if (printerSelect) printerSelect.addEventListener('change', savePrintSettings);
    if (formatSelect) formatSelect.addEventListener('change', savePrintSettings);
    if (copySelect) copySelect.addEventListener('change', savePrintSettings);
    
    // 暴露全局方法
    window.ReceiptModule = {
        receipts: state.receipts,
        currentReceipt: state.currentReceipt,
        template: state.template,
        settings: state.settings,
        newReceipt,
        printReceipt,
        saveReceipt,
        selectTemplate,
        updatePreview,
        updateHistory,
        deleteReceipt,
        getReceiptHistory,
        addReceipt,
        savePrintSettings
    };
    
    console.log('✅ 小票打印 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    newReceipt,
    printReceipt,
    saveReceipt,
    selectTemplate,
    deleteReceipt,
    getReceiptHistory,
    addReceipt,
    savePrintSettings
};