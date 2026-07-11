/**
 * 应用主入口
 * 初始化应用、路由和状态
 * 
 * @module App
 * 
 * @example
 * import App from './App.js'
 * const app = new App()
 * app.init()
 */

import router from './router/index.js'
import { moduleLoader } from './core/ModuleLoader.js'
import { sidebar } from './components/Layout/Sidebar.js'
import { store } from './store/index.js'
import { api } from './services/api.js'
import { CONFIG } from './config/index.js'

/**
 * 应用类
 */
class App {
  constructor() {
    /** @type {string} */
    this.name = CONFIG.getAppName()
    
    /** @type {string} */
    this.version = CONFIG.getVersion()
    
    /** @type {boolean} */
    this.isInitialized = false
    
    /** @type {Object} */
    this.components = {
      sidebar: null,
      moduleLoader: null,
      router: null
    }
  }

  /**
   * 初始化应用
   * @param {Object} options - 初始化选项
   * @returns {Promise<void>}
   */
  async init(options = {}) {
    if (this.isInitialized) {
      console.warn('App already initialized')
      return
    }

    console.log(`🚀 Starting ${this.name} v${this.version}...`)

    try {
      // 1. 初始化API
      const token = localStorage.getItem('auth_token')
      if (token) {
        api.setToken(token)
      }

      // 2. 初始化状态
      store.restore()

      // 3. 初始化模块加载器
      const container = document.getElementById('content-container')
      if (container) {
        moduleLoader.init(container)
      }

      // 4. 初始化侧边栏
      this.components.sidebar = sidebar

      // 5. 初始化路由
      router.init()

      // 6. 设置全局错误处理
      window.onerror = (message, source, lineno, colno, error) => {
        console.error('Global error:', { message, source, lineno, colno, error })
        this.handleError(error || message)
      }

      window.onunhandledrejection = (event) => {
        console.error('Unhandled rejection:', event.reason)
        this.handleError(event.reason)
      }

      // 7. 标记为已初始化
      this.isInitialized = true
      store.setState('app.loaded', true)

      console.log(`✅ ${this.name} started successfully`)
      
      // 触发启动事件
      document.dispatchEvent(new CustomEvent('app:ready'))
    } catch (error) {
      console.error('Failed to initialize app:', error)
      this.handleError(error)
    }
  }

  /**
   * 处理错误
   * @param {Error|string} error - 错误
   */
  handleError(error) {
    const message = error instanceof Error ? error.message : String(error)
    
    // 显示错误通知
    const container = document.getElementById('content-container')
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #d32f2f;">
          <h2>⚠️ 应用加载失败</h2>
          <p style="color: #666; margin: 12px 0;">${message}</p>
          <button onclick="location.reload()" 
                  style="padding: 10px 24px; background: #4fc3f7; color: #fff; border: none; border-radius: 6px; cursor: pointer; margin-top: 12px;">
            重新加载
          </button>
        </div>
      `
    }
  }

  /**
   * 获取应用信息
   * @returns {Object} 应用信息
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      initialized: this.isInitialized,
      modules: moduleLoader.getModules().length,
      routes: router.getRoutes().length
    }
  }

  /**
   * 销毁应用
   */
  destroy() {
    // 清理事件监听
    document.removeEventListener('app:ready', null)
    
    // 卸载所有模块
    const modules = moduleLoader.getModules()
    for (const module of modules) {
      moduleLoader.unloadModule(module.id)
    }
    
    this.isInitialized = false
    console.log(`🛑 ${this.name} destroyed`)
  }
}

// 创建单例
const app = new App()

export { app }
export default app