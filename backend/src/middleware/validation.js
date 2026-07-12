/**
 * 验证中间件（简化版 - 无 Joi 依赖）
 * @module middleware/validation
 */

import { createValidationError } from './errorHandler.js'

export function validate(schema, property = 'body') {
  return (req, res, next) => {
    const data = req[property]
    if (!data) {
      return next(createValidationError({ message: `Request ${property} is required` }))
    }
    next()
  }
}

export function validateQuery(schema) {
  return validate(schema, 'query')
}

export function validateParams(schema) {
  return validate(schema, 'params')
}

export function validateBody(schema) {
  return validate(schema, 'body')
}

export const schemas = {
  customer: { create: {}, update: {} },
  order: { create: {}, update: {} },
  product: { create: {}, update: {} },
  pagination: {}
}

export default {
  validate,
  validateQuery,
  validateParams,
  validateBody,
  schemas
}