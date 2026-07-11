/**
 * AI智能分析模块
 * 提供AI驱动的业务预测、智能推荐、异常检测等功能
 * 
 * @module modules/15-ai
 * 
 * @example
 * import { init, destroy, onShow, onHide } from './15-ai.js'
 */

import { api } from '../../src/services/api.js'
import { store } from '../../src/store/index.js'
import { formatDate, formatCurrency, timeAgo } from '../../src/utils/helpers.js'

/**
 * @typedef {Object} AIData
 * @property {Object} predictions - 预测数据
 * @property {Object} recommendations - 推荐数据
 * @property {Object} anomalies - 异常检测
 * @property {Object} insights - 洞察分析
 */

/**
 * 模块状态
 */
let state = {
  initialized: false,
  isLoading: false,
  activeTab: 'dashboard',
  data: {
    predictions: null,
    recommendations: null,
    anomalies: null,
    insights: null,
    chatHistory: []
  },
  isProcessing: false
}

/**
 * 初始化AI模块
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} 模块API
 */
export function init(container) {
  if (state.initialized) {
    console.warn('AI module already initialized')
    return getApi()
  }

  console.log('🧠 Initializing AI module...')
  
  state.container = container
  state.initialized = true

  // 加载数据
  loadAIData()

  console.log('✅ AI module initialized')

  return getApi()
}

/**
 * 加载AI数据
 */
