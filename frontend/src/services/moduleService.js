/**
 * 模块服务
 * 管理模块的加载、配置和状态
 * 
 * @module services/moduleService
 * 
 * @example
 * import moduleService from './services/moduleService.js'
 * const modules = moduleService.getAllModules()
 * moduleService.loadModule('dashboard')
 */

import { CONFIG } from '../config/index.js'

/**
 * 模块信息
 * @typedef {Object} ModuleInfo
 * @property {string} id - 模块ID
 * @property {string} name - 模块名称
 * @property {string} path - 模块路径
 * @property {number} order - 排序
 * @property {boolean} enabled - 是否启用
 * @property {string} icon - 图标
 * @property {string} module - 模块目录名
 * @property {Object} [meta] - 元数据
 */

class ModuleService {
  constructor() {
    /** @type {Map<string, ModuleInfo>} */
    this.modules = new Map()
    
    /** @type {Map<string, Object>} */
    this.loadedModules = new Map()
    
    /** @type {string|null} */
    this.currentModule = null
    
    /** @type {Array<Function>} */
    this.listeners = []
    
    this.init()
  }

  /**
   * 初始化模块服务
   */
  init() {
    // 从配置加载模块
    const modules = CONFIG.getModules()
    modules.forEach(module => {
      this.modules.set(module.id, module)
    })
  }

  /**
   * 获取所有模块
   * @returns {Array<ModuleInfo>} 模块列表
   */
  getAllModules() {
    return Array.from(this.modules.values())
  }

  /**
   * 获取启用的模块
   * @returns {Array<ModuleInfo>} 启用模块列表
   */
  getEnabledModules() {
    return this.getAllModules().filter(m => m.enabled !== false)
  }

  /**
   * 获取排序后的模块
   * @returns {Array<ModuleInfo>} 排序后的模块列表
   */
  getSortedModules() {
    return this.getEnabledModules().sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  /**
   * 获取模块
   * @param {string} moduleId - 模块ID
   * @returns {ModuleInfo|null} 模块信息
   */
  getModule(moduleId) {
    return this.modules.get(moduleId) || null
  }

  /**
   * 加载模块
   * @param {string} moduleId - 模块ID
   * @returns {Promise<Object|null>} 加载的模块
   */
  async loadModule(moduleId) {
    const module = this.getModule(moduleId)
    if (!module) {
      console.error(`Module not found: ${moduleId}`)
      return null
    }

    // 检查是否已加载
    if (this.loadedModules.has(moduleId)) {
      return this.loadedModules.get(moduleId)
    }

    try {
      // 构建路径
      const basePath = module.path || `/modules/${module.module}`
      const jsPath = `${basePath}/${module.module}.js`

      // 动态导入
      const moduleData = await import(jsPath)
      
      // 保存加载的模块
      this.loadedModules.set(moduleId, moduleData)
      
      // 触发事件
      this.emit('moduleLoaded', { moduleId, moduleData })
      
      return moduleData
    } catch (error) {
      console.error(`Failed to load module ${moduleId}:`, error)
      this.emit('moduleLoadError', { moduleId, error })
      return null
    }
  }

  /**
   * 切换当前模块
   * @param {string} moduleId - 模块ID
   * @param {Object} params - 参数
   * @returns {Promise<void>}
   */
  async switchTo(moduleId, params = {}) {
    const module = this.getModule(moduleId)
    if (!module) {
      console.error(`Module not found: ${moduleId}`)
      return
    }

    // 卸载当前模块
    if (this.currentModule && this.currentModule !== moduleId) {
      await this.unloadModule(this.currentModule)
    }

    // 加载新模块
    const moduleData = await this.loadModule(moduleId)
    if (moduleData) {
      this.currentModule = moduleId
      this.emit('moduleChanged', { moduleId, moduleData, params })
    }
  }

  /**
   * 卸载模块
   * @param {string} moduleId - 模块ID
   * @returns {Promise<void>}
   */
  async unloadModule(moduleId) {
    const moduleData = this.loadedModules.get(moduleId)
    if (!moduleData) return

    // 调用销毁方法
    if (typeof moduleData.destroy === 'function') {
      try {
        await moduleData.destroy()
      } catch (error) {
        console.warn(`Module ${moduleId} destroy failed:`, error)
      }
    }

    this.loadedModules.delete(moduleId)
    if (this.currentModule === moduleId) {
      this.currentModule = null
    }
    
    this.emit('moduleUnloaded', { moduleId })
  }

  /**
   * 获取当前模块
   * @returns {string|null} 当前模块ID
   */
  getCurrentModule() {
    return this.currentModule
  }

  /**
   * 获取当前模块数据
   * @returns {Object|null} 当前模块数据
   */
  getCurrentModuleData() {
    if (!this.currentModule) return null
    return this.loadedModules.get(this.currentModule) || null
  }

  /**
   * 检查模块是否已加载
   * @param {string} moduleId - 模块ID
   * @returns {boolean} 是否已加载
   */
  isModuleLoaded(moduleId) {
    return this.loadedModules.has(moduleId)
  }

  /**
   * 注册事件监听
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    this.listeners.push({ event, callback })
  }

  /**
   * 触发事件
   * @param {string} event - 事件名
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    for (const listener of this.listeners) {
      if (listener.event === event) {
        try {
          listener.callback(data)
        } catch (error) {
          console.error(`Event handler error:`, error)
        }
      }
    }
  }

  /**
   * 获取模块统计
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      total: this.modules.size,
      enabled: this.getEnabledModules().length,
      loaded: this.loadedModules.size,
      current: this.currentModule
    }
  }
}

// 创建单例
const moduleService = new ModuleService()

export { moduleService }
export default moduleService