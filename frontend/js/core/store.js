/**
 * @file store.js
 * @module core/store
 * @description 应用全局状态管理 - 支持持久化、订阅和响应式更新
 * 
 * @example
 * // 设置状态
 * import { store } from './store.js';
 * store.set('user', { id: 1, name: '张三' });
 * 
 * // 获取状态
 * const user = store.get('user');
 * 
 * // 订阅状态变化
 * store.subscribe('user', (newVal, oldVal) => {
 *   console.log('用户信息已更新', newVal);
 * });
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} StoreState
 * @property {any} [key] - 任意键值对
 */

/**
 * @typedef {function(any, any): void} StoreListener
 * @param {any} newValue - 新的值
 * @param {any} oldValue - 旧的值
 */

/**
 * @typedef {Object} StoreExport
 * @property {Object} state - 当前状态
 * @property {string[]} keys - 所有键名
 * @property {string[]} listeners - 所有监听器键名
 */

class Store {
    /**
     * @constructor
     * @description 创建Store实例，自动从localStorage恢复持久化状态
     */
    constructor() {
        /**
         * @private
         * @type {Object<string, any>}
         * @description 状态存储对象
         */
        this.state = {};

        /**
         * @private
         * @type {Object<string, StoreListener[]>}
         * @description 监听器映射表
         */
        this.listeners = {};

        /**
         * @private
         * @type {string[]}
         * @description 需要持久化到localStorage的键名列表
         */
        this.persistedKeys = [
            'authToken', 
            'user', 
            'theme', 
            'language', 
            'tenantId', 
            'businessId',
            'sidebarCollapsed',
            'cart'
        ];

        /**
         * @private
         * @type {boolean}
         * @description 是否已初始化
         */
        this.initialized = false;

        // 从本地存储恢复状态
        this.loadFromStorage();

        // 绑定方法
        this.set = this.set.bind(this);
        this.get = this.get.bind(this);
        this.remove = this.remove.bind(this);
        this.clear = this.clear.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
        this.emit = this.emit.bind(this);

        this.initialized = true;
    }

    /**
     * @private
     * @description 从localStorage恢复持久化状态
     */
    loadFromStorage() {
        try {
            for (const key of this.persistedKeys) {
                const value = localStorage.getItem(`store_${key}`);
                if (value !== null) {
                    try {
                        this.state[key] = JSON.parse(value);
                    } catch {
                        this.state[key] = value;
                    }
                }
            }
        } catch (error) {
            console.warn('从本地存储恢复状态失败:', error);
        }
    }

    /**
     * @private
     * @param {string} key - 状态键名
     * @param {any} value - 状态值
     * @description 保存到localStorage
     */
    saveToStorage(key, value) {
        try {
            if (this.persistedKeys.includes(key)) {
                localStorage.setItem(`store_${key}`, JSON.stringify(value));
            }
        } catch (error) {
            console.warn(`保存状态到本地存储失败 (${key}):`, error);
        }
    }

    /**
     * @public
     * @param {string} key - 状态键名
     * @param {any} value - 状态值
     * @param {boolean} [silent=false] - 是否静默更新（不触发监听器）
     * @returns {any} 设置的值
     * @description 设置状态值
     * 
     * @example
     * store.set('user', { id: 1, name: '张三' });
     * store.set('theme', 'dark', true); // 静默更新
     */
    set(key, value, silent = false) {
        const oldValue = this.state[key];
        this.state[key] = value;
        this.saveToStorage(key, value);

        if (!silent) {
            this.emit(key, value, oldValue);
        }

        return value;
    }

    /**
     * @public
     * @param {Object} updates - 批量更新的键值对
     * @param {boolean} [silent=false] - 是否静默更新
     * @returns {Object} 更新的数据
     * @description 批量设置状态
     * 
     * @example
     * store.setMultiple({
     *   user: { id: 1 },
     *   theme: 'dark',
     *   language: 'zh-CN'
     * });
     */
    setMultiple(updates, silent = false) {
        const oldValues = {};
        for (const [key, value] of Object.entries(updates)) {
            oldValues[key] = this.state[key];
            this.state[key] = value;
            this.saveToStorage(key, value);
        }

        if (!silent) {
            for (const [key, value] of Object.entries(updates)) {
                this.emit(key, value, oldValues[key]);
            }
        }

        return updates;
    }

    /**
     * @public
     * @param {string} key - 状态键名
     * @param {any} [defaultValue=null] - 默认值
     * @returns {any} 状态值
     * @description 获取状态值
     * 
     * @example
     * const user = store.get('user');
     * const theme = store.get('theme', 'light');
     */
    get(key, defaultValue = null) {
        return key in this.state ? this.state[key] : defaultValue;
    }

    /**
     * @public
     * @returns {Object} 所有状态的副本
     * @description 获取所有状态
     * 
     * @example
     * const allState = store.getAll();
     */
    getAll() {
        return { ...this.state };
    }

