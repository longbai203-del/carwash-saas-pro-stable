/**
 * @file i18n.js
 * @module i18n
 * @description 国际化 - 多语言支持
 * 
 * @example
 * import { i18n } from './i18n.js';
 * i18n.setLocale('en');
 * const text = i18n.t('welcome');
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} Locale
 * @property {string} code - 语言代码
 * @property {string} name - 语言名称
 * @property {Object} translations - 翻译内容
 */

/** @type {string} 当前语言 */
let currentLocale = 'zh-CN';

/** @type {Object} 语言包 */
let translations = {};

/** @type {Array<Locale>} 支持的语言列表 */
const supportedLocales = [];

/** @type {Array<Function>} 语言变化监听器 */
const listeners = [];

/**
 * @public
 * @description 添加语言包
 * @param {string} code - 语言代码
 * @param {string} name - 语言名称
 * @param {Object} translations - 翻译内容
 */
export function addLocale(code, name, translationsData) {
    supportedLocales.push({ code, name, translations: translationsData });
    if (code === currentLocale) {
        translations = translationsData;
    }
}

/**
 * @public
 * @description 设置当前语言
 * @param {string} code - 语言代码
 */
export function setLocale(code) {
    const locale = supportedLocales.find(l => l.code === code);
    if (!locale) {
        console.warn(`语言 "${code}" 不存在`);
        return;
    }
    
    currentLocale = code;
    translations = locale.translations;
    
    // 持久化
    try {
        localStorage.setItem('i18n_locale', code);
    } catch (e) {}
    
    // 通知监听器
    for (const listener of listeners) {
        try {
            listener(code);
        } catch (e) {
            console.error('语言变化监听器执行失败:', e);
        }
    }
    
    console.log(`🌐 语言切换: ${code}`);
}

/**
 * @public
 * @description 获取当前语言
 * @returns {string} 当前语言代码
 */
export function getLocale() {
    return currentLocale;
}

/**
 * @public
 * @description 获取支持的语言列表
 * @returns {Locale[]} 语言列表
 */
export function getLocales() {
    return supportedLocales;
}

/**
 * @public
 * @description 翻译文本
 * @param {string} key - 翻译键
 * @param {Object} [params] - 参数
 * @param {string} [defaultValue] - 默认值
 * @returns {string} 翻译后的文本
 */
export function t(key, params = {}, defaultValue) {
    // 支持嵌套路径，如 'user.name'
    const parts = key.split('.');
    let value = translations;
    for (const part of parts) {
        if (value && value[part] !== undefined) {
            value = value[part];
        } else {
            value = undefined;
            break;
        }
    }
    
    if (value === undefined) {
        return defaultValue || key;
    }
    
    // 替换参数
    let result = value;
    for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue);
    }
    
    return result;
}

/**
 * @public
 * @description 添加语言变化监听
 * @param {Function} callback - 回调函数
 * @returns {Function} 取消监听函数
 */
export function onLocaleChange(callback) {
    listeners.push(callback);
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}

/**
 * @public
 * @description 加载语言包（异步）
 * @param {string} code - 语言代码
 * @param {Function} loader - 加载函数
 * @returns {Promise<void>}
 */
export async function loadLocale(code, loader) {
    try {
        const data = await loader();
        addLocale(code, code, data);
        if (code === currentLocale) {
            setLocale(code);
        }
    } catch (error) {
        console.error(`加载语言包失败 (${code}):`, error);
    }
}

/**
 * @public
 * @description 初始化国际化
 * @param {string} [defaultLocale] - 默认语言
 */
export function init(defaultLocale = 'zh-CN') {
    // 从存储恢复
    try {
        const saved = localStorage.getItem('i18n_locale');
        if (saved && supportedLocales.some(l => l.code === saved)) {
            currentLocale = saved;
        } else {
            currentLocale = defaultLocale;
        }
    } catch (e) {}
    
    const locale = supportedLocales.find(l => l.code === currentLocale);
    if (locale) {
        translations = locale.translations;
    }
    
    console.log(`🌐 国际化初始化完成，当前语言: ${currentLocale}`);
}

// 初始化
init();

/**
 * @public
 * @description 国际化对象
 */
export const i18n = {
    addLocale,
    setLocale,
    getLocale,
    getLocales,
    t,
    onLocaleChange,
    loadLocale,
    init
};

export default i18n;