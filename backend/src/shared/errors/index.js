/**
 * 错误定义模块
 * 统一错误码和错误响应格式
 * 
 * @module shared/errors
 * 
 * @example
 * import { AppError, ErrorCodes } from '../shared/errors/index.js'
 * throw new AppError(ErrorCodes.NOT_FOUND, 'Customer not found')
 */

/**
 * 错误码定义
 */
export const ErrorCodes = {
    // 通用错误 (1000-1999)
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMITED: 'RATE_LIMITED',
  
    // 业务错误 (2000-2999)
    CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
    INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
    INVALID_ORDER_STATUS: 'INVALID_ORDER_STATUS',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
    // 支付错误 (3000-3999)
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    PAYMENT_REFUND_FAILED: 'PAYMENT_REFUND_FAILED',
    INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
  
    // 认证错误 (4000-4999)
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
  
    // 数据库错误 (5000-5999)
    DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
    DB_QUERY_FAILED: 'DB_QUERY_FAILED',
    DB_CONSTRAINT_VIOLATED: 'DB_CONSTRAINT_VIOLATED'
  }
  
  /**
   * 错误HTTP状态码映射
   */
  export const ErrorStatusMap = {
    [ErrorCodes.INTERNAL_ERROR]: 500,
    [ErrorCodes.BAD_REQUEST]: 400,
    [ErrorCodes.NOT_FOUND]: 404,
    [ErrorCodes.UNAUTHORIZED]: 401,
    [ErrorCodes.FORBIDDEN]: 403,
    [ErrorCodes.VALIDATION_ERROR]: 400,
    [ErrorCodes.RATE_LIMITED]: 429,
    [ErrorCodes.CUSTOMER_NOT_FOUND]: 404,
    [ErrorCodes.ORDER_NOT_FOUND]: 404,
    [ErrorCodes.PRODUCT_NOT_FOUND]: 404,
    [ErrorCodes.INSUFFICIENT_STOCK]: 400,
    [ErrorCodes.INVALID_ORDER_STATUS]: 400,
    [ErrorCodes.DUPLICATE_ENTRY]: 409,
    [ErrorCodes.PAYMENT_FAILED]: 400,
    [ErrorCodes.PAYMENT_REFUND_FAILED]: 400,
    [ErrorCodes.INVALID_PAYMENT_METHOD]: 400,
    [ErrorCodes.INVALID_TOKEN]: 401,
    [ErrorCodes.TOKEN_EXPIRED]: 401,
    [ErrorCodes.INVALID_CREDENTIALS]: 401,
    [ErrorCodes.PERMISSION_DENIED]: 403,
    [ErrorCodes.DB_CONNECTION_FAILED]: 500,
    [ErrorCodes.DB_QUERY_FAILED]: 500,
    [ErrorCodes.DB_CONSTRAINT_VIOLATED]: 409
  }
  
  /**
   * 应用错误类
   */
  export class AppError extends Error {
    /**
     * 创建应用错误
     * @param {string} code - 错误码
     * @param {string} message - 错误消息
     * @param {Object} details - 额外详情
     */
    constructor(code, message, details = null) {
      super(message)
      this.name = 'AppError'
      this.code = code
      this.statusCode = ErrorStatusMap[code] || 500
      this.details = details
      this.isOperational = true
      this.timestamp = new Date().toISOString()
    }
  
    /**
     * 转换为JSON
     * @returns {Object} JSON对象
     */
    toJSON() {
      return {
        success: false,
        error: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    }
  
    /**
     * 创建验证错误
     * @param {Object} errors - 验证错误对象
     * @returns {AppError} 验证错误
     */
    static validation(errors) {
      return new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        errors
      )
    }
  
    /**
     * 创建未找到错误
     * @param {string} resource - 资源名称
     * @returns {AppError} 未找到错误
     */
    static notFound(resource) {
      return new AppError(
        ErrorCodes.NOT_FOUND,
        `${resource} not found`
      )
    }
  
    /**
     * 创建未授权错误
     * @param {string} message - 错误消息
     * @returns {AppError} 未授权错误
     */
    static unauthorized(message = 'Unauthorized') {
      return new AppError(
        ErrorCodes.UNAUTHORIZED,
        message
      )
    }
  
    /**
     * 创建禁止访问错误
     * @param {string} message - 错误消息
     * @returns {AppError} 禁止访问错误
     */
    static forbidden(message = 'Forbidden') {
      return new AppError(
        ErrorCodes.FORBIDDEN,
        message
      )
    }
  }
  
  export default {
    ErrorCodes,
    ErrorStatusMap,
    AppError
  }