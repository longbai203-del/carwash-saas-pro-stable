/**
 * 设置中心模块
 * 管理系统配置、用户偏好、公司信息等设置
 * 
 * @module modules/14-settings
 * 
 * @example
 * import { init, destroy, onShow, onHide } from './14-settings.js'
 */

import { api } from '../../src/services/api.js'
import { store } from '../../src/store/index.js'
import { formatDate } from '../../src/utils/helpers.js'

/**
 * @typedef {Object} Settings
 * @property {Object} company - 公司信息
 * @property {Object} preferences - 用户偏好
 * @property {Object} notifications - 通知设置
 * @property {Object} security - 安全设置
 * @property {Object} integrations - 集成设置
 */

/**
 * 模块状态
 */
let state = {
  initialized: false,
  isLoading: false,
  activeTab: 'company',
  settings: {
    company: {
      name: '',
      logo: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      timezone: 'UTC',
      currency: 'USD'
    },
    preferences: {
      language: 'zh-CN',
      theme: 'light',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm'
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
      orderUpdates: true,
      marketing: false
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: 'medium'
    },
    integrations: {
      stripe: false,
      slack: false,
      zapier: false
    }
  },
  originalSettings: {}
}

/**
 * 初始化设置模块
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} 模块API
 */
export function init(container) {
  if (state.initialized) {
    console.warn('Settings module already initialized')
    return getApi()
  }

  console.log('⚙️ Initializing Settings module...')
  
  state.container = container
  state.initialized = true

  // 加载设置
  loadSettings()

  console.log('✅ Settings module initialized')

  return getApi()
}

/**
 * 加载设置
 */
