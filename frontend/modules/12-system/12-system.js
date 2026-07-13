/**
 * 系统管理模块
 * 处理系统设置、用户管理、权限、日志等系统操作
 * 
 * @module modules/12-system
 * 
 * @example
 * import { init, destroy, onShow, onHide } from './12-system.js'
 */

import { api } from '../../src/services/api.js'
import { store } from '../../src/store/index.js'
import { formatDate, timeAgo } from '../../src/utils/helpers.js'

/**
 * 模块状态
 */
let state = {
  initialized: false,
  users: [],
  roles: [],
  logs: [],
  isLoading: false,
  activeTab: 'users',
  filters: {
    role: '',
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
 * 初始化系统模块
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} 模块API
 */
export function init(container) {
  if (state.initialized) {
    console.warn('System module already initialized')
    return getApi()
  }

  console.log('⚙️ Initializing System module...')
  
  state.container = container
  state.initialized = true

  // 加载数据
  loadUsers()

  console.log('✅ System module initialized')

  return getApi()
}

/**
 * 加载用户列表
 */
async function loadUsers() {
  state.isLoading = true
  render()

  try {
    const response = await api.get('/users', {
      params: {
        page: state.pagination.page,
        limit: state.pagination.limit,
        role: state.filters.role || undefined,
        status: state.filters.status || undefined,
        search: state.filters.search || undefined
      }
    })
    
    if (response?.success) {
      state.users = response.data || []
      state.pagination.total = response.pagination?.total || 0
    }
  } catch (error) {
    console.error('Failed to load users:', error)
    showError('加载用户列表失败')
  }

  state.isLoading = false
  render()
}

/**
 * 切换标签
 */
function switchTab(tab) {
  state.activeTab = tab
  if (tab === 'logs') loadLogs()
  render()
}

/**
 * 加载日志
 */
async function loadLogs() {
  try {
    const response = await api.get('/system/logs', {
      params: { limit: 50 }
    })
    
    if (response?.success) {
      state.logs = response.data || []
    }
  } catch (error) {
    console.error('Failed to load logs:', error)
  }
}

/**
 * 渲染系统界面
 */
function render() {
  const { container } = state
  if (!container) return

  const tabs = [
    { id: 'users', label: '👤 用户管理' },
    { id: 'roles', label: '🔐 角色权限' },
    { id: 'settings', label: '⚙️ 系统设置' },
    { id: 'logs', label: '📋 审计日志' }
  ]

  container.innerHTML = `
    <div class="system-container">
      <!-- 头部 -->
      <div class="module-header">
        <h2>⚙️ 系统管理</h2>
      </div>

      <!-- 标签导航 -->
      <div class="tab-nav">
        ${tabs.map(tab => `
          <button class="tab-btn ${state.activeTab === tab.id ? 'active' : ''}"
                  onclick="window.__systemSwitchTab('${tab.id}')">
            ${tab.label}
          </button>
        `).join('')}
      </div>

      <!-- 过滤器 -->
      ${state.activeTab === 'users' ? `
        <div class="module-filters">
          <input type="text" 
                 placeholder="🔍 搜索用户..."
                 value="${state.filters.search || ''}"
                 oninput="window.__systemSearch(this.value)"
          />
          <select onchange="window.__systemFilterRole(this.value)">
            <option value="">全部角色</option>
            <option value="admin" ${state.filters.role === 'admin' ? 'selected' : ''}>管理员</option>
            <option value="manager" ${state.filters.role === 'manager' ? 'selected' : ''}>经理</option>
            <option value="staff" ${state.filters.role === 'staff' ? 'selected' : ''}>员工</option>
          </select>
          <select onchange="window.__systemFilterStatus(this.value)">
            <option value="">全部状态</option>
            <option value="active" ${state.filters.status === 'active' ? 'selected' : ''}>激活</option>
            <option value="inactive" ${state.filters.status === 'inactive' ? 'selected' : ''}>停用</option>
          </select>
        </div>
      ` : ''}

      <!-- 内容 -->
      <div class="module-content">
        ${renderContent()}
      </div>

      <!-- 分页 -->
      ${state.activeTab === 'users' ? `
        <div class="module-pagination">
          <span>共 ${state.pagination.total} 条</span>
          <div class="pagination-controls">
            <button onclick="window.__systemPage(${state.pagination.page - 1})" 
                    ${state.pagination.page <= 1 ? 'disabled' : ''}>
              上一页
            </button>
            <span>第 ${state.pagination.page} / ${Math.ceil(state.pagination.total / state.pagination.limit) || 1} 页</span>
            <button onclick="window.__systemPage(${state.pagination.page + 1})"
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
  window.__systemSwitchTab = switchTab
  window.__systemSearch = (value) => {
    state.filters.search = value
    state.pagination.page = 1
    loadUsers()
  }
  window.__systemFilterRole = (value) => {
    state.filters.role = value
    state.pagination.page = 1
    loadUsers()
  }
  window.__systemFilterStatus = (value) => {
    state.filters.status = value
    state.pagination.page = 1
    loadUsers()
  }
  window.__systemPage = (page) => {
    if (page < 1) return
    state.pagination.page = page
    loadUsers()
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
    case 'users':
      return renderUsers()
    case 'roles':
      return renderRoles()
    case 'settings':
      return renderSettings()
    case 'logs':
      return renderLogs()
    default:
      return '<div class="empty-state">未知标签</div>'
  }
}

/**
 * 渲染用户列表
 */
function renderUsers() {
  if (state.users.length === 0) {
    return '<div class="empty-state">暂无用户</div>'
  }

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>用户</th>
          <th>邮箱</th>
          <th>角色</th>
          <th>状态</th>
          <th>最后登录</th>
          <th>创建时间</th>
        </tr>
      </thead>
      <tbody>
        ${state.users.map(user => `
          <tr>
            <td>${user.first_name || ''} ${user.last_name || ''}</td>
            <td>${user.email}</td>
            <td><span class="role-badge">${user.role || 'staff'}</span></td>
            <td><span class="status-badge ${user.is_active ? 'active' : 'inactive'}">
              ${user.is_active ? '激活' : '停用'}
            </span></td>
            <td>${user.last_login_at ? timeAgo(user.last_login_at) : '-'}</td>
            <td>${formatDate(user.created_at)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

/**
 * 渲染角色
 */
function renderRoles() {
  return `
    <div class="tab-content">
      <h3>🔐 角色权限管理</h3>
      <p style="color: #666; margin-bottom: 16px;">角色权限管理功能开发中...</p>
      <div class="feature-placeholder">
        <div class="placeholder-icon">🔑</div>
        <p>即将支持：角色创建、权限分配、权限矩阵</p>
      </div>
    </div>
  `
}

/**
 * 渲染设置
 */
function renderSettings() {
  return `
    <div class="tab-content">
      <h3>⚙️ 系统设置</h3>
      <p style="color: #666; margin-bottom: 16px;">系统设置功能开发中...</p>
      <div class="feature-placeholder">
        <div class="placeholder-icon">🛠️</div>
        <p>即将支持：系统配置、邮件设置、API配置</p>
      </div>
    </div>
  `
}

/**
 * 渲染日志
 */
function renderLogs() {
  if (state.logs.length === 0) {
    return '<div class="empty-state">暂无日志</div>'
  }

  return `
    <div class="log-container">
      ${state.logs.map(log => `
        <div class="log-item ${log.level || 'info'}">
          <div class="log-time">${formatDate(log.created_at)}</div>
          <div class="log-level">${log.level || 'INFO'}</div>
          <div class="log-message">${log.message}</div>
          <div class="log-user">${log.user_id || 'system'}</div>
        </div>
      `).join('')}
    </div>
  `
}

/**
 * 应用样式
 */
function applyStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .system-container {
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

    .role-badge {
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
    .status-badge.inactive { background: #fce4ec; color: #880e4f; }

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

    .log-container {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      max-height: 500px;
      overflow-y: auto;
    }

    .log-item {
      display: flex;
      gap: 16px;
      padding: 8px 0;
      border-bottom: 1px solid #f5f5f5;
      font-size: 13px;
      font-family: monospace;
    }

    .log-item:last-child {
      border-bottom: none;
    }

    .log-time {
      color: #666;
      min-width: 160px;
    }

    .log-level {
      padding: 0 8px;
      border-radius: 4px;
      font-weight: 600;
      min-width: 50px;
      text-align: center;
    }

    .log-item.info .log-level { color: #0d47a1; }
    .log-item.warning .log-level { color: #e65100; }
    .log-item.error .log-level { color: #c62828; }
    .log-item.debug .log-level { color: #666; }

    .log-message {
      flex: 1;
      color: #1a1a2e;
    }

    .log-user {
      color: #999;
      min-width: 80px;
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
  console.log('👁️ System module shown')
  loadUsers()
}

/**
 * 模块隐藏时调用
 */
export function onHide() {
  console.log('🙈 System module hidden')
}

/**
 * 销毁模块
 */
export function destroy() {
  console.log('🗑️ Destroying System module...')
  
  delete window.__systemSwitchTab
  delete window.__systemSearch
  delete window.__systemFilterRole
  delete window.__systemFilterStatus
  delete window.__systemPage

  state.initialized = false
  state.container = null
  state.users = []
  state.logs = []

  console.log('✅ System module destroyed')
}

/**
 * 获取模块API
 */
function getApi() {
  return {
    reload: loadUsers,
    getUsers: () => [...state.users],
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