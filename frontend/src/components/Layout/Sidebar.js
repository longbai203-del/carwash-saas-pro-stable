/**
 * Sidebar 导航组件
 * 统一管理应用侧边栏导航
 * 
 * @module components/Layout/Sidebar
 * 
 * @example
 * import { sidebar } from './components/Layout/Sidebar.js'
 * sidebar.init()
 */

import { CONFIG } from '../../config/index.js'
import { moduleLoader } from '../../core/ModuleLoader.js'

/**
 * @typedef {Object} MenuItem
 * @property {string} id - 菜单项ID
 * @property {string} name - 显示名称
 * @property {string} path - 路径
 * @property {string} icon - 图标
 * @property {number} order - 排序
 * @property {boolean} enabled - 是否启用
 */

export class UnifiedSidebar {
  /**
   * 创建侧边栏实例
   * @param {Object} options - 配置选项
   * @param {string|HTMLElement} options.container - 容器
   * @param {string} options.currentModule - 当前模块ID
   * @param {Function} options.onNavigate - 导航回调
   */
  constructor(options = {}) {
    /** @type {string|HTMLElement} */
    this.container = options.container || '#sidebar'
    
    /** @type {string|null} */
    this.currentModule = options.currentModule || null
    
    /** @type {Function|null} */
    this.onNavigate = options.onNavigate || null
    
    /** @type {Array<MenuItem>} */
    this.modules = []
    
    /** @type {boolean} */
    this.isCollapsed = false
    
    /** @type {boolean} */
    this.isInitialized = false
    
    // 构建菜单
    this.buildMenu()
  }

  /**
   * 构建菜单
   * @returns {void}
   */
  buildMenu() {
    // 从配置获取模块
    let modules = []
    if (CONFIG.getSortedModules) {
      modules = CONFIG.getSortedModules()
    } else if (CONFIG.getModules) {
      modules = CONFIG.getModules()
    } else if (CONFIG.getAllModules) {
      modules = CONFIG.getAllModules()
    }
    
    this.modules = modules.map(function(module) {
      return {
        id: module.id,
        name: module.name,
        path: module.path || '/' + module.id,
        icon: module.icon || '📄',
        order: module.order || 0,
        enabled: module.enabled !== false
      }
    })

    // 按顺序排序
    this.modules.sort(function(a, b) {
      return a.order - b.order
    })
  }

  /**
   * 初始化侧边栏
   * @returns {UnifiedSidebar} 侧边栏实例
   */
  init() {
    if (this.isInitialized) {
      console.warn('Sidebar already initialized')
      return this
    }

    this.render()
    this.bindEvents()
    this.isInitialized = true
    
    console.log('Sidebar initialized')
    return this
  }

  /**
   * 渲染侧边栏
   * @returns {void}
   */
  render() {
    var containerEl = typeof this.container === 'string' 
      ? document.querySelector(this.container) 
      : this.container

    if (!containerEl) {
      console.warn('Sidebar container not found:', this.container)
      return
    }

    var collapsedClass = this.isCollapsed ? 'collapsed' : ''
    
    var menuItems = this.modules
      .filter(function(m) { return m.enabled !== false })
      .map(function(module) {
        var isActive = this.currentModule === module.id ? 'active' : ''
        return `
          <li class="nav-item ${isActive}" data-module-id="${module.id}">
            <a href="${module.path}" class="nav-link" data-navigate="${module.id}">
              <span class="nav-icon">${module.icon}</span>
              <span class="nav-text">${module.name}</span>
            </a>
          </li>
        `
      }.bind(this)).join('')

    var html = `
      <div class="sidebar-wrapper ${collapsedClass}">
        <!-- 品牌区域 -->
        <div class="sidebar-brand">
          <span class="brand-icon">🚗</span>
          <span class="brand-name">洗车SaaS</span>
          <span class="brand-version">v2.0</span>
          <button class="sidebar-toggle" onclick="window.__sidebarToggle()">
            ${this.isCollapsed ? '→' : '←'}
          </button>
        </div>

        <!-- 导航菜单 -->
        <nav class="sidebar-nav">
          <ul class="nav-list">
            ${menuItems}
          </ul>
        </nav>

        <!-- 底部 -->
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="user-avatar">👤</div>
            <div class="user-info">
              <div class="user-name">管理员</div>
              <div class="user-role">Admin</div>
            </div>
          </div>
          <button class="sidebar-logout" onclick="window.__sidebarLogout()">
            🚪 退出
          </button>
        </div>
      </div>
    `

    containerEl.innerHTML = html
    this.applyStyles()

    // 暴露全局方法
    window.__sidebarToggle = this.toggle.bind(this)
    window.__sidebarLogout = this.logout.bind(this)
  }