async function loadSettings() {
  state.isLoading = true
  render()

  try {
    const response = await api.get('/settings')
    
    if (response?.success) {
      state.settings = { ...state.settings, ...response.data }
      state.originalSettings = JSON.parse(JSON.stringify(state.settings))
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
    showError('加载设置失败')
  }

  state.isLoading = false
  render()
}

/**
 * 保存设置
 */
async function saveSettings() {
  state.isLoading = true
  render()

  try {
    const response = await api.put('/settings', state.settings)
    
    if (response?.success) {
      state.originalSettings = JSON.parse(JSON.stringify(state.settings))
      showSuccess('设置已保存')
    }
  } catch (error) {
    console.error('Failed to save settings:', error)
    showError('保存设置失败')
  }

  state.isLoading = false
  render()
}

/**
 * 重置设置
 */
function resetSettings() {
  if (!confirm('确定要重置所有设置吗？')) return
  
  state.settings = JSON.parse(JSON.stringify(state.originalSettings))
  render()
  showSuccess('设置已重置')
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
 * 更新设置字段
 * @param {string} category - 设置类别
 * @param {string} key - 字段名
 * @param {*} value - 字段值
 */
function updateSetting(category, key, value) {
  if (state.settings[category]) {
    state.settings[category][key] = value
    render()
  }
}

/**
 * 渲染设置界面
 */
function render() {
  const { container } = state
  if (!container) return

  const tabs = [
    { id: 'company', label: '🏢 公司信息' },
    { id: 'preferences', label: '🎨 偏好设置' },
    { id: 'notifications', label: '🔔 通知设置' },
    { id: 'security', label: '🔐 安全设置' },
    { id: 'integrations', label: '🔗 集成设置' }
  ]

  container.innerHTML = `
    <div class="settings-container">
      <!-- 头部 -->
      <div class="module-header">
        <h2>⚙️ 设置中心</h2>
        <div class="header-actions">
          <button class="btn-secondary" onclick="window.__settingsReset()">
            🔄 重置
          </button>
          <button class="btn-primary" onclick="window.__settingsSave()">
            💾 保存设置
          </button>
        </div>
      </div>

      <!-- 标签导航 -->
      <div class="tab-nav">
        ${tabs.map(tab => `
          <button class="tab-btn ${state.activeTab === tab.id ? 'active' : ''}"
                  onclick="window.__settingsSwitchTab('${tab.id}')">
            ${tab.label}
          </button>
        `).join('')}
      </div>

      <!-- 内容 -->
      <div class="module-content">
        ${state.isLoading ? `
          <div class="loading-spinner">加载中...</div>
        ` : `
          ${renderContent()}
        `}
      </div>
    </div>
  `

  applyStyles()

  // 暴露全局方法
  window.__settingsSwitchTab = switchTab
  window.__settingsSave = saveSettings
  window.__settingsReset = resetSettings
  window.__settingsUpdate = updateSetting
}

/**
 * 渲染内容
 */
function renderContent() {
  const { activeTab } = state

  switch (activeTab) {
    case 'company':
      return renderCompany()
    case 'preferences':
      return renderPreferences()
    case 'notifications':
      return renderNotifications()
    case 'security':
      return renderSecurity()
    case 'integrations':
      return renderIntegrations()
    default:
      return '<div class="empty-state">未知标签</div>'
  }
}

/**
 * 渲染公司信息
 */
function renderCompany() {
  const { company } = state.settings

  return `
    <div class="settings-form">
      <h3>🏢 公司信息</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>公司名称</label>
          <input type="text" value="${company.name || ''}" 
                 onchange="window.__settingsUpdate('company', 'name', this.value)"
          />
        </div>
        <div class="form-group">
          <label>Logo URL</label>
          <input type="text" value="${company.logo || ''}" 
                 onchange="window.__settingsUpdate('company', 'logo', this.value)"
                 placeholder="https://example.com/logo.png"
          />
        </div>
        <div class="form-group">
          <label>地址</label>
          <input type="text" value="${company.address || ''}" 
                 onchange="window.__settingsUpdate('company', 'address', this.value)"
          />
        </div>
        <div class="form-group">
          <label>电话</label>
          <input type="text" value="${company.phone || ''}" 
                 onchange="window.__settingsUpdate('company', 'phone', this.value)"
          />
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input type="email" value="${company.email || ''}" 
                 onchange="window.__settingsUpdate('company', 'email', this.value)"
          />
        </div>
        <div class="form-group">
          <label>网站</label>
          <input type="text" value="${company.website || ''}" 
                 onchange="window.__settingsUpdate('company', 'website', this.value)"
                 placeholder="https://example.com"
          />
        </div>
        <div class="form-group">
          <label>时区</label>
          <select onchange="window.__settingsUpdate('company', 'timezone', this.value)">
            <option value="UTC" ${company.timezone === 'UTC' ? 'selected' : ''}>UTC</option>
            <option value="America/New_York" ${company.timezone === 'America/New_York' ? 'selected' : ''}>美东时间</option>
            <option value="America/Los_Angeles" ${company.timezone === 'America/Los_Angeles' ? 'selected' : ''}>美西时间</option>
            <option value="Europe/London" ${company.timezone === 'Europe/London' ? 'selected' : ''}>伦敦时间</option>
            <option value="Asia/Shanghai" ${company.timezone === 'Asia/Shanghai' ? 'selected' : ''}>北京时间</option>
            <option value="Asia/Tokyo" ${company.timezone === 'Asia/Tokyo' ? 'selected' : ''}>东京时间</option>
          </select>
        </div>
        <div class="form-group">
          <label>货币</label>
          <select onchange="window.__settingsUpdate('company', 'currency', this.value)">
            <option value="USD" ${company.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
            <option value="EUR" ${company.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
            <option value="GBP" ${company.currency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
            <option value="JPY" ${company.currency === 'JPY' ? 'selected' : ''}>JPY (¥)</option>
            <option value="CNY" ${company.currency === 'CNY' ? 'selected' : ''}>CNY (¥)</option>
          </select>
        </div>
      </div>
    </div>
  `
}

/**
 * 渲染偏好设置
 */
function renderPreferences() {
  const { preferences } = state.settings

  return `
    <div class="settings-form">
      <h3>🎨 偏好设置</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>语言</label>
          <select onchange="window.__settingsUpdate('preferences', 'language', this.value)">
            <option value="zh-CN" ${preferences.language === 'zh-CN' ? 'selected' : ''}>简体中文</option>
            <option value="zh-TW" ${preferences.language === 'zh-TW' ? 'selected' : ''}>繁体中文</option>
            <option value="en-US" ${preferences.language === 'en-US' ? 'selected' : ''}>English</option>
            <option value="ja-JP" ${preferences.language === 'ja-JP' ? 'selected' : ''}>日本語</option>
          </select>
        </div>
        <div class="form-group">
          <label>主题</label>
          <select onchange="window.__settingsUpdate('preferences', 'theme', this.value)">
            <option value="light" ${preferences.theme === 'light' ? 'selected' : ''}>浅色</option>
            <option value="dark" ${preferences.theme === 'dark' ? 'selected' : ''}>深色</option>
            <option value="auto" ${preferences.theme === 'auto' ? 'selected' : ''}>跟随系统</option>
          </select>
        </div>
        <div class="form-group">
          <label>日期格式</label>
          <select onchange="window.__settingsUpdate('preferences', 'dateFormat', this.value)">
            <option value="YYYY-MM-DD" ${preferences.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
            <option value="MM/DD/YYYY" ${preferences.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
            <option value="DD/MM/YYYY" ${preferences.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
          </select>
        </div>
        <div class="form-group">
          <label>时间格式</label>
          <select onchange="window.__settingsUpdate('preferences', 'timeFormat', this.value)">
            <option value="HH:mm" ${preferences.timeFormat === 'HH:mm' ? 'selected' : ''}>24小时</option>
            <option value="hh:mm A" ${preferences.timeFormat === 'hh:mm A' ? 'selected' : ''}>12小时</option>
          </select>
        </div>
      </div>
    </div>
  `
}

/**
 * 渲染通知设置
 */
function renderNotifications() {
  const { notifications } = state.settings

  return `
    <div class="settings-form">
      <h3>🔔 通知设置</h3>
      <div class="toggle-grid">
        <div class="toggle-item">
          <label>邮件通知</label>
          <div class="toggle-switch">
            <input type="checkbox" ${notifications.email ? 'checked' : ''}
                   onchange="window.__settingsUpdate('notifications', 'email', this.checked)"
            />
            <span class="toggle-slider"></span>
          </div>
        </div>
        <div class="toggle-item">
          <label>推送通知</label>
          <div class="toggle-switch">
            <input type="checkbox" ${notifications.push ? 'checked' : ''}
                   onchange="window.__settingsUpdate('notifications', 'push', this.checked)"
            />
            <span class="toggle-slider"></span>
          </div>
        </div>
        <div class="toggle-item">
          <label>短信通知</label>
          <div class="toggle-switch">
            <input type="checkbox" ${notifications.sms ? 'checked' : ''}
                   onchange="window.__settingsUpdate('notifications', 'sms', this.checked)"
            />
            <span class="toggle-slider"></span>
          </div>
        </div>
        <div class="toggle-item">
          <label>订单更新</label>
          <div class="toggle-switch">
            <input type="checkbox" ${notifications.orderUpdates ? 'checked' : ''}
                   onchange="window.__settingsUpdate('notifications', 'orderUpdates', this.checked)"
            />
            <span class="toggle-slider"></span>
          </div>
        </div>
        <div class="toggle-item">
          <label>营销消息</label>
          <div class="toggle-switch">
            <input type="checkbox" ${notifications.marketing ? 'checked' : ''}
                   onchange="window.__settingsUpdate('notifications', 'marketing', this.checked)"
            />
            <span class="toggle-slider"></span>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * 渲染安全设置
 */
function renderSecurity() {
  const { security } = state.settings

  return `
    <div class="settings-form">
      <h3>🔐 安全设置</h3>
      <div class="toggle-grid">
        <div class="toggle-item">
          <label>两步验证</label>
          <div class="toggle-switch">
            <input type="checkbox" ${security.twoFactorAuth ? 'checked' : ''}
                   onchange="window.__settingsUpdate('security', 'twoFactorAuth', this.checked)"
            />
            <span class="toggle-slider"></span>
          </div>
        </div>
        <div class="form-group">
          <label>会话超时 (分钟)</label>
          <input type="number" value="${security.sessionTimeout || 30}" min="5" max="120"
                 onchange="window.__settingsUpdate('security', 'sessionTimeout', parseInt(this.value) || 30)"
          />
        </div>
        <div class="form-group">
          <label>密码策略</label>
          <select onchange="window.__settingsUpdate('security', 'passwordPolicy', this.value)">
            <option value="low" ${security.passwordPolicy === 'low' ? 'selected' : ''}>低</option>
            <option value="medium" ${security.passwordPolicy === 'medium' ? 'selected' : ''}>中</option>
            <option value="high" ${security.passwordPolicy === 'high' ? 'selected' : ''}>高</option>
          </select>
        </div>
      </div>
      <div style="margin-top: 16px;">
        <button class="btn-secondary" onclick="alert('密码修改功能开发中...')">
          🔑 修改密码
        </button>
      </div>
    </div>
  `
}

/**
 * 渲染集成设置
 */
function renderIntegrations() {
  const { integrations } = state.settings

  return `
    <div class="settings-form">
      <h3>🔗 集成设置</h3>
      <div class="toggle-grid">
        <div class="toggle-item">
          <label>Stripe 支付</label>
          <div class="toggle-switch">
            <input type="checkbox" ${integrations.stripe ? 'checked' : ''}
                   onchange="window.__settingsUpdate('integrations', 'stripe', this.checked)"
            />
            <span class="toggle-slider"></span>
          </div>
        </div>
        <div class="toggle-item">
          <label>Slack 通知</label>
          <div class="toggle-switch">
            <input type="checkbox" ${integrations.slack ? 'checked' : ''}
                   onchange="window.__settingsUpdate('integrations', 'slack', this.checked)"
            />
            <span class="toggle-slider"></span>
          </div>
        </div>
        <div class="toggle-item">
          <label>Zapier 自动化</label>
          <div class="toggle-switch">
            <input type="checkbox" ${integrations.zapier ? 'checked' : ''}
                   onchange="window.__settingsUpdate('integrations', 'zapier', this.checked)"
            />
            <span class="toggle-slider"></span>
          </div>
        </div>
      </div>
      <div style="margin-top: 16px;">
        <button class="btn-secondary" onclick="alert('集成配置功能开发中...')">
          ⚙️ 配置集成
        </button>
      </div>
    </div>
  `
}

/**
 * 应用样式
 */
function applyStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .settings-container {
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

    .header-actions {
      display: flex;
      gap: 8px;
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

    .btn-secondary {
      padding: 8px 20px;
      background: #f5f5f5;
      color: #1a1a2e;
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
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

    .settings-form {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .settings-form h3 {
      margin: 0 0 20px 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-group label {
      font-size: 13px;
      font-weight: 500;
      color: #333;
    }

    .form-group input,
    .form-group select {
      padding: 8px 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.3s;
    }

    .form-group input:focus,
    .form-group select:focus {
      border-color: #4fc3f7;
    }

    .toggle-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .toggle-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #fafafa;
      border-radius: 8px;
    }

    .toggle-item label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      cursor: pointer;
    }

    .toggle-switch {
      position: relative;
      width: 44px;
      height: 24px;
      flex-shrink: 0;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #ccc;
      border-radius: 12px;
      transition: 0.3s;
    }

    .toggle-slider:before {
      content: '';
      position: absolute;
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background: #fff;
      border-radius: 50%;
      transition: 0.3s;
    }

    .toggle-switch input:checked + .toggle-slider {
      background: #4fc3f7;
    }

    .toggle-switch input:checked + .toggle-slider:before {
      transform: translateX(20px);
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
      
      .header-actions {
        justify-content: stretch;
      }
      
      .header-actions button {
        flex: 1;
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
  console.log('👁️ Settings module shown')
  loadSettings()
}

/**
 * 模块隐藏时调用
 */
export function onHide() {
  console.log('🙈 Settings module hidden')
}

/**
 * 销毁模块
 */
export function destroy() {
  console.log('🗑️ Destroying Settings module...')
  
  delete window.__settingsSwitchTab
  delete window.__settingsSave
  delete window.__settingsReset
  delete window.__settingsUpdate

  state.initialized = false
  state.container = null

  console.log('✅ Settings module destroyed')
}

/**
 * 获取模块API
 */
function getApi() {
  return {
    reload: loadSettings,
    getSettings: () => ({ ...state.settings }),
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