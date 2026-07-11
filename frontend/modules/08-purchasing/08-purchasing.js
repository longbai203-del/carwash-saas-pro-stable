/**
 * 采购管理模块
 * 处理采购订单、供应商管理、收货等操作
 * 
 * @module modules/08-purchasing
 * 
 * @example
 * import { init, destroy, onShow, onHide } from './08-purchasing.js'
 */

import { api, endpoints } from '../../src/services/api.js'
import { store } from '../../src/store/index.js'
import { formatDate, formatCurrency, timeAgo, debounce } from '../../src/utils/helpers.js'

/**
 * @typedef {Object} PurchaseOrder
 * @property {string} id - 采购订单ID
 * @property {string} order_number - 订单编号
 * @property {string} supplier_id - 供应商ID
 * @property {string} supplier_name - 供应商名称
 * @property {string} status - 状态: draft, pending, approved, received, cancelled
 * @property {number} total_amount - 总金额
 * @property {string} expected_date - 预计到货日期
 * @property {string} received_date - 实际收货日期
 * @property {string} notes - 备注
 * @property {string} created_at - 创建时间
 * @property {string} updated_at - 更新时间
 */

/**
 * 模块状态
 */
let state = {
  initialized: false,
  orders: [],
  suppliers: [],
  selectedOrder: null,
  isLoading: false,
  filters: {
    status: '',
    supplier_id: '',
    search: ''
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  }
}

/**
 * 初始化采购模块
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} 模块API
 */
export function init(container) {
  if (state.initialized) {
    console.warn('Purchasing module already initialized')
    return getApi()
  }

  console.log('📦 Initializing Purchasing module...')
  
  state.container = container
  state.initialized = true

  // 加载数据
  loadSuppliers()
  loadOrders()

  // 绑定事件
  bindEvents()

  console.log('✅ Purchasing module initialized')

  return getApi()
}

/**
 * 加载供应商列表
 */
async function loadSuppliers() {
  try {
    const response = await api.get('/suppliers', {
      params: { is_active: true, limit: 100 }
    })
    
    if (response?.success) {
      state.suppliers = response.data || []
    }
  } catch (error) {
    console.error('Failed to load suppliers:', error)
  }
}

/**
 * 加载采购订单
 */
async function loadOrders() {
  state.isLoading = true
  render()

  try {
    const response = await api.get('/purchase-orders', {
      params: {
        page: state.pagination.page,
        limit: state.pagination.limit,
        status: state.filters.status || undefined,
        supplier_id: state.filters.supplier_id || undefined,
        search: state.filters.search || undefined
      }
    })
    
    if (response?.success) {
      state.orders = response.data || []
      state.pagination.total = response.pagination?.total || 0
    }
  } catch (error) {
    console.error('Failed to load orders:', error)
    showError('加载采购订单失败')
  }

  state.isLoading = false
  render()
}

/**
 * 创建采购订单
 * @param {Object} data - 订单数据
 */
async function createOrder(data) {
  state.isLoading = true
  render()

  try {
    const response = await api.post('/purchase-orders', data)
    
    if (response?.success) {
      showSuccess('采购订单创建成功')
      loadOrders()
    }
  } catch (error) {
    console.error('Create order failed:', error)
    showError('创建采购订单失败')
  }

  state.isLoading = false
  render()
}

/**
 * 更新采购订单状态
 * @param {string} id - 订单ID
 * @param {string} status - 新状态
 */
async function updateOrderStatus(id, status) {
  state.isLoading = true
  render()

  try {
    const response = await api.put(`/purchase-orders/${id}/status`, { status })
    
    if (response?.success) {
      showSuccess(`订单状态已更新为: ${status}`)
      loadOrders()
    }
  } catch (error) {
    console.error('Update status failed:', error)
    showError('更新状态失败')
  }

  state.isLoading = false
  render()
}

/**
 * 收货
 * @param {string} id - 订单ID
 */
async function receiveOrder(id) {
  if (!confirm('确认已收到该订单的所有货物？')) return

  state.isLoading = true
  render()

  try {
    const response = await api.post(`/purchase-orders/${id}/receive`)
    
    if (response?.success) {
      showSuccess('收货成功')
      loadOrders()
    }
  } catch (error) {
    console.error('Receive failed:', error)
    showError('收货失败')
  }

  state.isLoading = false
  render()
}

/**
 * 删除采购订单
 * @param {string} id - 订单ID
 */
