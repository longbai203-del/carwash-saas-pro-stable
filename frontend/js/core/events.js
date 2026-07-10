/**
 * @file events.js
 * @module events
 * @description 事件总线 - 应用事件通信
 * 
 * @example
 * import { eventBus } from './events.js';
 * eventBus.on('user:login', (user) => console.log(user));
 * eventBus.emit('user:login', { name: 'Admin' });
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

/** @type {Map<string, Array<Function>>} 事件监听器 */
const listeners = new Map();

/** @type {Map<string, any>} 事件缓存 */
const eventCache = new Map();

/** @type {boolean} 是否启用调试模式 */
let debugMode = false;

/**
 * @public
 * @description 设置调试模式
 * @param {boolean} enabled - 是否启用
 */
export function setDebugMode(enabled) {
    debugMode = enabled;
}

/**
 * @public
 * @description 注册事件监听
 * @param {string} event - 事件名称
 * @param {Function} callback - 回调函数
 * @param {Object} [options] - 选项
 * @param {boolean} [options.once] - 是否只执行一次
 * @param {number} [options.priority] - 优先级（数字越大越先执行）
 * @returns {Function} 取消监听函数
 */
export function on(event, callback, options = {}) {
    if (!listeners.has(event)) {
        listeners.set(event, []);
    }
    
    const entry = {
        callback,
        once: options.once || false,
        priority: options.priority || 0
    };
    
    const eventListeners = listeners.get(event);
    eventListeners.push(entry);
    // 按优先级排序
    eventListeners.sort((a, b) => b.priority - a.priority);
    
    // 如果有缓存事件，立即执行
    if (eventCache.has(event)) {
        const cached = eventCache.get(event);
        if (cached.args) {
            callback(...cached.args);
        } else {
            callback(cached);
        }
        if (options.once) {
            off(event, callback);
        }
    }
    
    if (debugMode) {
        console.log(`📢 事件注册: ${event}`, { options });
    }
    
    return () => off(event, callback);
}

/**
 * @public
 * @description 移除事件监听
 * @param {string} event - 事件名称
 * @param {Function} [callback] - 回调函数
 */
export function off(event, callback) {
    if (!callback) {
        listeners.delete(event);
        if (debugMode) {
            console.log(`📢 移除所有事件: ${event}`);
        }
        return;
    }
    
    const eventListeners = listeners.get(event);
    if (!eventListeners) return;
    
    const index = eventListeners.findIndex(entry => entry.callback === callback);
    if (index > -1) {
        eventListeners.splice(index, 1);
        if (eventListeners.length === 0) {
            listeners.delete(event);
        }
        if (debugMode) {
            console.log(`📢 移除事件: ${event}`);
        }
    }
}

/**
 * @public
 * @description 触发事件
 * @param {string} event - 事件名称
 * @param {...any} args - 参数
 * @param {Object} [options] - 选项
 * @param {boolean} [options.cache] - 是否缓存事件
 * @param {number} [options.delay] - 延迟执行（毫秒）
 * @returns {Promise<Array<any>>} 执行结果
 */
export async function emit(event, ...args) {
    const options = args[args.length - 1]?.cache !== undefined ? args.pop() : {};
    
    if (debugMode) {
        console.log(`📢 触发事件: ${event}`, args);
    }
    
    // 缓存事件
    if (options.cache) {
        eventCache.set(event, { args });
    }
    
    const eventListeners = listeners.get(event);
    if (!eventListeners || eventListeners.length === 0) {
        return [];
    }
    
    const results = [];
    const delayedListeners = [];
    
    for (const entry of eventListeners) {
        if (options.delay) {
            delayedListeners.push(entry);
        } else {
            try {
                const result = await entry.callback(...args);
                results.push(result);
            } catch (error) {
                console.error(`事件处理错误 (${event}):`, error);
                results.push({ error: error.message });
            }
        }
    }
    
    // 处理延迟执行
    if (delayedListeners.length > 0 && options.delay) {
        return new Promise((resolve) => {
            setTimeout(async () => {
                for (const entry of delayedListeners) {
                    try {
                        const result = await entry.callback(...args);
                        results.push(result);
                    } catch (error) {
                        console.error(`事件处理错误 (${event}):`, error);
                        results.push({ error: error.message });
                    }
                }
                resolve(results);
            }, options.delay);
        });
    }
    
    // 清理一次性监听器
    for (const entry of eventListeners) {
        if (entry.once) {
            off(event, entry.callback);
        }
    }
    
    return results;
}

/**
 * @public
 * @description 一次性监听
 * @param {string} event - 事件名称
 * @param {Function} callback - 回调函数
 * @param {Object} [options] - 选项
 * @returns {Function} 取消监听函数
 */
export function once(event, callback, options = {}) {
    return on(event, callback, { ...options, once: true });
}

/**
 * @public
 * @description 清除所有事件
 */
export function clearAll() {
    listeners.clear();
    eventCache.clear();
    if (debugMode) {
        console.log('📢 清除所有事件');
    }
}

/**
 * @public
 * @description 获取事件监听器数量
 * @param {string} [event] - 事件名称
 * @returns {number} 监听器数量
 */
export function listenerCount(event) {
    if (event) {
        return (listeners.get(event) || []).length;
    }
    let count = 0;
    for (const [, eventListeners] of listeners) {
        count += eventListeners.length;
    }
    return count;
}

/**
 * @public
 * @description 获取所有事件名称
 * @returns {string[]} 事件名称列表
 */
export function getEventNames() {
    return Array.from(listeners.keys());
}

/**
 * @public
 * @description 事件总线对象
 */
export const eventBus = {
    on,
    off,
    emit,
    once,
    clearAll,
    listenerCount,
    getEventNames,
    setDebugMode
};

export default eventBus;