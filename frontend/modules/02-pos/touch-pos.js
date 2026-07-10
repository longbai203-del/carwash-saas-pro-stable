/**
 * @file touch-pos.js
 * @module touch-pos
 * @description 触屏POS - 专为触摸屏优化的收银系统
 * 
 * @example
 * import { init } from './touch-pos.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} TouchProduct
 * @property {string} id - 商品ID
 * @property {string} name - 商品名称
 * @property {number} price - 单价
 * @property {string} icon - 图标Emoji
 */

/**
 * @typedef {Object} TouchCartItem
 * @property {string} id - 商品ID
 * @property {string} name - 商品名称
 * @property {number} price - 单价
 * @property {number} qty - 数量
 * @property {string} icon - 图标Emoji
 */

/**
 * @typedef {Object} TouchPOSState
 * @property {TouchCartItem[]} cart - 购物车
 * @property {TouchProduct[]} products - 商品列表
 */

/** @type {TouchPOSState} 状态 */
const state = {
    cart: [],
    products: []
};

/**
 * @private
 * @returns {TouchProduct[]} 默认商品列表
 */
function getDefaultProducts() {
    return [
        { id: 'P001', name: '标准洗车', price: 68, icon: '🚗' },
        { id: 'P002', name: '精致洗车', price: 128, icon: '🚙' },
        { id: 'P003', name: '深度清洁', price: 268, icon: '🧹' },
        { id: 'P004', name: '抛光打蜡', price: 388, icon: '✨' },
        { id: 'P005', name: '内饰清洗', price: 328, icon: '🪑' },
        { id: 'P006', name: '发动机清洗', price: 188, icon: '🔧' },
        { id: 'P007', name: '空调清洗', price: 158, icon: '❄️' },
        { id: 'P008', name: '轮胎养护', price: 88, icon: '🛞' },
        { id: 'P009', name: '玻璃镀膜', price: 228, icon: '🪟' },
        { id: 'P010', name: '漆面镀晶', price: 688, icon: '💎' },
        { id: 'P011', name: '洗车月卡', price: 398, icon: '📇' },
        { id: 'P012', name: '洗车季卡', price: 998, icon: '📋' }
    ];
}

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
 * @description 渲染商品列表
 */
function renderProducts() {
    const container = document.getElementById('touchProducts');
    if (!container) return;

    let html = '';
    state.products.forEach(p => {
        html += `
            <div class="touch-product" onclick="window.TouchPOSModule.addToCart('${p.id}')">
                <div class="product-icon">${p.icon}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-price">¥${formatCurrency(p.price)}</div>
            </div>
        `;
    });
    container.innerHTML = html;
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
    updateCart();
    // 触觉反馈
    if (navigator.vibrate) navigator.vibrate(10);
}

/**
 * @private
 * @param {string} productId - 商品ID
 * @description 从购物车移除
 */
function removeFromCart(productId) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;
    item.qty -= 1;
    if (item.qty <= 0) {
        state.cart = state.cart.filter(i => i.id !== productId);
    }
    updateCart();
}

/**
 * @private
 * @description 清空购物车
 */
function clearCart() {
    if (state.cart.length === 0) return;
    if (confirm('清空购物车？')) {
        state.cart = [];
        updateCart();
    }
}

/**
 * @private
 * @description 更新购物车
 */
function updateCart() {
    const container = document.getElementById('touchCartItems');
    const countEl = document.getElementById('touchCartCount');
    const subtotalEl = document.getElementById('touchSubtotal');
    const totalEl = document.getElementById('touchTotal');
    
    const count = state.cart.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = state.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const total = subtotal * 1.06;
    
    if (countEl) countEl.textContent = count;
    if (subtotalEl) subtotalEl.textContent = '¥' + formatCurrency(subtotal);
    if (totalEl) totalEl.textContent = '¥' + formatCurrency(total);
    
    const cartTotal = document.getElementById('touchCartTotal');
    if (cartTotal) cartTotal.textContent = '¥' + formatCurrency(total);
    
    if (state.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-touch-cart">
                <i class="fas fa-shopping-basket"></i>
                <p>点击左侧商品添加</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    state.cart.forEach(item => {
        html += `
            <div class="touch-cart-item">
                <div class="item-info">
                    <span class="name">${item.icon} ${item.name}</span>
                    <span class="qty">×${item.qty}</span>
                </div>
                <div class="item-actions">
                    <button class="btn-sm" onclick="window.TouchPOSModule.removeFromCart('${item.id}')">-</button>
                    <button class="btn-sm" onclick="window.TouchPOSModule.addToCart('${item.id}')">+</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
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
    const total = state.cart.reduce((sum, i) => sum + i.price * i.qty, 0) * 1.06;
    showToast('✅ 订单完成! 总计: ¥' + formatCurrency(total), 'success');
    state.cart = [];
    updateCart();
}

/**
 * @private
 * @description 切换全屏
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

/**
 * @private
 * @description 重置布局
 */
function resetLayout() {
    const grid = document.querySelector('.touch-grid');
    if (grid) {
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '1fr 340px';
    }
    renderProducts();
    updateCart();
}

/**
 * @private
 * @description 检测触摸设备
 */
function detectTouchDevice() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        console.log('触摸设备检测到，优化触屏体验');
        document.body.classList.add('touch-device');
        const style = document.createElement('style');
        style.textContent = `
            .touch-device .touch-product { min-height: 80px; }
            .touch-device .btn { min-height: 44px; }
        `;
        document.head.appendChild(style);
    }
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
        if (e.key === 'Escape' && document.fullscreenElement) {
            document.exitFullscreen();
        }
    });
}

/**
 * @public
 * @returns {Promise<void>}
 * @description 初始化触屏POS
 */
export async function init() {
    console.log('📱 触屏POS 初始化...');
    
    // 从存储恢复购物车
    const savedCart = store.get('touchPosCart');
    if (savedCart && savedCart.length > 0) {
        state.cart = savedCart;
    }
    
    state.products = getDefaultProducts();
    renderProducts();
    updateCart();
    detectTouchDevice();
    initKeyboardShortcuts();
    
    // 暴露全局方法
    window.TouchPOSModule = {
        addToCart,
        removeFromCart,
        clearCart,
        checkout,
        toggleFullscreen,
        resetLayout,
        updateCart
    };
    
    console.log('✅ 触屏POS 初始化完成');
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
    removeFromCart,
    clearCart,
    checkout,
    toggleFullscreen,
    resetLayout
};