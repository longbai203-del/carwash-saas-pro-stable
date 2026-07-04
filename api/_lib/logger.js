/**
 * api/_lib/logger.js - 日志工具
 */

// 日志级别
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

// 当前日志级别（从环境变量读取）
const CURRENT_LEVEL = process.env.LOG_LEVEL || 'info';
const LEVEL = LOG_LEVELS[CURRENT_LEVEL.toUpperCase()] ?? LOG_LEVELS.INFO;

/**
 * 格式化日志消息
 */
function formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (data) {
        return `${prefix} ${message}\n  Data: ${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
}

/**
 * 日志记录器
 */
export const logger = {
    debug(message, data = null) {
        if (LEVEL <= LOG_LEVELS.DEBUG) {
            console.debug(formatMessage('DEBUG', message, data));
        }
    },
    
    info(message, data = null) {
        if (LEVEL <= LOG_LEVELS.INFO) {
            console.info(formatMessage('INFO', message, data));
        }
    },
    
    warn(message, data = null) {
        if (LEVEL <= LOG_LEVELS.WARN) {
            console.warn(formatMessage('WARN', message, data));
        }
    },
    
    error(message, data = null) {
        if (LEVEL <= LOG_LEVELS.ERROR) {
            console.error(formatMessage('ERROR', message, data));
        }
    },
    
    /**
     * 记录 API 请求
     */
    api(req, res, duration) {
        const method = req.method;
        const url = req.url;
        const status = res.statusCode;
        const user = req.user?.username || 'anonymous';
        
        this.info(`API ${method} ${url} → ${status} (${duration}ms)`, {
            user,
            method,
            url,
            status,
            duration
        });
    },
    
    /**
     * 记录错误
     */
    errorWithContext(message, error, context = {}) {
        this.error(message, {
            error: error.message,
            stack: error.stack,
            ...context
        });
    }
};

/**
 * 性能计时器
 */
export function createTimer() {
    const start = Date.now();
    return {
        end() {
            return Date.now() - start;
        },
        log(message) {
            const duration = this.end();
            logger.debug(`${message} (${duration}ms)`);
            return duration;
        }
    };
}

/**
 * 创建请求上下文日志
 */
export function createRequestLogger(req) {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(2, 10);
    
    return {
        requestId,
        info(message, data = null) {
            logger.info(`[${requestId}] ${message}`, data);
        },
        error(message, data = null) {
            logger.error(`[${requestId}] ${message}`, data);
        },
        warn(message, data = null) {
            logger.warn(`[${requestId}] ${message}`, data);
        },
        finish(res) {
            const duration = Date.now() - start;
            logger.api(req, res, duration);
            return duration;
        }
    };
}

console.log('[Logger] ✅ 日志工具已加载');