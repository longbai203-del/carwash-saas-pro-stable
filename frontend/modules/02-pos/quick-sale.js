/**
 * @file quick-sale.js
 * @module quick-sale
 * @description 快捷销售 - 精简版POS收银系统
 * 
 * @example
 * import { init } from './quick-sale.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} QuickSaleItem
 * @property {string} id - 商品ID
 * @property {string} name - 商品名称
 * @property {number} price - 单价
 * @property {number} qty - 数量
 */

/**
 * @typedef {Object} QuickSaleState
 * @property {QuickSaleItem[]} cart - 购物车
 * @property {Array<{id: string, name: string, price: number, icon: string, color: string}>} products - 商品列表
 * @property {Array<{id: string, name: string, phone: string, level: string}>} customers - 客户列表
 * @property {string|null} selectedCustomer - 选中的客户ID
 * @property {string} paymentMethod - 支付方式
 * @property {number} discount - 折扣百分比
 * @property {number} taxRate - 税率
 * @property {string} searchQuery - 搜索关键词
 */

/** @type {QuickSaleState} 状态 */
const state = {
    cart: [],
    products: [],
    customers: [],
    selectedCustomer: null,
    paymentMethod: 'cash',
    discount: 0,
    taxRate: 0.06,
    searchQuery: ''
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
 * @returns {Array} 默认商品列表
 */
function getDefaultProducts() {
    return [
        { id: 'P001', name: '标准洗车', price: 68, icon: 'fa-car', color: '#4F46E5' },
        { id: 'P002', name: '精致洗车', price: 128, icon: 'fa-car', color: '#4F46E5' },
        { id: 'P003', name: '深度清洁', price: 268, icon: 'fa-spray-can', color: '#10B981' },
        { id: 'P004', name: '抛光打蜡', price: 388, icon: 'fa-wax', color: '#F59E0B' },
        { id: 'P005', name: '内饰清洗', price: 328, icon: 'fa-couch', color: '#8B5CF6' },
        { id: 'P006', name: '发动机清洗', price: 188, icon: 'fa-engine', color: '#EF4444' },
        { id: 'P007', name: '空调清洗', price: 158, icon: 'fa-snowflake', color: '#3B82F6' },
        { id: 'P008', name: '轮胎养护', price: 88, icon: 'fa-circle', color: '#6B7280' },
        { id: 'P009', name: '玻璃镀膜', price: 228, icon: 'fa-glass-whiskey', color: '#06B6D4' },
        { id: 'P010', name: '漆面镀晶', price: 688, icon: 'fa-gem', color: '#EC4899' },
        { id: 'P011', name: '洗车月卡', price: 398, icon: 'fa-id-card', color: '#14B8A6' },
        { id: 'P012', name: '洗车季卡', price: 998, icon: 'fa-id-card', color: '#14B8A6' }
    ];
}

/**
 * @private
 * @returns {Array} 默认客户列表
 */
function getDefaultCustomers() {
    return [
        { id: 'C001', name: '张伟', phone: '13800001111', level: 'gold' },
        { id: 'C002', name: '李娜', phone: '13800002222', level: 'vip' },
        { id: 'C003', name: '王强', phone: '13800003333', level: 'silver' },
        { id: 'C004', name: '刘洋', phone: '13800004444', level: 'bronze' },
        { id: 'C005', name: '陈静', phone: '13800005555', level: 'vip' }
    ];
}

/**
 * @private
 * @description 渲染商品网格
 */
function renderProductGrid() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const filtered = state.products.filter(p => 
        p.name.includes(state.searchQuery)
    );

    grid.innerHTML = filtered.map(product => `
        <div class="product-item" onclick="window.addToCart('${product.id}')" data-id="${product.id}">
            <div class="product-icon" style="background:${product.color}20; color:${product.color}">
                <i class="fas ${product.icon}"></i>
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">¥${formatCurrency(product.price)}</div>
        </div>
    `).join('');
}

/**
 * @private
 * @description 渲染客户下拉
 */
function renderCustomerDropdown() {
    const dropdown = document.getElementById('customerSelect');
    if (!dropdown) return;

    dropdown.innerHTML = `
        <option value="">散客</option>
        ${state.customers.map(c => `
            <option value="${c.id}">${c.name} (${c.phone})</option>
        `).join('')}
    `;

    dropdown.addEventListener('change', function() {
        state.selectedCustomer = this.value;
        updateUI();
    });
}

/**
 * @private
 * @param {string} productId - 商品ID
 * @description 添加到购物车
 */
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const existing = state.cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        state.cart.push({ ...product, qty: 1 });
    }

    updateUI();
    showToast(`已添加: ${product.name}`, 'success');
}

/**
 * @private
 * @param {string} productId - 商品ID
 * @param {number} delta - 变化量
 * @description 更新购物车数量
 */
function updateQty(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        state.cart = state.cart.filter(i => i.id !== productId);
    }

    updateUI();
}

/**
 * @private
 * @param {string} productId - 商品ID
 * @description 从购物车移除
 */
function removeFromCart(productId) {
    state.cart = state.cart.filter(i => i.id !== productId);
    updateUI();
}

/**
 * @private
 * @returns {Object} 总计对象
 * @description 计算总计
 */
function calculateTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountAmount = (subtotal * state.discount) / 100;
    const taxable = subtotal - discountAmount;
    const tax = taxable * state.taxRate;
    const total = taxable + tax;

    return { subtotal, discountAmount, taxable, tax, total };
}

