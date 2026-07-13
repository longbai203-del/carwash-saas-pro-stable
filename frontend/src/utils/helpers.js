/**
 * 工具函数模块
 * 提供通用工具函数
 * 
 * @module utils/helpers
 * 
 * @example
 * import { formatDate, debounce, deepClone } from './utils/helpers.js'
 */

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @param {string} format - 格式
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) return ''
    
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
    
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }
  
  /**
   * 格式化货币
   * @param {number} amount - 金额
   * @param {string} currency - 货币符号
   * @param {string} locale - 区域
   * @returns {string} 格式化后的货币字符串
   */
  export function formatCurrency(amount, currency = '$', locale = 'en-US') {
    if (amount === undefined || amount === null) return ''
    
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency === '$' ? 'USD' : currency
    })
    
    return formatter.format(amount)
  }
  
  /**
   * 格式化数字
   * @param {number} number - 数字
   * @param {number} decimals - 小数位数
   * @param {string} locale - 区域
   * @returns {string} 格式化后的数字字符串
   */
  export function formatNumber(number, decimals = 0, locale = 'en-US') {
    if (number === undefined || number === null) return ''
    
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
    
    return formatter.format(number)
  }
  
  /**
   * 获取相对时间
   * @param {string|Date} date - 日期
   * @returns {string} 相对时间描述
   */
  export function timeAgo(date) {
    if (!date) return ''
    
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
    
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)
    
    if (seconds < 60) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    if (months < 12) return `${months}个月前`
    return `${years}年前`
  }
  
  /**
   * 防抖函数
   * @param {Function} fn - 要防抖的函数
   * @param {number} delay - 延迟时间(ms)
   * @returns {Function} 防抖后的函数
   */
  export function debounce(fn, delay = 300) {
    let timer = null
    
    return function(...args) {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        fn.apply(this, args)
        timer = null
      }, delay)
    }
  }
  
  /**
   * 节流函数
   * @param {Function} fn - 要节流的函数
   * @param {number} interval - 间隔时间(ms)
   * @returns {Function} 节流后的函数
   */
  export function throttle(fn, interval = 300) {
    let lastTime = 0
    let timer = null
    
    return function(...args) {
      const now = Date.now()
      
      if (now - lastTime >= interval) {
        fn.apply(this, args)
        lastTime = now
      } else if (!timer) {
        timer = setTimeout(() => {
          fn.apply(this, args)
          lastTime = Date.now()
          timer = null
        }, interval - (now - lastTime))
      }
    }
  }
  
  /**
   * 深拷贝
   * @param {*} obj - 要拷贝的对象
   * @returns {*} 拷贝后的对象
   */
  export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => deepClone(item))
    
    const result = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = deepClone(obj[key])
      }
    }
    return result
  }
  
  /**
   * 生成唯一ID
   * @param {string} prefix - 前缀
   * @returns {string} 唯一ID
   */
  export function generateId(prefix = '') {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}${timestamp}${random}`
  }
  
  /**
   * 获取URL参数
   * @param {string} name - 参数名
   * @param {string} url - URL
   * @returns {string|null} 参数值
   */
  export function getQueryParam(name, url = window.location.href) {
    const params = new URLSearchParams(new URL(url).search)
    return params.get(name)
  }
  
  /**
   * 获取所有URL参数
   * @param {string} url - URL
   * @returns {Object} 参数对象
   */
  export function getQueryParams(url = window.location.href) {
    const params = new URLSearchParams(new URL(url).search)
    const result = {}
    for (const [key, value] of params) {
      result[key] = value
    }
    return result
  }
  
  /**
   * 构建URL查询字符串
   * @param {Object} params - 参数对象
   * @returns {string} 查询字符串
   */
  export function buildQueryString(params) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.append(key, String(value))
      }
    }
    const str = query.toString()
    return str ? `?${str}` : ''
  }
  
  /**
   * 截断文本
   * @param {string} text - 文本
   * @param {number} length - 最大长度
   * @param {string} suffix - 后缀
   * @returns {string} 截断后的文本
   */
  export function truncate(text, length = 100, suffix = '...') {
    if (!text || text.length <= length) return text
    return text.substring(0, length) + suffix
  }
  
  /**
   * 验证邮箱
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  /**
   * 验证手机号
   * @param {string} phone - 手机号
   * @returns {boolean} 是否有效
   */
  export function isValidPhone(phone) {
    return /^[\d\s\-+()]{7,20}$/.test(phone)
  }
  
  /**
   * 验证URL
   * @param {string} url - URL
   * @returns {boolean} 是否有效
   */
  export function isValidUrl(url) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
  
  /**
   * 防XSS转义
   * @param {string} html - HTML字符串
   * @returns {string} 转义后的字符串
   */
  export function escapeHtml(html) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return html.replace(/[&<>"']/g, char => map[char])
  }
  
  /**
   * 下划线转驼峰
   * @param {string} str - 下划线字符串
   * @returns {string} 驼峰字符串
   */
  export function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }
  
  /**
   * 驼峰转下划线
   * @param {string} str - 驼峰字符串
   * @returns {string} 下划线字符串
   */
  export function camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }
  
  export default {
    formatDate,
    formatCurrency,
    formatNumber,
    timeAgo,
    debounce,
    throttle,
    deepClone,
    generateId,
    getQueryParam,
    getQueryParams,
    buildQueryString,
    truncate,
    isValidEmail,
    isValidPhone,
    isValidUrl,
    escapeHtml,
    snakeToCamel,
    camelToSnake
  }