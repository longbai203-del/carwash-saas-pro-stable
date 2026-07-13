/**
 * 数据分析模块
 * 提供业务数据报表、图表分析、趋势预测等功能
 * 
 * @module modules/13-analytics
 * 
 * @example
 * import { init, destroy, onShow, onHide } from './13-analytics.js'
 */

import { api } from '../../src/services/api.js'
import { store } from '../../src/store/index.js'
import { formatDate, formatCurrency, timeAgo } from '../../src/utils/helpers.js'

/**
 * @typedef {Object} ReportData
 * @property {Object} sales - 销售数据
 * @property {Object} revenue - 收入数据
 * @property {Object} customers - 客户数据
 * @property {Object} inventory - 库存数据
 * @property {Object} employees - 员工数据
 */

/**
 * 模块状态
 */
const state = {
  initialized: false,
  isLoading: false,
  activeTab: 'overview',
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  },
  data: {
    overview: null,
    sales: null,
    revenue: null,
    customers: null,
    inventory: null,
    employees: null,
    trends: null
  },
  charts: {
    initialized: false
  }
}

/**
 * 初始化数据分析模块
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} 模块API
 */
export function init(container) {
  if (state.initialized) {
    console.warn('Analytics module already initialized')
    return getApi()
  }

  console.log('📊 Initializing Analytics module...')
  
  state.container = container
  state.initialized = true

  // 加载数据
  loadAllData()

  // 绑定事件
  bindEvents()

  console.log('✅ Analytics module initialized')

  return getApi()
}

/**
 * 加载所有数据
 */
async function loadAllData() {
  state.isLoading = true
  render()

  try {
    const { start, end } = state.dateRange
    
    // 并行加载所有数据
    const [overview, sales, revenue, customers, inventory, employees, trends] = await Promise.all([
      api.get('/analytics/overview', { params: { start, end } }),
      api.get('/analytics/sales', { params: { start, end } }),
      api.get('/analytics/revenue', { params: { start, end } }),
      api.get('/analytics/customers', { params: { start, end } }),
      api.get('/analytics/inventory', { params: { start, end } }),
      api.get('/analytics/employees', { params: { start, end } }),
      api.get('/analytics/trends', { params: { start, end } })
    ])

    state.data.overview = overview?.success ? overview.data : null
    state.data.sales = sales?.success ? sales.data : null
    state.data.revenue = revenue?.success ? revenue.data : null
    state.data.customers = customers?.success ? customers.data : null
    state.data.inventory = inventory?.success ? inventory.data : null
    state.data.employees = employees?.success ? employees.data : null
    state.data.trends = trends?.success ? trends.data : null

  } catch (error) {
    console.error('Failed to load analytics data:', error)
    showError('加载数据失败')
  }

  state.isLoading = false
  render()
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 窗口resize时重新渲染图表
  window.addEventListener('resize', () => {
    if (state.charts.initialized) {
      renderCharts()
    }
  })
}

/**
 * 切换标签
 * @param {string} tab - 标签名
 */
function switchTab(tab) {
  state.activeTab = tab
  render()
}

/**
 * 更新日期范围
 */
function updateDateRange() {
  const startInput = document.getElementById('analytics-date-start')
  const endInput = document.getElementById('analytics-date-end')
  
  if (startInput) state.dateRange.start = startInput.value
  if (endInput) state.dateRange.end = endInput.value
  
  loadAllData()
}

/**
 * 渲染数据分析界面
 */
function render() {
  const container = state.container
  if (!container) return

  const tabs = [
    { id: 'overview', label: '📊 总览' },
    { id: 'sales', label: '📈 销售分析' },
    { id: 'revenue', label: '💰 收入分析' },
    { id: 'customers', label: '👤 客户分析' },
    { id: 'inventory', label: '📦 库存分析' },
    { id: 'employees', label: '👥 员工分析' }
  ]

  container.innerHTML = `
    <div class="analytics-container">
      <!-- 头部 -->
      <div class="module-header">
        <h2>📊 数据分析</h2>
        <div class="date-range">
          <label>从</label>
          <input type="date" id="analytics-date-start" 
                 value="${state.dateRange.start}"
                 onchange="window.__analyticsUpdateDate()"
          />
          <label>到</label>
          <input type="date" id="analytics-date-end" 
                 value="${state.dateRange.end}"
                 onchange="window.__analyticsUpdateDate()"
          />
          <button class="btn-primary" onclick="window.__analyticsRefresh()">
            🔄 刷新
          </button>
        </div>
      </div>

      <!-- 标签导航 -->
      <div class="tab-nav">
        ${tabs.map(tab => `
          <button class="tab-btn ${state.activeTab === tab.id ? 'active' : ''}"
                  onclick="window.__analyticsSwitchTab('${tab.id}')">
            ${tab.label}
          </button>
        `).join('')}
      </div>

      <!-- 内容 -->
      <div class="module-content">
        ${state.isLoading ? `
          <div class="loading-spinner">加载数据中...</div>
        ` : `
          ${renderContent()}
        `}
      </div>
    </div>
  `

  applyStyles()

  // 暴露全局方法
  window.__analyticsSwitchTab = switchTab
  window.__analyticsUpdateDate = updateDateRange
  window.__analyticsRefresh = loadAllData
}

