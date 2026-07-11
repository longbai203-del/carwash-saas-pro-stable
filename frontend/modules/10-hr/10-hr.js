/**
 * 人力资源管理模块
 * 处理员工、考勤、排班、薪酬等HR操作
 * 
 * @module modules/10-hr
 * 
 * @example
 * import { init, destroy, onShow, onHide } from './10-hr.js'
 */

import { api, endpoints } from '../../src/services/api.js'
import { store } from '../../src/store/index.js'
import { formatDate, formatCurrency, timeAgo } from '../../src/utils/helpers.js'

/**
 * @typedef {Object} Employee
 * @property {string} id - 员工ID
 * @property {string} employee_id - 工号
 * @property {string} user_id - 用户ID
 * @property {string} first_name - 名
 * @property {string} last_name - 姓
 * @property {string} email - 邮箱
 * @property {string} phone - 电话
 * @property {string} department - 部门
 * @property {string} position - 职位
 * @property {string} hire_date - 入职日期
 * @property {number} salary - 薪资
 * @property {string} status - 状态: active, inactive, terminated
 */

/**
 * 模块状态
 */
let state = {
  initialized: false,
  employees: [],
  attendance: [],
  shifts: [],
  selectedEmployee: null,
  isLoading: false,
  activeTab: 'employees',
  filters: {
    department: '',
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
 * 初始化HR模块
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} 模块API
 */
export function init(container) {
  if (state.initialized) {
    console.warn('HR module already initialized')
    return getApi()
  }

  console.log('👤 Initializing HR module...')
  
  state.container = container
  state.initialized = true

  // 加载数据
  loadEmployees()

  console.log('✅ HR module initialized')

  return getApi()
}

/**
 * 加载员工列表
 */
async function loadEmployees() {
  state.isLoading = true
  render()

  try {
    const response = await api.get('/employees', {
      params: {
        page: state.pagination.page,
        limit: state.pagination.limit,
        department: state.filters.department || undefined,
        status: state.filters.status || undefined,
        search: state.filters.search || undefined
      }
    })
    
    if (response?.success) {
      state.employees = response.data || []
      state.pagination.total = response.pagination?.total || 0
    }
  } catch (error) {
    console.error('Failed to load employees:', error)
    showError('加载员工列表失败')
  }

  state.isLoading = false
  render()
}

/**
 * 创建员工
 * @param {Object} data - 员工数据
 */
async function createEmployee(data) {
  state.isLoading = true
  render()

  try {
    const response = await api.post('/employees', data)
    
    if (response?.success) {
      showSuccess('员工创建成功')
      loadEmployees()
    }
  } catch (error) {
    console.error('Create employee failed:', error)
    showError('创建员工失败')
  }

  state.isLoading = false
  render()
}

/**
 * 更新员工
 * @param {string} id - 员工ID
 * @param {Object} data - 员工数据
 */
async function updateEmployee(id, data) {
  state.isLoading = true
  render()

  try {
    const response = await api.put(`/employees/${id}`, data)
    
    if (response?.success) {
      showSuccess('员工信息更新成功')
      loadEmployees()
    }
  } catch (error) {
    console.error('Update employee failed:', error)
    showError('更新员工失败')
  }

  state.isLoading = false
  render()
}

/**
 * 删除员工
 * @param {string} id - 员工ID
 */
async function deleteEmployee(id) {
  if (!confirm('确定要删除该员工吗？')) return

  state.isLoading = true
  render()

  try {
    const response = await api.delete(`/employees/${id}`)
    
    if (response?.success) {
      showSuccess('员工已删除')
      loadEmployees()
    }
  } catch (error) {
    console.error('Delete failed:', error)
    showError('删除失败')
  }

  state.isLoading = false
  render()
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
 * 渲染HR界面
 */
function render() {
  const { container } = state
  if (!container) return

  const tabs = [
    { id: 'employees', label: '👤 员工管理' },
    { id: 'attendance', label: '📋 考勤管理' },
    { id: 'shifts', label: '🔄 排班管理' },
    { id: 'payroll', label: '💰 薪酬管理' }
  ]

  container.innerHTML = `
    <div class="hr-container">
      <!-- 头部 -->
      <div class="module-header">
        <h2>👤 人力资源管理</h2>
        ${state.activeTab === 'employees' ? `
          <button class="btn-primary" onclick="window.__hrCreate()">
            + 添加员工
          </button>
        ` : ''}
      </div>

      <!-- 标签导航 -->
      <div class="tab-nav">
        ${tabs.map(tab => `
          <button class="tab-btn ${state.activeTab === tab.id ? 'active' : ''}"
                  onclick="window.__hrSwitchTab('${tab.id}')">
            ${tab.label}
          </button>
        `).join('')}
      </div>

      <!-- 过滤器 -->
      ${state.activeTab === 'employees' ? `
        <div class="module-filters">
          <input type="text" 
                 placeholder="🔍 搜索姓名/工号/邮箱..."
                 value="${state.filters.search || ''}"
                 oninput="window.__hrSearch(this.value)"
          />
          <select onchange="window.__hrFilterDepartment(this.value)">
            <option value="">全部部门</option>
            <option value="sales" ${state.filters.department === 'sales' ? 'selected' : ''}>销售</option>
            <option value="service" ${state.filters.department === 'service' ? 'selected' : ''}>服务</option>
            <option value="admin" ${state.filters.department === 'admin' ? 'selected' : ''}>行政</option>
            <option value="finance" ${state.filters.department === 'finance' ? 'selected' : ''}>财务</option>
          </select>
          <select onchange="window.__hrFilterStatus(this.value)">
            <option value="">全部状态</option>
            <option value="active" ${state.filters.status === 'active' ? 'selected' : ''}>在职</option>
            <option value="inactive" ${state.filters.status === 'inactive' ? 'selected' : ''}>停用</option>
            <option value="terminated" ${state.filters.status === 'terminated' ? 'selected' : ''}>已离职</option>
          </select>
        </div>
      ` : ''}

      <!-- 内容 -->
      <div class="module-content">
        ${renderContent()}
      </div>

      <!-- 分页 -->
      ${state.activeTab === 'employees' ? `
        <div class="module-pagination">
          <span>共 ${state.pagination.total} 条</span>
          <div class="pagination-controls">
            <button onclick="window.__hrPage(${state.pagination.page - 1})" 
                    ${state.pagination.page <= 1 ? 'disabled' : ''}>
              上一页
            </button>
            <span>第 ${state.pagination.page} / ${Math.ceil(state.pagination.total / state.pagination.limit) || 1} 页</span>
            <button onclick="window.__hrPage(${state.pagination.page + 1})"
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
  window.__hrSwitchTab = switchTab
  window.__hrSearch = (value) => {
    state.filters.search = value
    state.pagination.page = 1
    loadEmployees()
  }
  window.__hrFilterDepartment = (value) => {
    state.filters.department = value
    state.pagination.page = 1
    loadEmployees()
  }
  window.__hrFilterStatus = (value) => {
    state.filters.status = value
    state.pagination.page = 1
    loadEmployees()
  }
  window.__hrPage = (page) => {
    if (page < 1) return
    state.pagination.page = page
    loadEmployees()
  }
  window.__hrCreate = () => {
    const firstName = prompt('请输入名：')
    if (!firstName) return
    const lastName = prompt('请输入姓：')
    if (!lastName) return
    const email = prompt('请输入邮箱：')
    if (!email) return
    const position = prompt('请输入职位：') || ''

    createEmployee({
      first_name: firstName,
      last_name: lastName,
      email,
      position,
      department: 'sales',
      hire_date: new Date().toISOString().split('T')[0],
      salary: parseFloat(prompt('请输入薪资：') || 0) || 0,
      status: 'active'
    })
  }
  window.__hrEdit = (id) => {
    const employee = state.employees.find(e => e.id === id)
    if (!employee) return
    
    const position = prompt('请输入新职位：', employee.position) || employee.position
    const salary = prompt('请输入新薪资：', employee.salary) || employee.salary

    updateEmployee(id, {
      position,
      salary: parseFloat(salary) || 0
    })
  }
  window.__hrDelete = deleteEmployee
}

/**
 * 渲染内容
 */
function renderContent() {
  const { activeTab, employees, isLoading } = state

  if (isLoading) {
    return '<div class="loading-spinner">加载中...</div>'
  }

  switch (activeTab) {
    case 'employees':
      return renderEmployees()
    case 'attendance':
      return renderAttendance()
    case 'shifts':
      return renderShifts()
    case 'payroll':
      return renderPayroll()
    default:
      return '<div class="empty-state">未知标签</div>'
  }
}

/**
 * 渲染员工列表
 */
function renderEmployees() {
  if (state.employees.length === 0) {
    return '<div class="empty-state">暂无员工</div>'
  }

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>工号</th>
          <th>姓名</th>
          <th>职位</th>
          <th>部门</th>
          <th>薪资</th>
          <th>状态</th>
          <th>入职日期</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${state.employees.map(emp => `
          <tr>
            <td>${emp.employee_id || 'N/A'}</td>
            <td>${emp.first_name || ''} ${emp.last_name || ''}</td>
            <td>${emp.position || '-'}</td>
            <td>${emp.department || '-'}</td>
            <td>${formatCurrency(emp.salary || 0)}</td>
            <td><span class="status-badge ${emp.status}">${getStatusLabel(emp.status)}</span></td>
            <td>${emp.hire_date ? formatDate(emp.hire_date, 'YYYY-MM-DD') : '-'}</td>
            <td>
              <button onclick="window.__hrEdit('${emp.id}')">编辑</button>
              <button onclick="window.__hrDelete('${emp.id}')" class="btn-danger">删除</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

/**
 * 渲染考勤
 */
function renderAttendance() {
  return `
    <div class="tab-content">
      <h3>📋 考勤管理</h3>
      <p style="color: #666; margin-bottom: 16px;">考勤功能开发中...</p>
      <div class="feature-placeholder">
        <div class="placeholder-icon">⏰</div>
        <p>即将支持：打卡记录、考勤统计、请假审批</p>
      </div>
    </div>
  `
}

/**
 * 渲染排班
 */
function renderShifts() {
  return `
    <div class="tab-content">
      <h3>🔄 排班管理</h3>
      <p style="color: #666; margin-bottom: 16px;">排班功能开发中...</p>
      <div class="feature-placeholder">
        <div class="placeholder-icon">📅</div>
        <p>即将支持：排班表、轮班管理、换班申请</p>
      </div>
    </div>
  `
}

/**
 * 渲染薪酬
 */
function renderPayroll() {
  return `
    <div class="tab-content">
      <h3>💰 薪酬管理</h3>
      <p style="color: #666; margin-bottom: 16px;">薪酬功能开发中...</p>
      <div class="feature-placeholder">
        <div class="placeholder-icon">💵</div>
        <p>即将支持：工资计算、薪酬发放、报表生成</p>
      </div>
    </div>
  `
}

/**
 * 获取状态标签
 */
function getStatusLabel(status) {
  const labels = {
    active: '在职',
    inactive: '停用',
    terminated: '已离职'
  }
  return labels[status] || status
}

/**
 * 应用样式
 */
function applyStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .hr-container {
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
      margin-right: 4px;
    }

    .data-table button:not(.btn-danger) {
      background: #e3f2fd;
      color: #0d47a1;
    }

    .status-badge {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
    }

    .status-badge.active { background: #e8f5e9; color: #1b5e20; }
    .status-badge.inactive { background: #fff3e0; color: #e65100; }
    .status-badge.terminated { background: #fce4ec; color: #880e4f; }

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
  console.log('👁️ HR module shown')
  loadEmployees()
}

/**
 * 模块隐藏时调用
 */
export function onHide() {
  console.log('🙈 HR module hidden')
}

/**
 * 销毁模块
 */
export function destroy() {
  console.log('🗑️ Destroying HR module...')
  
  delete window.__hrSwitchTab
  delete window.__hrSearch
  delete window.__hrFilterDepartment
  delete window.__hrFilterStatus
  delete window.__hrPage
  delete window.__hrCreate
  delete window.__hrEdit
  delete window.__hrDelete

  state.initialized = false
  state.container = null
  state.employees = []

  console.log('✅ HR module destroyed')
}

/**
 * 获取模块API
 */
function getApi() {
  return {
    reload: loadEmployees,
    getEmployees: () => [...state.employees],
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