async function deleteOrder(id) {
  if (!confirm('确定要删除该采购订单吗？')) return

  state.isLoading = true
  render()

  try {
    const response = await api.delete(`/purchase-orders/${id}`)
    
    if (response?.success) {
      showSuccess('采购订单已删除')
      loadOrders()
    }
  } catch (error) {
    console.error('Delete failed:', error)
    showError('删除失败')
  }

  state.isLoading = false
  render()
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 可在此添加事件监听
}

/**
 * 渲染采购界面
 */
function render() {
  const { container } = state
  if (!container) return

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'draft', label: '草稿' },
    { value: 'pending', label: '待审批' },
    { value: 'approved', label: '已批准' },
    { value: 'received', label: '已收货' },
    { value: 'cancelled', label: '已取消' }
  ]

  container.innerHTML = `
    <div class="purchasing-container">
      <!-- 头部 -->
      <div class="module-header">
        <h2>📦 采购管理</h2>
        <button class="btn-primary" onclick="window.__purchasingCreate()">
          + 新建采购订单
        </button>
      </div>

      <!-- 过滤器 -->
      <div class="module-filters">
        <input type="text" 
               placeholder="🔍 搜索订单号/供应商..."
               value="${state.filters.search || ''}"
               oninput="window.__purchasingSearch(this.value)"
        />
        <select onchange="window.__purchasingFilterStatus(this.value)">
          ${statusOptions.map(opt => `
            <option value="${opt.value}" ${state.filters.status === opt.value ? 'selected' : ''}>
              ${opt.label}
            </option>
          `).join('')}
        </select>
        <select onchange="window.__purchasingFilterSupplier(this.value)">
          <option value="">全部供应商</option>
          ${state.suppliers.map(s => `
            <option value="${s.id}" ${state.filters.supplier_id === s.id ? 'selected' : ''}>
              ${s.name}
            </option>
          `).join('')}
        </select>
      </div>

      <!-- 内容 -->
      <div class="module-content">
        ${state.isLoading ? `
          <div class="loading-spinner">加载中...</div>
        ` : state.orders.length === 0 ? `
          <div class="empty-state">暂无采购订单</div>
        ` : `
          <table class="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>供应商</th>
                <th>总金额</th>
                <th>状态</th>
                <th>预计到货</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${state.orders.map(order => `
                <tr>
                  <td><strong>#${order.order_number}</strong></td>
                  <td>${order.supplier_name || order.supplier_id}</td>
                  <td>${formatCurrency(order.total_amount || 0)}</td>
                  <td><span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span></td>
                  <td>${order.expected_date ? formatDate(order.expected_date, 'YYYY-MM-DD') : '-'}</td>
                  <td>${timeAgo(order.created_at)}</td>
                  <td>
                    <button onclick="window.__purchasingView('${order.id}')">查看</button>
                    ${order.status === 'draft' ? `
                      <button onclick="window.__purchasingSubmit('${order.id}')">提交</button>
                      <button onclick="window.__purchasingDelete('${order.id}')" class="btn-danger">删除</button>
                    ` : ''}
                    ${order.status === 'approved' ? `
                      <button onclick="window.__purchasingReceive('${order.id}')" class="btn-success">收货</button>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>

      <!-- 分页 -->
      <div class="module-pagination">
        <span>共 ${state.pagination.total} 条</span>
        <div class="pagination-controls">
          <button onclick="window.__purchasingPage(${state.pagination.page - 1})" 
                  ${state.pagination.page <= 1 ? 'disabled' : ''}>
            上一页
          </button>
          <span>第 ${state.pagination.page} / ${Math.ceil(state.pagination.total / state.pagination.limit) || 1} 页</span>
          <button onclick="window.__purchasingPage(${state.pagination.page + 1})"
                  ${state.pagination.page >= Math.ceil(state.pagination.total / state.pagination.limit) ? 'disabled' : ''}>
            下一页
          </button>
        </div>
      </div>
    </div>
  `

  applyStyles()

  // 暴露全局方法
  window.__purchasingSearch = (value) => {
    state.filters.search = value
    state.pagination.page = 1
    loadOrders()
  }
  window.__purchasingFilterStatus = (value) => {
    state.filters.status = value
    state.pagination.page = 1
    loadOrders()
  }
  window.__purchasingFilterSupplier = (value) => {
    state.filters.supplier_id = value
    state.pagination.page = 1
    loadOrders()
  }
  window.__purchasingPage = (page) => {
    if (page < 1) return
    state.pagination.page = page
    loadOrders()
  }
  window.__purchasingCreate = () => {
    // 简化创建对话框
    const supplierId = prompt('请输入供应商ID：')
    if (!supplierId) return
    
    const totalAmount = prompt('请输入总金额：')
    if (!totalAmount) return

    createOrder({
      supplier_id: supplierId,
      total_amount: parseFloat(totalAmount),
      status: 'draft',
      notes: prompt('备注：') || ''
    })
  }
  window.__purchasingView = (id) => {
    const order = state.orders.find(o => o.id === id)
    if (!order) return
    alert(`
      采购订单详情
      ============
      订单号: ${order.order_number}
      供应商: ${order.supplier_name || order.supplier_id}
      总金额: ${formatCurrency(order.total_amount || 0)}
      状态: ${getStatusLabel(order.status)}
      预计到货: ${order.expected_date || '-'}
      创建时间: ${formatDate(order.created_at)}
      备注: ${order.notes || '无'}
    `)
  }
  window.__purchasingSubmit = (id) => {
    if (confirm('确认提交该采购订单进行审批？')) {
      updateOrderStatus(id, 'pending')
    }
  }
  window.__purchasingReceive = receiveOrder
  window.__purchasingDelete = deleteOrder
}

/**
 * 获取状态标签
 * @param {string} status - 状态码
 * @returns {string} 状态标签
 */
function getStatusLabel(status) {
  const labels = {
    draft: '草稿',
    pending: '待审批',
    approved: '已批准',
    received: '已收货',
    cancelled: '已取消'
  }
  return labels[status] || status
}

/**
 * 应用样式
 */
function applyStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .purchasing-container {
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .module-header h2 {
      margin: 0;
      font-size: 24px;
    }

    .btn-primary {
      padding: 8px 20px;
      background: #4fc3f7;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-primary:hover {
      background: #0288d1;
    }

    .btn-success {
      padding: 4px 12px;
      background: #e8f5e9;
      color: #1b5e20;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-success:hover {
      background: #4caf50;
      color: #fff;
    }

    .btn-danger {
      padding: 4px 12px;
      background: #fce4ec;
      color: #c62828;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-danger:hover {
      background: #f44336;
      color: #fff;
    }

    .module-filters {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .module-filters input,
    .module-filters select {
      padding: 8px 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
    }

    .module-filters input:focus,
    .module-filters select:focus {
      border-color: #4fc3f7;
    }

    .module-filters input {
      flex: 1;
      min-width: 200px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .data-table th {
      background: #f5f5f5;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      color: #666;
    }

    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .data-table tr:hover td {
      background: #fafafa;
    }

    .data-table button {
      padding: 4px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-right: 4px;
    }

    .data-table button:not(.btn-danger):not(.btn-success) {
      background: #e3f2fd;
      color: #0d47a1;
    }

    .status-badge {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
    }

    .status-badge.status-draft { background: #f5f5f5; color: #666; }
    .status-badge.status-pending { background: #fff3e0; color: #e65100; }
    .status-badge.status-approved { background: #e3f2fd; color: #0d47a1; }
    .status-badge.status-received { background: #e8f5e9; color: #1b5e20; }
    .status-badge.status-cancelled { background: #fce4ec; color: #880e4f; }

    .module-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding: 12px 0;
    }

    .pagination-controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .pagination-controls button {
      padding: 4px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
    }

    .pagination-controls button:disabled {
      opacity: 0.5;
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
  console.log('👁️ Purchasing module shown')
  loadOrders()
}

/**
 * 模块隐藏时调用
 */
export function onHide() {
  console.log('🙈 Purchasing module hidden')
}

/**
 * 销毁模块
 */
export function destroy() {
  console.log('🗑️ Destroying Purchasing module...')
  
  delete window.__purchasingSearch
  delete window.__purchasingFilterStatus
  delete window.__purchasingFilterSupplier
  delete window.__purchasingPage
  delete window.__purchasingCreate
  delete window.__purchasingView
  delete window.__purchasingSubmit
  delete window.__purchasingReceive
  delete window.__purchasingDelete

  state.initialized = false
  state.container = null
  state.orders = []
  state.suppliers = []

  console.log('✅ Purchasing module destroyed')
}

/**
 * 获取模块API
 */
function getApi() {
  return {
    reload: loadOrders,
    getOrders: () => [...state.orders],
    getSuppliers: () => [...state.suppliers],
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