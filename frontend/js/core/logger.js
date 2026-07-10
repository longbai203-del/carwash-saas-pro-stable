/**
 * @file logger.js
 * @module logger
 * @description 日志记录 - 统一的日志系统
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} level - 日志级别
 * @property {string} module - 模块名称
 * @property {string} message - 日志消息
 * @property {*} [data] - 附加数据
 * @property {string} timestamp - 时间戳
 * @property {string} sessionId - 会话ID
 * @property {string} userId - 用户ID
 */

/** @type {string} 当前日志级别 */
let logLevel = 'info';

/** @type {Array<LogEntry>} 日志存储 */
const logs = [];

/** @type {Array<Function>} 日志输出器 */
const outputs = [];

/** @type {string|null} 会话ID */
let sessionId = null;

/** @type {string|null} 用户ID */
let userId = null;

/**
 * @public
 * @description 日志级别
 */
export const LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

/**
 * @public
 * @description 设置日志级别
 * @param {string|number} level - 日志级别
 */
export function setLogLevel(level) {
    if (typeof level === 'string') {
        const map = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            none: 4
        };
        logLevel = map[level.toLowerCase()] ?? 1;
    } else {
        logLevel = level;
    }
}

/**
 * @public
 * @description 设置当前用户
 * @param {string} id - 用户ID
 */
export function setCurrentUser(id) {
    userId = id;
}

/**
 * @public
 * @description 获取会话ID
 * @returns {string} 会话ID
 */
function getSessionId() {
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    }
    return sessionId;
}

/**
 * @private
 * @description 创建日志条目
 * @param {string} level - 日志级别
 * @param {string} module - 模块名称
 * @param {string} message - 日志消息
 * @param {*} [data] - 附加数据
 * @returns {LogEntry} 日志条目
 */
function createLogEntry(level, module, message, data) {
    return {
        level,
        module,
        message,
        data,
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        userId: userId || null
    };
}

/**
 * @private
 * @description 输出日志
 * @param {LogEntry} entry - 日志条目
 */
function outputLog(entry) {
    const levelValue = LEVELS[entry.level.toUpperCase()] ?? 1;
    const currentLevel = typeof logLevel === 'string' ? LEVELS[logLevel.toUpperCase()] ?? 1 : logLevel;
    
    if (levelValue < currentLevel) return;
    
    // 存储日志
    logs.push(entry);
    if (logs.length > 1000) {
        logs.shift();
    }
    
    // 输出到控制台
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}]`;
    const message = `${prefix} ${entry.message}`;
    
    switch (entry.level.toLowerCase()) {
        case 'debug':
            console.debug(message, entry.data || '');
            break;
        case 'info':
            console.info(message, entry.data || '');
            break;
        case 'warn':
            console.warn(message, entry.data || '');
            break;
        case 'error':
            console.error(message, entry.data || '');
            break;
        default:
            console.log(message, entry.data || '');
    }
    
    // 输出到自定义输出器
    for (const output of outputs) {
        try {
            output(entry);
        } catch (e) {
            console.error('日志输出器执行失败:', e);
        }
    }
}

/**
 * @public
 * @description 添加日志输出器
 * @param {Function} output - 输出函数
 */
export function addOutput(output) {
    outputs.push(output);
}

/**
 * @public
 * @description DEBUG级别日志
 * @param {string} module - 模块名称
 * @param {string} message - 日志消息
 * @param {*} [data] - 附加数据
 */
export function debug(module, message, data) {
    outputLog(createLogEntry('debug', module, message, data));
}

/**
 * @public
 * @description INFO级别日志
 * @param {string} module - 模块名称
 * @param {string} message - 日志消息
 * @param {*} [data] - 附加数据
 */
export function info(module, message, data) {
    outputLog(createLogEntry('info', module, message, data));
}

/**
 * @public
 * @description WARN级别日志
 * @param {string} module - 模块名称
 * @param {string} message - 日志消息
 * @param {*} [data] - 附加数据
 */
export function warn(module, message, data) {
    outputLog(createLogEntry('warn', module, message, data));
}

/**
 * @public
 * @description ERROR级别日志
 * @param {string} module - 模块名称
 * @param {string} message - 日志消息
 * @param {*} [data] - 附加数据
 */
export function error(module, message, data) {
    outputLog(createLogEntry('error', module, message, data));
}

/**
 * @public
 * @description 获取所有日志
 * @param {Object} [filter] - 过滤条件
 * @param {string} [filter.level] - 日志级别
 * @param {string} [filter.module] - 模块名称
 * @param {string} [filter.startDate] - 开始日期
 * @param {string} [filter.endDate] - 结束日期
 * @returns {LogEntry[]} 日志列表
 */
export function getLogs(filter = {}) {
    let result = [...logs];
    
    if (filter.level) {
        result = result.filter(l => l.level === filter.level);
    }
    if (filter.module) {
        result = result.filter(l => l.module === filter.module);
    }
    if (filter.startDate) {
        result = result.filter(l => l.timestamp >= filter.startDate);
    }
    if (filter.endDate) {
        result = result.filter(l => l.timestamp <= filter.endDate);
    }
    
    return result;
}

/**
 * @public
 * @description 清空日志
 */
export function clearLogs() {
    logs.length = 0;
}

/**
 * @public
 * @description 导出日志
 * @param {Object} [filter] - 过滤条件
 * @returns {string} JSON字符串
 */
export function exportLogs(filter = {}) {
    const data = getLogs(filter);
    return JSON.stringify(data, null, 2);
}

/**
 * @public
 * @description 日志工具对象
 */
export const logger = {
    LEVELS,
    setLogLevel,
    setCurrentUser,
    addOutput,
    debug,
    info,
    warn,
    error,
    getLogs,
    clearLogs,
    exportLogs
};

export default logger;