/**
 * POS收银模块
 * 处理销售点收银操作
 * 
 * @module modules/02-pos
 * 
 * @example
 * import { init, destroy, onShow, onHide } from './02-pos.js'
 */

import { api, endpoints } from '../../src/services/api.js'
import { store } from '../../src/store/index.js'
import { formatCurrency, formatNumber, debounce } from '../../src/utils/helpers.js'

/**
 * @typedef {Object} CartItem
 * @property {string} id - 商品ID
 * @property {string} name - 商品名称
 * @property {number} unit_price - 单价
 * @property {number} quantity - 数量
 * @property {number} total - 小计
 * @property {string} [sku] - SKU
 * @property {string} [barcode] - 条形码
 */

/**
 * 模块状态
 */
let state = {
  initialized: false,
  cart: [],
  customer: null,
  products: [],
  searchQuery: '',
  total: 0,
  subtotal: 0,
  tax: 0,
  discount: 0,
  selectedProduct: null,
  isLoading: false
}

/**
 * 初始化POS模块
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} 模块API
 */
export function init(container) {
  if (state.initialized) {
    console.warn('POS module already initialized')
    return getApi()
  }

  console.log('💰 Initializing POS module...')
  
  state.container = container
  state.initialized = true

  // 加载产品列表
  loadProducts()

  // 绑定事件
  bindEvents()

  console.log('✅ POS module initialized')

  return getApi()
}

/**
 * 加载产品列表
 */
async function loadProducts() {
  state.isLoading = true
  render()

  try {
    const response = await api.get(endpoints.products.list, {
      params: { is_active: true, limit: 100 }
    })
    
    if (response?.success) {
      state.products = response.data || []
    }
  } catch (error) {
    console.error('Failed to load products:', error)
    showError('加载商品失败')
  }

  state.isLoading = false
  render()
}

/**
 * 搜索产品
 */
const searchProducts = debounce(async (query) => {
  state.searchQuery = query
  state.isLoading = true
  render()

  try {
    const response = await api.get(endpoints.products.search, {
      params: { q: query }
    })
    
    if (response?.success) {
      state.products = response.data || []
    }
  } catch (error) {
    console.error('Search failed:', error)
  }

  state.isLoading = false
  render()
}, 300)

/**
 * 添加商品到购物车
 * @param {Object} product - 商品
 */
function addToCart(product) {
  const existing = state.cart.find(item => item.id === product.id)
  
  if (existing) {
    existing.quantity += 1
    existing.total = existing.quantity * existing.unit_price
  } else {
    state.cart.push({
      id: product.id,
      name: product.name,
      unit_price: product.unit_price,
      quantity: 1,
      total: product.unit_price,
      sku: product.sku,
      barcode: product.barcode
    })
  }

  updateTotals()
  render()
}

/**
 * 从购物车移除商品
 * @param {string} productId - 商品ID
 */
function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.id !== productId)
  updateTotals()
  render()
}

/**
 * 更新购物车数量
 * @param {string} productId - 商品ID
 * @param {number} quantity - 新数量
 */
function updateQuantity(productId, quantity) {
  const item = state.cart.find(item => item.id === productId)
  if (!item) return

  if (quantity <= 0) {
    removeFromCart(productId)
    return
  }

  item.quantity = quantity
  item.total = quantity * item.unit_price
  updateTotals()
  render()
}

/**
 * 更新总计
 */
function updateTotals() {
  state.subtotal = state.cart.reduce((sum, item) => sum + item.total, 0)
  state.tax = state.subtotal * 0.1 // 10% 税率
  state.total = state.subtotal + state.tax - state.discount
}

/**
 * 应用折扣
 * @param {number} amount - 折扣金额
 */
function applyDiscount(amount) {
  state.discount = Math.min(amount, state.subtotal)
  updateTotals()
  render()
}

/**
 * 选择客户
 * @param {Object} customer - 客户信息
 */
function selectCustomer(customer) {
  state.customer = customer
  render()
}

/**
 * 结算订单
 */
async function checkout() {
  if (state.cart.length === 0) {
    showError('购物车为空')
    return
  }

  if (!state.customer) {
    showError('请选择客户')
    return
  }

  state.isLoading = true
  render()

  try {
    const orderData = {
      customer_id: state.customer.id,
      items: state.cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price
      })),
      discount_amount: state.discount,
      notes: ''
    }

    const response = await api.post(endpoints.orders.create, orderData)
    
    if (response?.success) {
      // 清空购物车
      state.cart = []
      state.discount = 0
      state.customer = null
      updateTotals()
      
      showSuccess('订单创建成功！')
      render()
      
      // 打印收据
      printReceipt(response.data)
    }
  } catch (error) {
    console.error('Checkout failed:', error)
    showError('结算失败：' + (error.message || '未知错误'))
  }

  state.isLoading = false
  render()
}

