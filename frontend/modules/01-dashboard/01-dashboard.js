/**
 * 仪表盘模块
 * 显示业务概览数据
 * 
 * @module modules/01-dashboard
 * 
 * @example
 * import { init, destroy, onShow, onHide } from './01-dashboard.js'
 */

import { api, endpoints } from '../../src/services/api.js'
import { store } from '../../src/store/index.js'
import { formatDate, formatCurrency, timeAgo } from '../../src/utils/helpers.js'

/**
 * 模块状态
 */
let state = {
  initialized: false,
  data: {
    stats: {},
    recentOrders: [],
    lowStock: [],
    notifications: []
  },
  interval: null
}

/**
 * 初始化模块
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} 模块API
 */
export function init(container) {
  if (state.initialized) {
    console.warn('Dashboard module already initialized')
    return getApi()
  }

  console.log('📊 Initializing Dashboard module...')
  
  state.container = container
  state.initialized = true

  // 加载数据
  loadDashboardData()

  // 设置定时刷新（每5分钟）
  state.interval = setInterval(() => {
    loadDashboardData()
  }, 5 * 60 * 1000)

  // 监听状态变化
  const unsubscribe = store.subscribe((state) => {
    // 当用户认证状态变化时刷新数据
    if (state.user?.authenticated) {
      loadDashboardData()
    }
  })

  console.log('✅ Dashboard module initialized')

  return {
    ...getApi(),
    unsubscribe
  }
}

/**
 * 加载仪表盘数据
 * @returns {Promise<void>}
 */
async function loadDashboardData() {
  try {
    // 获取统计数据
    const statsResponse = await api.get('/dashboard/stats')
    if (statsResponse?.success) {
      state.data.stats = statsResponse.data
    }

    // 获取最近订单
    const ordersResponse = await api.get(endpoints.orders.list, {
      params: { limit: 10, sort: 'created_at:desc' }
    })
    if (ordersResponse?.success) {
      state.data.recentOrders = ordersResponse.data || []
    }

    // 获取低库存预警
    const stockResponse = await api.get(endpoints.products.lowStock)
    if (stockResponse?.success) {
      state.data.lowStock = stockResponse.data || []
    }

    // 获取通知
    const notificationsResponse = await api.get('/notifications', {
      params: { unread: true, limit: 5 }
    })
    if (notificationsResponse?.success) {
      state.data.notifications = notificationsResponse.data || []
    }

    // 更新UI
    renderDashboard()

    // 更新store
    store.setState({
      'data.dashboard': state.data
    })

  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    showError('加载数据失败，请稍后重试')
  }
}

/**
 * 渲染仪表盘
 */
function renderDashboard() {
  const { container } = state
  if (!container) return

  const { stats, recentOrders, lowStock, notifications } = state.data

  container.innerHTML = `
    <div class="dashboard-container">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-label">今日收入</div>
            <div class="stat-value">${formatCurrency(stats.todayRevenue || 0)}</div>
            <div class="stat-change ${(stats.revenueChange || 0) >= 0 ? 'positive' : 'negative'}">
              ${stats.revenueChange >= 0 ? '↑' : '↓'} ${Math.abs(stats.revenueChange || 0)}%
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <div class="stat-label">今日订单</div>
            <div class="stat-value">${stats.todayOrders || 0}</div>
            <div class="stat-change ${(stats.ordersChange || 0) >= 0 ? 'positive' : 'negative'}">
              ${stats.ordersChange >= 0 ? '↑' : '↓'} ${Math.abs(stats.ordersChange || 0)}%
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-content">
            <div class="stat-label">活跃客户</div>
            <div class="stat-value">${stats.activeCustomers || 0}</div>
            <div class="stat-change positive">+${stats.newCustomers || 0} 新增</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <div class="stat-label">库存预警</div>
            <div class="stat-value">${stats.lowStockCount || 0}</div>
            <div class="stat-change ${(stats.lowStockCount || 0) > 0 ? 'negative' : 'positive'}">
              ${(stats.lowStockCount || 0) > 0 ? '⚠️ 需要关注' : '✅ 库存正常'}
            </div>
          </div>
        </div>
      </div>

      <!-- 最近订单 -->
      <div class="section">
        <div class="section-header">
          <h3>📋 最近订单</h3>
          <a href="/orders" class="view-all">查看全部 →</a>
        </div>
        <div class="order-list">
          ${recentOrders.length > 0 ? recentOrders.map(order => `
            <div class="order-item">
              <div class="order-info">
                <span class="order-number">#${order.order_number}</span>
                <span class="order-customer">${order.customer_name || '未知客户'}</span>
              </div>
              <div class="order-meta">
                <span class="order-amount">${formatCurrency(order.total_amount || 0)}</span>
                <span class="order-status status-${order.status}">${order.status}</span>
                <span class="order-time">${timeAgo(order.created_at)}</span>
              </div>
            </div>
          `).join('') : `
            <div class="empty-state">
              <p>暂无订单</p>
            </div>
          `}
        </div>
      </div>

      <!-- 低库存预警 -->
      <div class="section">
        <div class="section-header">
          <h3>⚠️ 低库存预警</h3>
          <a href="/inventory" class="view-all">管理库存 →</a>
        </div>
        <div class="stock-list">
          ${lowStock.length > 0 ? lowStock.map(product => `
            <div class="stock-item">
              <span class="stock-name">${product.name}</span>
              <span class="stock-quantity" style="color: ${product.current_stock === 0 ? '#d32f2f' : '#f57c00'}">
                库存: ${product.current_stock} / ${product.min_stock}
              </span>
            </div>
          `).join('') : `
            <div class="empty-state">
              <p>✅ 所有产品库存充足</p>
            </div>
          `}
        </div>
      </div>

      <!-- 通知 -->
      <div class="section">
        <div class="section-header">
          <h3>🔔 通知</h3>
        </div>
        <div class="notification-list">
          ${notifications.length > 0 ? notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}">
              <span class="notification-icon">${notification.icon || '📌'}</span>
              <span class="notification-message">${notification.message}</span>
              <span class="notification-time">${timeAgo(notification.created_at)}</span>
            </div>
          `).join('') : `
            <div class="empty-state">
              <p>📭 暂无新通知</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `

  // 应用样式
  applyStyles()
}