    /**
     * @public
     * @param {string} key - 状态键名
     * @description 移除状态
     * 
     * @example
     * store.remove('authToken');
     */
    remove(key) {
        delete this.state[key];
        try {
            localStorage.removeItem(`store_${key}`);
        } catch (error) {
            // 忽略
        }
        this.emit(key, undefined, null);
    }

    /**
     * @public
     * @param {string[]} [except=[]] - 保留的键名列表
     * @description 清空所有状态（保留部分关键状态）
     * 
     * @example
     * store.clear(['authToken', 'user']); // 保留认证信息
     */
    clear(except = []) {
        const keysToRemove = Object.keys(this.state).filter(key => !except.includes(key));
        for (const key of keysToRemove) {
            delete this.state[key];
            try {
                localStorage.removeItem(`store_${key}`);
            } catch (error) {
                // 忽略
            }
        }

        // 触发全局清除事件
        this.emit('store:cleared', keysToRemove);
    }

    /**
     * @public
     * @param {string} key - 状态键名
     * @param {StoreListener} callback - 回调函数 (newValue, oldValue) => void
     * @returns {Function} 取消订阅函数
     * @description 订阅状态变化
     * 
     * @example
     * const unsubscribe = store.subscribe('user', (newUser, oldUser) => {
     *   console.log('用户从', oldUser, '变为', newUser);
     * });
     * // 取消订阅
     * unsubscribe();
     */
    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);

        // 返回取消订阅函数
        return () => this.unsubscribe(key, callback);
    }

    /**
     * @public
     * @param {string} key - 状态键名
     * @param {StoreListener} callback - 要移除的回调函数
     * @description 取消订阅
     */
    unsubscribe(key, callback) {
        if (this.listeners[key]) {
            this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
            if (this.listeners[key].length === 0) {
                delete this.listeners[key];
            }
        }
    }

    /**
     * @public
     * @param {string} key - 状态键名
     * @param {any} newValue - 新值
     * @param {any} oldValue - 旧值
     * @description 触发状态变化事件
     */
    emit(key, newValue, oldValue) {
        // 触发特定键的监听器
        if (this.listeners[key]) {
            for (const callback of this.listeners[key]) {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`状态监听器执行失败 (${key}):`, error);
                }
            }
        }

        // 触发通配符监听器
        if (this.listeners['*']) {
            for (const callback of this.listeners['*']) {
                try {
                    callback(key, newValue, oldValue);
                } catch (error) {
                    console.error('通配符监听器执行失败:', error);
                }
            }
        }

        // 触发全局事件
        const event = new CustomEvent('store:change', {
            detail: { key, newValue, oldValue }
        });
        document.dispatchEvent(event);
    }

    /**
     * @public
     * @param {string} key - 状态键名
     * @param {function(any): boolean} predicate - 判断函数
     * @param {number} [timeout=5000] - 超时时间(ms)
     * @returns {Promise<any>} 满足条件的值
     * @description 等待状态变化满足条件
     * 
     * @example
     * const user = await store.waitFor('user', u => u !== null);
     */
    waitFor(key, predicate, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            // 检查当前值
            const currentValue = this.get(key);
            if (predicate(currentValue)) {
                resolve(currentValue);
                return;
            }

            // 监听变化
            const unsubscribe = this.subscribe(key, (newValue) => {
                if (predicate(newValue)) {
                    unsubscribe();
                    resolve(newValue);
                }
            });

            // 超时处理
            const checkTimeout = () => {
                if (Date.now() - startTime > timeout) {
                    unsubscribe();
                    reject(new Error(`等待状态 "${key}" 超时`));
                } else {
                    setTimeout(checkTimeout, 100);
                }
            };
            checkTimeout();
        });
    }

    /**
     * @public
     * @returns {StoreExport} 状态导出
     * @description 导出状态（用于调试）
     */
    export() {
        return {
            state: { ...this.state },
            keys: Object.keys(this.state),
            listeners: Object.keys(this.listeners)
        };
    }

    /**
     * @public
     * @param {Object} data - 要导入的数据
     * @description 导入状态（用于调试/恢复）
     */
    import(data) {
        for (const [key, value] of Object.entries(data)) {
            this.set(key, value, true);
        }
    }

    /**
     * @public
     * @description 重置为初始状态（保留认证信息）
     */
    reset() {
        const preserved = ['authToken', 'user', 'theme', 'language'];
        const preservedValues = {};
        for (const key of preserved) {
            if (key in this.state) {
                preservedValues[key] = this.state[key];
            }
        }

        this.clear();

        for (const [key, value] of Object.entries(preservedValues)) {
            this.set(key, value);
        }
    }
}

// 创建单例实例
/**
 * @global
 * @type {Store}
 * @description 全局Store实例
 */
export const store = new Store();

// 全局暴露
if (typeof window !== 'undefined') {
    window.store = store;
}

export default store;