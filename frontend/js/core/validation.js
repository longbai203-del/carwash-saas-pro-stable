/**
 * @file validation.js
 * @module validation
 * @description 表单验证 - 统一的验证规则和工具
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} ValidationRule
 * @property {string} name - 规则名称
 * @property {Function} validate - 验证函数
 * @property {string} message - 错误消息
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 是否有效
 * @property {string|null} error - 错误消息
 */

/** @type {Map<string, Function>} 内置验证规则 */
const builtinRules = new Map();

/**
 * @private
 * @description 注册内置规则
 */
function registerBuiltinRules() {
    // 必填
    builtinRules.set('required', (value, field) => {
        if (value === undefined || value === null || value === '') {
            return `${field || '字段'}不能为空`;
        }
        if (Array.isArray(value) && value.length === 0) {
            return `${field || '字段'}不能为空`;
        }
        return null;
    });
    
    // 邮箱
    builtinRules.set('email', (value) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (value && !emailRegex.test(value)) {
            return '请输入有效的邮箱地址';
        }
        return null;
    });
    
    // 手机号（中国）
    builtinRules.set('phone', (value) => {
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (value && !phoneRegex.test(value)) {
            return '请输入有效的手机号码';
        }
        return null;
    });
    
    // 数字
    builtinRules.set('number', (value) => {
        if (value && isNaN(Number(value))) {
            return '请输入有效的数字';
        }
        return null;
    });
    
    // 整数
    builtinRules.set('integer', (value) => {
        if (value && !Number.isInteger(Number(value))) {
            return '请输入有效的整数';
        }
        return null;
    });
    
    // 最小长度
    builtinRules.set('minLength', (value, field, min) => {
        if (value && value.length < min) {
            return `${field || '字段'}长度不能少于${min}个字符`;
        }
        return null;
    });
    
    // 最大长度
    builtinRules.set('maxLength', (value, field, max) => {
        if (value && value.length > max) {
            return `${field || '字段'}长度不能超过${max}个字符`;
        }
        return null;
    });
    
    // 正则匹配
    builtinRules.set('pattern', (value, field, pattern, message) => {
        if (value && !pattern.test(value)) {
            return message || `${field || '字段'}格式无效`;
        }
        return null;
    });
    
    // 最小值
    builtinRules.set('min', (value, field, min) => {
        if (value !== undefined && value !== null && Number(value) < min) {
            return `${field || '字段'}不能小于${min}`;
        }
        return null;
    });
    
    // 最大值
    builtinRules.set('max', (value, field, max) => {
        if (value !== undefined && value !== null && Number(value) > max) {
            return `${field || '字段'}不能大于${max}`;
        }
        return null;
    });
    
    // URL
    builtinRules.set('url', (value) => {
        const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/;
        if (value && !urlRegex.test(value)) {
            return '请输入有效的URL';
        }
        return null;
    });
    
    // 日期
    builtinRules.set('date', (value) => {
        if (value && isNaN(new Date(value).getTime())) {
            return '请输入有效的日期';
        }
        return null;
    });
    
    // 身份证
    builtinRules.set('idCard', (value) => {
        const idRegex = /^[1-9]\d{5}(18|19|20)?\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
        if (value && !idRegex.test(value)) {
            return '请输入有效的身份证号码';
        }
        return null;
    });
    
    // 密码强度
    builtinRules.set('password', (value) => {
        if (value && value.length < 8) {
            return '密码长度不能少于8个字符';
        }
        if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            return '密码必须包含大小写字母和数字';
        }
        return null;
    });
    
    // 确认密码
    builtinRules.set('confirm', (value, field, targetValue) => {
        if (value !== targetValue) {
            return `${field || '确认密码'}不匹配`;
        }
        return null;
    });
}

// 注册内置规则
registerBuiltinRules();

/**
 * @public
 * @description 注册自定义验证规则
 * @param {string} name - 规则名称
 * @param {Function} validator - 验证函数
 */
export function registerRule(name, validator) {
    builtinRules.set(name, validator);
}

/**
 * @public
 * @description 验证单个字段
 * @param {string|Array<Object>} rules - 验证规则
 * @param {*} value - 字段值
 * @param {string} fieldName - 字段名称
 * @param {Object} [context] - 上下文（用于confirm等规则）
 * @returns {ValidationResult} 验证结果
 */
export function validateField(rules, value, fieldName, context = {}) {
    let rulesList = [];
    
    if (typeof rules === 'string') {
        rulesList = rules.split('|').map(r => {
            const [name, ...args] = r.split(':');
            return { name, args: args.map(a => isNaN(a) ? a : Number(a)) };
        });
    } else if (Array.isArray(rules)) {
        rulesList = rules;
    } else {
        return { valid: true, error: null };
    }
    
    for (const rule of rulesList) {
        let ruleName = rule.name;
        let args = rule.args || [];
        
        // 处理规则带参数的情况
        if (typeof rule === 'string') {
            const parts = rule.split(':');
            ruleName = parts[0];
            args = parts.slice(1).map(a => isNaN(a) ? a : Number(a));
        }
        
        const validator = builtinRules.get(ruleName);
        if (!validator) {
            console.warn(`未知验证规则: ${ruleName}`);
            continue;
        }
        
        // 构建参数列表
        const params = [value, fieldName, ...args, context];
        const error = validator(...params);
        
        if (error) {
            return { valid: false, error };
        }
    }
    
    return { valid: true, error: null };
}

/**
 * @public
 * @description 验证整个表单
 * @param {Object} data - 表单数据
 * @param {Object} rules - 验证规则映射
 * @param {Object} [context] - 上下文
 * @returns {Object} 验证结果 { valid: boolean, errors: Object }
 */
export function validateForm(data, rules, context = {}) {
    const errors = {};
    let isValid = true;
    
    for (const [field, fieldRules] of Object.entries(rules)) {
        const value = data[field];
        const result = validateField(fieldRules, value, field, { ...context, data });
        
        if (!result.valid) {
            errors[field] = result.error;
            isValid = false;
        }
    }
    
    return { valid: isValid, errors };
}

/**
 * @public
 * @description 检查值是否为空
 * @param {*} value - 值
 * @returns {boolean} 是否为空
 */
export function isEmpty(value) {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * @public
 * @description 获取值的显示文本
 * @param {*} value - 值
 * @returns {string} 显示文本
 */
export function getDisplayValue(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? '是' : '否';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

/**
 * @public
 * @description 验证工具对象
 */
export const validation = {
    registerRule,
    validateField,
    validateForm,
    isEmpty,
    getDisplayValue
};

export default validation;