  /**
   * 绑定事件
   * @returns {void}
   */
  bindEvents() {
    var containerEl = typeof this.container === 'string' 
      ? document.querySelector(this.container) 
      : this.container

    if (!containerEl) return

    // 使用事件委托处理导航点击
    containerEl.addEventListener('click', function(e) {
      var link = e.target.closest('[data-navigate]')
      if (link) {
        e.preventDefault()
        var moduleId = link.dataset.navigate
        this.navigateTo(moduleId)
      }
    }.bind(this))
  }

  /**
   * 导航到指定模块
   * @param {string} moduleId - 模块ID
   * @param {Object} params - 参数
   * @returns {Promise<void>}
   */
  async navigateTo(moduleId, params) {
    params = params || {}
    var module = this.modules.find(function(m) { return m.id === moduleId })
    if (!module) {
      console.warn('Module not found:', moduleId)
      return
    }

    // 更新当前模块
    this.currentModule = moduleId
    this.setActive(moduleId)

    // 更新URL
    try {
      window.history.pushState({ module: moduleId }, '', module.path)
    } catch (e) {
      // 忽略
    }

    // 触发自定义事件
    var event = new CustomEvent('navigation', {
      detail: {
        moduleId: moduleId,
        path: module.path,
        params: params
      }
    })
    document.dispatchEvent(event)

    // 调用回调
    if (this.onNavigate) {
      this.onNavigate(moduleId, params)
    }

    // 使用 ModuleLoader 加载模块
    try {
      if (moduleLoader && typeof moduleLoader.loadModule === 'function') {
        await moduleLoader.loadModule(moduleId)
        if (typeof moduleLoader.renderModule === 'function') {
          moduleLoader.renderModule(moduleId)
        }
      } else {
        console.warn('ModuleLoader not available, navigation skipped')
      }
    } catch (error) {
      console.error('Failed to load module:', moduleId, error)
    }
  }

  /**
   * 设置激活状态
   * @param {string} moduleId - 模块ID
   * @returns {void}
   */
  setActive(moduleId) {
    var containerEl = typeof this.container === 'string' 
      ? document.querySelector(this.container) 
      : this.container

    if (!containerEl) return

    var items = containerEl.querySelectorAll('.nav-item')
    items.forEach(function(item) {
      var id = item.dataset.moduleId
      if (id === moduleId) {
        item.classList.add('active')
      } else {
        item.classList.remove('active')
      }
    })
  }

  /**
   * 切换侧边栏折叠状态
   * @returns {void}
   */
  toggle() {
    this.isCollapsed = !this.isCollapsed
    var wrapper = document.querySelector('.sidebar-wrapper')
    if (wrapper) {
      if (this.isCollapsed) {
        wrapper.classList.add('collapsed')
      } else {
        wrapper.classList.remove('collapsed')
      }
    }
    localStorage.setItem('sidebar_collapsed', String(this.isCollapsed))
  }

  /**
   * 登出
   * @returns {void}
   */
  logout() {
    if (confirm('确定要退出登录吗？')) {
      document.dispatchEvent(new CustomEvent('logout'))
      window.location.href = '/login'
    }
  }

