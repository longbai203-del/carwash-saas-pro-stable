/**
 * CRM 客户关系管理模块
 * 集成在 AI 模块中
 * 
 * @module modules/15-ai/crm
 * 
 * @example
 * import { init, destroy } from './crm.js'
 */

import { api } from '../../../src/services/api.js';
import { formatDate, formatCurrency, timeAgo } from '../../../src/utils/helpers.js';

/**
 * 模块状态
 */
let state = {
  initialized: false,
  customers: [],
  selectedCustomer: null,
  isLoading: false,
  view: 'list', // list | detail | edit
  filters: {
    tier: '',
    search: '',
    status: ''
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  }
};

/**
 * 初始化 CRM 模块
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} 模块API
 */
export function init(container) {
  if (state.initialized) {
    console.warn('CRM module already initialized');
    return getApi();
  }

  console.log('📋 Initializing CRM module...');
  
  state.container = container;
  state.initialized = true;

  // 加载数据
  loadCustomers();

  console.log('✅ CRM module initialized');

  return getApi();
}

/**
 * 加载客户列表
 */
async function loadCustomers() {
  state.isLoading = true;
  render();

  try {
    const response = await api.get('/customers', {
      params: {
        page: state.pagination.page,
        limit: state.pagination.limit,
        tier: state.filters.tier || undefined,
        search: state.filters.search || undefined,
        status: state.filters.status || undefined
      }
    });
    
    if (response?.success) {
      state.customers = response.data || [];
      state.pagination.total = response.pagination?.total || 0;
    }
  } catch (error) {
    console.error('Failed to load customers:', error);
    showError('加载客户列表失败');
  }

  state.isLoading = false;
  render();
}

/**
 * 选择客户
 * @param {string} id - 客户ID
 */
function selectCustomer(id) {
  const customer = state.customers.find(c => c.id === id);
  if (customer) {
    state.selectedCustomer = customer;
    state.view = 'detail';
    render();
  }
}

/**
 * 返回列表
 */
function backToList() {
  state.view = 'list';
  state.selectedCustomer = null;
  render();
}

/**
 * 渲染 CRM 界面
 */
function render() {
  const { container } = state;
  if (!container) return;

  if (state.view === 'detail' && state.selectedCustomer) {
    renderDetail();
  } else {
    renderList();
  }

  applyStyles();
}

/**
 * 渲染列表视图
 */
