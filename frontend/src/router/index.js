/**
 * 路由模块
 * 统一管理应用路由
 * 
 * @module router
 * 
 * @example
 * import router from './router/index.js'
 * router.init()
 * router.navigate('/dashboard')
 */

import { CONFIG } from '../config/index.js'
import { moduleLoader } from '../core/ModuleLoader.js'

/**
 * 路由配置
 * @typedef {Object} RouteConfig
 * @property {string} path - 路由路径
 * @property {string} moduleId - 模块ID
 * @property {string} title - 页面标题
 * @property {Function} [beforeEnter] - 进入前的钩子
 * @property {Function} [afterEnter] - 进入后的钩子
 */

class Router {
  constructor() {
    /** @type {Array<RouteConfig>} */
    this.routes = []
    
    /** @type {string} */
    this.currentPath = '/'
    
    /** @type {string} */
    this.currentModule = null
    
    /** @type {Object} */
    this.history = []
    
    /** @type {number} */
    this.historyIndex = -1
    
    /** @type {Array<Function>} */
    this.beforeEachHooks = []
    
    /** @type {Array<Function>} */
    this.afterEachHooks = []
    
    /** @type {Function|null} */
    this.onError = null
  }

  /**
   * 初始化路由
   * @param {Array<RouteConfig>} routes - 路由配置
   * @param {Object} options - 选项
   * @returns {Router} 路由实例
   */
  init(routes = [], options = {}) {
    this.routes = routes.length > 0 ? routes : this.buildRoutesFromConfig()
    
    // 监听popstate事件
    window.addEventListener('popstate', (event) => {
      const path = window.location.pathname
      this.handleRoute(path, event.state)
    })

    // 处理初始路由
    const initialPath = window.location.pathname
    if (initialPath !== '/') {
      this.handleRoute(initialPath)
    } else {
      // 加载默认模块
      const defaultModule = CONFIG.getDefaultModule()
      if (defaultModule) {
        this.navigateTo(defaultModule.id)
      }
    }

    return this
  }

  /**
   * 从配置构建路由
   * @returns {Array<RouteConfig>} 路由配置
   */
  buildRoutesFromConfig() {
    const modules = CONFIG.getModules()
    const routes = []
    
    // 获取模块对应的路由
    const routeMap = CONFIG.getRoutes()
    
    for (const module of modules) {
      const path = module.path || `/${module.id}`
      const route = {
        path: path,
        moduleId: module.id,
        title: module.name,
        meta: module
      }
      routes.push(route)
    }

    // 添加根路径重定向
    routes.push({
      path: '/',
      moduleId: CONFIG.defaultModule || 'dashboard',
      title: '首页'
    })

    // 添加404路由
    routes.push({
      path: '*',
      moduleId: null,
      title: '404 - 页面未找到'
    })

    return routes
  }

  /**
   * 注册路由
   * @param {string|Array} path - 路径或路由配置
   * @param {Object} config - 路由配置
   * @returns {Router} 路由实例
   */
  register(path, config = {}) {
    if (typeof path === 'string') {
      this.routes.push({
        path,
        ...config
      })
    } else if (Array.isArray(path)) {
      this.routes = [...this.routes, ...path]
    }
    return this
  }

  /**
   * 查找路由
   * @param {string} path - 路径
   * @returns {RouteConfig|null} 路由配置
   */
  findRoute(path) {
    // 移除查询参数
    const cleanPath = path.split('?')[0]
    
    // 精确匹配
    let route = this.routes.find(r => r.path === cleanPath)
    if (route) return route

    // 通配符匹配
    route = this.routes.find(r => r.path === '*')
    if (route) return route

    // 参数匹配 (/users/:id)
    for (const r of this.routes) {
      if (r.path.includes(':')) {
        const pattern = r.path.replace(/:[^/]+/g, '([^/]+)')
        const regex = new RegExp(`^${pattern}$`)
        if (regex.test(cleanPath)) {
          return r
        }
      }
    }

    return null
  }

  /**
   * 解析路由参数
   * @param {string} path - 路径
   * @param {RouteConfig} route - 路由配置
   * @returns {Object} 路由参数
   */
  parseParams(path, route) {
    const params = {}
    if (!route || !route.path.includes(':')) return params

    const cleanPath = path.split('?')[0]
    const pathSegments = cleanPath.split('/')
    const routeSegments = route.path.split('/')

    for (let i = 0; i < routeSegments.length; i++) {
      if (routeSegments[i].startsWith(':')) {
        const key = routeSegments[i].substring(1)
        params[key] = pathSegments[i] || null
      }
    }

    return params
  }

