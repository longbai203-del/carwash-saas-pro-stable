/**
 * 日志工具
 * 统一日志记录
 * 
 * @module lib/logger
 * 
 * @example
 * import { logger } from '../lib/logger.js'
 * logger.info('应用启动成功')
 * logger.error('发生错误', { error: err })
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.resolve(__dirname, '../../../logs');

/**
 * 日志级别
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

/**
 * 日志级别名称
 */
export const LOG_LEVEL_NAMES = {
  [LOG_LEVELS.DEBUG]: 'DEBUG',
  [LOG_LEVELS.INFO]: 'INFO',
  [LOG_LEVELS.WARN]: 'WARN',
  [LOG_LEVELS.ERROR]: 'ERROR',
  [LOG_LEVELS.FATAL]: 'FATAL',
};

/**
 * 颜色映射
 */
const COLORS = {
  DEBUG: '\x1b[36m',   // Cyan
  INFO: '\x1b[32m',    // Green
  WARN: '\x1b[33m',    // Yellow
  ERROR: '\x1b[31m',   // Red
  FATAL: '\x1b[41m',   // Red background
  RESET: '\x1b[0m',
};

/**
 * 日志类
 */
class Logger {
  /**
   * 创建日志实例
   * @param {Object} options - 配置选项
   * @param {string} options.name - 日志名称
   * @param {number} options.level - 日志级别
   * @param {boolean} options.enableFile - 是否写入文件
   * @param {string} options.logDir - 日志目录
   */
  constructor(options = {}) {
    this.name = options.name || 'app';
    this.level = options.level || LOG_LEVELS.INFO;
    this.enableFile = options.enableFile || false;
    this.logDir = options.logDir || logsDir;

    // 确保日志目录存在
    if (this.enableFile) {
      this.ensureLogDir();
    }
  }

  /**
   * 确保日志目录存在
   */
  async ensureLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch {
      // 目录可能已存在
    }
  }

  /**
   * 获取日志文件路径
   * @param {Date} date - 日期
   * @returns {string} 文件路径
   */
  getLogFilePath(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    return path.join(this.logDir, `${this.name}-${dateStr}.log`);
  }

  /**
   * 格式化日志消息
   * @param {number} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @returns {string} 格式化后的日志
   */
  format(level, message, meta = null) {
    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level] || 'UNKNOWN';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${levelName} [${this.name}] ${message}${metaStr}`;
  }

  /**
   * 格式化带颜色的日志
   * @param {number} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @returns {string} 带颜色的日志
   */
  formatColor(level, message, meta = null) {
    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level] || 'UNKNOWN';
    const color = COLORS[levelName] || COLORS.RESET;
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${color}[${timestamp}] ${levelName} [${this.name}] ${message}${metaStr}${COLORS.RESET}`;
  }

  /**
   * 写入日志文件
   * @param {string} formatted - 格式化后的日志
   */
  async writeToFile(formatted) {
    if (!this.enableFile) return;

    try {
      const filePath = this.getLogFilePath();
      await fs.appendFile(filePath, `${formatted}\n`, 'utf8');
    } catch {
      // 写入失败，静默处理
    }
  }

  /**
   * 记录日志
   * @param {number} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  log(level, message, meta = null) {
    if (level < this.level) return;

    const formatted = this.format(level, message, meta);
    const formattedColor = this.formatColor(level, message, meta);

    // 输出到控制台
    console.log(formattedColor);

    // 写入文件
    this.writeToFile(formatted);
  }

  /**
   * 调试日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  debug(message, meta = null) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  /**
   * 信息日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  info(message, meta = null) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  /**
   * 警告日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  warn(message, meta = null) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  /**
   * 错误日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  error(message, meta = null) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  /**
   * 致命日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  fatal(message, meta = null) {
    this.log(LOG_LEVELS.FATAL, message, meta);
  }

  /**
   * 创建子日志器
   * @param {string} name - 子日志器名称
   * @returns {Logger} 子日志器
   */
  child(name) {
    return new Logger({
      name: `${this.name}:${name}`,
      level: this.level,
      enableFile: this.enableFile,
      logDir: this.logDir,
    });
  }

  /**
   * 获取日志统计
   * @returns {Promise<Object>} 日志统计
   */
  async getStats() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(f => f.startsWith(this.name) && f.endsWith('.log'));
      
      let totalSize = 0;
      let totalLines = 0;
      
      for (const file of logFiles) {
        const stats = await fs.stat(path.join(this.logDir, file));
        totalSize += stats.size;
        
        const content = await fs.readFile(path.join(this.logDir, file), 'utf8');
        totalLines += content.split('\n').filter(line => line.trim()).length;
      }

      return {
        files: logFiles.length,
        totalSize: totalSize,
        totalLines: totalLines,
        logDir: this.logDir,
      };
    } catch {
      return {
        files: 0,
        totalSize: 0,
        totalLines: 0,
        logDir: this.logDir,
      };
    }
  }

  /**
   * 清理旧日志
   * @param {number} days - 保留天数
   * @returns {Promise<number>} 清理的文件数
   */
  async cleanOldLogs(days = 30) {
    try {
      const files = await fs.readdir(this.logDir);
      const now = Date.now();
      const maxAge = days * 24 * 60 * 60 * 1000;
      let cleaned = 0;

      for (const file of files) {
        if (!file.startsWith(this.name) || !file.endsWith('.log')) continue;
        
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          cleaned++;
        }
      }

      return cleaned;
    } catch {
      return 0;
    }
  }
}

// 创建默认日志器
const logger = new Logger({
  name: 'carwash',
  level: process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL] : LOG_LEVELS.INFO,
  enableFile: process.env.LOG_TO_FILE === 'true',
});

// 创建请求日志器
const requestLogger = logger.child('request');

export { Logger, logger, requestLogger };
export default logger;