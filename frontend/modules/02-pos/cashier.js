/**
 * @file cashier.js
 * @module cashier
 * @description POS收银台模块 - 完整的收银系统，包含购物车、支付、小票打印
 * 
 * @example
 * import { init } from './cashier.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} CartItem
 * @property {string} id - 商品ID
 * @property {string} name - 商品名称
 * @property {number} price - 商品单价
 * @property {number} qty - 数量
 * @property {string} [category] - 分类
 * @property {string} [icon] - 图标
 * @property {string} [color] - 颜色
 */

/**
 * @typedef {Object} Customer
 * @property {string} id - 客户ID
 * @property {string} name - 客户名称
 * @property {string} phone - 电话号码
 * @property {string} level - 客户等级 (vip/gold/silver/bronze)
 */

/**
 * @typedef {Object} OrderData
 * @property {Array<{productId: string, name: string, price: number, qty: number, subtotal: number}>} items - 商品列表
 * @property {string|null} customerId - 客户ID
 * @property {number} subtotal - 小计
 * @property {number} discount - 折扣
 * @property {number} tax - 税费
 * @property {number} total - 总计
 * @property {string} paymentMethod - 支付方式
 * @property {string} paymentStatus - 支付状态
 */

/**
 * @typedef {Object} POSState
 * @property {CartItem[]} cart - 购物车商品列表
 * @property {Customer|null} selectedCustomer - 当前选中的客户
 * @property {string} paymentMethod - 支付方式
 * @property {number} discount - 折扣百分比
 * @property {number} taxRate - 税率
 * @property {Array<{id: string, name: string, price: number, category: string, icon: string, color: string}>} products - 商品列表
 * @property {Customer[]} customers - 客户列表
 * @property {string} searchQuery - 搜索关键词
 * @property {boolean} loading - 是否加载中
 */

/** @type {POSState} POS状态 */
const state = {
    cart: [],
    selectedCustomer: null,
    paymentMethod: 'cash',
    discount: 0,
    taxRate: 0.06,
    products: [],
    customers: [],
    searchQuery: '',
    loading: false
};

/**
 * 客户等级样式映射
 */
const LEVEL_STYLES = {
    vip: { label: 'VIP', color: '#8B5CF6', bg: '#EDE9FE' },
    gold: { label: '黄金', color: '#F59E0B', bg: '#FEF3C7' },
    silver: { label: '白银', color: '#6B7280', bg: '#F3F4F6' },
    bronze: { label: '青铜', color: '#92400E', bg: '#FDE68A' }
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
 * @param {number} amount - 金额
 * @param {string} type - 音效类型
 * @description 播放音效（UI反馈）
 */
function playSound(type) {
    // 简单的UI反馈
    if (type === 'add') {
        const btn = document.querySelector('.product-item:active');
        if (btn) {
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => btn.style.transform = '', 150);
        }
    }
}

/**
 * @private
 * @returns {Array} 默认商品列表
 */
function getDefaultProducts() {
    return [
        { id: 'P001', name: '标准洗车', price: 68, category: '洗车', icon: 'fa-car', color: '#4F46E5' },
        { id: 'P002', name: '精致洗车', price: 128, category: '洗车', icon: 'fa-car', color: '#4F46E5' },
        { id: 'P003', name: '深度清洁', price: 268, category: '洗车', icon: 'fa-spray-can', color: '#10B981' },
        { id: 'P004', name: '抛光打蜡', price: 388, category: '美容', icon: 'fa-wax', color: '#F59E0B' },
        { id: 'P005', name: '内饰清洗', price: 328, category: '美容', icon: 'fa-couch', color: '#8B5CF6' },
        { id: 'P006', name: '发动机清洗', price: 188, category: '保养', icon: 'fa-engine', color: '#EF4444' },
        { id: 'P007', name: '空调清洗', price: 158, category: '保养', icon: 'fa-snowflake', color: '#3B82F6' },
        { id: 'P008', name: '轮胎养护', price: 88, category: '保养', icon: 'fa-circle', color: '#6B7280' },
        { id: 'P009', name: '玻璃镀膜', price: 228, category: '美容', icon: 'fa-glass-whiskey', color: '#06B6D4' },
        { id: 'P010', name: '漆面镀晶', price: 688, category: '美容', icon: 'fa-gem', color: '#EC4899' },
        { id: 'P011', name: '洗车月卡', price: 398, category: '会员', icon: 'fa-id-card', color: '#14B8A6' },
        { id: 'P012', name: '洗车季卡', price: 998, category: '会员', icon: 'fa-id-card', color: '#14B8A6' }
    ];
}

/**
 * @private
 * @returns {Customer[]} 默认客户列表
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
 * @returns {Promise<void>}
 * @description 加载商品列表
 */
async function loadProducts() {
    try {
        const response = await apiClient.get('/products?status=active');
        if (response && response.success) {
            state.products = response.data || [];
        } else {
            state.products = getDefaultProducts();
        }
    } catch (error) {
        console.warn('⚠️ 加载商品失败，使用默认商品:', error);
        state.products = getDefaultProducts();
    }
}

