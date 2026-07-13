/**
 * 状态管理模块
 * 统一管理应用状态
 * 
 * @module store
 * 
 * @example
 * import store from './store/index.js'
 * store.setState('user', { name: 'John' })
 * const user = store.getState('user')
 * store.subscribe((state) => console.log(state))
 */

import { CONFIG } from '../config/index.js'
import { api } from '../services/api.js'

/**
 * 状态配置
 * @typedef {Object} StoreConfig
 * @property {Object} initialState - 初始状态
 * @property {Array<Function>} middlewares - 中间件
 */

class Store {
  /**
   * 创建Store实例
   * @param {StoreConfig} config - 配置
   */
  constructor(config = {}) {
    /** @type {Object} */
    this.state = config.initialState || {}
    
    /** @type {Array<Function>} */
    this.listeners = []
    
    /** @type {Array<Function>} */
    this.middlewares = config.middlewares || []
    
    /** @type {Array<Object>} */
    this.history = []
    
    /** @type {number} */
    this.historyLimit = 50
    
    this.init()
  }

  /**
   * 初始化Store
   */
  init() {
    // 从localStorage恢复状态
    const saved = localStorage.getItem('app_state')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        this.state = { ...this.state, ...parsed }
      } catch (error) {
        console.warn('Failed to restore state:', error)
      }
    }

    // 自动保存状态
    this.subscribe((state) => {
      try {
        localStorage.setItem('app_state', JSON.stringify(state))
      } catch (error) {
        console.warn('Failed to save state:', error)
      }
    })
  }

  /**
   * 获取状态
   * @param {string} [key] - 状态键名
   * @returns {*} 状态值
   */
  getState(key) {
    if (key === undefined) {
      return this.state
    }
    return this.state[key]
  }

  /**
   * 设置状态
   * @param {string|Object} key - 键名或状态对象
   * @param {*} [value] - 值
   * @returns {Store} Store实例
   */
  setState(key, value) {
    let newState
    
    if (typeof key === 'string') {
      newState = { [key]: value }
    } else if (typeof key === 'object') {
      newState = key
    } else {
      throw new Error('Invalid state update')
    }

    // 应用中间件
    for (const middleware of this.middlewares) {
      const result = middleware(newState, this.state)
      if (result) {
        newState = result
      }
    }

    // 更新状态
    const prevState = { ...this.state }
    this.state = { ...this.state, ...newState }

    // 记录历史
    this.history.push({ prevState, newState, timestamp: Date.now() })
    if (this.history.length > this.historyLimit) {
      this.history.shift()
    }

    // 通知监听器
    this.notify()

    return this
  }

  /**
   * 批量更新状态
   * @param {Array<Object>} updates - 更新数组
   * @returns {Store} Store实例
   */
  batchUpdate(updates) {
    const newState = {}
    for (const update of updates) {
      Object.assign(newState, typeof update === 'function' ? update(this.state) : update)
    }
    return this.setState(newState)
  }

  /**
   * 获取状态片段
   * @param {Array<string>} keys - 键名列表
   * @returns {Object} 状态片段
   */
  pick(keys) {
    const result = {}
    for (const key of keys) {
      if (key in this.state) {
        result[key] = this.state[key]
      }
    }
    return result
  }

  /**
   * 检查状态是否存在
   * @param {string} key - 键名
   * @returns {boolean} 是否存在
   */
  has(key) {
    return key in this.state
  }

  /**
   * 订阅状态变化
   * @param {Function} listener - 监听器
   * @returns {Function} 取消订阅函数
   */
  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 通知所有监听器
   */
  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Listener error:', error)
      }
    }
  }

  /**
   * 重置状态
   * @param {Object} [defaultState] - 默认状态
   * @returns {Store} Store实例
   */
  reset(defaultState = {}) {
    this.state = defaultState
    this.history = []
    this.notify()
    return this
  }

  /**
   * 撤销上次状态变更
   * @returns {Store} Store实例
   */
  undo() {
    if (this.history.length === 0) return this
    
    const lastEntry = this.history.pop()
    this.state = lastEntry.prevState
    this.notify()
    return this
  }

  /**
   * 获取状态历史
   * @param {number} [limit] - 限制数量
   * @returns {Array} 历史记录
   */
  getHistory(limit) {
    const history = [...this.history]
    return limit ? history.slice(-limit) : history
  }

  /**
   * 清空状态历史
   * @returns {Store} Store实例
   */
  clearHistory() {
    this.history = []
    return this
  }

  /**
   * 持久化状态到localStorage
   * @param {string} [key] - 存储键名
   * @param {Array<string>} [fields] - 要存储的字段
   * @returns {Store} Store实例
   */
  persist(key = 'app_state', fields = null) {
    const data = fields ? this.pick(fields) : this.state
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist state:', error)
    }
    return this
  }

  /**
   * 从localStorage恢复状态
   * @param {string} [key] - 存储键名
   * @returns {Store} Store实例
   */
  restore(key = 'app_state') {
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const data = JSON.parse(saved)
        this.setState(data)
      }
    } catch (error) {
      console.warn('Failed to restore state:', error)
    }
    return this
  }
}

// 创建Store实例
const store = new Store({
  initialState: {
    app: {
      name: CONFIG.getAppName(),
      version: CONFIG.getVersion(),
      loaded: false
    },
    user: {
      authenticated: false,
      data: null,
      permissions: [],
      roles: []
    },
    ui: {
      sidebarOpen: true,
      darkMode: false,
      currentModule: null,
      notifications: []
    },
    data: {}
  },
  middlewares: [
    // 日志中间件
    (newState, prevState) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('State changed:', {
          prev: prevState,
          next: newState,
          diff: Object.keys(newState).filter(k => newState[k] !== prevState[k])
        })
      }
      return newState
    }
  ]
})

export { store }
export default store