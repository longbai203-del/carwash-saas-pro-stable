/**
 * referrals.js - 推荐管理模块
 * @module referrals
 * @description 提供推荐记录的CRUD操作和转化跟踪
 */

// 06-marketing/referrals.js
console.log('📄 06-marketing/referrals page loaded');

/**
 * 初始化推荐模块
 * @returns {void}
 */
export function init() {
    console.log('06-marketing/referrals initialized');
    
    const saved = localStorage.getItem('referral_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载推荐数据:', data.length);
            if (typeof window.ReferralModule !== 'undefined') {
                window.ReferralModule.referrals = data;
                window.ReferralModule.filteredReferrals = [...data];
                window.ReferralModule.render();
            }
        } catch (e) {
            console.warn('加载推荐数据失败');
        }
    }
}

/**
 * 获取所有推荐
 * @returns {Array<Object>} 推荐数组
 */
export function getReferrals() {
    try {
        const data = localStorage.getItem('referral_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 根据ID获取推荐
 * @param {string} id - 推荐ID
 * @returns {Object|null} 推荐对象或null
 */
export function getReferralById(id) {
    try {
        const referrals = getReferrals();
        return referrals.find(r => r.id === id) || null;
    } catch (e) {
        return null;
    }
}

/**
 * 新增推荐
 * @param {Object} referral - 推荐数据
 * @param {string} referral.referrer - 推荐人
 * @param {string} referral.referee - 被推荐人
 * @param {number} referral.reward - 奖励积分
 * @param {string} referral.status - 状态
 * @returns {boolean} 是否成功
 */
export function addReferral(referral) {
    try {
        const referrals = getReferrals();
        referrals.push(referral);
        localStorage.setItem('referral_data', JSON.stringify(referrals));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 更新推荐
 * @param {string} id - 推荐ID
 * @param {Object} data - 要更新的数据
 * @returns {boolean} 是否成功
 */
export function updateReferral(id, data) {
    try {
        const referrals = getReferrals();
        const index = referrals.findIndex(r => r.id === id);
        if (index >= 0) {
            referrals[index] = { ...referrals[index], ...data };
            localStorage.setItem('referral_data', JSON.stringify(referrals));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * 删除推荐
 * @param {string} id - 推荐ID
 * @returns {boolean} 是否成功
 */
export function deleteReferral(id) {
    try {
        const referrals = getReferrals();
        const filtered = referrals.filter(r => r.id !== id);
        localStorage.setItem('referral_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 获取已转化的推荐
 * @returns {Array<Object>} 已转化的推荐数组
 */
export function getConvertedReferrals() {
    try {
        const referrals = getReferrals();
        return referrals.filter(r => r.status === 'converted');
    } catch (e) {
        return [];
    }
}

export default {
    init,
    getReferrals,
    getReferralById,
    addReferral,
    updateReferral,
    deleteReferral,
    getConvertedReferrals
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('06-marketing/referrals DOM ready');
    init();
});