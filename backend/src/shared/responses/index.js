/**
 * 统一响应模块
 * 标准化的 API 响应格式
 * 
 * @module responses
 * 
 * @example
 * import { success, error, paginated } from '../responses/index.js'
 * res.json(success(data))
 */

/**
 * 成功响应
 * @param {*} data - 响应数据
 * @param {string} message - 成功消息
 * @param {Object} meta - 元数据
 * @returns {Object} 响应对象
 */
export function success(data, message = '操作成功', meta = {}) {
    return {
      success: true,
      code: 'SUCCESS',
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 分页响应
   * @param {Array} data - 数据列表
   * @param {Object} pagination - 分页信息
   * @param {string} message - 成功消息
   * @returns {Object} 响应对象
   */
  export function paginated(data, pagination, message = '获取成功') {
    return {
      success: true,
      code: 'SUCCESS',
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        total: pagination.total || 0,
        totalPages: pagination.totalPages || Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false,
      },
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 创建成功响应
   * @param {*} data - 响应数据
   * @param {string} message - 成功消息
   * @returns {Object} 响应对象
   */
  export function created(data, message = '创建成功') {
    return {
      success: true,
      code: 'CREATED',
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 更新成功响应
   * @param {*} data - 响应数据
   * @param {string} message - 成功消息
   * @returns {Object} 响应对象
   */
  export function updated(data, message = '更新成功') {
    return {
      success: true,
      code: 'UPDATED',
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 删除成功响应
   * @param {string} message - 成功消息
   * @returns {Object} 响应对象
   */
  export function deleted(message = '删除成功') {
    return {
      success: true,
      code: 'DELETED',
      message,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 错误响应
   * @param {string} code - 错误码
   * @param {string} message - 错误消息
   * @param {*} details - 错误详情
   * @param {number} statusCode - HTTP 状态码
   * @returns {Object} 响应对象
   */
  export function error(code, message, details = null, statusCode = 400) {
    return {
      success: false,
      code: code || 'ERROR',
      message: message || '操作失败',
      details,
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 验证错误响应
   * @param {Object} errors - 验证错误对象
   * @param {string} message - 错误消息
   * @returns {Object} 响应对象
   */
  export function validationError(errors, message = '验证失败') {
    return {
      success: false,
      code: 'VALIDATION_ERROR',
      message,
      errors,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 未找到响应
   * @param {string} resource - 资源名称
   * @returns {Object} 响应对象
   */
  export function notFound(resource = '资源') {
    return {
      success: false,
      code: 'NOT_FOUND',
      message: `${resource}不存在`,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 未授权响应
   * @param {string} message - 错误消息
   * @returns {Object} 响应对象
   */
  export function unauthorized(message = '未授权访问') {
    return {
      success: false,
      code: 'UNAUTHORIZED',
      message,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 禁止访问响应
   * @param {string} message - 错误消息
   * @returns {Object} 响应对象
   */
  export function forbidden(message = '禁止访问') {
    return {
      success: false,
      code: 'FORBIDDEN',
      message,
      timestamp: new Date().toISOString(),
    };
  }
  
  export default {
    success,
    paginated,
    created,
    updated,
    deleted,
    error,
    validationError,
    notFound,
    unauthorized,
    forbidden,
  };