  /**
   * 导航到指定路径
   * @param {string} path - 路径
   * @param {Object} state - 状态
   * @param {Object} options - 选项
   * @returns {Promise<void>}
   */
  async navigate(path, state = {}, options = {}) {
    const { replace = false, silent = false } = options
    
    // 查找路由
    const route = this.findRoute(path)
    if (!route) {
      console.warn(`Route not found: ${path}`)
      return
    }

    // 解析参数
    const params = this.parseParams(path, route)

    // 执行前置钩子
    if (!silent) {
      for (const hook of this.beforeEachHooks) {
        const result = await hook({ path, route, params })
        if (result === false) {
          // 钩子阻止导航
          return
        }
        if (typeof result === 'string') {
          // 重定向
          return this.navigate(result, state, { ...options, replace: true })
        }
      }
    }

    // 更新历史
    if (!replace) {
      this.history = this.history.slice(0, this.historyIndex + 1)
      this.history.push({ path, route, params, state })
      this.historyIndex = this.history.length - 1
      
      if (!silent) {
        window.history.pushState({ path, ...state }, route.title || '', path)
      }
    } else {
      window.history.replaceState({ path, ...state }, route.title || '', path)
    }

    // 更新当前状态
    this.currentPath = path
    this.currentModule = route.moduleId

    // 触发导航事件
    const event = new CustomEvent('navigation', {
      detail: {
        path,
        route,
        params,
        state,
        moduleId: route.moduleId
      }
    })
    document.dispatchEvent(event)

    // 加载模块
    if (route.moduleId) {
      const moduleData = await moduleLoader.loadModule(route.moduleId)
      if (moduleData) {
        moduleLoader.renderModule(route.moduleId)
      }
    } else {
      // 显示404
      this.show404(path)
    }

    // 更新页面标题
    if (route.title) {
      document.title = `${route.title} - ${CONFIG.getAppName()}`
    }

    // 执行后置钩子
    if (!silent) {
      for (const hook of this.afterEachHooks) {
        await hook({ path, route, params, state })
      }
    }
  }

  /**
   * 导航到模块
   * @param {string} moduleId - 模块ID
   * @param {Object} params - 参数
   * @param {Object} options - 选项
   * @returns {Promise<void>}
   */
  async navigateTo(moduleId, params = {}, options = {}) {
    const module = CONFIG.getModule(moduleId)
    if (!module) {
      console.error(`Module not found: ${moduleId}`)
      return
    }

    // 构建路径
    let path = module.path || `/${moduleId}`
    
    // 添加参数
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString()
      path += `?${queryString}`
    }

    await this.navigate(path, { moduleId, ...params }, options)
  }

  /**
   * 返回上一页
   * @param {Object} options - 选项
   * @returns {Promise<void>}
   */
  async back(options = {}) {
    if (this.historyIndex > 0) {
      this.historyIndex--
      const entry = this.history[this.historyIndex]
      await this.navigate(entry.path, entry.state, { ...options, silent: true })
      window.history.back()
    } else {
      // 没有历史记录，返回首页
      await this.navigateTo(CONFIG.defaultModule || 'dashboard')
    }
  }

  /**
   * 前进到下一页
   * @param {Object} options - 选项
   * @returns {Promise<void>}
   */
  async forward(options = {}) {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      const entry = this.history[this.historyIndex]
      await this.navigate(entry.path, entry.state, { ...options, silent: true })
      window.history.forward()
    }
  }

  /**
   * 显示404页面
   * @param {string} path - 请求路径
   */
  show404(path) {
    const container = document.getElementById('content-container')
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <h1 style="font-size: 72px; color: #e0e0e0; margin-bottom: 20px;">404</h1>
          <h2 style="color: #333; margin-bottom: 12px;">页面未找到</h2>
          <p style="color: #666; margin-bottom: 24px;">路径: ${path}</p>
          <button onclick="window.location.href='/' " 
                  style="padding: 10px 24px; background: #4fc3f7; color: #fff; border: none; border-radius: 6px; cursor: pointer;">
            返回首页
          </button>
        </div>
      `
    }
    document.title = `404 - ${CONFIG.getAppName()}`
  }

  /**
   * 注册全局前置钩子
   * @param {Function} hook - 钩子函数
   * @returns {Router} 路由实例
   */
  beforeEach(hook) {
    if (typeof hook === 'function') {
      this.beforeEachHooks.push(hook)
    }
    return this
  }

  /**
   * 注册全局后置钩子
   * @param {Function} hook - 钩子函数
   * @returns {Router} 路由实例
   */
  afterEach(hook) {
    if (typeof hook === 'function') {
      this.afterEachHooks.push(hook)
    }
    return this
  }

  /**
   * 设置错误处理函数
   * @param {Function} handler - 错误处理函数
   * @returns {Router} 路由实例
   */
  onError(handler) {
    this.onError = handler
    return this
  }

  /**
   * 处理路由变化
   * @param {string} path - 路径
   * @param {Object} state - 状态
   * @returns {Promise<void>}
   */
  async handleRoute(path, state = {}) {
    try {
      await this.navigate(path, state, { silent: true })
    } catch (error) {
      console.error('Route handling error:', error)
      if (this.onError) {
        this.onError(error, path)
      }
    }
  }

  /**
   * 获取当前路由信息
   * @returns {Object} 当前路由信息
   */
  getCurrentRoute() {
    return {
      path: this.currentPath,
      moduleId: this.currentModule,
      history: this.history,
      historyIndex: this.historyIndex,
      canGoBack: this.historyIndex > 0,
      canGoForward: this.historyIndex < this.history.length - 1
    }
  }

  /**
   * 获取所有路由
   * @returns {Array<RouteConfig>} 路由列表
   */
  getRoutes() {
    return this.routes
  }

  /**
   * 生成链接
   * @param {string} moduleId - 模块ID
   * @param {Object} params - 参数
   * @returns {string} URL
   */
  link(moduleId, params = {}) {
    const module = CONFIG.getModule(moduleId)
    if (!module) return '#'
    
    let path = module.path || `/${moduleId}`
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString()
      path += `?${queryString}`
    }
    return path
  }
}

// 创建单例
const router = new Router()

export { router }
export default router