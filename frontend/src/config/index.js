// frontend/src/config/index.js
import moduleMapData from '../../module-map.json' assert { type: 'json' }

// 从module-map.json加载配置
const config = moduleMapData

class Config {
  constructor() {
    this.data = config
  }

  /**
   * 获取所有模块
   */
  getModules() {
    return Object.values(this.data.modules || {})
  }

  /**
   * 获取启用的模块
   */
  getEnabledModules() {
    return Object.values(this.data.modules || {})
      .filter(m => m.enabled !== false)
  }

  /**
   * 获取排序后的模块
   */
  getSortedModules() {
    return this.getEnabledModules()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  /**
   * 获取模块
   */
  getModule(id) {
    return this.data.modules?.[id] || null
  }

  /**
   * 获取模块路径
   */
  getModulePath(id) {
    const module = this.getModule(id)
    return module ? module.path : null
  }

  /**
   * 获取路由
   */
  getRoute(id) {
    return this.data.routes?.[id] || null
  }

  /**
   * 获取默认模块
   */
  getDefaultModule() {
    const defaultId = this.data.defaultModule || 'dashboard'
    return this.getModule(defaultId) || this.getModules()[0]
  }

  /**
   * 获取应用名称
   */
  getAppName() {
    return this.data.appName || '洗车SaaS'
  }

  /**
   * 获取版本
   */
  getVersion() {
    return this.data.version || '1.0.0'
  }

  /**
   * 获取基础路径
   */
  getBasePath() {
    return this.data.basePath || '/'
  }

  /**
   * 获取所有路由
   */
  getRoutes() {
    return this.data.routes || {}
  }
}

// 导出单例
export const CONFIG = new Config()