/**
 * @private
 * @description 更新UI
 */
function updateUI() {
    const cartItems = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('subtotal');
    const discountEl = document.getElementById('discountAmount');
    const taxEl = document.getElementById('taxAmount');
    const totalEl = document.getElementById('totalAmount');
    const cartCount = document.getElementById('cartCount');
    const totalItems = document.getElementById('totalItems');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartItems) {
        if (state.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-basket"></i>
                    <p>购物车是空的</p>
                </div>
            `;
        } else {
            cartItems.innerHTML = state.cart.map(item => `
                <div class="cart-item">
                    <div>
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">¥${formatCurrency(item.price)} × ${item.qty}</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="qty-btn" onclick="window.updateQty('${item.id}', -1)">-</button>
                        <span class="qty-num">${item.qty}</span>
                        <button class="qty-btn" onclick="window.updateQty('${item.id}', 1)">+</button>
                        <button class="remove-btn" onclick="window.removeFromCart('${item.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    const totals = calculateTotals();
    if (subtotalEl) subtotalEl.textContent = `¥${formatCurrency(totals.subtotal)}`;
    if (discountEl) discountEl.textContent = `-¥${formatCurrency(totals.discountAmount)}`;
    if (taxEl) taxEl.textContent = `¥${formatCurrency(totals.tax)}`;
    if (totalEl) totalEl.textContent = `¥${formatCurrency(totals.total)}`;

    const count = state.cart.reduce((sum, i) => sum + i.qty, 0);
    if (cartCount) cartCount.textContent = count;
    if (totalItems) totalItems.textContent = `共 ${count} 件商品`;

    if (checkoutBtn) {
        checkoutBtn.disabled = state.cart.length === 0;
    }
}

/**
 * @private
 * @param {string} method - 支付方式
 * @description 选择支付方式
 */
function selectPayment(method) {
    state.paymentMethod = method;
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.method === method);
    });
}

/**
 * @private
 * @param {Object} orderData - 订单数据
 * @description 显示收据弹窗
 */
function showReceiptModal(orderData) {
    const modal = document.getElementById('receiptModal');
    if (!modal) return;

    const receiptContent = document.getElementById('receiptContent');
    if (!receiptContent) return;

    receiptContent.innerHTML = `
        <div class="receipt">
            <div class="receipt-header">
                <h3>🧼 洗车店</h3>
                <p>订单 #${Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
            </div>
            <div class="receipt-items">
                ${orderData.items.map(item => `
                    <div class="receipt-item">
                        <span>${item.name} × ${item.qty}</span>
                        <span>¥${formatCurrency(item.subtotal)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="receipt-totals">
                <div class="receipt-item"><span>小计</span><span>¥${formatCurrency(orderData.subtotal)}</span></div>
                <div class="receipt-item"><span>折扣</span><span>-¥${formatCurrency(orderData.discount)}</span></div>
                <div class="receipt-item"><span>税费</span><span>¥${formatCurrency(orderData.tax)}</span></div>
                <div class="receipt-item receipt-total"><span>总计</span><span>¥${formatCurrency(orderData.total)}</span></div>
            </div>
            <div class="receipt-footer">
                <p>支付方式: ${orderData.paymentMethod}</p>
                <p>${new Date().toLocaleString()}</p>
                <button class="btn btn-primary" onclick="window.closeReceipt()">关闭</button>
                <button class="btn btn-secondary" onclick="window.print()">打印</button>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

/**
 * @private
 * @description 关闭收据
 */
function closeReceipt() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 * @description 结账
 */
function checkout() {
    if (state.cart.length === 0) {
        showToast('购物车为空', 'warning');
        return;
    }

    const totals = calculateTotals();
    const orderData = {
        items: state.cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            subtotal: item.price * item.qty
        })),
        customerId: state.selectedCustomer || null,
        subtotal: totals.subtotal,
        discount: totals.discountAmount,
        tax: totals.tax,
        total: totals.total,
        paymentMethod: state.paymentMethod,
        paymentStatus: 'paid'
    };

    showToast('订单支付成功！', 'success');
    showReceiptModal(orderData);
    state.cart = [];
    updateUI();
}

/**
 * @private
 * @description 初始化键盘快捷键
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F9') {
            e.preventDefault();
            checkout();
        }
        if (e.key === 'Escape') {
            closeReceipt();
        }
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9 && state.products.length >= num) {
            const product = state.products[num - 1];
            if (product) addToCart(product.id);
        }
    });
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            state.searchQuery = this.value;
            renderProductGrid();
        });
    }

    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectPayment(this.dataset.method);
        });
    });

    const discountInput = document.getElementById('discountInput');
    if (discountInput) {
        discountInput.addEventListener('input', function() {
            state.discount = parseFloat(this.value) || 0;
            updateUI();
        });
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
}

/**
 * @public
 * @returns {Promise<void>}
 * @description 初始化快捷销售
 */
export async function init() {
    console.log('✅ 快捷销售 POS 初始化...');
    
    state.products = getDefaultProducts();
    state.customers = getDefaultCustomers();
    
    renderProductGrid();
    renderCustomerDropdown();
    bindEvents();
    initKeyboardShortcuts();
    updateUI();
    
    // 暴露全局方法
    window.addToCart = addToCart;
    window.updateQty = updateQty;
    window.removeFromCart = removeFromCart;
    window.selectPayment = selectPayment;
    window.closeReceipt = closeReceipt;
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    addToCart,
    updateQty,
    removeFromCart,
    checkout
};