async function loadAIData() {
  state.isLoading = true
  render()

  try {
    const [predictions, recommendations, anomalies, insights] = await Promise.all([
      api.get('/ai/predictions'),
      api.get('/ai/recommendations'),
      api.get('/ai/anomalies'),
      api.get('/ai/insights')
    ])

    state.data.predictions = predictions?.success ? predictions.data : null
    state.data.recommendations = recommendations?.success ? recommendations.data : null
    state.data.anomalies = anomalies?.success ? anomalies.data : null
    state.data.insights = insights?.success ? insights.data : null

  } catch (error) {
    console.error('Failed to load AI data:', error)
    showError('加载AI数据失败')
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
 * 发送聊天消息
 */
function sendMessage() {
  const input = document.getElementById('ai-chat-input')
  if (!input || !input.value.trim()) return

  const message = input.value.trim()
  input.value = ''

  // 添加用户消息
  state.data.chatHistory.push({
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  })

  state.isProcessing = true
  render()

  // 模拟AI响应
  setTimeout(() => {
    const responses = [
      '根据数据分析，我建议您重点关注最近的销售趋势。',
      '我注意到您的库存周转率有所提升，这是个好现象！',
      '基于历史数据，预测下周订单量将增长15%。',
      '检测到客户满意度评分上升，继续保持！',
      '建议您考虑增加热门商品库存，以满足预期需求。'
    ]
    
    state.data.chatHistory.push({
      role: 'assistant',
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date().toISOString()
    })

    state.isProcessing = false
    render()
  }, 1000)
}

/**
 * 渲染AI界面
 */
function render() {
  const { container } = state
  if (!container) return

  const tabs = [
    { id: 'dashboard', label: '📊 AI概览' },
    { id: 'predictions', label: '🔮 预测分析' },
    { id: 'recommendations', label: '💡 智能推荐' },
    { id: 'anomalies', label: '⚠️ 异常检测' },
    { id: 'chat', label: '💬 AI助手' }
  ]

  container.innerHTML = `
    <div class="ai-container">
      <!-- 头部 -->
      <div class="module-header">
        <h2>🧠 AI智能分析</h2>
        <button class="btn-primary" onclick="window.__aiRefresh()">
          🔄 刷新数据
        </button>
      </div>

      <!-- 标签导航 -->
      <div class="tab-nav">
        ${tabs.map(tab => `
          <button class="tab-btn ${state.activeTab === tab.id ? 'active' : ''}"
                  onclick="window.__aiSwitchTab('${tab.id}')">
            ${tab.label}
          </button>
        `).join('')}
      </div>

      <!-- 内容 -->
      <div class="module-content">
        ${state.isLoading ? `
          <div class="loading-spinner">AI正在分析数据...</div>
        ` : `
          ${renderContent()}
        `}
      </div>
    </div>
  `

  applyStyles()

  // 暴露全局方法
  window.__aiSwitchTab = switchTab
  window.__aiRefresh = loadAIData
  window.__aiSendMessage = sendMessage
}

/**
 * 渲染内容
 */
function renderContent() {
  const { activeTab } = state

  switch (activeTab) {
    case 'dashboard':
      return renderDashboard()
    case 'predictions':
      return renderPredictions()
    case 'recommendations':
      return renderRecommendations()
    case 'anomalies':
      return renderAnomalies()
    case 'chat':
      return renderChat()
    default:
      return '<div class="empty-state">未知标签</div>'
  }
}

/**
 * 渲染AI概览
 */
function renderDashboard() {
  const { predictions, recommendations, anomalies, insights } = state.data

  return `
    <div class="ai-dashboard">
      <!-- 关键指标 -->
      <div class="ai-stats-grid">
        <div class="ai-stat-card">
          <div class="ai-stat-icon">🔮</div>
          <div class="ai-stat-content">
            <div class="ai-stat-label">预测准确性</div>
            <div class="ai-stat-value">${predictions?.accuracy || 92}%</div>
            <div class="ai-stat-detail">基于${predictions?.sampleSize || 1000}条数据</div>
          </div>
        </div>
        <div class="ai-stat-card">
          <div class="ai-stat-icon">💡</div>
          <div class="ai-stat-content">
            <div class="ai-stat-label">智能推荐</div>
            <div class="ai-stat-value">${recommendations?.total || 5}</div>
            <div class="ai-stat-detail">${recommendations?.new || 2}条新推荐</div>
          </div>
        </div>
        <div class="ai-stat-card">
          <div class="ai-stat-icon">⚠️</div>
          <div class="ai-stat-content">
            <div class="ai-stat-label">异常检测</div>
            <div class="ai-stat-value">${anomalies?.count || 0}</div>
            <div class="ai-stat-detail ${(anomalies?.count || 0) > 0 ? 'warning' : ''}">
              ${(anomalies?.count || 0) > 0 ? '需要关注' : '一切正常'}
            </div>
          </div>
        </div>
        <div class="ai-stat-card">
          <div class="ai-stat-icon">📊</div>
          <div class="ai-stat-content">
            <div class="ai-stat-label">洞察分析</div>
            <div class="ai-stat-value">${insights?.total || 8}</div>
            <div class="ai-stat-detail">${insights?.new || 3}条新洞察</div>
          </div>
        </div>
      </div>

      <!-- 洞察列表 -->
      <div class="ai-insights">
        <h3>📊 关键洞察</h3>
        <div class="insight-list">
          ${insights?.items?.map(insight => `
            <div class="insight-item">
              <div class="insight-icon">${insight.icon || '📌'}</div>
              <div class="insight-content">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-description">${insight.description}</div>
                <div class="insight-meta">
                  <span class="insight-confidence">置信度: ${insight.confidence || 85}%</span>
                  <span class="insight-time">${timeAgo(insight.created_at)}</span>
                </div>
              </div>
            </div>
          `).join('') || '<div class="empty-state">暂无洞察</div>'}
        </div>
      </div>
    </div>
  `
}

/**
 * 渲染预测分析
 */
function renderPredictions() {
  const { predictions } = state.data

  return `
    <div class="ai-tab-content">
      <h3>🔮 预测分析</h3>
      <div class="prediction-grid">
        <div class="prediction-card">
          <div class="prediction-label">📈 销售预测</div>
          <div class="prediction-value">${formatCurrency(predictions?.sales || 0)}</div>
          <div class="prediction-change ${(predictions?.salesChange || 0) >= 0 ? 'positive' : 'negative'}">
            ${(predictions?.salesChange || 0) >= 0 ? '↑' : '↓'} ${Math.abs(predictions?.salesChange || 0)}%
          </div>
          <div class="prediction-period">预测周期: ${predictions?.period || '30天'}</div>
        </div>
        <div class="prediction-card">
          <div class="prediction-label">📋 订单预测</div>
          <div class="prediction-value">${predictions?.orders || 0}</div>
          <div class="prediction-change ${(predictions?.ordersChange || 0) >= 0 ? 'positive' : 'negative'}">
            ${(predictions?.ordersChange || 0) >= 0 ? '↑' : '↓'} ${Math.abs(predictions?.ordersChange || 0)}%
          </div>
          <div class="prediction-period">预测周期: ${predictions?.period || '30天'}</div>
        </div>
        <div class="prediction-card">
          <div class="prediction-label">👤 客户预测</div>
          <div class="prediction-value">${predictions?.customers || 0}</div>
          <div class="prediction-change positive">+${predictions?.newCustomers || 0} 新增</div>
          <div class="prediction-period">预测周期: ${predictions?.period || '30天'}</div>
        </div>
      </div>
      <div class="feature-placeholder">
        <div class="placeholder-icon">📊</div>
        <p>详细预测报表功能开发中...</p>
        <p style="font-size: 12px; color: #999;">即将支持：趋势预测、季节性分析、预测模型</p>
      </div>
    </div>
  `
}

/**
 * 渲染智能推荐
 */
function renderRecommendations() {
  const { recommendations } = state.data

  return `
    <div class="ai-tab-content">
      <h3>💡 智能推荐</h3>
      <div class="recommendation-list">
        ${recommendations?.items?.map(rec => `
          <div class="recommendation-item">
            <div class="rec-icon">${rec.icon || '💡'}</div>
            <div class="rec-content">
              <div class="rec-title">${rec.title}</div>
              <div class="rec-description">${rec.description}</div>
              <div class="rec-meta">
                <span class="rec-impact">预期影响: ${rec.impact || '中'}</span>
                <span class="rec-confidence">置信度: ${rec.confidence || 80}%</span>
              </div>
              <button class="btn-action" onclick="alert('应用推荐: ${rec.title}')">
                应用推荐
              </button>
            </div>
          </div>
        `).join('') || '<div class="empty-state">暂无推荐</div>'}
      </div>
    </div>
  `
}

/**
 * 渲染异常检测
 */
function renderAnomalies() {
  const { anomalies } = state.data

  return `
    <div class="ai-tab-content">
      <h3>⚠️ 异常检测</h3>
      <div class="anomaly-list">
        ${anomalies?.items?.map(anomaly => `
          <div class="anomaly-item ${anomaly.severity || 'medium'}">
            <div class="anomaly-icon">
              ${anomaly.severity === 'high' ? '🔴' : anomaly.severity === 'medium' ? '🟡' : '🟢'}
            </div>
            <div class="anomaly-content">
              <div class="anomaly-title">${anomaly.title}</div>
              <div class="anomaly-description">${anomaly.description}</div>
              <div class="anomaly-meta">
                <span class="anomaly-severity severity-${anomaly.severity || 'medium'}">
                  ${anomaly.severity || '中'}
                </span>
                <span class="anomaly-time">${timeAgo(anomaly.detected_at)}</span>
              </div>
            </div>
          </div>
        `).join('') || '<div class="empty-state">✅ 未检测到异常</div>'}
      </div>
    </div>
  `
}

/**
 * 渲染AI助手聊天
 */
function renderChat() {
  const { chatHistory, isProcessing } = state

  return `
    <div class="ai-tab-content chat-container">
      <h3>💬 AI助手</h3>
      <div class="chat-messages" id="ai-chat-messages">
        ${chatHistory.length === 0 ? `
          <div class="chat-empty">
            <div class="chat-empty-icon">🤖</div>
            <p>我是您的AI助手，可以帮您分析数据、提供建议</p>
            <p style="font-size: 12px; color: #999;">试试问我关于销售、库存或客户的问题</p>
          </div>
        ` : chatHistory.map(msg => `
          <div class="chat-message ${msg.role}">
            <div class="chat-avatar">${msg.role === 'user' ? '👤' : '🤖'}</div>
            <div class="chat-bubble">
              <div class="chat-content">${msg.content}</div>
              <div class="chat-time">${formatDate(msg.timestamp)}</div>
            </div>
          </div>
        `).join('')}
        ${isProcessing ? `
          <div class="chat-message assistant">
            <div class="chat-avatar">🤖</div>
            <div class="chat-bubble">
              <div class="chat-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
      <div class="chat-input-container">
        <input type="text" id="ai-chat-input" 
               placeholder="输入您的问题..."
               onkeydown="if(event.key === 'Enter') window.__aiSendMessage()"
        />
        <button class="btn-primary" onclick="window.__aiSendMessage()">
          📤 发送
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
    .ai-container {
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

    .btn-action {
      padding: 4px 16px;
      background: #e3f2fd;
      color: #0d47a1;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-top: 8px;
    }

    .btn-action:hover {
      background: #4fc3f7;
      color: #fff;
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

    .ai-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .ai-stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .ai-stat-icon {
      font-size: 28px;
    }

    .ai-stat-content {
      flex: 1;
    }

    .ai-stat-label {
      font-size: 13px;
      color: #888;
    }

    .ai-stat-value {
      font-size: 22px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .ai-stat-detail {
      font-size: 12px;
      color: #666;
    }

    .ai-stat-detail.warning {
      color: #f57c00;
    }

    .ai-insights {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .ai-insights h3 {
      margin: 0 0 16px 0;
    }

    .insight-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .insight-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #fafafa;
      border-radius: 8px;
      border-left: 3px solid #4fc3f7;
    }

    .insight-icon {
      font-size: 20px;
    }

    .insight-content {
      flex: 1;
    }

    .insight-title {
      font-weight: 500;
      color: #1a1a2e;
    }

    .insight-description {
      font-size: 14px;
      color: #666;
      margin: 4px 0;
    }

    .insight-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #999;
    }

    .insight-confidence {
      color: #4fc3f7;
    }

    .ai-tab-content {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .ai-tab-content h3 {
      margin: 0 0 16px 0;
    }

    .prediction-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .prediction-card {
      text-align: center;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .prediction-label {
      font-size: 13px;
      color: #888;
    }

    .prediction-value {
      font-size: 28px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 8px 0;
    }

    .prediction-change {
      font-size: 14px;
    }

    .prediction-change.positive {
      color: #2e7d32;
    }

    .prediction-change.negative {
      color: #d32f2f;
    }

    .prediction-period {
      font-size: 12px;
      color: #999;
      margin-top: 8px;
    }

    .recommendation-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .recommendation-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #f5f8ff;
      border-radius: 8px;
      border: 1px solid #e3f2fd;
    }

    .rec-icon {
      font-size: 24px;
    }

    .rec-content {
      flex: 1;
    }

    .rec-title {
      font-weight: 500;
      color: #1a1a2e;
    }

    .rec-description {
      font-size: 14px;
      color: #666;
      margin: 4px 0;
    }

    .rec-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #999;
    }

    .rec-impact {
      color: #4fc3f7;
    }

    .rec-confidence {
      color: #66bb6a;
    }

    .anomaly-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .anomaly-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid #4fc3f7;
    }

    .anomaly-item.high {
      background: #fce4ec;
      border-left-color: #d32f2f;
    }

    .anomaly-item.medium {
      background: #fff3e0;
      border-left-color: #f57c00;
    }

    .anomaly-item.low {
      background: #e8f5e9;
      border-left-color: #2e7d32;
    }

    .anomaly-icon {
      font-size: 20px;
    }

    .anomaly-content {
      flex: 1;
    }

    .anomaly-title {
      font-weight: 500;
      color: #1a1a2e;
    }

    .anomaly-description {
      font-size: 14px;
      color: #666;
      margin: 4px 0;
    }

    .anomaly-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
    }

    .anomaly-severity {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 11px;
    }

    .anomaly-severity.severity-high {
      background: #fce4ec;
      color: #c62828;
    }

    .anomaly-severity.severity-medium {
      background: #fff3e0;
      color: #e65100;
    }

    .anomaly-severity.severity-low {
      background: #e8f5e9;
      color: #1b5e20;
    }

    .anomaly-time {
      color: #999;
    }

    .chat-container {
      display: flex;
      flex-direction: column;
      height: 500px;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chat-empty {
      text-align: center;
      padding: 40px;
      color: #999;
    }

    .chat-empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .chat-message {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .chat-message.user {
      flex-direction: row-reverse;
    }

    .chat-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e0e0e0;
      font-size: 16px;
    }

    .chat-message.user .chat-avatar {
      background: #4fc3f7;
    }

    .chat-bubble {
      max-width: 70%;
      padding: 12px 16px;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .chat-message.user .chat-bubble {
      background: #4fc3f7;
      color: #fff;
    }

    .chat-content {
      font-size: 14px;
      line-height: 1.5;
    }

    .chat-time {
      font-size: 10px;
      color: #999;
      margin-top: 4px;
    }

    .chat-message.user .chat-time {
      color: rgba(255,255,255,0.7);
    }

    .chat-typing {
      display: flex;
      gap: 4px;
      padding: 4px 0;
    }

    .chat-typing span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #999;
      animation: typing 1.4s infinite both;
    }

    .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
    .chat-typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    .chat-input-container {
      display: flex;
      gap: 8px;
    }

    .chat-input-container input {
      flex: 1;
      padding: 10px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }

    .chat-input-container input:focus {
      border-color: #4fc3f7;
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
      .ai-stats-grid {
        grid-template-columns: 1fr 1fr;
      }
      
      .prediction-grid {
        grid-template-columns: 1fr;
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
  console.log('👁️ AI module shown')
  loadAIData()
}

/**
 * 模块隐藏时调用
 */
export function onHide() {
  console.log('🙈 AI module hidden')
}

/**
 * 销毁模块
 */
export function destroy() {
  console.log('🗑️ Destroying AI module...')
  
  delete window.__aiSwitchTab
  delete window.__aiRefresh
  delete window.__aiSendMessage

  state.initialized = false
  state.container = null
  state.data.chatHistory = []

  console.log('✅ AI module destroyed')
}

/**
 * 获取模块API
 */
function getApi() {
  return {
    reload: loadAIData,
    getData: () => ({ ...state.data }),
    switchTab,
    sendMessage,
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