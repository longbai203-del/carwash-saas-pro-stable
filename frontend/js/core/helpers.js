/**
 * @file helpers.js
 * @module helpers
 * @description 工具函数 - 通用辅助函数
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

/**
 * @description 格式化日期
 * @param {string|Date} date - 日期
 * @param {string} format - 格式
 * @returns {string} 格式化后的日期
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '无效日期';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * @description 格式化金额
 * @param {number} amount - 金额
 * @param {string} currency - 货币符号
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的金额
 */
export function formatMoney(amount, currency = '¥', decimals = 2) {
    if (amount === undefined || amount === null) return `${currency}0.00`;
    const num = Number(amount);
    if (isNaN(num)) return `${currency}0.00`;
    return `${currency}${num.toFixed(decimals)}`;
}

/**
 * @description 格式化数字
 * @param {number} num - 数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数字
 */
export function formatNumber(num, decimals = 0) {
    if (num === undefined || num === null) return '0';
    const n = Number(num);
    if (isNaN(n)) return '0';
    return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * @description 生成随机ID
 * @param {string} prefix - 前缀
 * @param {number} length - 长度
 * @returns {string} 随机ID
 */
export function generateId(prefix = '', length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix ? `${prefix}-${result}` : result;
}

/**
 * @description 生成UUID
 * @returns {string} UUID
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * @description 深拷贝
 * @param {*} obj - 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
    return obj;
}

/**
 * @description 防抖
 * @param {Function} fn - 函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖函数
 */
export function debounce(fn, delay = 300) {
    let timer = null;
    return function(...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
            timer = null;
        }, delay);
    };
}

/**
 * @description 节流
 * @param {Function} fn - 函数
 * @param {number} interval - 间隔时间（毫秒）
 * @returns {Function} 节流函数
 */
export function throttle(fn, interval = 300) {
    let lastTime = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastTime >= interval) {
            fn.apply(this, args);
            lastTime = now;
        }
    };
}

/**
 * @description 获取URL参数
 * @param {string} name - 参数名
 * @param {string} [url] - URL
 * @returns {string|null} 参数值
 */
export function getQueryParam(name, url = window.location.search) {
    const params = new URLSearchParams(url);
    return params.get(name);
}

/**
 * @description 获取所有URL参数
 * @param {string} [url] - URL
 * @returns {Object} 参数对象
 */
export function getQueryParams(url = window.location.search) {
    const params = new URLSearchParams(url);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

/**
 * @description 对象转查询字符串
 * @param {Object} obj - 对象
 * @returns {string} 查询字符串
 */
export function objectToQueryString(obj) {
    return new URLSearchParams(obj).toString();
}

/**
 * @description 查询字符串转对象
 * @param {string} query - 查询字符串
 * @returns {Object} 对象
 */
export function queryStringToObject(query) {
    const params = new URLSearchParams(query);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

/**
 * @description 颜色工具 - 十六进制转RGB
 * @param {string} hex - 十六进制颜色
 * @returns {Object} RGB对象
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * @description 颜色工具 - RGB转十六进制
 * @param {number} r - 红色
 * @param {number} g - 绿色
 * @param {number} b - 蓝色
 * @returns {string} 十六进制颜色
 */
export function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(c => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0')).join('');
}

/**
 * @description 截断文本
 * @param {string} text - 文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀
 * @returns {string} 截断后的文本
 */
export function truncate(text, maxLength = 50, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + suffix;
}

/**
 * @description 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 扩展名
 */
export function getFileExtension(filename) {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * @description 获取文件大小显示
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 文件大小
 */
export function getFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * @description 格式化相对时间
 * @param {string|Date} date - 日期
 * @param {string} [lang] - 语言
 * @returns {string} 相对时间
 */
export function getRelativeTime(date, lang = 'zh-CN') {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '无效日期';
    
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    const intervals = {
        'zh-CN': {
            justNow: '刚刚',
            minutes: (n) => `${n}分钟前`,
            hours: (n) => `${n}小时前`,
            days: (n) => `${n}天前`,
            weeks: (n) => `${n}周前`,
            months: (n) => `${n}个月前`,
            years: (n) => `${n}年前`
        },
        'en': {
            justNow: 'just now',
            minutes: (n) => `${n}m ago`,
            hours: (n) => `${n}h ago`,
            days: (n) => `${n}d ago`,
            weeks: (n) => `${n}w ago`,
            months: (n) => `${n}mo ago`,
            years: (n) => `${n}y ago`
        }
    };
    
    const t = intervals[lang] || intervals['zh-CN'];
    
    if (diff < 60000) return t.justNow;
    if (diff < 3600000) return t.minutes(Math.floor(diff / 60000));
    if (diff < 86400000) return t.hours(Math.floor(diff / 3600000));
    if (diff < 604800000) return t.days(Math.floor(diff / 86400000));
    if (diff < 2592000000) return t.weeks(Math.floor(diff / 604800000));
    if (diff < 31536000000) return t.months(Math.floor(diff / 2592000000));
    return t.years(Math.floor(diff / 31536000000));
}

/**
 * @description 获取浏览器信息
 * @returns {Object} 浏览器信息
 */
export function getBrowserInfo() {
    const ua = navigator.userAgent;
    const isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isEdge = /Edge/.test(ua);
    const isIE = /MSIE|Trident/.test(ua);
    
    return {
        name: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isEdge ? 'Edge' : isIE ? 'IE' : 'Unknown',
        isChrome,
        isFirefox,
        isSafari,
        isEdge,
        isIE,
        userAgent: ua,
        platform: navigator.platform,
        language: navigator.language
    };
}

/**
 * @description 检查是否移动设备
 * @returns {boolean} 是否移动设备
 */
export function isMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
}

/**
 * @description 睡眠
 * @param {number} ms - 毫秒数
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
    formatDate,
    formatMoney,
    formatNumber,
    generateId,
    generateUUID,
    deepClone,
    debounce,
    throttle,
    getQueryParam,
    getQueryParams,
    objectToQueryString,
    queryStringToObject,
    hexToRgb,
    rgbToHex,
    truncate,
    getFileExtension,
    getFileSize,
    getRelativeTime,
    getBrowserInfo,
    isMobile,
    sleep
};