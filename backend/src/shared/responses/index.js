/**
 * 统一响应模块
 * 统一API响应格式
 * 
 * @module shared/responses
 * 
 * @example
 * import { successResponse, errorResponse } from '../shared/responses/index.js'
 * res.json(successResponse(data))
 */

/**
 * 成功响应
 * @param {*} data - 响应数据
 * @param {string} message - 成功消息
 * @param {Object} meta - 元数据
 * @returns {Object} 响应对象
 */
export function successResponse(data, message = 'Success', meta = {}) {
    return {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString()
    }
  }
  
  /**
   * 列表响应
   * @param {Array} data - 列表数据
   * @param {Object} pagination - 分页信息
   * @param {string} message - 成功消息
   * @returns {Object} 响应对象
   */
  export function listResponse(data, pagination = null, message = 'Success') {
    const response = {
      success: true,
      message,
      data
    }
  
    if (pagination) {
      response.pagination = pagination
    }
  
    response.timestamp = new Date().toISOString()
    return response
  }
  
  /**
   * 错误响应
   * @param {string} error - 错误码
   * @param {string} message - 错误消息
   * @param {*} details - 错误详情
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} 响应对象
   */
  export function errorResponse(error, message, details = null, statusCode = 400) {
    return {
      success: false,
      error,
      message,
      details,
      statusCode,
      timestamp: new Date().toISOString()
    }
  }
  
  /**
   * 创建响应
   * @param {*} data - 响应数据
   * @param {string} message - 消息
   * @param {number} statusCode - HTTP状态码
   * @returns {Object} 响应对象
   */
  export function createResponse(data, message = 'Success', statusCode = 200) {
    const isSuccess = statusCode >= 200 && statusCode < 300
    
    if (isSuccess) {
      return successResponse(data, message)
    } else {
      return errorResponse(
        'ERROR',
        message || 'An error occurred',
        data,
        statusCode
      )
    }
  }
  
  export default {
    successResponse,
    listResponse,
    errorResponse,
    createResponse
  }