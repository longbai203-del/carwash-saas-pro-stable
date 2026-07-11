/**
 * SaaS管理模块
 * 处理租户、订阅、套餐、计费等SaaS运营操作
 * 
 * @module modules/11-saas
 * 
 * @example
 * import { init, destroy, onShow, onHide } from './11-saas.js'
 */

import { api } from '../../src/services/api.js'
import { store } from '../../src/store/index.js'
import { formatDate, formatCurrency } from '../../src/utils/helpers.js'

/**
 * @typedef {Object} Tenant
 * @property {string} id - 租户ID
 * @property {string} name - 租户名称
 * @property {string} slug - 租户标识
 * @property {string} subscription_plan - 订阅套餐
 * @property {string} subscription_status - 订阅状态
 * @property {string} created_at - 创建时间
 */

/**
 * 模块状态
 */
let state = {
  initialized: false,
  tenants: [],
  subscriptions: [],
  plans: [],
  selectedTenant: null,
  isLoading: false,
  activeTab: 'tenants',
  filters: {
    plan: '',
    status: '',
    search: ''
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  }
}

/**
 * 初始化SaaS模块
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} 模块API
 */
export function init(container) {
  if (state.initialized) {
    console.warn('SaaS module already initialized')
    return getApi()
  }

  console.log('☁️ Initializing SaaS module...')
  
  state.container = container
  state.initialized = true

  // 加载数据
  loadTenants()
  loadPlans()

  console.log('✅ SaaS module initialized')

  return getApi()
}

/**
 * 加载租户列表
 */
async function loadTenants() {
  state.isLoading = true
  render()

  try {
    const response = await api.get('/tenants', {
      params: {
        page: state.pagination.page,
        limit: state.pagination.limit,
        plan: state.filters.plan || undefined,
        status: state.filters.status || undefined,
        search: state.filters.search || undefined
      }
    })
    
    if (response?.success) {
      state.tenants = response.data || []
      state.pagination.total = response.pagination?.total || 0
    }
  } catch (error) {
    console.error('Failed to load tenants:', error)
    showError('加载租户列表失败')
  }

  state.isLoading = false
  render()
}

/**
 * 加载套餐列表
 */
async function loadPlans() {
  try {
    const response = await api.get('/plans')
    
    if (response?.success) {
      state.plans = response.data || []
    }
  } catch (error) {
    console.error('Failed to load plans:', error)
  }
}

/**
 * 创建租户
 * @param {Object} data - 租户数据
 */
async function createTenant(data) {
  state.isLoading = true
  render()

  try {
    const response = await api.post('/tenants', data)
    
    if (response?.success) {
      showSuccess('租户创建成功')
      loadTenants()
    }
  } catch (error) {
    console.error('Create tenant failed:', error)
    showError('创建租户失败')
  }

  state.isLoading = false
  render()
}

/**
 * 更新租户订阅
 * @param {string} id - 租户ID
 * @param {string} plan - 套餐名
 */
async function updateSubscription(id, plan) {
  state.isLoading = true
  render()

  try {
    const response = await api.put(`/tenants/${id}/subscription`, { plan })
    
    if (response?.success) {
      showSuccess(`订阅已更新为: ${plan}`)
      loadTenants()
    }
  } catch (error) {
    console.error('Update subscription failed:', error)
    showError('更新订阅失败')
  }

  state.isLoading = false
  render()
}

/**
 * 切换标签
 */
function switchTab(tab) {
  state.activeTab = tab
  render()
}

/**
 * 渲染SaaS界面
 */
