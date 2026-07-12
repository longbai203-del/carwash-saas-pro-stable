/**
 * 错误处理中间件
 * 统一处理应用错误
 * 
 * @module middleware/errorHandler
 * 
 * @example
 * import { errorHandler, AppError } from './middleware/errorHandler.js'
 * throw new AppError('Resource not found', 404)
 */

/**
 * 应用错误类
 * 用于抛出可预测的业务错误
 */
export class AppError extends Error {
    /**
     * 创建应用错误
     * @param {string} message - 错误消息
     * @param {number} statusCode - HTTP状态码
     * @param {string} code - 错误代码
     * @param {Object} details - 额外详情
     */
    constructor(message, statusCode = 400, code = 'BAD_REQUEST', details = null) {
      super(message)
      this.name = 'AppError'
      this.statusCode = statusCode
      this.code = code
      this.details = details
      this.isOperational = true
    }
  }
  
  /**
   * 错误处理中间件
   * 
   * @param {Error} err - 错误对象
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件
   * @returns {void}
   */
  export function errorHandler(err, req, res, next) {
    // 记录错误
    console.error(`[Error] ${err.name}: ${err.message}`)
    if (err.stack) {
      console.error(err.stack)
    }
  
    // 如果是应用错误
    if (err.isOperational) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: err.code || 'BAD_REQUEST',
        message: err.message,
        details: err.details || null
      })
    }
  
    // 如果是JWT错误
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or malformed token'
      })
    }
  
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      })
    }
  
    // 如果是数据库错误
    if (err.code && err.code.startsWith('23')) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_ENTRY',
        message: 'Duplicate entry found'
      })
    }
  
    // 默认错误响应
    const isProduction = process.env.NODE_ENV === 'production'
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message,
      ...(isProduction ? {} : { stack: err.stack })
    })
  }
  
  /**
   * 404错误处理中间件
   * 
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - 下一个中间件
   * @returns {void}
   */
  export function notFoundHandler(req, res, next) {
    const error = new AppError(
      `Route not found: ${req.method} ${req.url}`,
      404,
      'NOT_FOUND'
    )
    next(error)
  }
  
  /**
   * 异步错误捕获包装器
   * 用于捕获异步函数中的错误并传递给错误处理中间件
   * 
   * @param {Function} fn - 异步函数
   * @returns {Function} 包装后的函数
   * 
   * @example
   * router.get('/users', catchAsync(async (req, res) => {
   *   const users = await userService.findAll()
   *   res.json({ success: true, data: users })
   * }))
   */
  export function catchAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next)
    }
  }
  
  /**
   * 验证错误创建
   * @param {Object} errors - 验证错误对象
   * @returns {AppError} 验证错误
   */
  export function createValidationError(errors) {
    return new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      errors
    )
  }
  
  export default {
    AppError,
    errorHandler,
    notFoundHandler,
    catchAsync,
    createValidationError
  }