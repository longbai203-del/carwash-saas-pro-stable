// modules/02-pos/quick-sale/cashier.js
import { getProducts } from '../../../api/inventory.js';
import { getCustomers } from '../../../api/customers.js';
import { createOrder } from '../../../api/orders.js';
import { formatCurrency, showToast } from '../../../js/utils.js';

const state = {
    cart: [],
    products: [],
    customers: [],
    selectedCustomer: null,
    paymentMethod: 'cash',
    discount: 0,
    taxRate: 0.06,
    loading: false,
    searchQuery: ''
};

export async function init() {
    console.log('POS收银已加载');
    await loadProducts();
    await loadCustomers();
    bindEvents();
    initKeyboardShortcuts();
    updateUI();
}

async function loadProducts() {
    try {
        const data = await getMockPOSProducts();
        state.products = data;
        renderProductGrid();
    } catch (error) {
        console.error('加载商品失败:', error);
        showToast('加载商品失败', 'error');
    }
}

async function loadCustomers() {
    try {
        const data = await getMockCustomers();
        state.customers = data;
        renderCustomerDropdown();
    } catch (error) {
        console.error('加载客户失败:', error);
    }
}

function getMockPOSProducts() {
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

function getMockCustomers() {
    return [
        { id: 'C001', name: '张伟', phone: '13800001111', level: 'gold' },
        { id: 'C002', name: '李娜', phone: '13800002222', level: 'vip' },
        { id: 'C003', name: '王强', phone: '13800003333', level: 'silver' },
        { id: 'C004', name: '刘洋', phone: '13800004444', level: 'bronze' },
        { id: 'C005', name: '陈静', phone: '13800005555', level: 'vip' }
    ];
}

function renderProductGrid() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const filtered = state.products.filter(p => 
        p.name.includes(state.searchQuery) || 
        p.category.includes(state.searchQuery)
    );

    grid.innerHTML = filtered.map(product => `
        <div class="product-item" onclick="addToCart('${product.id}')" data-id="${product.id}">
            <div class="product-icon" style="background:${product.color}20; color:${product.color}">
                <i class="fas ${product.icon}"></i>
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">¥${formatCurrency(product.price)}</div>
        </div>
    `).join('');
}

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
        state.selectedCustomer = this.value;
        updateUI();
    });
}

// 添加到购物车
window.addToCart = function(productId) {
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
    playSound('add');
};

// 更新购物车数量
window.updateQty = function(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        state.cart = state.cart.filter(i => i.id !== productId);
    }

    updateUI();
};

// 移除购物车项
window.removeFromCart = function(productId) {
    state.cart = state.cart.filter(i => i.id !== productId);
    updateUI();
    playSound('remove');
};

// 计算总计
function calculateTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountAmount = (subtotal * state.discount) / 100;
    const taxable = subtotal - discountAmount;
    const tax = taxable * state.taxRate;
    const total = taxable + tax;

    return { subtotal, discountAmount, taxable, tax, total };
}

// 更新UI
function updateUI() {
    const cartItems = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('subtotal');
    const discountEl = document.getElementById('discountAmount');
    const taxEl = document.getElementById('taxAmount');
    const totalEl = document.getElementById('totalAmount');
    const cartCount = document.getElementById('cartCount');
    const totalItems = document.getElementById('totalItems');

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
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">¥${formatCurrency(item.price)} × ${item.qty}</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                        <span class="qty-num">${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                        <button class="remove-btn" onclick="removeFromCart('${item.id}')">
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

    // 更新结账按钮状态
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = state.cart.length === 0;
    }

    // 更新VIP信息
    if (state.selectedCustomer) {
        const customer = state.customers.find(c => c.id === state.selectedCustomer);
        document.getElementById('customerInfo').innerHTML = `
            <span class="text-sm font-medium">${customer.name}</span>
            <span class="badge badge-${customer.level}">${customer.level.toUpperCase()}</span>
        `;
    } else {
        document.getElementById('customerInfo').innerHTML = `
            <span class="text-sm text-gray-500">散客</span>
        `;
    }
}

// 搜索商品
function searchProducts(query) {
    state.searchQuery = query;
    renderProductGrid();
}

// 支付方式切换
function selectPayment(method) {
    state.paymentMethod = method;
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.method === method);
    });
}

// 结账
async function checkout() {
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

    try {
        showToast('正在处理订单...', 'info');
        // await createOrder(orderData);
        
        // 模拟成功
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showToast('订单支付成功！', 'success');
        playSound('success');
        
        // 打印小票
        printReceipt(orderData);
        
        // 清空购物车
        state.cart = [];
        updateUI();
        
        // 显示收据弹窗
        showReceiptModal(orderData);
    } catch (error) {
        console.error('支付失败:', error);
        showToast('支付失败，请重试', 'error');
        playSound('error');
    }
}

// 打印小票
function printReceipt(orderData) {
    // 使用 window.print() 或调用打印服务
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
    
    console.log('打印收据:', receiptContent);
    // 实际项目中使用 window.print() 或连接蓝牙打印机
}

// 显示收据弹窗
function showReceiptModal(orderData) {
    const modal = document.getElementById('receiptModal');
    if (!modal) return;

    document.getElementById('receiptContent').innerHTML = `
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
                <div><span>小计</span><span>¥${formatCurrency(orderData.subtotal)}</span></div>
                <div><span>折扣</span><span>-¥${formatCurrency(orderData.discount)}</span></div>
                <div><span>税费</span><span>¥${formatCurrency(orderData.tax)}</span></div>
                <div class="receipt-total"><span>总计</span><span>¥${formatCurrency(orderData.total)}</span></div>
            </div>
            <div class="receipt-footer">
                <p>支付方式: ${orderData.paymentMethod}</p>
                <p>${new Date().toLocaleString()}</p>
                <button class="btn btn-primary" onclick="closeReceipt()">关闭</button>
                <button class="btn btn-secondary" onclick="window.print()">打印</button>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

window.closeReceipt = function() {
    document.getElementById('receiptModal').style.display = 'none';
};

// 音效
function playSound(type) {
    // 简单的UI反馈，实际项目可使用Web Audio API
    if (type === 'add') {
        // 点击音效
    } else if (type === 'success') {
        // 成功音效
    }
}

// 键盘快捷键
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // F1: 搜索聚焦
        if (e.key === 'F1') {
            e.preventDefault();
            document.getElementById('searchInput')?.focus();
        }
        // F2: 切换客户
        if (e.key === 'F2') {
            e.preventDefault();
            document.getElementById('customerSelect')?.focus();
        }
        // F9: 结账
        if (e.key === 'F9') {
            e.preventDefault();
            checkout();
        }
        // ESC: 关闭弹窗
        if (e.key === 'Escape') {
            closeReceipt();
        }
        // 数字键快速添加商品
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
            const product = state.products[num - 1];
            if (product) addToCart(product.id);
        }
    });

    // 显示快捷键提示
    console.log('快捷键: F1-搜索, F2-客户, F9-结账, 1-9快速添加');
}

function bindEvents() {
    // 搜索
    document.getElementById('searchInput')?.addEventListener('input', function() {
        searchProducts(this.value);
    });

    // 支付方式选择
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectPayment(this.dataset.method);
        });
    });

    // 折扣输入
    document.getElementById('discountInput')?.addEventListener('input', function() {
        state.discount = parseFloat(this.value) || 0;
        updateUI();
    });

    // 结账
    document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}