function render() {
  const { container } = state
  if (!container) return

  const tabs = [
    { id: 'tenants', label: '🏢 租户管理' },
    { id: 'subscriptions', label: '📋 订阅管理' },
    { id: 'plans', label: '📦 套餐管理' },
    { id: 'billing', label: '💳 计费管理' }
  ]

  container.innerHTML = `
    <div class="saas-container">
      <!-- 头部 -->
      <div class="module-header">
        <h2>☁️ SaaS管理</h2>
        ${state.activeTab === 'tenants' ? `
          <button class="btn-primary" onclick="window.__saasCreateTenant()">
            + 创建租户
          </button>
        ` : ''}
      </div>

      <!-- 标签导航 -->
      <div class="tab-nav">
        ${tabs.map(tab => `
          <button class="tab-btn ${state.activeTab === tab.id ? 'active' : ''}"
                  onclick="window.__saasSwitchTab('${tab.id}')">
            ${tab.label}
          </button>
        `).join('')}
      </div>

      <!-- 过滤器 -->
      ${state.activeTab === 'tenants' ? `
        <div class="module-filters">
          <input type="text" 
                 placeholder="🔍 搜索租户..."
                 value="${state.filters.search || ''}"
                 oninput="window.__saasSearch(this.value)"
          />
          <select onchange="window.__saasFilterPlan(this.value)">
            <option value="">全部套餐</option>
            ${state.plans.map(p => `
              <option value="${p.name}" ${state.filters.plan === p.name ? 'selected' : ''}>${p.name}</option>
            `).join('')}
          </select>
          <select onchange="window.__saasFilterStatus(this.value)">
            <option value="">全部状态</option>
            <option value="active" ${state.filters.status === 'active' ? 'selected' : ''}>激活</option>
            <option value="trial" ${state.filters.status === 'trial' ? 'selected' : ''}>试用</option>
            <option value="expired" ${state.filters.status === 'expired' ? 'selected' : ''}>已过期</option>
            <option value="cancelled" ${state.filters.status === 'cancelled' ? 'selected' : ''}>已取消</option>
          </select>
        </div>
      ` : ''}

      <!-- 内容 -->
      <div class="module-content">
        ${renderContent()}
      </div>

      <!-- 分页 -->
      ${state.activeTab === 'tenants' ? `
        <div class="module-pagination">
          <span>共 ${state.pagination.total} 条</span>
          <div class="pagination-controls">
            <button onclick="window.__saasPage(${state.pagination.page - 1})" 
                    ${state.pagination.page <= 1 ? 'disabled' : ''}>
              上一页
            </button>
            <span>第 ${state.pagination.page} / ${Math.ceil(state.pagination.total / state.pagination.limit) || 1} 页</span>
            <button onclick="window.__saasPage(${state.pagination.page + 1})"
                    ${state.pagination.page >= Math.ceil(state.pagination.total / state.pagination.limit) ? 'disabled' : ''}>
              下一页
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `

  applyStyles()

  // 暴露全局方法
  window.__saasSwitchTab = switchTab
  window.__saasSearch = (value) => {
    state.filters.search = value
    state.pagination.page = 1
    loadTenants()
  }
  window.__saasFilterPlan = (value) => {
    state.filters.plan = value
    state.pagination.page = 1
    loadTenants()
  }
  window.__saasFilterStatus = (value) => {
    state.filters.status = value
    state.pagination.page = 1
    loadTenants()
  }
  window.__saasPage = (page) => {
    if (page < 1) return
    state.pagination.page = page
    loadTenants()
  }
  window.__saasCreateTenant = () => {
    const name = prompt('请输入租户名称：')
    if (!name) return
    const slug = prompt('请输入租户标识（slug）：') || name.toLowerCase().replace(/\s/g, '-')
    const plan = prompt('请输入套餐名称（free/basic/pro/enterprise）：') || 'free'

    createTenant({
      name,
      slug,
      subscription_plan: plan,
      subscription_status: 'active'
    })
  }
  window.__saasChangePlan = (id) => {
    const plan = prompt('请输入新套餐（free/basic/pro/enterprise）：')
    if (plan) {
      updateSubscription(id, plan)
    }
  }
}

/**
 * 渲染内容
 */
function renderContent() {
  const { activeTab, isLoading } = state

  if (isLoading) {
    return '<div class="loading-spinner">加载中...</div>'
  }

  switch (activeTab) {
    case 'tenants':
      return renderTenants()
    case 'subscriptions':
      return renderSubscriptions()
    case 'plans':
      return renderPlans()
    case 'billing':
      return renderBilling()
    default:
      return '<div class="empty-state">未知标签</div>'
  }
}

/**
 * 渲染租户列表
 */
function renderTenants() {
  if (state.tenants.length === 0) {
    return '<div class="empty-state">暂无租户</div>'
  }

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>租户名称</th>
          <th>标识</th>
          <th>套餐</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${state.tenants.map(tenant => `
          <tr>
            <td><strong>${tenant.name}</strong></td>
            <td>${tenant.slug}</td>
            <td><span class="plan-badge">${tenant.subscription_plan || 'free'}</span></td>
            <td><span class="status-badge ${tenant.subscription_status}">${getStatusLabel(tenant.subscription_status)}</span></td>
            <td>${formatDate(tenant.created_at)}</td>
            <td>
              <button onclick="window.__saasChangePlan('${tenant.id}')">修改套餐</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

/**
 * 渲染订阅
 */
function renderSubscriptions() {
  return `
    <div class="tab-content">
      <h3>📋 订阅管理</h3>
      <p style="color: #666; margin-bottom: 16px;">订阅管理功能开发中...</p>
      <div class="feature-placeholder">
        <div class="placeholder-icon">📊</div>
        <p>即将支持：订阅列表、自动续费、订阅分析</p>
      </div>
    </div>
  `
}

/**
 * 渲染套餐
 */
function renderPlans() {
  return `
    <div class="tab-content">
      <h3>📦 套餐管理</h3>
      <p style="color: #666; margin-bottom: 16px;">套餐管理功能开发中...</p>
      <div class="feature-placeholder">
        <div class="placeholder-icon">📋</div>
        <p>即将支持：套餐配置、定价管理、功能限制</p>
      </div>
    </div>
  `
}

/**
 * 渲染计费
 */
function renderBilling() {
  return `
    <div class="tab-content">
      <h3>💳 计费管理</h3>
      <p style="color: #666; margin-bottom: 16px;">计费管理功能开发中...</p>
      <div class="feature-placeholder">
        <div class="placeholder-icon">💰</div>
        <p>即将支持：账单生成、支付处理、财务报表</p>
      </div>
    </div>
  `
}

/**
 * 获取状态标签
 */
function getStatusLabel(status) {
  const labels = {
    active: '激活',
    trial: '试用',
    expired: '已过期',
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
    .saas-container {
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
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

    .tab-nav {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 2px solid #e0e0e0;
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
      min-width: 150px;
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
      background: #e3f2fd;
      color: #0d47a1;
    }

    .data-table button:hover {
      background: #4fc3f7;
      color: #fff;
    }

    .plan-badge {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      background: #e3f2fd;
      color: #0d47a1;
    }

    .status-badge {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
    }

    .status-badge.active { background: #e8f5e9; color: #1b5e20; }
    .status-badge.trial { background: #fff3e0; color: #e65100; }
    .status-badge.expired { background: #fce4ec; color: #880e4f; }
    .status-badge.cancelled { background: #f5f5f5; color: #666; }

    .tab-content {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .tab-content h3 {
      margin-top: 0;
    }

    .feature-placeholder {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }

    .placeholder-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

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
  console.log('👁️ SaaS module shown')
  loadTenants()
}

/**
 * 模块隐藏时调用
 */
export function onHide() {
  console.log('🙈 SaaS module hidden')
}

/**
 * 销毁模块
 */
export function destroy() {
  console.log('🗑️ Destroying SaaS module...')
  
  delete window.__saasSwitchTab
  delete window.__saasSearch
  delete window.__saasFilterPlan
  delete window.__saasFilterStatus
  delete window.__saasPage
  delete window.__saasCreateTenant
  delete window.__saasChangePlan

  state.initialized = false
  state.container = null
  state.tenants = []

  console.log('✅ SaaS module destroyed')
}

/**
 * 获取模块API
 */
function getApi() {
  return {
    reload: loadTenants,
    getTenants: () => [...state.tenants],
    getPlans: () => [...state.plans],
    switchTab,
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