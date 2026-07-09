/**
 * coupons.js - 优惠券管理模块
 * @module coupons
 * @description 提供优惠券的CRUD操作和数据管理
 */

// 05-customers/coupons.js
console.log('📄 05-customers/coupons page loaded');

/**
 * 初始化优惠券模块
 * @returns {void}
 */
export function init() {
    console.log('05-customers/coupons initialized');
    
    const saved = localStorage.getItem('coupon_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载优惠券数据:', data.length);
            if (typeof window.CouponModule !== 'undefined') {
                window.CouponModule.coupons = data;
                window.CouponModule.filteredCoupons = [...data];
                window.CouponModule.render();
            }
        } catch (e) {
            console.warn('加载优惠券数据失败');
        }
    }
}

/**
 * 获取所有优惠券
 * @returns {Array<Object>} 优惠券数组
 */
export function getCoupons() {
    try {
        const data = localStorage.getItem('coupon_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 根据ID获取优惠券
 * @param {string} id - 优惠券ID
 * @returns {Object|null} 优惠券对象或null
 */
export function getCouponById(id) {
    try {
        const coupons = getCoupons();
        return coupons.find(c => c.id === id) || null;
    } catch (e) {
        return null;
    }
}

/**
 * 新增优惠券
 * @param {Object} coupon - 优惠券数据
 * @param {string} coupon.name - 优惠券名称
 * @param {string} coupon.code - 优惠券代码
 * @param {string} coupon.type - 类型 (discount/percent)
 * @param {number} coupon.value - 优惠值
 * @param {number} coupon.minOrder - 最低消费
 * @param {string} coupon.validFrom - 有效期开始
 * @param {string} coupon.validTo - 有效期结束
 * @returns {boolean} 是否成功
 */
export function addCoupon(coupon) {
    try {
        const coupons = getCoupons();
        coupons.push(coupon);
        localStorage.setItem('coupon_data', JSON.stringify(coupons));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 更新优惠券
 * @param {string} id - 优惠券ID
 * @param {Object} data - 要更新的数据
 * @returns {boolean} 是否成功
 */
export function updateCoupon(id, data) {
    try {
        const coupons = getCoupons();
        const index = coupons.findIndex(c => c.id === id);
        if (index >= 0) {
            coupons[index] = { ...coupons[index], ...data };
            localStorage.setItem('coupon_data', JSON.stringify(coupons));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * 删除优惠券
 * @param {string} id - 优惠券ID
 * @returns {boolean} 是否成功
 */
export function deleteCoupon(id) {
    try {
        const coupons = getCoupons();
        const filtered = coupons.filter(c => c.id !== id);
        localStorage.setItem('coupon_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 获取可用优惠券
 * @returns {Array<Object>} 可用优惠券数组
 */
export function getActiveCoupons() {
    try {
        const coupons = getCoupons();
        return coupons.filter(c => c.status === 'active');
    } catch (e) {
        return [];
    }
}

export default {
    init,
    getCoupons,
    getCouponById,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    getActiveCoupons
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('05-customers/coupons DOM ready');
    init();
});