/**
 * @private
 * @returns {Promise<void>}
 * @description 加载客户列表
 */
async function loadCustomers() {
    try {
        const response = await apiClient.get('/customers?limit=100');
        if (response && response.success) {
            state.customers = response.data || [];
        } else {
            state.customers = getDefaultCustomers();
        }
    } catch (error) {
        console.warn('⚠️ 加载客户失败，使用默认客户:', error);
        state.customers = getDefaultCustomers();
    }
}

/**
 * @private
 * @description 渲染商品网格
 */
function renderProductGrid() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const filtered = state.products.filter(p => 
        p.name.includes(state.searchQuery) || 
        p.category.includes(state.searchQuery)
    );

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px;color:#9CA3AF;">
                <i class="fas fa-search" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                未找到匹配的商品
            </div>
        `;
        return;
    }

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
            <option value="${c.id}">${c.name} (${c.phone}) ${c.level === 'vip' ? '⭐' : ''}</option>
        `).join('')}
    `;

    dropdown.addEventListener('change', function() {
        const customer = state.customers.find(c => c.id === this.value);
        state.selectedCustomer = customer || null;
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

    // 保存到Store
    store.set('cart', state.cart);
    updateUI();
    playSound('add');
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

    store.set('cart', state.cart);
    updateUI();
}

/**
 * @private
 * @param {string} productId - 商品ID
 * @description 从购物车移除
 */
function removeFromCart(productId) {
    state.cart = state.cart.filter(i => i.id !== productId);
    store.set('cart', state.cart);
    updateUI();
    playSound('remove');
}

/**
 * @private
 * @description 清空购物车
 */
function clearCart() {
    if (state.cart.length === 0) return;
    if (!confirm('确认清空购物车？')) return;
    state.cart = [];
    store.set('cart', state.cart);
    updateUI();
    showToast('购物车已清空', 'info');
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

    // 更新购物车列表
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
                    <div style="flex:1;">
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

    // 更新总计
    const totals = calculateTotals();
    if (subtotalEl) subtotalEl.textContent = `¥${formatCurrency(totals.subtotal)}`;
    if (discountEl) discountEl.textContent = `-¥${formatCurrency(totals.discountAmount)}`;
    if (taxEl) taxEl.textContent = `¥${formatCurrency(totals.tax)}`;
    if (totalEl) totalEl.textContent = `¥${formatCurrency(totals.total)}`;

    // 更新数量
    const count = state.cart.reduce((sum, i) => sum + i.qty, 0);
    if (cartCount) cartCount.textContent = count;
    if (totalItems) totalItems.textContent = `共 ${count} 件商品`;

    // 更新结账按钮
    if (checkoutBtn) {
        checkoutBtn.disabled = state.cart.length === 0;
    }

    // 更新客户信息
    const customerInfo = document.getElementById('customerInfo');
    if (customerInfo) {
        if (state.selectedCustomer) {
            const lv = LEVEL_STYLES[state.selectedCustomer.level] || LEVEL_STYLES.bronze;
            customerInfo.innerHTML = `
                <span style="font-weight:500;">${state.selectedCustomer.name}</span>
                <span style="padding:2px 10px;border-radius:9999px;font-size:12px;background:${lv.bg};color:${lv.color};">
                    ${lv.label}
                </span>
            `;
        } else {
            customerInfo.innerHTML = `<span style="color:#6B7280;">散客</span>`;
        }
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
 * @param {OrderData} orderData - 订单数据
 * @description 显示收据弹窗
 */
function showReceiptModal(orderData) {
    const modal = document.getElementById('receiptModal');
    if (!modal) return;

    const content = document.getElementById('receiptContent');
    if (!content) return;

    content.innerHTML = `
        <div class="receipt" style="font-family:monospace;padding:16px;">
            <div style="text-align:center;border-bottom:2px dashed #E5E7EB;padding-bottom:16px;margin-bottom:16px;">
                <h3 style="margin:0;">🧼 洗车店</h3>
                <p style="margin:4px 0 0 0;font-size:14px;color:#6B7280;">
                    订单 #${Math.random().toString(36).substr(2, 8).toUpperCase()}
                </p>
            </div>
            <div style="margin-bottom:12px;">
                ${orderData.items.map(item => `
                    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;">
                        <span>${item.name} × ${item.qty}</span>
                        <span>¥${formatCurrency(item.subtotal)}</span>
                    </div>
                `).join('')}
            </div>
            <div style="border-top:2px dashed #E5E7EB;padding-top:12px;margin-top:12px;">
                <div style="display:flex;justify-content:space-between;font-size:14px;">
                    <span>小计</span>
                    <span>¥${formatCurrency(orderData.subtotal)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:14px;">
                    <span>折扣</span>
                    <span>-¥${formatCurrency(orderData.discount)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:14px;">
                    <span>税费</span>
                    <span>¥${formatCurrency(orderData.tax)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;border-top:2px solid #4F46E5;padding-top:8px;margin-top:4px;">
                    <span>总计</span>
                    <span>¥${formatCurrency(orderData.total)}</span>
                </div>
            </div>
            <div style="text-align:center;border-top:2px dashed #E5E7EB;padding-top:16px;margin-top:16px;">
                <p style="font-size:14px;color:#6B7280;">支付方式: ${orderData.paymentMethod}</p>
                <p style="font-size:14px;color:#6B7280;">${new Date().toLocaleString()}</p>
                <div style="display:flex;gap:8px;justify-content:center;margin-top:8px;">
                    <button onclick="window.closeReceipt()" style="padding:6px 16px;background:#4F46E5;color:white;border:none;border-radius:4px;cursor:pointer;">
                        关闭
                    </button>
                    <button onclick="window.print()" style="padding:6px 16px;background:#F3F4F6;border:none;border-radius:4px;cursor:pointer;">
                        打印
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

/**
 * @private
 * @description 关闭收据弹窗
 */
function closeReceipt() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 * @param {OrderData} orderData - 订单数据
 * @description 打印小票
 */
function printReceipt(orderData) {
    const receiptContent = `
        洗车店收据
        ================
        商品明细:
        ${orderData.items.map(item => 
            `${item.name} × ${item.qty} = ¥${formatCurrency(item.subtotal)}`
        ).join('\n')}
        ================
        小计: ¥${formatCurrency(orderData.subtotal)}
        折扣: -¥${formatCurrency(orderData.discount)}
        税费: ¥${formatCurrency(orderData.tax)}
        总计: ¥${formatCurrency(orderData.total)}
        支付方式: ${orderData.paymentMethod}
        时间: ${new Date().toLocaleString()}
        ================
        感谢光临！
    `;
    
    console.log('📄 打印收据:', receiptContent);
}

/**
 * @private
 * @returns {Promise<void>}
 * @description 结账
 */
async function checkout() {
    if (state.cart.length === 0) {
        showToast('购物车为空', 'warning');
        return;
    }

    const totals = calculateTotals();
    
    // 构建订单数据
    const orderData = {
        items: state.cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            subtotal: item.price * item.qty
        })),
        customerId: state.selectedCustomer ? state.selectedCustomer.id : null,
        subtotal: totals.subtotal,
        discount: totals.discountAmount,
        tax: totals.tax,
        total: totals.total,
        paymentMethod: state.paymentMethod,
        paymentStatus: 'paid'
    };

    try {
        showToast('正在处理订单...', 'info');
        
        // 调用API创建订单
        const response = await apiClient.post('/orders', orderData);
        
        if (response && response.success) {
            showToast('订单支付成功！', 'success');
            playSound('success');
            
            // 打印小票
            printReceipt(orderData);
            
            // 清空购物车
            state.cart = [];
            store.set('cart', state.cart);
            updateUI();
            
            // 显示收据
            showReceiptModal(orderData);
        } else {
            throw new Error(response.message || '支付失败');
        }
    } catch (error) {
        console.error('❌ 支付失败:', error);
        showToast('支付失败: ' + error.message, 'error');
        playSound('error');
    }
}

