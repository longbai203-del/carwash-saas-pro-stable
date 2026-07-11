/**
 * 验证中间件
 * 请求数据验证
 * 
 * @module middleware/validation
 * 
 * @example
 * import { validate } from './middleware/validation.js'
 * import { customerSchema } from '../shared/validation/schemas.js'
 * router.post('/customers', validate(customerSchema), handler)
 */

import Joi from 'joi'
import { createValidationError } from './errorHandler.js'

/**
 * 验证中间件工厂
 * 使用Joi模式验证请求数据
 * 
 * @param {Object} schema - Joi验证模式
 * @param {string} property - 要验证的属性 ('body', 'query', 'params')
 * @returns {Function} 中间件函数
 * 
 * @example
 * const customerSchema = Joi.object({
 *   name: Joi.string().required(),
 *   email: Joi.string().email().required()
 * })
 * router.post('/customers', validate(customerSchema, 'body'), handler)
 */
export function validate(schema, property = 'body') {
  return (req, res, next) => {
    const data = req[property]
    if (!data) {
      return next(createValidationError({ message: `Request ${property} is required` }))
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
      return next(createValidationError(errors))
    }

    // 替换请求数据为验证后的数据
    req[property] = value
    next()
  }
}

/**
 * 查询参数验证
 * @param {Object} schema - Joi验证模式
 * @returns {Function} 中间件函数
 */
export function validateQuery(schema) {
  return validate(schema, 'query')
}

/**
 * 路径参数验证
 * @param {Object} schema - Joi验证模式
 * @returns {Function} 中间件函数
 */
export function validateParams(schema) {
  return validate(schema, 'params')
}

/**
 * 请求体验证
 * @param {Object} schema - Joi验证模式
 * @returns {Function} 中间件函数
 */
export function validateBody(schema) {
  return validate(schema, 'body')
}

/**
 * 通用验证模式
 */
export const schemas = {
  // 客户验证
  customer: {
    create: Joi.object({
      first_name: Joi.string().min(1).max(50).required(),
      last_name: Joi.string().min(1).max(50).required(),
      email: Joi.string().email().max(255),
      phone: Joi.string().pattern(/^[\d\s\-+()]{7,20}$/),
      address: Joi.string().max(500),
      city: Joi.string().max(50),
      state: Joi.string().max(50),
      zip_code: Joi.string().max(20),
      country: Joi.string().max(50),
      notes: Joi.string().max(1000)
    }),
    update: Joi.object({
      first_name: Joi.string().min(1).max(50),
      last_name: Joi.string().min(1).max(50),
      email: Joi.string().email().max(255),
      phone: Joi.string().pattern(/^[\d\s\-+()]{7,20}$/),
      address: Joi.string().max(500),
      city: Joi.string().max(50),
      state: Joi.string().max(50),
      zip_code: Joi.string().max(20),
      country: Joi.string().max(50),
      notes: Joi.string().max(1000),
      is_active: Joi.boolean()
    })
  },

  // 订单验证
  order: {
    create: Joi.object({
      customer_id: Joi.string().uuid().required(),
      vehicle_id: Joi.string().uuid(),
      notes: Joi.string().max(1000),
      items: Joi.array().items(
        Joi.object({
          product_id: Joi.string().uuid().required(),
          quantity: Joi.number().integer().min(1).required(),
          unit_price: Joi.number().min(0).required(),
          notes: Joi.string().max(500)
        })
      ).min(1).required()
    }),
    update: Joi.object({
      status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled', 'refunded'),
      payment_status: Joi.string().valid('unpaid', 'paid', 'refunded', 'failed'),
      notes: Joi.string().max(1000)
    })
  },

  // 产品验证
  product: {
    create: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      description: Joi.string().max(1000),
      category_id: Joi.string().uuid(),
      sku: Joi.string().max(50),
      barcode: Joi.string().max(50),
      unit_price: Joi.number().min(0).required(),
      cost_price: Joi.number().min(0),
      min_stock: Joi.number().integer().min(0),
      max_stock: Joi.number().integer().min(0),
      unit: Joi.string().max(20),
      tax_rate: Joi.number().min(0).max(100),
      is_service: Joi.boolean(),
      is_active: Joi.boolean()
    }),
    update: Joi.object({
      name: Joi.string().min(1).max(100),
      description: Joi.string().max(1000),
      category_id: Joi.string().uuid(),
      sku: Joi.string().max(50),
      barcode: Joi.string().max(50),
      unit_price: Joi.number().min(0),
      cost_price: Joi.number().min(0),
      min_stock: Joi.number().integer().min(0),
      max_stock: Joi.number().integer().min(0),
      unit: Joi.string().max(20),
      tax_rate: Joi.number().min(0).max(100),
      is_service: Joi.boolean(),
      is_active: Joi.boolean()
    })
  },

  // 分页查询
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  })
}

export default {
  validate,
  validateQuery,
  validateParams,
  validateBody,
  schemas
}