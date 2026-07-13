/**
 * 财务管理模块
 * 处理收入、支出、账单、报表等财务操作
 * 
 * @module modules/09-finance
 * 
 * @example
 * import { init, destroy, onShow, onHide } from './09-finance.js'
 */

import { api, endpoints } from '../../src/services/api.js'
import { store } from '../../src/store/index.js'
import { formatDate, formatCurrency, timeAgo } from '../../src/utils/helpers.js'

/**
 * @typedef {Object} Transaction
 * @property {string} id - 交易ID
 * @property {string} transaction_number - 交易编号
 * @property {string} type - 类型: income, expense
 * @property {string} category - 类别
 * @property {number} amount - 金额
 * @property {string} description - 描述
 * @property {string} payment_method - 支付方式
 * @property {string} status - 状态: pending, completed, cancelled
 * @property {string} created_at - 创建时间
 */

/**
 * 模块状态
 */
let state = {
  initialized: false,
  transactions: [],
  stats: {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    pendingCount: 0
  },
  isLoading: false,
  filters: {
    type: '',
    category: '',
    date_from: '',
    date_to: '',
    search: ''
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  }
}

/**
 * 初始化财务模块
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} 模块API
 */
export function init(container) {
  if (state.initialized) {
    console.warn('Finance module already initialized')
    return getApi()
  }

  console.log('💰 Initializing Finance module...')
  
  state.container = container
  state.initialized = true

  // 加载数据
  loadStats()
  loadTransactions()

  console.log('✅ Finance module initialized')

  return getApi()
}

/**
 * 加载财务统计
 */