/**
 * 打印收据
 * @param {Object} order - 订单数据
 */
function printReceipt(order) {
  // 简单打印 - 可扩展为真实打印
  const receipt = `
    ================================
    洗车SaaS - 销售收据
    订单号: ${order.order_number}
    日期: ${new Date().toLocaleString()}
    ================================
    商品列表:
    ${order.items.map(item => 
      `  ${item.name} x ${item.quantity} = ${formatCurrency(item.total_amount)}`
    ).join('\n')}
    ================================
    小计: ${formatCurrency(order.subtotal)}
    税额: ${formatCurrency(order.tax_amount)}
    折扣: ${formatCurrency(order.discount_amount || 0)}
    总计: ${formatCurrency(order.total_amount)}
    ================================
    感谢您的惠顾！
    ================================
  `

  console.log(receipt)
  alert('收据已生成，请查看控制台')
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && state.selectedProduct) {
      addToCart(state.selectedProduct)
      state.selectedProduct = null
    }
    if (e.key === 'Escape') {
      state.selectedProduct = null
      render()
    }
  })
}

/**
 * 渲染POS界面
 */
function render() {
  const { container } = state
  if (!container) return

  container.innerHTML = `
    <div class="pos-container">
      <!-- 产品列表 -->
      <div class="pos-products">
        <div class="pos-search">
          <input type="text" 
                 id="pos-search-input"
                 placeholder="🔍 搜索商品 (名称/SKU/条形码)"
                 value="${state.searchQuery}"
                 oninput="window.__posSearch(this.value)"
          />
        </div>
        <div class="product-grid">
          ${state.isLoading ? `
            <div class="loading-spinner">加载中...</div>
          ` : state.products.length === 0 ? `
            <div class="empty-state">暂无商品</div>
          ` : state.products.map(product => `
            <div class="product-card ${state.selectedProduct?.id === product.id ? 'selected' : ''}"
                 onclick="window.__posAddToCart('${product.id}')"
                 onmouseenter="window.__posSelectProduct('${product.id}')">
              <div class="product-name">${product.name}</div>
              <div class="product-price">${formatCurrency(product.unit_price)}</div>
              <div class="product-sku">${product.sku || ''}</div>
              <div class="product-stock">库存: ${product.current_stock || 0}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 购物车 -->
      <div class="pos-cart">
        <div class="cart-header">
          <h3>🛒 购物车</h3>
          <button onclick="window.__posClearCart()" class="btn-clear">清空</button>
        </div>
        <div class="cart-items">
          ${state.cart.length === 0 ? `
            <div class="empty-cart">购物车为空</div>
          ` : state.cart.map(item => `
            <div class="cart-item">
              <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatCurrency(item.unit_price)}</div>
              </div>
              <div class="cart-item-controls">
                <button onclick="window.__posUpdateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button onclick="window.__posUpdateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                <span class="cart-item-total">${formatCurrency(item.total)}</span>
                <button onclick="window.__posRemoveFromCart('${item.id}')" class="btn-remove">×</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="cart-summary">
          <div class="summary-row">
            <span>小计</span>
            <span>${formatCurrency(state.subtotal)}</span>
          </div>
          <div class="summary-row">
            <span>税额 (10%)</span>
            <span>${formatCurrency(state.tax)}</span>
          </div>
          <div class="summary-row">
            <span>折扣</span>
            <span>-${formatCurrency(state.discount)}</span>
          </div>
          <div class="summary-row total">
            <span>合计</span>
            <span>${formatCurrency(state.total)}</span>
          </div>
        </div>
        <div class="cart-actions">
          <div class="customer-select">
            <input type="text" 
                   placeholder="👤 客户 (输入姓名/手机号)"
                   onchange="window.__posSelectCustomer(this.value)"
            />
          </div>
          <div class="discount-input">
            <input type="number" 
                   placeholder="折扣金额"
                   onchange="window.__posApplyDiscount(this.value)"
            />
          </div>
          <button class="btn-checkout" onclick="window.__posCheckout()">
            💳 结算 (${formatCurrency(state.total)})
          </button>
        </div>
      </div>
    </div>
  `

  // 应用样式
  applyStyles()

  // 暴露全局方法
  window.__posSearch = searchProducts
  window.__posAddToCart = (id) => {
    const product = state.products.find(p => p.id === id)
    if (product) addToCart(product)
  }
  window.__posSelectProduct = (id) => {
    state.selectedProduct = state.products.find(p => p.id === id) || null
    render()
  }
  window.__posRemoveFromCart = removeFromCart
  window.__posUpdateQuantity = updateQuantity
  window.__posClearCart = () => {
    state.cart = []
    updateTotals()
    render()
  }
  window.__posApplyDiscount = (value) => {
    applyDiscount(parseFloat(value) || 0)
  }
  window.__posSelectCustomer = (value) => {
    // 简化版：直接使用输入值作为客户名
    if (value) {
      selectCustomer({ id: 'temp-' + Date.now(), name: value })
    } else {
      state.customer = null
      render()
    }
  }
  window.__posCheckout = checkout
}

/**
 * 应用POS样式
 */
function applyStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .pos-container {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 20px;
      height: calc(100vh - 120px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .pos-products {
      background: #fff;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .pos-search {
      margin-bottom: 12px;
    }

    .pos-search input {
      width: 100%;
      padding: 10px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.3s;
    }

    .pos-search input:focus {
      border-color: #4fc3f7;
    }

    .product-grid {
      flex: 1;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      align-content: start;
    }

    .product-card {
      background: #fafafa;
      border: 2px solid #f0f0f0;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }

    .product-card:hover {
      border-color: #4fc3f7;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .product-card.selected {
      border-color: #4fc3f7;
      background: #e3f2fd;
    }

    .product-name {
      font-weight: 500;
      font-size: 14px;
      color: #1a1a2e;
      margin-bottom: 4px;
    }

    .product-price {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .product-sku {
      font-size: 11px;
      color: #999;
    }

    .product-stock {
      font-size: 11px;
      color: #666;
      margin-top: 4px;
    }

    .pos-cart {
      background: #fff;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
    }

    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f0f0f0;
    }

    .cart-header h3 {
      margin: 0;
      font-size: 18px;
    }

    .btn-clear {
      background: #fce4ec;
      color: #c62828;
      border: none;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .cart-items {
      flex: 1;
      overflow-y: auto;
      margin-bottom: 12px;
    }

    .cart-item {
      padding: 8px 0;
      border-bottom: 1px solid #f5f5f5;
    }

    .cart-item:last-child {
      border-bottom: none;
    }

    .cart-item-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .cart-item-name {
      font-weight: 500;
    }

    .cart-item-price {
      color: #666;
    }

    .cart-item-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cart-item-controls button {
      width: 24px;
      height: 24px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      font-size: 14px;
    }

    .cart-item-controls button:hover {
      background: #f0f0f0;
    }

    .cart-item-total {
      font-weight: 500;
      margin-left: 8px;
      min-width: 60px;
      text-align: right;
    }

    .btn-remove {
      color: #d32f2f !important;
      border-color: #fce4ec !important;
    }

    .empty-cart {
      text-align: center;
      color: #999;
      padding: 40px 0;
    }

    .cart-summary {
      padding: 12px 0;
      border-top: 2px solid #f0f0f0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 14px;
    }

    .summary-row.total {
      font-size: 18px;
      font-weight: 600;
      border-top: 2px solid #e0e0e0;
      padding-top: 8px;
      margin-top: 4px;
    }

    .cart-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }

    .cart-actions input {
      padding: 8px 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      width: 100%;
    }

    .cart-actions input:focus {
      border-color: #4fc3f7;
    }

    .btn-checkout {
      padding: 12px;
      background: #4fc3f7;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }

    .btn-checkout:hover {
      background: #0288d1;
    }

    .btn-checkout:disabled {
      background: #bdbdbd;
      cursor: not-allowed;
    }

    .loading-spinner {
      text-align: center;
      padding: 40px;
      color: #999;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #999;
    }

    @media (max-width: 768px) {
      .pos-container {
        grid-template-columns: 1fr;
        height: auto;
      }
    }
  `
  document.head.appendChild(style)
}

/**
 * 显示错误
 */
function showError(message) {
  alert('❌ ' + message)
}

/**
 * 显示成功
 */
function showSuccess(message) {
  alert('✅ ' + message)
}

/**
 * 模块显示时调用
 */
export function onShow() {
  console.log('👁️ POS module shown')
  render()
}

/**
 * 模块隐藏时调用
 */
export function onHide() {
  console.log('🙈 POS module hidden')
}

/**
 * 销毁模块
 */
export function destroy() {
  console.log('🗑️ Destroying POS module...')
  
  // 清理全局方法
  delete window.__posSearch
  delete window.__posAddToCart
  delete window.__posSelectProduct
  delete window.__posRemoveFromCart
  delete window.__posUpdateQuantity
  delete window.__posClearCart
  delete window.__posApplyDiscount
  delete window.__posSelectCustomer
  delete window.__posCheckout

  state.initialized = false
  state.container = null
  state.cart = []
  state.products = []
  state.customer = null

  console.log('✅ POS module destroyed')
}

/**
 * 获取模块API
 */
function getApi() {
  return {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart: () => { state.cart = []; updateTotals(); render() },
    getCart: () => [...state.cart],
    getTotal: () => state.total,
    onShow,
    onHide,
    destroy
  }
}

export default {
  init,
  destroy,
  onShow,
  onHide
}