/**
 * 应用仪表盘样式
 */
function applyStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .dashboard-container {
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 32px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 12px;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 13px;
      color: #888;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .stat-change {
      font-size: 12px;
      margin-top: 4px;
    }

    .stat-change.positive {
      color: #2e7d32;
    }

    .stat-change.negative {
      color: #d32f2f;
    }

    .section {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0;
    }

    .view-all {
      color: #4fc3f7;
      text-decoration: none;
      font-size: 14px;
    }

    .view-all:hover {
      text-decoration: underline;
    }

    .order-item, .stock-item, .notification-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .order-item:last-child, .stock-item:last-child, .notification-item:last-child {
      border-bottom: none;
    }

    .order-number {
      font-weight: 500;
      color: #1a1a2e;
    }

    .order-customer {
      color: #666;
      font-size: 14px;
    }

    .order-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .order-amount {
      font-weight: 500;
      color: #1a1a2e;
    }

    .order-status {
      font-size: 12px;
      padding: 2px 10px;
      border-radius: 12px;
      text-transform: capitalize;
    }

    .status-pending { background: #fff3e0; color: #e65100; }
    .status-processing { background: #e3f2fd; color: #0d47a1; }
    .status-completed { background: #e8f5e9; color: #1b5e20; }
    .status-cancelled { background: #fce4ec; color: #880e4f; }

    .order-time {
      color: #999;
      font-size: 12px;
    }

    .stock-name {
      font-weight: 500;
      color: #1a1a2e;
    }

    .stock-quantity {
      font-size: 14px;
    }

    .notification-item.unread {
      background: #f5f8ff;
      margin: 0 -20px;
      padding: 12px 20px;
    }

    .notification-icon {
      font-size: 18px;
    }

    .notification-message {
      flex: 1;
      margin: 0 12px;
    }

    .notification-time {
      color: #999;
      font-size: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: #999;
    }
  `
  document.head.appendChild(style)
}

/**
 * 显示错误
 * @param {string} message - 错误信息
 */
function showError(message) {
  const { container } = state
  if (!container) return

  container.innerHTML = `
    <div style="text-align: center; padding: 40px; color: #d32f2f;">
      <p>${message}</p>
      <button onclick="location.reload()" 
              style="padding: 8px 20px; background: #4fc3f7; color: #fff; border: none; border-radius: 6px; cursor: pointer; margin-top: 12px;">
        重试
      </button>
    </div>
  `
}

/**
 * 模块显示时调用
 */
export function onShow() {
  console.log('👁️ Dashboard module shown')
  // 刷新数据
  loadDashboardData()
}

/**
 * 模块隐藏时调用
 */
export function onHide() {
  console.log('🙈 Dashboard module hidden')
}

/**
 * 销毁模块
 */
export function destroy() {
  console.log('🗑️ Destroying Dashboard module...')
  
  if (state.interval) {
    clearInterval(state.interval)
    state.interval = null
  }

  state.initialized = false
  state.container = null
  state.data = {
    stats: {},
    recentOrders: [],
    lowStock: [],
    notifications: []
  }

  console.log('✅ Dashboard module destroyed')
}

/**
 * 获取模块API
 * @returns {Object} 模块API
 */
function getApi() {
  return {
    loadData: loadDashboardData,
    refresh: loadDashboardData,
    getState: () => ({ ...state.data }),
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