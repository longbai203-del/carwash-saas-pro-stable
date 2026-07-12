/**
 * 统一配置模块
 * 从module-map.json加载配置
 * 
 * @module config
 * 
 * @example
 * import { CONFIG } from './config/index.js'
 * const modules = CONFIG.getModules()
 */

import moduleMapData from '../../module-map.json'

/**
 * 配置类
 */
class Config {
  constructor() {
    /** @type {Object} */
    this.data = moduleMapData
  }

  /**
   * 获取所有模块
   * @returns {Array} 模块列表
   */
  getModules() {
    return Object.values(this.data.modules || {})
  }

  /**
   * 获取启用的模块
   * @returns {Array} 启用模块列表
   */
  getEnabledModules() {
    return Object.values(this.data.modules || {})
      .filter(m => m.enabled !== false)
  }

  /**
   * 获取排序后的模块
   * @returns {Array} 排序后的模块列表
   */
  getSortedModules() {
    return this.getEnabledModules()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  /**
   * 获取模块
   * @param {string} id - 模块ID
   * @returns {Object|null} 模块配置
   */
  getModule(id) {
    return this.data.modules?.[id] || null
  }

  /**
   * 获取模块路径
   * @param {string} id - 模块ID
   * @returns {string|null} 模块路径
   */
  getModulePath(id) {
    const module = this.getModule(id)
    return module ? module.path : null
  }

  /**
   * 获取路由
   * @param {string} id - 路由ID
   * @returns {string|null} 路由路径
   */
  getRoute(id) {
    return this.data.routes?.[id] || null
  }

  /**
   * 获取所有路由
   * @returns {Object} 路由映射
   */
  getRoutes() {
    return this.data.routes || {}
  }

  /**
   * 获取默认模块
   * @returns {Object|null} 默认模块
   */
  getDefaultModule() {
    const defaultId = this.data.defaultModule || 'dashboard'
    return this.getModule(defaultId) || this.getModules()[0] || null
  }

  /**
   * 获取应用名称
   * @returns {string} 应用名称
   */
  getAppName() {
    return this.data.appName || '洗车SaaS'
  }

  /**
   * 获取版本
   * @returns {string} 版本
   */
  getVersion() {
    return this.data.version || '1.0.0'
  }

  /**
   * 获取基础路径
   * @returns {string} 基础路径
   */
  getBasePath() {
    return this.data.basePath || '/'
  }

  /**
   * 检查模块是否存在
   * @param {string} id - 模块ID
   * @returns {boolean} 是否存在
   */
  hasModule(id) {
    return !!this.data.modules?.[id]
  }

  /**
   * 获取模块数量
   * @returns {number} 模块数量
   */
  getModuleCount() {
    return Object.keys(this.data.modules || {}).length
  }

  /**
   * 获取配置
   * @param {string} [key] - 配置键名
   * @returns {*} 配置值
   */
  get(key) {
    if (key === undefined) {
      return this.data
    }
    return this.data[key]
  }

  /**
   * 获取模块图标
   * @param {string} id - 模块ID
   * @returns {string|null} 图标名称
   */
  getModuleIcon(id) {
    const module = this.getModule(id)
    return module ? module.icon : null
  }

  /**
   * 获取模块名称
   * @param {string} id - 模块ID
   * @returns {string|null} 模块名称
   */
  getModuleName(id) {
    const module = this.getModule(id)
    return module ? module.name : null
  }
}

// 创建单例
const CONFIG = new Config()

export { CONFIG }
export default CONFIG