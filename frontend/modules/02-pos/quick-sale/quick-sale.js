/**
 * POS - 收银系统 (精简版)
 * 包含完整购物车功能
 */

const state = {
    cart: [],
    products: [],
    selectedCustomer: null,
    paymentMethod: 'cash',
    discount: 0,
    taxRate: 0.06,
    searchQuery: ''
};

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return amount.toFixed(2);
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; 
        padding: 12px 24px; border-radius: 8px; 
        color: white; font-size: 14px; z-index: 10000;
        background: ${type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : type === 'success' ? '#10B981' : '#4F46E5'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: fadeInUp 0.3s ease;
        max-width: 400px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getProducts() {
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

function getCustomers() {
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

function updateQty(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        state.cart = state.cart.filter(i => i.id !== productId);
    }

    updateUI();
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(i => i.id !== productId);
    updateUI();
}

function calculateTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountAmount = (subtotal * state.discount) / 100;
    const taxable = subtotal - discountAmount;
    const tax = taxable * state.taxRate;
    const total = taxable + tax;

    return { subtotal, discountAmount, taxable, tax, total };
}

function updateUI() {
    const cartItems = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('subtotal');
    const discountEl = document.getElementById('discountAmount');
    const taxEl = document.getElementById('taxAmount');
    const totalEl = document.getElementById('totalAmount');
    const cartCount = document.getElementById('cartCount');
    const totalItems = document.getElementById('totalItems');

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

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = state.cart.length === 0;
    }
}

function searchProducts(query) {
    state.searchQuery = query;
    renderProductGrid();
}

function selectPayment(method) {
    state.paymentMethod = method;
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.method === method);
    });
}

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

function closeReceipt() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.style.display = 'none';
}

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

function bindEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchProducts(this.value);
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

export function init() {
    console.log('✅ POS 已加载 (完整版)');
    
    state.products = getProducts();
    state.customers = getCustomers();
    
    renderProductGrid();
    renderCustomerDropdown();
    bindEvents();
    initKeyboardShortcuts();
    updateUI();
    
    window.addToCart = addToCart;
    window.updateQty = updateQty;
    window.removeFromCart = removeFromCart;
    window.selectPayment = selectPayment;
    window.closeReceipt = closeReceipt;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init
};