/**
 * 数据验证工具
 * 统一的输入验证
 * 
 * @module lib/validation
 * 
 * @example
 * import { validate, schemas } from '../lib/validation.js'
 * const result = validate(data, schemas.customer)
 */

/**
 * 验证结果
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 是否有效
 * @property {Object|null} errors - 错误对象
 * @property {Object|null} value - 验证后的值
 */

/**
 * 验证模式
 */
export const schemas = {
    /**
     * 客户验证
     */
    customer: {
      first_name: {
        required: true,
        type: 'string',
        min: 1,
        max: 50,
        message: '姓名必须在 1-50 个字符之间',
      },
      last_name: {
        required: true,
        type: 'string',
        min: 1,
        max: 50,
        message: '姓名必须在 1-50 个字符之间',
      },
      email: {
        required: false,
        type: 'email',
        max: 255,
        message: '请输入有效的邮箱地址',
      },
      phone: {
        required: false,
        type: 'phone',
        message: '请输入有效的电话号码',
      },
      address: {
        required: false,
        type: 'string',
        max: 500,
      },
      city: {
        required: false,
        type: 'string',
        max: 50,
      },
      state: {
        required: false,
        type: 'string',
        max: 50,
      },
      zip_code: {
        required: false,
        type: 'string',
        max: 20,
      },
      country: {
        required: false,
        type: 'string',
        max: 50,
      },
    },
  
    /**
     * 订单验证
     */
    order: {
      customer_id: {
        required: true,
        type: 'uuid',
        message: '请选择有效的客户',
      },
      vehicle_id: {
        required: false,
        type: 'uuid',
      },
      items: {
        required: true,
        type: 'array',
        min: 1,
        message: '订单至少包含一个商品',
      },
      notes: {
        required: false,
        type: 'string',
        max: 1000,
      },
    },
  
    /**
     * 产品验证
     */
    product: {
      name: {
        required: true,
        type: 'string',
        min: 1,
        max: 100,
        message: '产品名称必须在 1-100 个字符之间',
      },
      description: {
        required: false,
        type: 'string',
        max: 1000,
      },
      sku: {
        required: false,
        type: 'string',
        max: 50,
      },
      unit_price: {
        required: true,
        type: 'number',
        min: 0,
        message: '单价必须大于等于 0',
      },
      cost_price: {
        required: false,
        type: 'number',
        min: 0,
      },
      min_stock: {
        required: false,
        type: 'number',
        integer: true,
        min: 0,
      },
      max_stock: {
        required: false,
        type: 'number',
        integer: true,
        min: 0,
      },
      tax_rate: {
        required: false,
        type: 'number',
        min: 0,
        max: 100,
        message: '税率必须在 0-100 之间',
      },
    },
  
    /**
     * 用户验证
     */
    user: {
      email: {
        required: true,
        type: 'email',
        message: '请输入有效的邮箱地址',
      },
      password: {
        required: true,
        type: 'string',
        min: 8,
        message: '密码至少需要 8 个字符',
      },
      first_name: {
        required: true,
        type: 'string',
        min: 1,
        max: 50,
      },
      last_name: {
        required: true,
        type: 'string',
        min: 1,
        max: 50,
      },
      phone: {
        required: false,
        type: 'phone',
      },
    },
  
    /**
     * 登录验证
     */
    login: {
      email: {
        required: true,
        type: 'email',
        message: '请输入有效的邮箱地址',
      },
      password: {
        required: true,
        type: 'string',
        min: 1,
        message: '请输入密码',
      },
    },
  };
  
  /**
   * 验证器类
   */
  class Validator {
    /**
     * 验证数据
     * @param {Object} data - 要验证的数据
     * @param {Object} schema - 验证模式
     * @param {Object} options - 选项
     * @returns {ValidationResult} 验证结果
     */
    validate(data, schema, options = {}) {
      const { strict = false, stripUnknown = false } = options;
      const errors = {};
      let valid = true;
      let result = {};
  
      for (const [key, rules] of Object.entries(schema)) {
        const value = data[key];
        const fieldErrors = [];
  
        // 检查必需
        if (rules.required && (value === undefined || value === null || value === '')) {
          fieldErrors.push(rules.message || `${key} 是必需的`);
          valid = false;
          errors[key] = fieldErrors;
          continue;
        }
  
        // 跳过未提供的字段
        if (value === undefined || value === null) {
          if (stripUnknown) continue;
          if (rules.default !== undefined) {
            result[key] = rules.default;
          }
          continue;
        }
  
        // 类型检查
        const typeError = this.checkType(value, rules, key);
        if (typeError) {
          fieldErrors.push(typeError);
          valid = false;
          errors[key] = fieldErrors;
          continue;
        }
  
        // 验证值
        const valueErrors = this.validateValue(value, rules, key);
        if (valueErrors.length > 0) {
          fieldErrors.push(...valueErrors);
          valid = false;
          errors[key] = fieldErrors;
          continue;
        }
  
        // 自定义验证
        if (rules.custom && typeof rules.custom === 'function') {
          try {
            const customResult = rules.custom(value, data);
            if (customResult !== true) {
              fieldErrors.push(customResult || `自定义验证失败: ${key}`);
              valid = false;
              errors[key] = fieldErrors;
              continue;
            }
          } catch (error) {
            fieldErrors.push(error.message || `自定义验证错误: ${key}`);
            valid = false;
            errors[key] = fieldErrors;
            continue;
          }
        }
  
        // 通过验证
        result[key] = value;
      }
  
      // 严格模式：检查未知字段
      if (strict) {
        for (const key of Object.keys(data)) {
          if (!schema[key] && data[key] !== undefined) {
            errors[key] = [`未知字段: ${key}`];
            valid = false;
          }
        }
      }
  
      return {
        valid,
        errors: Object.keys(errors).length > 0 ? errors : null,
        value: valid ? result : null,
      };
    }
  
    /**
     * 检查类型
     * @param {*} value - 值
     * @param {Object} rules - 规则
     * @param {string} key - 字段名
     * @returns {string|null} 错误信息
     */
    checkType(value, rules, key) {
      const type = rules.type || 'string';
  
      switch (type) {
        case 'string':
          if (typeof value !== 'string') {
            return `${key} 必须是字符串类型`;
          }
          break;
  
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            return `${key} 必须是数字`;
          }
          break;
  
        case 'integer':
          if (!Number.isInteger(value)) {
            return `${key} 必须是整数`;
          }
          break;
  
        case 'boolean':
          if (typeof value !== 'boolean') {
            return `${key} 必须是布尔值`;
          }
          break;
  
        case 'array':
          if (!Array.isArray(value)) {
            return `${key} 必须是数组`;
          }
          break;
  
        case 'object':
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return `${key} 必须是对象`;
          }
          break;
  
        case 'email':
          if (typeof value !== 'string' || !this.isEmail(value)) {
            return rules.message || `${key} 必须是有效的邮箱地址`;
          }
          break;
  
        case 'phone':
          if (typeof value !== 'string' || !this.isPhone(value)) {
            return rules.message || `${key} 必须是有效的电话号码`;
          }
          break;
  
        case 'uuid':
          if (typeof value !== 'string' || !this.isUUID(value)) {
            return rules.message || `${key} 必须是有效的 UUID`;
          }
          break;
  
        case 'url':
          if (typeof value !== 'string' || !this.isURL(value)) {
            return rules.message || `${key} 必须是有效的 URL`;
          }
          break;
  
        default:
          return null;
      }
  
      return null;
    }
  
    /**
     * 验证值
     * @param {*} value - 值
     * @param {Object} rules - 规则
     * @param {string} key - 字段名
     * @returns {Array} 错误列表
     */
    validateValue(value, rules, key) {
      const errors = [];
  
      // 字符串长度
      if (typeof value === 'string') {
        if (rules.min && value.length < rules.min) {
          errors.push(rules.message || `${key} 至少需要 ${rules.min} 个字符`);
        }
        if (rules.max && value.length > rules.max) {
          errors.push(rules.message || `${key} 最多允许 ${rules.max} 个字符`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(rules.message || `${key} 格式不正确`);
        }
      }
  
      // 数字范围
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(rules.message || `${key} 必须大于等于 ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(rules.message || `${key} 必须小于等于 ${rules.max}`);
        }
      }
  
      // 数组
      if (Array.isArray(value)) {
        if (rules.min !== undefined && value.length < rules.min) {
          errors.push(rules.message || `${key} 至少需要 ${rules.min} 个元素`);
        }
        if (rules.max !== undefined && value.length > rules.max) {
          errors.push(rules.message || `${key} 最多允许 ${rules.max} 个元素`);
        }
      }
  
      // 枚举
      if (rules.enum && Array.isArray(rules.enum) && !rules.enum.includes(value)) {
        errors.push(rules.message || `${key} 必须是以下值之一: ${rules.enum.join(', ')}`);
      }
  
      return errors;
    }
  
    /**
     * 验证邮箱
     * @param {string} email - 邮箱地址
     * @returns {boolean} 是否有效
     */
    isEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  
    /**
     * 验证电话
     * @param {string} phone - 电话号码
     * @returns {boolean} 是否有效
     */
    isPhone(phone) {
      return /^[\d\s\-+()]{7,20}$/.test(phone);
    }
  
    /**
     * 验证 UUID
     * @param {string} uuid - UUID
     * @returns {boolean} 是否有效
     */
    isUUID(uuid) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
    }
  
    /**
     * 验证 URL
     * @param {string} url - URL
     * @returns {boolean} 是否有效
     */
    isURL(url) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }
  }
  
  // 创建单例
  const validator = new Validator();
  
  /**
   * 快捷验证函数
   * @param {Object} data - 要验证的数据
   * @param {Object} schema - 验证模式
   * @param {Object} options - 选项
   * @returns {ValidationResult} 验证结果
   */
  export function validate(data, schema, options = {}) {
    return validator.validate(data, schema, options);
  }
  
  export { Validator, validator };
  export default validator;

export function isRequired(value, fieldName) {
    if (value === undefined || value === null || value === '') {
        return { error: true, message: (fieldName || '字段') + ' 是必填的' };
    }
    return null;
}


export function validateVehicleRecord(data) {
    const errors = {};
    if (!data) return { valid: false, errors: { general: '数据不能为空' } };
    if (!data.plate) errors.plate = '车牌号是必填的';
    return { valid: Object.keys(errors).length === 0, errors };
}


export function validateInventory(data) {
    const errors = {};
    if (!data) return { valid: false, errors: { general: '数据不能为空' } };
    if (!data.product_id) errors.product_id = '产品ID是必填的';
    if (data.quantity === undefined || data.quantity === null) {
        errors.quantity = '数量是必填的';
    } else if (typeof data.quantity !== 'number' || data.quantity < 0) {
        errors.quantity = '数量必须是非负数字';
    }
    return { valid: Object.keys(errors).length === 0, errors };
}


export function validateOrder(data) {
    const errors = {};
    if (!data) return { valid: false, errors: { general: '数据不能为空' } };
    if (!data.customer_id) errors.customer_id = '客户ID是必填的';
    return { valid: Object.keys(errors).length === 0, errors };
}
