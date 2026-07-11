/**
 * API服务模块
 * 统一管理所有API调用
 * 
 * @module services/api
 * 
 * @example
 * import { api, endpoints } from './services/api.js'
 * const response = await api.get('/customers', { tenant_id: 'xxx' })
 */

import { CONFIG } from '../config/index.js'

/**
 * API配置
 * @typedef {Object} ApiConfig
 * @property {string} baseURL - 基础URL
 * @property {number} timeout - 超时时间(ms)
 * @property {Object} headers - 默认请求头
 * @property {Function} onRequest - 请求拦截器
 * @property {Function} onResponse - 响应拦截器
 * @property {Function} onError - 错误拦截器
 */

/**
 * API响应
 * @typedef {Object} ApiResponse
 * @property {boolean} success - 是否成功
 * @property {*} data - 响应数据
 * @property {string} [error] - 错误信息
 * @property {Object} [pagination] - 分页信息
 */

class ApiService {
  /**
   * 创建API服务实例
   * @param {ApiConfig} config - API配置
   */
  constructor(config = {}) {
    /** @type {string} */
    this.baseURL = config.baseURL || '/api'
    
    /** @type {number} */
    this.timeout = config.timeout || 30000
    
    /** @type {Object} */
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers
    }
    
    /** @type {Array<Function>} */
    this.requestInterceptors = []
    
    /** @type {Array<Function>} */
    this.responseInterceptors = []
    
    /** @type {Array<Function>} */
    this.errorInterceptors = []
    
    /** @type {string|null} */
    this.token = null
  }

  /**
   * 设置认证令牌
   * @param {string} token - JWT令牌
   */
  setToken(token) {
    this.token = token
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`
    } else {
      delete this.defaultHeaders['Authorization']
    }
  }

  /**
   * 获取认证令牌
   * @returns {string|null} 令牌
   */
  getToken() {
    return this.token
  }

  /**
   * 注册请求拦截器
   * @param {Function} interceptor - 拦截器函数
   * @returns {ApiService} API服务实例
   */
  onRequest(interceptor) {
    if (typeof interceptor === 'function') {
      this.requestInterceptors.push(interceptor)
    }
    return this
  }

  /**
   * 注册响应拦截器
   * @param {Function} interceptor - 拦截器函数
   * @returns {ApiService} API服务实例
   */
  onResponse(interceptor) {
    if (typeof interceptor === 'function') {
      this.responseInterceptors.push(interceptor)
    }
    return this
  }

  /**
   * 注册错误拦截器
   * @param {Function} interceptor - 拦截器函数
   * @returns {ApiService} API服务实例
   */
  onError(interceptor) {
    if (typeof interceptor === 'function') {
      this.errorInterceptors.push(interceptor)
    }
    return this
  }

  /**
   * 发送请求
   * @param {string} method - HTTP方法
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<ApiResponse>} 响应
   */
  async request(method, url, options = {}) {
    const {
      data,
      params,
      headers = {},
      timeout = this.timeout
    } = options

    // 构建完整URL
    let fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`
    
    // 添加查询参数
    if (params) {
      const queryString = new URLSearchParams(params).toString()
      if (queryString) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
      }
    }

    // 合并请求头
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers
    }

    // 构建请求选项
    const requestOptions = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout)
    }

    // 添加请求体
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      requestOptions.body = JSON.stringify(data)
    }

    // 执行请求拦截器
    let requestData = { url: fullUrl, options: requestOptions }
    for (const interceptor of this.requestInterceptors) {
      requestData = interceptor(requestData) || requestData
    }

    try {
      // 发送请求
      const response = await fetch(requestData.url, requestData.options)
      
      // 解析响应
      let responseData
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      // 执行响应拦截器
      let result = { response, data: responseData }
      for (const interceptor of this.responseInterceptors) {
        result = interceptor(result) || result
      }

      // 处理HTTP错误
      if (!response.ok) {
        const error = new Error(responseData?.message || response.statusText)
        error.status = response.status
        error.statusText = response.statusText
        error.data = responseData
        throw error
      }

      return result.data
    } catch (error) {
      // 执行错误拦截器
      let errorData = error
      for (const interceptor of this.errorInterceptors) {
        errorData = interceptor(errorData) || errorData
      }
      throw errorData
    }
  }

  /**
   * GET请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<ApiResponse>}
   */
  get(url, options = {}) {
    return this.request('GET', url, options)
  }

  /**
   * POST请求
   * @param {string} url - 请求URL
   * @param {*} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<ApiResponse>}
   */
  post(url, data, options = {}) {
    return this.request('POST', url, { ...options, data })
  }

  /**
   * PUT请求
   * @param {string} url - 请求URL
   * @param {*} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<ApiResponse>}
   */
  put(url, data, options = {}) {
    return this.request('PUT', url, { ...options, data })
  }

  /**
   * PATCH请求
   * @param {string} url - 请求URL
   * @param {*} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<ApiResponse>}
   */
  patch(url, data, options = {}) {
    return this.request('PATCH', url, { ...options, data })
  }

  /**
   * DELETE请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<ApiResponse>}
   */
  delete(url, options = {}) {
    return this.request('DELETE', url, options)
  }

  /**
   * 上传文件
   * @param {string} url - 请求URL
   * @param {File} file - 文件
   * @param {Object} options - 请求选项
   * @returns {Promise<ApiResponse>}
   */
  upload(url, file, options = {}) {
    const formData = new FormData()
    formData.append('file', file)
    
    const { data, ...rest } = options
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    return this.request('POST', url, {
      ...rest,
      data: formData,
      headers: {
        ...options.headers,
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

/**
 * API端点定义
 */
export const endpoints = {
  // 认证
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile'
  },
  
  // 客户
  customers: {
    list: '/customers',
    detail: (id) => `/customers/${id}`,
    create: '/customers',
    update: (id) => `/customers/${id}`,
    delete: (id) => `/customers/${id}`,
    search: '/customers/search'
  },
  
  // 订单
  orders: {
    list: '/orders',
    detail: (id) => `/orders/${id}`,
    create: '/orders',
    update: (id) => `/orders/${id}`,
    delete: (id) => `/orders/${id}`,
    stats: '/orders/stats'
  },
  
  // 产品
  products: {
    list: '/products',
    detail: (id) => `/products/${id}`,
    create: '/products',
    update: (id) => `/products/${id}`,
    delete: (id) => `/products/${id}`,
    search: '/products/search',
    lowStock: '/products/low-stock'
  },
  
  // 库存
  inventory: {
    transactions: '/inventory/transactions',
    adjust: '/inventory/adjust',
    alerts: '/inventory/alerts',
    stats: '/inventory/stats'
  },
  
  // 员工
  employees: {
    list: '/employees',
    detail: (id) => `/employees/${id}`,
    create: '/employees',
    update: (id) => `/employees/${id}`,
    delete: (id) => `/employees/${id}`
  },
  
  // 报告
  reports: {
    sales: '/reports/sales',
    inventory: '/reports/inventory',
    finance: '/reports/finance',
    employee: '/reports/employee'
  }
}

// 创建单例
const api = new ApiService()

export { api }
export default api