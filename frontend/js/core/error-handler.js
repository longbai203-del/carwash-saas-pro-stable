/**
 * @file error-handler.js
 * @module error-handler
 * @description 错误处理 - 统一错误处理
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from './init.js';
import { logger } from './logger.js';

/** @type {Array<Function>} 错误处理器 */
const errorHandlers = [];

/** @type {boolean} 是否启用全局错误捕获 */
let globalErrorHandling = true;

/**
 * @public
 * @description 设置全局错误捕获
 * @param {boolean} enabled - 是否启用
 */
export function setGlobalErrorHandling(enabled) {
    globalErrorHandling = enabled;
    if (enabled) {
        setupGlobalErrorHandlers();
    } else {
        removeGlobalErrorHandlers();
    }
}

/**
 * @private
 * @description 设置全局错误处理器
 */
function setupGlobalErrorHandlers() {
    // 未捕获的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
        event.preventDefault();
        const error = event.reason;
        handleError(error, { source: 'unhandledrejection' });
    });
    
    // 未捕获的同步错误
    window.addEventListener('error', (event) => {
        if (event.error) {
            event.preventDefault();
            handleError(event.error, { 
                source: 'error', 
                filename: event.filename, 
                lineno: event.lineno, 
                colno: event.colno 
            });
        }
    });
}

/**
 * @private
 * @description 移除全局错误处理器
 */
function removeGlobalErrorHandlers() {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleErrorEvent);
}

/**
 * @private
 */
function handleUnhandledRejection(event) {
    event.preventDefault();
    handleError(event.reason, { source: 'unhandledrejection' });
}

/**
 * @private
 */
function handleErrorEvent(event) {
    if (event.error) {
        event.preventDefault();
        handleError(event.error, { 
            source: 'error', 
            filename: event.filename, 
            lineno: event.lineno, 
            colno: event.colno 
        });
    }
}

/**
 * @public
 * @description 添加错误处理器
 * @param {Function} handler - 处理器函数
 */
export function addErrorHandler(handler) {
    errorHandlers.push(handler);
}

/**
 * @public
 * @description 处理错误
 * @param {Error|string} error - 错误对象或消息
 * @param {Object} [context] - 上下文信息
 * @returns {void}
 */
export function handleError(error, context = {}) {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const message = errorObj.message || '未知错误';
    
    // 日志记录
    logger.error('error-handler', message, {
        error: errorObj,
        context,
        stack: errorObj.stack
    });
    
    // 显示Toast
    const userMessage = getUserFriendlyMessage(errorObj);
    showToast(userMessage, 'error');
    
    // 执行自定义处理器
    for (const handler of errorHandlers) {
        try {
            handler(errorObj, context);
        } catch (e) {
            console.error('错误处理器执行失败:', e);
        }
    }
    
    // 开发环境打印堆栈
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ 错误:', errorObj);
        console.error('📍 上下文:', context);
        console.error('📚 堆栈:', errorObj.stack);
    }
}

/**
 * @private
 * @description 获取用户友好的错误消息
 * @param {Error} error - 错误对象
 * @returns {string} 用户友好消息
 */
function getUserFriendlyMessage(error) {
    const status = error.status || error.statusCode;
    const code = error.code || error.errorCode;
    
    // 根据状态码返回消息
    if (status === 400) return '请求参数错误，请检查输入';
    if (status === 401) return '请重新登录后再试';
    if (status === 403) return '您没有权限执行此操作';
    if (status === 404) return '请求的资源不存在';
    if (status === 408) return '请求超时，请稍后重试';
    if (status === 409) return '数据冲突，请刷新后重试';
    if (status === 422) return '数据验证失败，请检查输入';
    if (status === 429) return '请求过于频繁，请稍后重试';
    if (status === 500) return '服务器内部错误，请稍后重试';
    if (status === 502) return '网关错误，请稍后重试';
    if (status === 503) return '服务暂时不可用，请稍后重试';
    
    // 根据错误码返回消息
    if (code === 'NETWORK_ERROR') return '网络连接失败，请检查网络';
    if (code === 'TIMEOUT') return '请求超时，请稍后重试';
    if (code === 'ABORTED') return '请求已被取消';
    
    // 默认返回错误消息
    return error.message || '操作失败，请稍后重试';
}

/**
 * @public
 * @description 创建自定义错误
 * @param {string} message - 错误消息
 * @param {number} status - 状态码
 * @param {string} code - 错误码
 * @returns {Error} 自定义错误
 */
export function createError(message, status, code) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
}

/**
 * @public
 * @description 捕获异步错误
 * @param {Function} fn - 异步函数
 * @param {Function} [onError] - 错误回调
 * @returns {Function} 包装后的函数
 */
export function catchAsync(fn, onError) {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            handleError(error);
            if (onError) {
                onError(error);
            }
            return null;
        }
    };
}

/**
 * @public
 * @description 错误处理对象
 */
export const errorHandler = {
    setGlobalErrorHandling,
    addErrorHandler,
    handleError,
    createError,
    catchAsync
};

// 默认启用全局错误捕获
setGlobalErrorHandling(true);

export default errorHandler;