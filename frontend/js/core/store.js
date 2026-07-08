/**
 * core/store.js - 统一状态管理 (V2)
 * @module store
 * @description 全局状态管理中心，支持持久化和订阅
 * 
 * @example
 * import { appStore } from './core/store.js';
 * // 设置状态
 * appStore.set('user', { name: '管理员', role: 'admin' });
 * // 获取状态
 * const user = appStore.get('user');
 * // 订阅变化
 * appStore.subscribe((state) => console.log('状态更新:', state));
 */

class Store {
    constructor() {
        /** @type {Object} 全局状态对象 */
        this.state = {
            user: null,
            tenant: null,
            store: null,
            cart: [],
            menuConfig: [],
            theme: 'light',
            notifications: [],
            currentModule: null,
            currentPage: null,
            isLoading: false
        };
        /** @type {Array<Function>} 状态变化监听器列表 */
        this.listeners = [];
        /** @type {Array<string>} 需要持久化的key列表 */
        this.persistKeys = ['user', 'tenant', 'cart', 'theme', 'menuConfig'];
        /** @type {boolean} 是否已初始化 */
        this.initialized = false;
    }

    /**
     * 初始化Store，从localStorage恢复数据
     * @returns {void}
     */
    init() {
        if (this.initialized) return;

        this.persistKeys.forEach(key => {
            const saved = localStorage.getItem(`store_${key}`);
            if (saved) {
                try {
                    this.state[key] = JSON.parse(saved);
                } catch (e) {
                    console.warn(`[Store] 恢复 ${key} 失败:`, e);
                }
            }
        });

        // 恢复主题
        if (this.state.theme) {
            document.documentElement.setAttribute('data-theme', this.state.theme);
        }

        this.initialized = true;
        console.log('[Store] ✅ 初始化完成');
    }

    /**
     * 获取状态值
     * @param {string} key - 状态键名
     * @returns {*} 对应的状态值
     */
    get(key) {
        return this.state[key];
    }

    /**
     * 获取完整状态
     * @returns {Object} 完整状态对象
     */
    getState() {
        return this.state;
    }

    /**
     * 设置状态值
     * @param {string} key - 状态键名
     * @param {*} value - 状态值
     * @param {boolean} [persist=true] - 是否持久化
     * @returns {void}
     */
    set(key, value, persist = true) {
        this.state[key] = value;
        if (persist && this.persistKeys.includes(key)) {
            try {
                localStorage.setItem(`store_${key}`, JSON.stringify(value));
            } catch (e) {
                console.warn(`[Store] 持久化 ${key} 失败:`, e);
            }
        }
        this.notify();
    }

    /**
     * 批量更新状态
     * @param {Object} newState - 要更新的状态对象
     * @returns {void}
     */
    update(newState) {
        Object.keys(newState).forEach(key => {
            this.state[key] = newState[key];
            if (this.persistKeys.includes(key)) {
                try {
                    localStorage.setItem(`store_${key}`, JSON.stringify(newState[key]));
                } catch (e) {
                    console.warn(`[Store] 持久化 ${key} 失败:`, e);
                }
            }
        });
        this.notify();
    }

    /**
     * 订阅状态变化
     * @param {Function} callback - 回调函数，接收当前state作为参数
     * @returns {Function} 取消订阅函数
     */
    subscribe(callback) {
        this.listeners.push(callback);
        // 立即执行一次，同步当前状态
        try {
            callback(this.state);
        } catch (e) {
            console.error('[Store] 初始订阅执行失败:', e);
        }
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * 通知所有监听器
     * @private
     */
    notify() {
        this.listeners.forEach(cb => {
            try {
                cb(this.state);
            } catch (e) {
                console.error('[Store] 通知错误:', e);
            }
        });
    }

    /**
     * 清空所有状态 (登出时使用)
     * @returns {void}
     */
    clear() {
        this.state = {
            user: null,
            tenant: null,
            store: null,
            cart: [],
            menuConfig: [],
            theme: 'light',
            notifications: [],
            currentModule: null,
            currentPage: null,
            isLoading: false
        };
        this.persistKeys.forEach(key => {
            try {
                localStorage.removeItem(`store_${key}`);
            } catch (e) {
                console.warn(`[Store] 清除 ${key} 失败:`, e);
            }
        });
        this.notify();
        console.log('[Store] 🧹 已清空所有状态');
    }

    /**
     * 切换主题
     * @param {string} theme - 'light' 或 'dark'
     * @returns {void}
     */
    toggleTheme(theme) {
        const newTheme = theme || (this.state.theme === 'light' ? 'dark' : 'light');
        this.set('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    }
}

// 导出单例
export const appStore = new Store();