/**
 * 渲染内容
 */
function renderContent() {
  const activeTab = state.activeTab

  switch (activeTab) {
    case 'overview':
      return renderOverview()
    case 'sales':
      return renderSales()
    case 'revenue':
      return renderRevenue()
    case 'customers':
      return renderCustomers()
    case 'inventory':
      return renderInventory()
    case 'employees':
      return renderEmployees()
    default:
      return '<div class="empty-state">未知标签</div>'
  }
}

/**
 * 渲染总览
 */
function renderOverview() {
  const { overview, sales, revenue, customers, inventory, employees } = state.data

  return `
    <div class="overview-container">
      <!-- 关键指标 -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">💰</div>
          <div class="kpi-content">
            <div class="kpi-label">总收入</div>
            <div class="kpi-value">${formatCurrency(revenue?.total || 0)}</div>
            <div class="kpi-change ${(revenue?.growth || 0) >= 0 ? 'positive' : 'negative'}">
              ${(revenue?.growth || 0) >= 0 ? '↑' : '↓'} ${Math.abs(revenue?.growth || 0)}%
            </div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📋</div>
          <div class="kpi-content">
            <div class="kpi-label">总订单</div>
            <div class="kpi-value">${sales?.total || 0}</div>
            <div class="kpi-change ${(sales?.growth || 0) >= 0 ? 'positive' : 'negative'}">
              ${(sales?.growth || 0) >= 0 ? '↑' : '↓'} ${Math.abs(sales?.growth || 0)}%
            </div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">👤</div>
          <div class="kpi-content">
            <div class="kpi-label">总客户</div>
            <div class="kpi-value">${customers?.total || 0}</div>
            <div class="kpi-change positive">+${customers?.new || 0} 新增</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📦</div>
          <div class="kpi-content">
            <div class="kpi-label">库存周转率</div>
            <div class="kpi-value">${inventory?.turnover || 0}</div>
            <div class="kpi-change ${(inventory?.turnoverChange || 0) >= 0 ? 'positive' : 'negative'}">
              ${(inventory?.turnoverChange || 0) >= 0 ? '↑' : '↓'} ${Math.abs(inventory?.turnoverChange || 0)}%
            </div>
          </div>
        </div>
      </div>

      <!-- 趋势图占位 -->
      <div class="chart-container">
        <h3>📈 趋势分析</h3>
        <div class="chart-placeholder" id="trend-chart">
          <div class="chart-bars">
            ${state.data.trends?.map((item, index) => `
              <div class="chart-bar-wrapper">
                <div class="chart-bar" style="height: ${item.value / 10}%;">
                  <span class="chart-bar-value">${item.value}</span>
                </div>
                <span class="chart-bar-label">${item.label}</span>
              </div>
            `).join('') || '<p>暂无趋势数据</p>'}
          </div>
        </div>
      </div>

      <!-- 快速报表 -->
      <div class="quick-reports">
        <h3>📋 快速报表</h3>
        <div class="report-grid">
          <div class="report-card" onclick="window.__analyticsSwitchTab('sales')">
            <span class="report-icon">📈</span>
            <span class="report-name">销售报表</span>
            <span class="report-arrow">→</span>
          </div>
          <div class="report-card" onclick="window.__analyticsSwitchTab('revenue')">
            <span class="report-icon">💰</span>
            <span class="report-name">收入报表</span>
            <span class="report-arrow">→</span>
          </div>
          <div class="report-card" onclick="window.__analyticsSwitchTab('customers')">
            <span class="report-icon">👤</span>
            <span class="report-name">客户报表</span>
            <span class="report-arrow">→</span>
          </div>
          <div class="report-card" onclick="window.__analyticsSwitchTab('inventory')">
            <span class="report-icon">📦</span>
            <span class="report-name">库存报表</span>
            <span class="report-arrow">→</span>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * 渲染销售分析
 */
function renderSales() {
  const { sales } = state.data

  return `
    <div class="analytics-tab-content">
      <h3>📈 销售分析</h3>
      <div class="analytics-stats">
        <div class="stat-item">
          <span class="stat-label">总销售额</span>
          <span class="stat-value">${formatCurrency(sales?.totalAmount || 0)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总订单数</span>
          <span class="stat-value">${sales?.totalOrders || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均订单金额</span>
          <span class="stat-value">${formatCurrency(sales?.averageOrder || 0)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">增长率</span>
          <span class="stat-value ${(sales?.growth || 0) >= 0 ? 'positive' : 'negative'}">
            ${(sales?.growth || 0) >= 0 ? '+' : ''}${sales?.growth || 0}%
          </span>
        </div>
      </div>
      <div class="feature-placeholder">
        <div class="placeholder-icon">📊</div>
        <p>详细销售报表功能开发中...</p>
        <p style="font-size: 12px; color: #999;">即将支持：销售趋势、品类分析、时段分析</p>
      </div>
    </div>
  `
}

/**
 * 渲染收入分析
 */
function renderRevenue() {
  const { revenue } = state.data

  return `
    <div class="analytics-tab-content">
      <h3>💰 收入分析</h3>
      <div class="analytics-stats">
        <div class="stat-item">
          <span class="stat-label">总收入</span>
          <span class="stat-value">${formatCurrency(revenue?.total || 0)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总支出</span>
          <span class="stat-value">${formatCurrency(revenue?.expenses || 0)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">净利润</span>
          <span class="stat-value">${formatCurrency(revenue?.profit || 0)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">利润率</span>
          <span class="stat-value">${revenue?.margin || 0}%</span>
        </div>
      </div>
      <div class="feature-placeholder">
        <div class="placeholder-icon">📈</div>
        <p>详细收入报表功能开发中...</p>
        <p style="font-size: 12px; color: #999;">即将支持：收入趋势、成本分析、利润分析</p>
      </div>
    </div>
  `
}

/**
 * 渲染客户分析
 */
function renderCustomers() {
  const { customers } = state.data

  return `
    <div class="analytics-tab-content">
      <h3>👤 客户分析</h3>
      <div class="analytics-stats">
        <div class="stat-item">
          <span class="stat-label">总客户数</span>
          <span class="stat-value">${customers?.total || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">新增客户</span>
          <span class="stat-value">${customers?.new || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">活跃客户</span>
          <span class="stat-value">${customers?.active || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">客户留存率</span>
          <span class="stat-value">${customers?.retention || 0}%</span>
        </div>
      </div>
      <div class="feature-placeholder">
        <div class="placeholder-icon">👥</div>
        <p>详细客户报表功能开发中...</p>
        <p style="font-size: 12px; color: #999;">即将支持：客户分层、忠诚度分析、流失分析</p>
      </div>
    </div>
  `
}

/**
 * 渲染库存分析
 */
function renderInventory() {
  const { inventory } = state.data

  return `
    <div class="analytics-tab-content">
      <h3>📦 库存分析</h3>
      <div class="analytics-stats">
        <div class="stat-item">
          <span class="stat-label">总库存价值</span>
          <span class="stat-value">${formatCurrency(inventory?.totalValue || 0)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">库存周转率</span>
          <span class="stat-value">${inventory?.turnover || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">低库存商品</span>
          <span class="stat-value" style="color: #f57c00;">${inventory?.lowStock || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">缺货商品</span>
          <span class="stat-value" style="color: #d32f2f;">${inventory?.outOfStock || 0}</span>
        </div>
      </div>
      <div class="feature-placeholder">
        <div class="placeholder-icon">📊</div>
        <p>详细库存报表功能开发中...</p>
        <p style="font-size: 12px; color: #999;">即将支持：库存周转、ABC分析、预警分析</p>
      </div>
    </div>
  `
}

/**
 * 渲染员工分析
 */
function renderEmployees() {
  const { employees } = state.data

  return `
    <div class="analytics-tab-content">
      <h3>👥 员工分析</h3>
      <div class="analytics-stats">
        <div class="stat-item">
          <span class="stat-label">总员工数</span>
          <span class="stat-value">${employees?.total || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">在职员工</span>
          <span class="stat-value">${employees?.active || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">本月出勤率</span>
          <span class="stat-value">${employees?.attendance || 0}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">员工流失率</span>
          <span class="stat-value" style="color: ${(employees?.turnover || 0) > 10 ? '#d32f2f' : '#2e7d32'}">
            ${employees?.turnover || 0}%
          </span>
        </div>
      </div>
      <div class="feature-placeholder">
        <div class="placeholder-icon">📋</div>
        <p>详细员工报表功能开发中...</p>
        <p style="font-size: 12px; color: #999;">即将支持：绩效分析、考勤分析、薪酬分析</p>
      </div>
    </div>
  `
}

/**
 * 渲染图表（占位）
 */
function renderCharts() {
  // 实际项目中可集成 Chart.js 等图表库
  state.charts.initialized = true
}

/**
 * 应用样式
 */
function applyStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .analytics-container {
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .module-header h2 {
      margin: 0;
      font-size: 24px;
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .date-range label {
      font-size: 14px;
      color: #666;
    }

    .date-range input {
      padding: 6px 10px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
    }

    .date-range input:focus {
      border-color: #4fc3f7;
    }

    .btn-primary {
      padding: 6px 16px;
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

    .tab-nav {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 2px solid #e0e0e0;
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 10px 20px;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      font-size: 14px;
      color: #666;
      transition: all 0.3s;
    }

    .tab-btn:hover {
      color: #1a1a2e;
    }

    .tab-btn.active {
      color: #1a1a2e;
      border-bottom-color: #4fc3f7;
      font-weight: 600;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .kpi-icon {
      font-size: 28px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 12px;
    }

    .kpi-content {
      flex: 1;
    }

    .kpi-label {
      font-size: 13px;
      color: #888;
    }

    .kpi-value {
      font-size: 22px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .kpi-change {
      font-size: 12px;
      margin-top: 2px;
    }

    .kpi-change.positive {
      color: #2e7d32;
    }

    .kpi-change.negative {
      color: #d32f2f;
    }

    .chart-container {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .chart-container h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
    }

    .chart-placeholder {
      min-height: 200px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 8px;
      padding: 20px 0;
    }

    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      height: 200px;
      width: 100%;
      justify-content: center;
    }

    .chart-bar-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
    }

    .chart-bar {
      width: 40px;
      min-height: 4px;
      background: linear-gradient(180deg, #4fc3f7, #0288d1);
      border-radius: 4px 4px 0 0;
      position: relative;
      transition: height 0.5s ease;
    }

    .chart-bar-value {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      color: #666;
    }

    .chart-bar-label {
      font-size: 11px;
      color: #999;
      margin-top: 4px;
    }

    .quick-reports {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .quick-reports h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
    }

    .report-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }

    .report-card {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #f5f8ff;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .report-card:hover {
      background: #e3f2fd;
      transform: translateY(-2px);
    }

    .report-icon {
      font-size: 20px;
      margin-right: 12px;
    }

    .report-name {
      flex: 1;
      font-weight: 500;
      color: #1a1a2e;
    }

    .report-arrow {
      color: #4fc3f7;
    }

    .analytics-tab-content {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .analytics-tab-content h3 {
      margin: 0 0 16px 0;
    }

    .analytics-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .stat-item {
      text-align: center;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .stat-label {
      display: block;
      font-size: 12px;
      color: #888;
    }

    .stat-value {
      display: block;
      font-size: 20px;
      font-weight: 600;
      color: #1a1a2e;
      margin-top: 4px;
    }

    .stat-value.positive {
      color: #2e7d32;
    }

    .stat-value.negative {
      color: #d32f2f;
    }

    .feature-placeholder {
      text-align: center;
      padding: 40px 20px;
      color: #999;
      background: #fafafa;
      border-radius: 8px;
    }

    .placeholder-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .loading-spinner {
      text-align: center;
      padding: 60px;
      color: #999;
    }

    .empty-state {
      text-align: center;
      padding: 60px;
      color: #999;
    }

    @media (max-width: 768px) {
      .module-header {
        flex-direction: column;
        align-items: stretch;
      }
      
      .date-range {
        justify-content: center;
      }
      
      .kpi-grid {
        grid-template-columns: 1fr 1fr;
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
  console.log('👁️ Analytics module shown')
  loadAllData()
}

/**
 * 模块隐藏时调用
 */
export function onHide() {
  console.log('🙈 Analytics module hidden')
}

/**
 * 销毁模块
 */
export function destroy() {
  console.log('🗑️ Destroying Analytics module...')
  
  delete window.__analyticsSwitchTab
  delete window.__analyticsUpdateDate
  delete window.__analyticsRefresh

  state.initialized = false
  state.container = null
  state.charts.initialized = false

  console.log('✅ Analytics module destroyed')
}

/**
 * 获取模块API
 */
function getApi() {
  return {
    reload: loadAllData,
    getData: function() {
      return { ...state.data }
    },
    switchTab: switchTab,
    onShow: onShow,
    onHide: onHide,
    destroy: destroy
  }
}

export default {
  init: init,
  destroy: destroy,
  onShow: onShow,
  onHide: onHide
}