async function loadStats() {
  try {
    const response = await api.get('/finance/stats')
    
    if (response?.success) {
      state.stats = response.data || state.stats
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

/**
 * 加载交易记录
 */
async function loadTransactions() {
  state.isLoading = true
  render()

  try {
    const response = await api.get('/finance/transactions', {
      params: {
        page: state.pagination.page,
        limit: state.pagination.limit,
        type: state.filters.type || undefined,
        category: state.filters.category || undefined,
        date_from: state.filters.date_from || undefined,
        date_to: state.filters.date_to || undefined,
        search: state.filters.search || undefined
      }
    })
    
    if (response?.success) {
      state.transactions = response.data || []
      state.pagination.total = response.pagination?.total || 0
    }
  } catch (error) {
    console.error('Failed to load transactions:', error)
    showError('加载交易记录失败')
  }

  state.isLoading = false
  render()
}

/**
 * 创建交易记录
 * @param {Object} data - 交易数据
 */
async function createTransaction(data) {
  state.isLoading = true
  render()

  try {
    const response = await api.post('/finance/transactions', data)
    
    if (response?.success) {
      showSuccess('交易记录创建成功')
      loadStats()
      loadTransactions()
    }
  } catch (error) {
    console.error('Create transaction failed:', error)
    showError('创建交易记录失败')
  }

  state.isLoading = false
  render()
}

/**
 * 删除交易记录
 * @param {string} id - 交易ID
 */
async function deleteTransaction(id) {
  if (!confirm('确定要删除该交易记录吗？')) return

  state.isLoading = true
  render()

  try {
    const response = await api.delete(`/finance/transactions/${id}`)
    
    if (response?.success) {
      showSuccess('交易记录已删除')
      loadStats()
      loadTransactions()
    }
  } catch (error) {
    console.error('Delete failed:', error)
    showError('删除失败')
  }

  state.isLoading = false
  render()
}

/**
 * 渲染财务界面
 */
function render() {
  const { container } = state
  if (!container) return

  const { totalIncome, totalExpense, balance, pendingCount } = state.stats

  container.innerHTML = `
    <div class="finance-container">
      <!-- 头部 -->
      <div class="module-header">
        <h2>💰 财务管理</h2>
        <button class="btn-primary" onclick="window.__financeCreate()">
          + 新增交易
        </button>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card income">
          <div class="stat-label">总收入</div>
          <div class="stat-value">${formatCurrency(totalIncome)}</div>
        </div>
        <div class="stat-card expense">
          <div class="stat-label">总支出</div>
          <div class="stat-value">${formatCurrency(totalExpense)}</div>
        </div>
        <div class="stat-card balance ${balance >= 0 ? 'positive' : 'negative'}">
          <div class="stat-label">净余额</div>
          <div class="stat-value">${formatCurrency(balance)}</div>
        </div>
        <div class="stat-card pending">
          <div class="stat-label">待处理</div>
          <div class="stat-value">${pendingCount}</div>
        </div>
      </div>

      <!-- 过滤器 -->
      <div class="module-filters">
        <input type="text" 
               placeholder="🔍 搜索..."
               value="${state.filters.search || ''}"
               oninput="window.__financeSearch(this.value)"
        />
        <select onchange="window.__financeFilterType(this.value)">
          <option value="">全部类型</option>
          <option value="income" ${state.filters.type === 'income' ? 'selected' : ''}>收入</option>
          <option value="expense" ${state.filters.type === 'expense' ? 'selected' : ''}>支出</option>
        </select>
        <input type="date" 
               value="${state.filters.date_from || ''}"
               onchange="window.__financeFilterDateFrom(this.value)"
        />
        <input type="date" 
               value="${state.filters.date_to || ''}"
               onchange="window.__financeFilterDateTo(this.value)"
        />
      </div>

      <!-- 交易列表 -->
      <div class="module-content">
        ${state.isLoading ? `
          <div class="loading-spinner">加载中...</div>
        ` : state.transactions.length === 0 ? `
          <div class="empty-state">暂无交易记录</div>
        ` : `
          <table class="data-table">
            <thead>
              <tr>
                <th>交易编号</th>
                <th>类型</th>
                <th>类别</th>
                <th>金额</th>
                <th>描述</th>
                <th>支付方式</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${state.transactions.map(tx => `
                <tr>
                  <td><strong>#${tx.transaction_number}</strong></td>
                  <td><span class="type-badge ${tx.type}">${tx.type === 'income' ? '收入' : '支出'}</span></td>
                  <td>${tx.category || '-'}</td>
                  <td class="${tx.type === 'income' ? 'text-positive' : 'text-negative'}">
                    ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
                  </td>
                  <td>${tx.description || '-'}</td>
                  <td>${tx.payment_method || '-'}</td>
                  <td><span class="status-badge ${tx.status}">${tx.status}</span></td>
                  <td>${timeAgo(tx.created_at)}</td>
                  <td>
                    <button onclick="window.__financeDelete('${tx.id}')" class="btn-danger">删除</button>
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
          <button onclick="window.__financePage(${state.pagination.page - 1})" 
                  ${state.pagination.page <= 1 ? 'disabled' : ''}>
            上一页
          </button>
          <span>第 ${state.pagination.page} / ${Math.ceil(state.pagination.total / state.pagination.limit) || 1} 页</span>
          <button onclick="window.__financePage(${state.pagination.page + 1})"
                  ${state.pagination.page >= Math.ceil(state.pagination.total / state.pagination.limit) ? 'disabled' : ''}>
            下一页
          </button>
        </div>
      </div>
    </div>
  `

  applyStyles()

  // 暴露全局方法
  window.__financeSearch = (value) => {
    state.filters.search = value
    state.pagination.page = 1
    loadTransactions()
  }
  window.__financeFilterType = (value) => {
    state.filters.type = value
    state.pagination.page = 1
    loadTransactions()
  }
  window.__financeFilterDateFrom = (value) => {
    state.filters.date_from = value
    state.pagination.page = 1
    loadTransactions()
  }
  window.__financeFilterDateTo = (value) => {
    state.filters.date_to = value
    state.pagination.page = 1
    loadTransactions()
  }
  window.__financePage = (page) => {
    if (page < 1) return
    state.pagination.page = page
    loadTransactions()
  }
  window.__financeCreate = () => {
    const type = confirm('点击"确定"为收入，取消为支出') ? 'income' : 'expense'
    const amount = prompt('请输入金额：')
    if (!amount) return
    const description = prompt('请输入描述：') || ''
    const category = prompt('请输入类别：') || ''

    createTransaction({
      type,
      amount: parseFloat(amount),
      description,
      category,
      payment_method: 'cash',
      status: 'completed'
    })
  }
  window.__financeDelete = deleteTransaction
}

/**
 * 应用样式
 */
function applyStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .finance-container {
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
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

    .stat-card.income .stat-value { color: #2e7d32; }
    .stat-card.expense .stat-value { color: #d32f2f; }
    .stat-card.balance.positive .stat-value { color: #2e7d32; }
    .stat-card.balance.negative .stat-value { color: #d32f2f; }

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

    .module-filters input[type="text"] {
      flex: 1;
      min-width: 150px;
    }

    .module-filters input[type="date"] {
      width: 150px;
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
    }

    .type-badge {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
    }

    .type-badge.income { background: #e8f5e9; color: #1b5e20; }
    .type-badge.expense { background: #fce4ec; color: #880e4f; }

    .text-positive { color: #2e7d32; font-weight: 600; }
    .text-negative { color: #d32f2f; font-weight: 600; }

    .status-badge {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
    }

    .status-badge.pending { background: #fff3e0; color: #e65100; }
    .status-badge.completed { background: #e8f5e9; color: #1b5e20; }
    .status-badge.cancelled { background: #fce4ec; color: #880e4f; }

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
  console.log('👁️ Finance module shown')
  loadStats()
  loadTransactions()
}

/**
 * 模块隐藏时调用
 */
export function onHide() {
  console.log('🙈 Finance module hidden')
}

/**
 * 销毁模块
 */
export function destroy() {
  console.log('🗑️ Destroying Finance module...')
  
  delete window.__financeSearch
  delete window.__financeFilterType
  delete window.__financeFilterDateFrom
  delete window.__financeFilterDateTo
  delete window.__financePage
  delete window.__financeCreate
  delete window.__financeDelete

  state.initialized = false
  state.container = null
  state.transactions = []

  console.log('✅ Finance module destroyed')
}

/**
 * 获取模块API
 */
function getApi() {
  return {
    reload: loadTransactions,
    getTransactions: () => [...state.transactions],
    getStats: () => ({ ...state.stats }),
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