/**
 * backend/shared/lib/validation.js - 参数校验工具
 * @module validation
 * @description 提供常用数据校验函数，支持前端和后端共同引用
 * 
 * @example
 * import { isRequired, isValidPhone } from '../shared/lib/validation.js';
 * const error = isRequired(username, '用户名');
 */

/**
 * 检查是否为空
 * @param {*} value - 待校验的值
 * @param {string} fieldName - 字段名（用于错误提示）
 * @returns {string|null} 如果为空返回错误信息，否则返回null
 */
export function isRequired(value, fieldName) {
    if (value === undefined || value === null || value === '') {
        return `${fieldName} 不能为空`;
    }
    return null;
}

/**
 * 检查是否为有效的邮箱
 * @param {string} email - 邮箱地址
 * @returns {string|null} 无效则返回错误信息，有效返回null
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return '请输入有效的邮箱地址';
    }
    return null;
}

/**
 * 检查是否为有效的手机号（沙特格式）
 * @param {string} phone - 手机号
 * @returns {string|null} 无效则返回错误信息，有效返回null
 */
export function isValidPhone(phone) {
    if (!phone) return null; // 允许为空
    // 沙特手机号: 05xxxxxxxx 或 +9665xxxxxxxx
    const phoneRegex = /^(05|\+9665)\d{8}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return '请输入有效的手机号（05xxxxxxxx 或 +9665xxxxxxxx）';
    }
    return null;
}

/**
 * 检查密码强度
 * @param {string} password - 密码字符串
 * @returns {string|null} 密码强度不足返回错误信息，否则返回null
 */
export function isValidPassword(password) {
    if (!password || password.length < 6) {
        return '密码至少需要6位字符';
    }
    return null;
}

/**
 * 检查是否为有效的金额
 * @param {number|string} amount - 金额
 * @returns {string|null} 无效则返回错误信息，有效返回null
 */
export function isValidAmount(amount) {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) {
        return '金额必须为正数';
    }
    return null;
}

/**
 * 检查是否为有效的整数
 * @param {number|string} value - 待校验数字
 * @param {number} [min=0] - 最小值
 * @param {number} [max=Infinity] - 最大值
 * @returns {string|null} 无效则返回错误信息，有效返回null
 */
export function isValidInteger(value, min = 0, max = Infinity) {
    const num = parseInt(value);
    if (isNaN(num) || num < min || num > max) {
        return `必须是有效的整数（范围: ${min} - ${max}）`;
    }
    return null;
}

/**
 * 检查是否为有效的日期
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {string|null} 无效则返回错误信息，有效返回null
 */
export function isValidDate(date) {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return '请输入有效的日期';
    }
    return null;
}

/**
 * 验证订单数据
 * @param {Object} data - 订单数据
 * @param {string} data.plate_number - 车牌号
 * @param {number} data.total - 总金额
 * @returns {Array<string>} 错误信息数组
 */
export function validateOrder(data) {
    const errors = [];
    
    const plateError = isRequired(data.plate_number, '车牌号');
    if (plateError) errors.push(plateError);
    
    const amountError = isValidAmount(data.total);
    if (amountError) errors.push(amountError);
    
    return errors;
}

/**
 * 验证客户数据
 * @param {Object} data - 客户数据
 * @param {string} data.name - 客户姓名
 * @param {string} [data.phone] - 手机号
 * @returns {Array<string>} 错误信息数组
 */
export function validateCustomer(data) {
    const errors = [];
    
    const nameError = isRequired(data.name, '客户姓名');
    if (nameError) errors.push(nameError);
    
    if (data.phone) {
        const phoneError = isValidPhone(data.phone);
        if (phoneError) errors.push(phoneError);
    }
    
    return errors;
}

/**
 * 验证员工数据
 * @param {Object} data - 员工数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Array<string>} 错误信息数组
 */
export function validateEmployee(data) {
    const errors = [];
    
    const usernameError = isRequired(data.username, '用户名');
    if (usernameError) errors.push(usernameError);
    
    const passwordError = isValidPassword(data.password);
    if (passwordError) errors.push(passwordError);
    
    return errors;
}

/**
 * 验证库存数据
 * @param {Object} data - 库存数据
 * @param {string} data.name - 产品名称
 * @param {number} data.quantity - 数量
 * @returns {Array<string>} 错误信息数组
 */
export function validateInventory(data) {
    const errors = [];
    
    const nameError = isRequired(data.name, '产品名称');
    if (nameError) errors.push(nameError);
    
    const qtyError = isValidInteger(data.quantity, 0);
    if (qtyError) errors.push(qtyError);
    
    return errors;
}

/**
 * 验证车辆监控数据
 * @param {Object} data - 车辆数据
 * @param {string} data.plate - 车牌号
 * @returns {Array<string>} 错误信息数组
 */
export function validateVehicleRecord(data) {
    const errors = [];
    
    const plateError = isRequired(data.plate, '车牌号');
    if (plateError) errors.push(plateError);
    
    return errors;
}

/**
 * 合并验证结果
 * @param {Array<Function>} validations - 验证函数数组
 * @returns {Array<string>} 合并后的错误数组
 */
export function validateAll(validations) {
    const allErrors = [];
    validations.forEach(fn => {
        const result = fn();
        if (result && Array.isArray(result)) {
            allErrors.push(...result);
        } else if (result) {
            allErrors.push(result);
        }
    });
    return allErrors;
}

/**
 * 创建统一的验证响应
 * @param {Array<string>} errors - 错误数组
 * @returns {Object|null} 如果errors有值返回错误响应对象，否则返回null
 */
export function validationResponse(errors) {
    if (errors.length === 0) return null;
    return {
        success: false,
        error: '参数验证失败',
        errors: errors,
        code: 'VALIDATION_ERROR'
    };
}

console.log('[Validation] ✅ 校验工具已加载');