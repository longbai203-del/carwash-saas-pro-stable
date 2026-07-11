/**
 * 验证工具模块
 * 提供表单验证功能
 * 
 * @module utils/validation
 * 
 * @example
 * import { validate, rules } from './utils/validation.js'
 * const result = validate({ email: 'test@example.com' }, { email: rules.email })
 */

/**
 * 验证规则
 */
export const rules = {
    /**
     * 必填
     */
    required: {
      validate: (value) => value !== undefined && value !== null && value !== '',
      message: 'This field is required'
    },
    
    /**
     * 邮箱
     */
    email: {
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Please enter a valid email address'
    },
    
    /**
     * 手机号
     */
    phone: {
      validate: (value) => /^[\d\s\-+()]{7,20}$/.test(value),
      message: 'Please enter a valid phone number'
    },
    
    /**
     * URL
     */
    url: {
      validate: (value) => {
        try {
          new URL(value)
          return true
        } catch {
          return false
        }
      },
      message: 'Please enter a valid URL'
    },
    
    /**
     * 数字
     */
    number: {
      validate: (value) => !isNaN(parseFloat(value)) && isFinite(value),
      message: 'Please enter a valid number'
    },
    
    /**
     * 整数
     */
    integer: {
      validate: (value) => Number.isInteger(Number(value)),
      message: 'Please enter a valid integer'
    },
    
    /**
     * 最小长度
     */
    minLength: (min) => ({
      validate: (value) => value && value.length >= min,
      message: `Minimum length is ${min} characters`
    }),
    
    /**
     * 最大长度
     */
    maxLength: (max) => ({
      validate: (value) => !value || value.length <= max,
      message: `Maximum length is ${max} characters`
    }),
    
    /**
     * 最小数字
     */
    min: (min) => ({
      validate: (value) => value >= min,
      message: `Value must be at least ${min}`
    }),
    
    /**
     * 最大数字
     */
    max: (max) => ({
      validate: (value) => value <= max,
      message: `Value must be at most ${max}`
    }),
    
    /**
     * 正则匹配
     */
    pattern: (pattern, message) => ({
      validate: (value) => pattern.test(value),
      message: message || 'Invalid format'
    }),
    
    /**
     * 相等
     */
    equals: (target) => ({
      validate: (value) => value === target,
      message: 'Values do not match'
    })
  }
  
  /**
   * 验证函数
   * @param {Object} data - 要验证的数据
   * @param {Object} schema - 验证模式
   * @returns {Object} 验证结果
   */
  export function validate(data, schema) {
    const errors = {}
    let isValid = true
    
    for (const [field, fieldRules] of Object.entries(schema)) {
      const value = data[field]
      const fieldErrors = []
      
      const rulesArray = Array.isArray(fieldRules) ? fieldRules : [fieldRules]
      
      for (const rule of rulesArray) {
        // 如果是函数，调用它
        if (typeof rule === 'function') {
          const result = rule(value, data)
          if (result !== true) {
            fieldErrors.push(typeof result === 'string' ? result : 'Invalid value')
          }
          continue
        }
        
        // 如果是对象规则
        if (rule && typeof rule.validate === 'function') {
          if (!rule.validate(value, data)) {
            fieldErrors.push(rule.message || 'Invalid value')
          }
          continue
        }
        
        // 如果是内置规则名称
        if (typeof rule === 'string' && rules[rule]) {
          const builtinRule = rules[rule]
          if (!builtinRule.validate(value, data)) {
            fieldErrors.push(builtinRule.message || 'Invalid value')
          }
          continue
        }
      }
      
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors
        isValid = false
      }
    }
    
    return {
      isValid,
      errors,
      hasError: (field) => !!errors[field],
      getErrors: (field) => errors[field] || []
    }
  }
  
  /**
   * 创建验证器
   * @param {Object} schema - 验证模式
   * @returns {Function} 验证器函数
   */
  export function createValidator(schema) {
    return (data) => validate(data, schema)
  }
  
  export default {
    rules,
    validate,
    createValidator
  }