function renderList() {
  const { container, customers, isLoading, pagination, filters } = state;

  const tiers = [
    { value: '', label: '全部等级' },
    { value: 'bronze', label: '青铜' },
    { value: 'silver', label: '银牌' },
    { value: 'gold', label: '金牌' },
    { value: 'platinum', label: '铂金' }
  ];

  const statuses = [
    { value: '', label: '全部状态' },
    { value: 'active', label: '活跃' },
    { value: 'inactive', label: '非活跃' }
  ];

  container.innerHTML = `
    <div class="crm-container">
      <!-- 头部 -->
      <div class="crm-header">
        <h2>👥 客户关系管理 (CRM)</h2>
        <button class="btn-primary" onclick="window.__crmAddCustomer()">
          + 添加客户
        </button>
      </div>

      <!-- 统计 -->
      <div class="crm-stats">
        <div class="stat-card">
          <span class="stat-icon">👥</span>
          <div>
            <div class="stat-number">${pagination.total}</div>
            <div class="stat-label">总客户</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">⭐</span>
          <div>
            <div class="stat-number">${customers.filter(c => c.tier === 'platinum').length}</div>
            <div class="stat-label">铂金客户</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">💰</span>
          <div>
            <div class="stat-number">${formatCurrency(customers.reduce((sum, c) => sum + (c.total_spent || 0), 0))}</div>
            <div class="stat-label">总消费</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🔄</span>
          <div>
            <div class="stat-number">${customers.filter(c => c.is_active !== false).length}</div>
            <div class="stat-label">活跃客户</div>
          </div>
        </div>
      </div>

      <!-- 搜索和过滤 -->
      <div class="crm-filters">
        <input type="text" 
               placeholder="🔍 搜索客户名称/邮箱/电话..."
               value="${filters.search || ''}"
               oninput="window.__crmSearch(this.value)" />
        <select onchange="window.__crmFilterTier(this.value)">
          ${tiers.map(t => `
            <option value="${t.value}" ${filters.tier === t.value ? 'selected' : ''}>
              ${t.label}
            </option>
          `).join('')}
        </select>
        <select onchange="window.__crmFilterStatus(this.value)">
          ${statuses.map(s => `
            <option value="${s.value}" ${filters.status === s.value ? 'selected' : ''}>
              ${s.label}
            </option>
          `).join('')}
        </select>
        <button class="btn-refresh" onclick="window.__crmRefresh()">🔄</button>
      </div>

      <!-- 客户列表 -->
      <div class="crm-list">
        ${isLoading ? `
          <div class="loading-state">加载中...</div>
        ` : customers.length === 0 ? `
          <div class="empty-state">暂无客户</div>
        ` : customers.map(customer => `
          <div class="customer-item" onclick="window.__crmSelectCustomer('${customer.id}')">
            <div class="customer-avatar ${customer.tier || 'bronze'}">
              ${(customer.first_name || '').charAt(0)}${(customer.last_name || '').charAt(0)}
            </div>
            <div class="customer-info">
              <div class="customer-name">
                ${customer.first_name || ''} ${customer.last_name || ''}
                <span class="customer-tier ${customer.tier || 'bronze'}">${customer.tier || 'bronze'}</span>
              </div>
              <div class="customer-contact">
                <span>📧 ${customer.email || '无邮箱'}</span>
                <span>📱 ${customer.phone || '无电话'}</span>
              </div>
            </div>
            <div class="customer-metrics">
              <div class="metric">
                <span class="metric-value">${formatCurrency(customer.total_spent || 0)}</span>
                <span class="metric-label">总消费</span>
              </div>
              <div class="metric">
                <span class="metric-value">${customer.total_visits || 0}</span>
                <span class="metric-label">访问次数</span>
              </div>
              <div class="metric">
                <span class="metric-value">${customer.loyalty_points || 0}</span>
                <span class="metric-label">积分</span>
              </div>
            </div>
            <div class="customer-status ${customer.is_active !== false ? 'active' : 'inactive'}">
              ${customer.is_active !== false ? '● 活跃' : '● 非活跃'}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- 分页 -->
      <div class="crm-pagination">
        <button onclick="window.__crmPage(${pagination.page - 1})" 
                ${pagination.page <= 1 ? 'disabled' : ''}>
          上一页
        </button>
        <span>第 ${pagination.page} / ${Math.ceil(pagination.total / pagination.limit) || 1} 页</span>
        <button onclick="window.__crmPage(${pagination.page + 1})"
                ${pagination.page >= Math.ceil(pagination.total / pagination.limit) ? 'disabled' : ''}>
          下一页
        </button>
      </div>
    </div>
  `;

  // 暴露全局方法
  window.__crmSearch = (value) => {
    state.filters.search = value;
    state.pagination.page = 1;
    loadCustomers();
  };
  window.__crmFilterTier = (value) => {
    state.filters.tier = value;
    state.pagination.page = 1;
    loadCustomers();
  };
  window.__crmFilterStatus = (value) => {
    state.filters.status = value;
    state.pagination.page = 1;
    loadCustomers();
  };
  window.__crmRefresh = loadCustomers;
  window.__crmPage = (page) => {
    if (page < 1) return;
    state.pagination.page = page;
    loadCustomers();
  };
  window.__crmSelectCustomer = selectCustomer;
  window.__crmAddCustomer = () => {
    alert('添加客户功能开发中...');
  };
}

/**
 * 渲染详情视图
 */
function renderDetail() {
  const { container, selectedCustomer } = state;
  if (!selectedCustomer) return;

  const customer = selectedCustomer;

  container.innerHTML = `
    <div class="crm-detail">
      <div class="detail-header">
        <button class="btn-back" onclick="window.__crmBackToList()">← 返回列表</button>
        <div class="detail-actions">
          <button class="btn-edit" onclick="window.__crmEditCustomer('${customer.id}')">✏️ 编辑</button>
          <button class="btn-delete" onclick="window.__crmDeleteCustomer('${customer.id}')">🗑️ 删除</button>
        </div>
      </div>

      <div class="detail-profile">
        <div class="profile-avatar ${customer.tier || 'bronze'}">
          ${(customer.first_name || '').charAt(0)}${(customer.last_name || '').charAt(0)}
        </div>
        <div class="profile-info">
          <h2>${customer.first_name || ''} ${customer.last_name || ''}</h2>
          <div class="profile-contact">
            <span>📧 ${customer.email || '无邮箱'}</span>
            <span>📱 ${customer.phone || '无电话'}</span>
          </div>
          <div class="profile-meta">
            <span class="tier-badge ${customer.tier || 'bronze'}">${customer.tier || 'bronze'}</span>
            <span>积分: ${customer.loyalty_points || 0}</span>
            <span>总消费: ${formatCurrency(customer.total_spent || 0)}</span>
            <span>访问: ${customer.total_visits || 0} 次</span>
          </div>
        </div>
      </div>

      <div class="detail-body">
        <div class="detail-section">
          <h3>📋 基本信息</h3>
          <div class="info-grid">
            <div><span class="label">姓名</span><span>${customer.first_name || ''} ${customer.last_name || ''}</span></div>
            <div><span class="label">邮箱</span><span>${customer.email || '未设置'}</span></div>
            <div><span class="label">电话</span><span>${customer.phone || '未设置'}</span></div>
            <div><span class="label">地址</span><span>${customer.address || '未设置'}</span></div>
            <div><span class="label">城市</span><span>${customer.city || '未设置'}</span></div>
            <div><span class="label">状态</span><span class="status-badge ${customer.is_active !== false ? 'active' : 'inactive'}">
              ${customer.is_active !== false ? '活跃' : '非活跃'}
            </span></div>
          </div>
        </div>

        <div class="detail-section">
          <h3>📊 统计数据</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">${formatCurrency(customer.total_spent || 0)}</span>
              <span class="stat-label">总消费</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${customer.total_visits || 0}</span>
              <span class="stat-label">总访问</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${customer.loyalty_points || 0}</span>
              <span class="stat-label">忠诚度积分</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${customer.last_visit_at ? timeAgo(customer.last_visit_at) : '从未访问'}</span>
              <span class="stat-label">最后访问</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>📝 备注</h3>
          <p>${customer.notes || '暂无备注'}</p>
        </div>
      </div>
    </div>
  `;

  // 暴露全局方法
  window.__crmBackToList = backToList;
  window.__crmEditCustomer = (id) => {
    alert(`编辑客户 ${id} 功能开发中...`);
  };
  window.__crmDeleteCustomer = (id) => {
    if (confirm('确定要删除该客户吗？')) {
      alert(`删除客户 ${id} 功能开发中...`);
    }
  };
}

/**
 * 应用样式
 */
function applyStyles() {
  const styleId = 'crm-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .crm-container { padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .crm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .crm-header h2 { margin: 0; font-size: 24px; }
    .crm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .stat-card { background: #fff; border-radius: 12px; padding: 16px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); display: flex; align-items: center; gap: 16px; }
    .stat-card .stat-icon { font-size: 28px; }
    .stat-card .stat-number { font-size: 24px; font-weight: 700; color: #1a1a2e; }
    .stat-card .stat-label { font-size: 13px; color: #888; }
    .crm-filters { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .crm-filters input { flex: 1; min-width: 150px; padding: 10px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; outline: none; }
    .crm-filters input:focus { border-color: #4fc3f7; }
    .crm-filters select { padding: 10px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; background: #fff; }
    .btn-refresh { padding: 10px 16px; border: 2px solid #e0e0e0; border-radius: 8px; background: #fff; cursor: pointer; font-size: 16px; }
    .btn-refresh:hover { background: #f5f5f5; }
    .crm-list { display: flex; flex-direction: column; gap: 12px; }
    .customer-item { display: flex; align-items: center; padding: 16px 20px; background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; cursor: pointer; transition: all 0.2s; gap: 16px; }
    .customer-item:hover { border-color: #4fc3f7; box-shadow: 0 4px 12px rgba(0,0,0,0.06); transform: translateY(-2px); }
    .customer-avatar { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; color: #fff; flex-shrink: 0; }
    .customer-avatar.bronze { background: #FDE68A; color: #92400E; }
    .customer-avatar.silver { background: #E5E7EB; color: #374151; }
    .customer-avatar.gold { background: #FCD34D; color: #78350F; }
    .customer-avatar.platinum { background: #A5B4FC; color: #312E81; }
    .customer-info { flex: 1; min-width: 0; }
    .customer-name { font-weight: 600; font-size: 16px; color: #1a1a2e; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .customer-tier { font-size: 11px; padding: 2px 10px; border-radius: 9999px; font-weight: 500; text-transform: uppercase; }
    .customer-tier.bronze { background: #FDE68A; color: #92400E; }
    .customer-tier.silver { background: #E5E7EB; color: #374151; }
    .customer-tier.gold { background: #FCD34D; color: #78350F; }
    .customer-tier.platinum { background: #A5B4FC; color: #312E81; }
    .customer-contact { font-size: 13px; color: #888; display: flex; gap: 16px; flex-wrap: wrap; }
    .customer-metrics { display: flex; gap: 24px; }
    .metric { text-align: center; }
    .metric .metric-value { font-size: 16px; font-weight: 600; color: #1a1a2e; display: block; }
    .metric .metric-label { font-size: 11px; color: #888; }
    .customer-status { font-size: 12px; padding: 4px 12px; border-radius: 9999px; font-weight: 500; }
    .customer-status.active { background: #E8F5E9; color: #1B5E20; }
    .customer-status.inactive { background: #F5F5F5; color: #757575; }
    .crm-pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 20px; padding: 16px 0; }
    .crm-pagination button { padding: 8px 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff; cursor: pointer; }
    .crm-pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
    .crm-pagination button:hover:not(:disabled) { background: #f5f5f5; }
    .loading-state, .empty-state { text-align: center; padding: 40px; color: #999; }
    .btn-primary { padding: 10px 24px; background: #4fc3f7; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
    .btn-primary:hover { background: #0288d1; }
    .crm-detail { padding: 20px; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .btn-back { background: none; border: none; color: #4fc3f7; cursor: pointer; font-size: 14px; padding: 8px 0; }
    .btn-back:hover { text-decoration: underline; }
    .detail-actions { display: flex; gap: 8px; }
    .btn-edit { padding: 8px 16px; background: #E3F2FD; color: #0D47A1; border: none; border-radius: 6px; cursor: pointer; }
    .btn-delete { padding: 8px 16px; background: #FCE4EC; color: #C62828; border: none; border-radius: 6px; cursor: pointer; }
    .detail-profile { display: flex; gap: 24px; padding: 24px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 24px; flex-wrap: wrap; }
    .profile-avatar { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 600; color: #fff; flex-shrink: 0; }
    .profile-avatar.bronze { background: #FDE68A; color: #92400E; }
    .profile-avatar.silver { background: #E5E7EB; color: #374151; }
    .profile-avatar.gold { background: #FCD34D; color: #78350F; }
    .profile-avatar.platinum { background: #A5B4FC; color: #312E81; }
    .profile-info h2 { margin: 0 0 4px 0; font-size: 24px; }
    .profile-contact { display: flex; gap: 16px; color: #666; flex-wrap: wrap; }
    .profile-meta { display: flex; gap: 16px; margin-top: 8px; flex-wrap: wrap; align-items: center; }
    .tier-badge { padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; text-transform: uppercase; }
    .tier-badge.bronze { background: #FDE68A; color: #92400E; }
    .tier-badge.silver { background: #E5E7EB; color: #374151; }
    .tier-badge.gold { background: #FCD34D; color: #78350F; }
    .tier-badge.platinum { background: #A5B4FC; color: #312E81; }
    .detail-body { display: flex; flex-direction: column; gap: 24px; }
    .detail-section { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .detail-section h3 { margin: 0 0 16px 0; font-size: 16px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-grid .label { color: #888; font-size: 13px; display: block; }
    .info-grid span { font-size: 15px; }
    .status-badge.active { color: #1B5E20; }
    .status-badge.inactive { color: #757575; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .stat-item { text-align: center; }
    .stat-item .stat-value { font-size: 24px; font-weight: 700; color: #1a1a2e; display: block; }
    .stat-item .stat-label { font-size: 13px; color: #888; }
    @media (max-width: 768px) {
      .crm-stats { grid-template-columns: repeat(2, 1fr); }
      .customer-metrics { display: none; }
      .info-grid { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .crm-filters { flex-direction: column; }
      .detail-profile { flex-direction: column; align-items: center; text-align: center; }
      .profile-meta { justify-content: center; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * 显示错误
 */
function showError(message) {
  alert('❌ ' + message);
}

/**
 * 模块显示时调用
 */
export function onShow() {
  console.log('👁️ CRM module shown');
  loadCustomers();
}

/**
 * 模块隐藏时调用
 */
export function onHide() {
  console.log('🙈 CRM module hidden');
}

/**
 * 销毁模块
 */
export function destroy() {
  console.log('🗑️ Destroying CRM module...');
  
  delete window.__crmSearch;
  delete window.__crmFilterTier;
  delete window.__crmFilterStatus;
  delete window.__crmRefresh;
  delete window.__crmPage;
  delete window.__crmSelectCustomer;
  delete window.__crmAddCustomer;
  delete window.__crmBackToList;
  delete window.__crmEditCustomer;
  delete window.__crmDeleteCustomer;

  const style = document.getElementById('crm-styles');
  if (style) style.remove();

  state.initialized = false;
  state.container = null;
  state.customers = [];

  console.log('✅ CRM module destroyed');
}

/**
 * 获取模块API
 */
function getApi() {
  return {
    reload: loadCustomers,
    getCustomers: () => [...state.customers],
    onShow,
    onHide,
    destroy
  };
}

export default {
  init,
  destroy,
  onShow,
  onHide
};