  /**
   * 应用样式
   * @returns {void}
   */
  applyStyles() {
    var styleId = 'sidebar-styles'
    var style = document.getElementById(styleId)
    
    if (style) {
      style.remove()
    }

    style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .sidebar-wrapper {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: #1a1a2e;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: width 0.3s ease;
        width: 260px;
        overflow: hidden;
        position: sticky;
        top: 0;
        left: 0;
        z-index: 1000;
      }

      .sidebar-wrapper.collapsed {
        width: 70px;
      }

      .sidebar-wrapper.collapsed .brand-name,
      .sidebar-wrapper.collapsed .brand-version,
      .sidebar-wrapper.collapsed .nav-text,
      .sidebar-wrapper.collapsed .user-info,
      .sidebar-wrapper.collapsed .sidebar-logout {
        display: none;
      }

      .sidebar-wrapper.collapsed .sidebar-toggle {
        transform: rotate(180deg);
      }

      .sidebar-brand {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        flex-shrink: 0;
        gap: 10px;
        min-height: 60px;
      }

      .brand-icon {
        font-size: 28px;
        flex-shrink: 0;
      }

      .brand-name {
        font-size: 18px;
        font-weight: 700;
        flex: 1;
        white-space: nowrap;
        color: #fff;
        letter-spacing: 0.5px;
      }

      .brand-version {
        font-size: 10px;
        color: rgba(255,255,255,0.3);
        white-space: nowrap;
        padding: 2px 8px;
        background: rgba(255,255,255,0.05);
        border-radius: 10px;
      }

      .sidebar-toggle {
        background: none;
        border: none;
        color: rgba(255,255,255,0.5);
        cursor: pointer;
        font-size: 16px;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.3s;
        flex-shrink: 0;
      }

      .sidebar-toggle:hover {
        background: rgba(255,255,255,0.1);
        color: #fff;
      }

      .sidebar-nav {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
      }

      .sidebar-nav::-webkit-scrollbar {
        width: 4px;
      }

      .sidebar-nav::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.15);
        border-radius: 4px;
      }

      .nav-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .nav-item {
        margin: 2px 0;
        position: relative;
      }

      .nav-link {
        display: flex;
        align-items: center;
        padding: 10px 20px;
        color: rgba(255,255,255,0.55);
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
        gap: 12px;
        font-size: 14px;
        border-radius: 0;
        position: relative;
        min-height: 44px;
      }

      .nav-link:hover {
        background: rgba(255,255,255,0.06);
        color: #fff;
      }

      .nav-item.active .nav-link {
        background: rgba(79, 195, 247, 0.12);
        color: #4fc3f7;
      }

      .nav-item.active .nav-link::before {
        content: '';
        position: absolute;
        left: 0;
        top: 8px;
        bottom: 8px;
        width: 3px;
        background: #4fc3f7;
        border-radius: 0 4px 4px 0;
      }

      .nav-icon {
        font-size: 18px;
        width: 28px;
        text-align: center;
        flex-shrink: 0;
      }

      .nav-text {
        flex: 1;
        white-space: nowrap;
        font-weight: 400;
      }

      .sidebar-footer {
        border-top: 1px solid rgba(255,255,255,0.08);
        padding: 12px 16px;
        flex-shrink: 0;
      }

      .sidebar-user {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-radius: 8px;
        cursor: pointer;
      }

      .sidebar-user:hover {
        background: rgba(255,255,255,0.05);
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(79, 195, 247, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
        color: #4fc3f7;
      }

      .user-info {
        flex: 1;
        min-width: 0;
      }

      .user-name {
        font-size: 14px;
        font-weight: 500;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-role {
        font-size: 11px;
        color: rgba(255,255,255,0.35);
      }

      .sidebar-logout {
        width: 100%;
        padding: 8px 12px;
        background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.5);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        margin-top: 4px;
        text-align: center;
      }

      .sidebar-logout:hover {
        background: rgba(244, 67, 54, 0.15);
        color: #ef5350;
      }

      @media (max-width: 768px) {
        .sidebar-wrapper {
          position: fixed;
          left: 0;
          top: 0;
          width: 280px;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
          box-shadow: 2px 0 20px rgba(0,0,0,0.3);
          height: 100vh;
          z-index: 9999;
        }

        .sidebar-wrapper.mobile-open {
          transform: translateX(0);
        }

        .sidebar-wrapper.collapsed {
          width: 280px;
        }

        .sidebar-wrapper.collapsed .brand-name,
        .sidebar-wrapper.collapsed .brand-version,
        .sidebar-wrapper.collapsed .nav-text,
        .sidebar-wrapper.collapsed .user-info,
        .sidebar-wrapper.collapsed .sidebar-logout {
          display: flex;
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          z-index: 9998;
        }

        .sidebar-overlay.active {
          display: block;
        }
      }
    `
    document.head.appendChild(style)

    // 添加移动端遮罩
    if (!document.getElementById('sidebar-overlay')) {
      var overlay = document.createElement('div')
      overlay.className = 'sidebar-overlay'
      overlay.id = 'sidebar-overlay'
      document.body.appendChild(overlay)
    }
  }

  /**
   * 获取当前模块
   * @returns {string|null} 当前模块ID
   */
  getCurrentModule() {
    return this.currentModule
  }

  /**
   * 获取所有菜单项
   * @returns {Array<MenuItem>} 菜单项列表
   */
  getMenuItems() {
    return this.modules.slice()
  }

  /**
   * 设置导航回调
   * @param {Function} callback - 回调函数
   * @returns {UnifiedSidebar} 侧边栏实例
   */
  setOnNavigate(callback) {
    this.onNavigate = callback
    return this
  }

  /**
   * 刷新侧边栏
   * @returns {void}
   */
  refresh() {
    this.buildMenu()
    this.render()
  }

  /**
   * 销毁侧边栏
   * @returns {void}
   */
  destroy() {
    delete window.__sidebarToggle
    delete window.__sidebarLogout
    
    var style = document.getElementById('sidebar-styles')
    if (style) {
      style.remove()
    }
    
    var overlay = document.getElementById('sidebar-overlay')
    if (overlay) {
      overlay.remove()
    }

    var containerEl = typeof this.container === 'string' 
      ? document.querySelector(this.container) 
      : this.container
    
    if (containerEl) {
      containerEl.innerHTML = ''
    }

    this.isInitialized = false
    console.log('Sidebar destroyed')
  }
}

// 导出单例
export var sidebar = new UnifiedSidebar()

export default sidebar