/**
 * @private
 * @description 初始化键盘快捷键
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // F9: 结账
        if (e.key === 'F9') {
            e.preventDefault();
            checkout();
        }
        // ESC: 关闭弹窗
        if (e.key === 'Escape') {
            closeReceipt();
        }
        // 数字键 1-9: 快速添加商品
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9 && state.products.length >= num) {
            const product = state.products[num - 1];
            if (product) addToCart(product.id);
        }
        // F1: 搜索聚焦
        if (e.key === 'F1') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.focus();
        }
    });

    console.log('⌨️ 快捷键: F1-搜索, F9-结账, ESC-关闭, 1-9快速添加');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    // 搜索
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            state.searchQuery = this.value;
            renderProductGrid();
        });
    }

    // 支付方式
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectPayment(this.dataset.method);
        });
    });

    // 折扣
    const discountInput = document.getElementById('discountInput');
    if (discountInput) {
        discountInput.addEventListener('input', function() {
            state.discount = parseFloat(this.value) || 0;
            updateUI();
        });
    }

    // 结账
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }

    // 清空购物车
    const clearBtn = document.getElementById('clearCart');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCart);
    }
}

/**
 * @public
 * @returns {Promise<void>}
 * @description 初始化POS
 */
export async function init() {
    console.log('💵 POS 模块初始化...');
    
    try {
        // 从Store恢复购物车
        const savedCart = store.get('cart');
        if (savedCart && savedCart.length > 0) {
            state.cart = savedCart;
        }
        
        // 加载数据
        await loadProducts();
        await loadCustomers();
        
        // 渲染
        renderProductGrid();
        renderCustomerDropdown();
        updateUI();
        bindEvents();
        initKeyboardShortcuts();
        
        // 暴露全局方法
        window.addToCart = addToCart;
        window.updateQty = updateQty;
        window.removeFromCart = removeFromCart;
        window.selectPayment = selectPayment;
        window.checkout = checkout;
        window.closeReceipt = closeReceipt;
        window.clearCart = clearCart;
        
        console.log('✅ POS 初始化完成');
    } catch (error) {
        console.error('❌ POS 初始化失败:', error);
        showToast('加载POS数据失败', 'error');
    }
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
    checkout,
    clearCart
};