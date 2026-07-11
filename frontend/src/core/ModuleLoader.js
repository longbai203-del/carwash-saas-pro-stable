// frontend/src/core/ModuleLoader.js
import { CONFIG } from '../config/index.js'

class ModuleLoader {
  constructor() {
    this.config = CONFIG
    this.loadedModules = new Map()
    this.currentModule = null
    this.container = null
  }

  /**
   * 初始化模块加载器
   */
  init(container) {
    this.container = container
    console.log('📦 ModuleLoader initialized')
    console.log(📋  modules available)
  }

  /**
   * 获取所有模块
   */
  getModules() {
    return this.config.getModules()
  }

  /**
   * 获取启用的模块
   */
  getEnabledModules() {
    return this.config.getEnabledModules()
  }

  /**
   * 获取排序后的模块
   */
  getSortedModules() {
    return this.config.getSortedModules()
  }

  /**
   * 加载模块
   */
  async loadModule(moduleId) {
    const module = this.config.getModule(moduleId)
    if (!module) {
      console.error(❌ Module  not found)
      return null
    }

    // 检查是否已加载
    if (this.loadedModules.has(moduleId)) {
      console.log(📦 Module  already loaded)
      return this.loadedModules.get(moduleId)
    }

    try {
      console.log(📦 Loading module: )

      // 构建路径
      const basePath = module.path || /modules/
      const htmlPath = ${basePath}/.html
      const jsPath = ${basePath}/.js

      // 加载HTML
      const html = await this.loadHTML(htmlPath)
      
      // 加载JS (如果存在)
      let jsModule = null
      try {
        jsModule = await this.loadJS(jsPath)
      } catch (error) {
        console.warn(⚠️ JS module not found: )
      }

      const moduleData = {
        id: moduleId,
        name: module.name,
        path: basePath,
        html: html,
        js: jsModule,
        instance: null
      }

      this.loadedModules.set(moduleId, moduleData)
      this.currentModule = moduleId
      
      console.log(✅ Module  loaded successfully)
      return moduleData
    } catch (error) {
      console.error(❌ Failed to load module :, error)
      return null
    }
  }

  /**
   * 加载HTML
   */
  async loadHTML(path) {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(Failed to load HTML:  ())
    }
    return await response.text()
  }

  /**
   * 加载JS
   */
  async loadJS(path) {
    // 使用动态import
    return await import(path)
  }

  /**
   * 渲染模块到容器
   */
  renderModule(moduleId) {
    if (!this.container) {
      console.error('❌ Container not set')
      return
    }

    const moduleData = this.loadedModules.get(moduleId)
    if (!moduleData) {
      console.error(❌ Module  not loaded)
      return
    }

    // 清空容器
    this.container.innerHTML = ''
    
    // 插入HTML
    this.container.innerHTML = moduleData.html

    // 调用模块的初始化函数
    if (moduleData.js && typeof moduleData.js.init === 'function') {
      try {
        moduleData.instance = moduleData.js.init(this.container)
        console.log(✅ Module  rendered and initialized)
      } catch (error) {
        console.error(❌ Module  init failed:, error)
      }
    } else {
      console.log(✅ Module  rendered (no init function))
    }
  }

  /**
   * 导航到模块
   */
  async navigateTo(moduleId) {
    console.log(🚀 Navigating to: )
    
    const moduleData = await this.loadModule(moduleId)
    if (moduleData) {
      this.renderModule(moduleId)
      
      // 更新URL
      const module = this.config.getModule(moduleId)
      if (module) {
        window.history.pushState({ module: moduleId }, '', module.path || /)
      }
    }
  }

  /**
   * 卸载模块
   */
  unloadModule(moduleId) {
    const moduleData = this.loadedModules.get(moduleId)
    if (moduleData) {
      // 调用销毁函数
      if (moduleData.instance && typeof moduleData.instance.destroy === 'function') {
        try {
          moduleData.instance.destroy()
        } catch (error) {
          console.warn(⚠️ Module  destroy failed:, error)
        }
      }
      this.loadedModules.delete(moduleId)
      console.log(🗑️ Module  unloaded)
    }
  }

  /**
   * 获取当前模块
   */
  getCurrentModule() {
    return this.currentModule ? this.loadedModules.get(this.currentModule) : null
  }

  /**
   * 检查模块是否已加载
   */
  isModuleLoaded(moduleId) {
    return this.loadedModules.has(moduleId)
  }
}

// 导出单例
export const moduleLoader = new ModuleLoader()
