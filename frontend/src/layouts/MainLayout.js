/**
 * 主布局组件
 * 应用的主要布局结构
 * 
 * @module layouts/MainLayout
 * 
 * @example
 * import MainLayout from './layouts/MainLayout.js'
 */

import { sidebar } from '../components/Layout/Sidebar.js'

/**
 * 主布局类
 */
class MainLayout {
  constructor() {
    this.container = null
    this.sidebar = null
    this.content = null
  }

  /**
   * 渲染主布局
   * @param {HTMLElement} container - 容器元素
   * @returns {void}
   */
  render(container) {
    if (!container) {
      console.error('Container element is required')
      return
    }

    this.container = container

    // 创建布局结构
    container.innerHTML = `
      <div class="main-layout">
        <div id="sidebar-container" class="sidebar-container"></div>
        <div class="main-content">
          <div id="content-container" class="content-container"></div>
        </div>
      </div>
    `

    // 初始化侧边栏
    const sidebarContainer = document.getElementById('sidebar-container')
    if (sidebarContainer) {
      this.sidebar = sidebar
      // Sidebar 会自动初始化
    }

    // 获取内容容器
    this.content = document.getElementById('content-container')

    // 应用样式
    this.applyStyles()
  }

  /**
   * 获取内容容器
   * @returns {HTMLElement} 内容容器
   */
  getContentContainer() {
    return this.content
  }

  /**
   * 应用布局样式
   * @returns {void}
   */
  applyStyles() {
    const style = document.createElement('style')
    style.textContent = `
      .main-layout {
        display: flex;
        min-height: 100vh;
        background: #f0f2f5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .sidebar-container {
        width: 260px;
        flex-shrink: 0;
        background: #1a1a2e;
        color: #fff;
        min-height: 100vh;
        position: sticky;
        top: 0;
        height: 100vh;
        overflow-y: auto;
      }

      .main-content {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        min-height: 100vh;
      }

      .content-container {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        min-height: 400px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }

      /* 侧边栏样式 */
      .sidebar-brand {
        padding: 24px 20px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .sidebar-brand .brand-icon {
        font-size: 28px;
      }

      .sidebar-brand .brand-name {
        font-size: 20px;
        font-weight: 600;
      }

      .sidebar-brand .brand-version {
        font-size: 11px;
        color: rgba(255,255,255,0.4);
        margin-left: auto;
      }

      .sidebar-nav {
        padding: 8px 0;
      }

      .nav-section-title {
        padding: 12px 20px 6px;
        font-size: 11px;
        text-transform: uppercase;
        color: rgba(255,255,255,0.3);
        letter-spacing: 1px;
      }

      .nav-item {
        list-style: none;
      }

      .nav-link {
        display: flex;
        align-items: center;
        padding: 10px 20px;
        color: rgba(255,255,255,0.6);
        text-decoration: none;
        transition: all 0.2s;
        cursor: pointer;
        font-size: 14px;
        gap: 12px;
      }

      .nav-link:hover {
        background: rgba(255,255,255,0.05);
        color: #fff;
      }

      .nav-item.active .nav-link {
        background: rgba(255,255,255,0.08);
        color: #fff;
        border-right: 3px solid #4fc3f7;
      }

      .nav-link .nav-icon {
        width: 20px;
        font-size: 16px;
        text-align: center;
      }

      .nav-link .nav-text {
        flex: 1;
      }

      .nav-link .nav-badge {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
        background: #e53935;
        color: #fff;
      }

      @media (max-width: 768px) {
        .sidebar-container {
          position: fixed;
          left: -280px;
          top: 0;
          z-index: 1000;
          transition: left 0.3s;
        }

        .sidebar-container.open {
          left: 0;
        }

        .main-content {
          padding: 16px;
        }

        .content-container {
          padding: 16px;
          min-height: 300px;
        }
      }
    `
    document.head.appendChild(style)
  }
}

export default MainLayout