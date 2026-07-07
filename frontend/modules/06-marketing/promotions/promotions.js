/**
 * promotions.js - 促销管理模块
 * @module promotions
 * @description 提供促销活动的CRUD操作和数据管理
 */

// 06-marketing/promotions.js
console.log('📄 06-marketing/promotions page loaded');

/**
 * 初始化促销模块
 * @returns {void}
 */
export function init() {
    console.log('06-marketing/promotions initialized');
    
    const saved = localStorage.getItem('promotion_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载促销数据:', data.length);
            if (typeof window.PromotionModule !== 'undefined') {
                window.PromotionModule.promotions = data;
                window.PromotionModule.filteredPromotions = [...data];
                window.PromotionModule.render();
            }
        } catch (e) {
            console.warn('加载促销数据失败');
        }
    }
}

/**
 * 获取所有促销
 * @returns {Array<Object>} 促销数组
 */
export function getPromotions() {
    try {
        const data = localStorage.getItem('promotion_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 根据ID获取促销
 * @param {string} id - 促销ID
 * @returns {Object|null} 促销对象或null
 */
export function getPromotionById(id) {
    try {
        const promotions = getPromotions();
        return promotions.find(p => p.id === id) || null;
    } catch (e) {
        return null;
    }
}

/**
 * 新增促销
 * @param {Object} promotion - 促销数据
 * @param {string} promotion.name - 促销名称
 * @param {string} promotion.type - 类型 (discount/coupon/bundle/member)
 * @param {string} promotion.value - 优惠值
 * @param {string} promotion.status - 状态 (active/pending/ended)
 * @param {string} promotion.startDate - 开始日期
 * @param {string} promotion.endDate - 结束日期
 * @param {string} promotion.desc - 描述
 * @returns {boolean} 是否成功
 */
export function addPromotion(promotion) {
    try {
        const promotions = getPromotions();
        promotions.push(promotion);
        localStorage.setItem('promotion_data', JSON.stringify(promotions));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 更新促销
 * @param {string} id - 促销ID
 * @param {Object} data - 要更新的数据
 * @returns {boolean} 是否成功
 */
export function updatePromotion(id, data) {
    try {
        const promotions = getPromotions();
        const index = promotions.findIndex(p => p.id === id);
        if (index >= 0) {
            promotions[index] = { ...promotions[index], ...data };
            localStorage.setItem('promotion_data', JSON.stringify(promotions));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * 删除促销
 * @param {string} id - 促销ID
 * @returns {boolean} 是否成功
 */
export function deletePromotion(id) {
    try {
        const promotions = getPromotions();
        const filtered = promotions.filter(p => p.id !== id);
        localStorage.setItem('promotion_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 获取进行中的促销
 * @returns {Array<Object>} 进行中的促销数组
 */
export function getActivePromotions() {
    try {
        const promotions = getPromotions();
        return promotions.filter(p => p.status === 'active');
    } catch (e) {
        return [];
    }
}

/**
 * 获取待开始的促销
 * @returns {Array<Object>} 待开始的促销数组
 */
export function getPendingPromotions() {
    try {
        const promotions = getPromotions();
        return promotions.filter(p => p.status === 'pending');
    } catch (e) {
        return [];
    }
}

export default {
    init,
    getPromotions,
    getPromotionById,
    addPromotion,
    updatePromotion,
    deletePromotion,
    getActivePromotions,
    getPendingPromotions
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('06-marketing/promotions DOM ready');
    init();
});