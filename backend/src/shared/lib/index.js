/**
 * 工具库 - 统一导出
 * 
 * @module lib/index
 * 
 * @example
 * import { logger, supabase, validate } from '../lib/index.js'
 */

export * from './logger.js';
export * from './supabase.js';
export * from './validation.js';

/**
 * 通用工具函数
 */
export const utils = {
  /**
   * 延迟执行
   * @param {number} ms - 延迟毫秒
   * @returns {Promise<void>}
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * 生成唯一ID
   * @param {string} prefix - 前缀
   * @returns {string} 唯一ID
   */
  generateId: (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}${random}`;
  },

  /**
   * 深拷贝
   * @param {*} obj - 要拷贝的对象
   * @returns {*} 拷贝后的对象
   */
  deepClone: (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => utils.deepClone(item));
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = utils.deepClone(obj[key]);
      }
    }
    return result;
  },

  /**
   * 防XSS转义
   * @param {string} html - HTML字符串
   * @returns {string} 转义后的字符串
   */
  escapeHtml: (html) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return html.replace(/[&<>"']/g, char => map[char] || char);
  },

  /**
   * 截断文本
   * @param {string} text - 文本
   * @param {number} length - 最大长度
   * @param {string} suffix - 后缀
   * @returns {string} 截断后的文本
   */
  truncate: (text, length = 100, suffix = '...') => {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + suffix;
  },

  /**
   * 格式化数字
   * @param {number} number - 数字
   * @param {number} decimals - 小数位数
   * @returns {string} 格式化后的数字
   */
  formatNumber: (number, decimals = 2) => {
    if (number === undefined || number === null) return '0';
    return Number(number).toFixed(decimals);
  },

  /**
   * 格式化货币
   * @param {number} amount - 金额
   * @param {string} currency - 货币符号
   * @returns {string} 格式化后的金额
   */
  formatCurrency: (amount, currency = '¥') => {
    if (amount === undefined || amount === null) return `${currency}0.00`;
    return `${currency}${Number(amount).toFixed(2)}`;
  },

  /**
   * 获取相对时间
   * @param {string|Date} date - 日期
   * @returns {string} 相对时间描述
   */
  timeAgo: (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    if (months < 12) return `${months}个月前`;
    return `${years}年前`;
  },
};

export default {
  utils,
};