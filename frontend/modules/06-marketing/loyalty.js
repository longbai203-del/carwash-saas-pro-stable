/**
 * loyalty.js - 积分管理模块
 * @module loyalty
 * @description 提供积分规则和积分记录的CRUD操作
 */

// 06-marketing/loyalty.js
console.log('📄 06-marketing/loyalty page loaded');

/**
 * 初始化积分模块
 * @returns {void}
 */
export function init() {
    console.log('06-marketing/loyalty initialized');
    
    const savedRules = localStorage.getItem('loyalty_rules');
    if (savedRules) {
        try {
            const data = JSON.parse(savedRules);
            console.log('已加载积分规则:', data.length);
            if (typeof window.LoyaltyModule !== 'undefined') {
                window.LoyaltyModule.rules = data;
            }
        } catch (e) {
            console.warn('加载积分规则失败');
        }
    }
    
    const savedRecords = localStorage.getItem('loyalty_records');
    if (savedRecords) {
        try {
            const data = JSON.parse(savedRecords);
            console.log('已加载积分记录:', data.length);
            if (typeof window.LoyaltyModule !== 'undefined') {
                window.LoyaltyModule.records = data;
                window.LoyaltyModule.render();
            }
        } catch (e) {
            console.warn('加载积分记录失败');
        }
    }
}

/**
 * 获取所有积分规则
 * @returns {Array<Object>} 规则数组
 */
export function getRules() {
    try {
        const data = localStorage.getItem('loyalty_rules');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 获取所有积分记录
 * @returns {Array<Object>} 记录数组
 */
export function getRecords() {
    try {
        const data = localStorage.getItem('loyalty_records');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 新增积分规则
 * @param {Object} rule - 规则数据
 * @returns {boolean} 是否成功
 */
export function addRule(rule) {
    try {
        const rules = getRules();
        rules.push(rule);
        localStorage.setItem('loyalty_rules', JSON.stringify(rules));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 更新积分规则
 * @param {string} id - 规则ID
 * @param {Object} data - 要更新的数据
 * @returns {boolean} 是否成功
 */
export function updateRule(id, data) {
    try {
        const rules = getRules();
        const index = rules.findIndex(r => r.id === id);
        if (index >= 0) {
            rules[index] = { ...rules[index], ...data };
            localStorage.setItem('loyalty_rules', JSON.stringify(rules));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * 删除积分规则
 * @param {string} id - 规则ID
 * @returns {boolean} 是否成功
 */
export function deleteRule(id) {
    try {
        const rules = getRules();
        const filtered = rules.filter(r => r.id !== id);
        localStorage.setItem('loyalty_rules', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 新增积分记录
 * @param {Object} record - 记录数据
 * @param {string} record.customer - 客户名
 * @param {string} record.type - 类型 (income/expense)
 * @param {number} record.points - 积分数
 * @param {string} record.desc - 描述
 * @returns {boolean} 是否成功
 */
export function addRecord(record) {
    try {
        const records = getRecords();
        records.push(record);
        localStorage.setItem('loyalty_records', JSON.stringify(records));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getRules,
    getRecords,
    addRule,
    updateRule,
    deleteRule,
    addRecord
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('06-marketing/loyalty DOM ready');
    init();
});