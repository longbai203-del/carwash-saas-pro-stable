/**
 * gift-cards.js - 礼品卡管理模块
 * @module gift-cards
 * @description 提供礼品卡的CRUD操作和数据管理
 */

// 05-customers/gift-cards.js
console.log('📄 05-customers/gift-cards page loaded');

/**
 * 初始化礼品卡模块
 * @returns {void}
 */
export function init() {
    console.log('05-customers/gift-cards initialized');
    
    const saved = localStorage.getItem('giftcard_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载礼品卡数据:', data.length);
            if (typeof window.GiftCardModule !== 'undefined') {
                window.GiftCardModule.cards = data;
                window.GiftCardModule.filteredCards = [...data];
                window.GiftCardModule.render();
            }
        } catch (e) {
            console.warn('加载礼品卡数据失败');
        }
    }
}

/**
 * 获取所有礼品卡
 * @returns {Array<Object>} 礼品卡数组
 */
export function getGiftCards() {
    try {
        const data = localStorage.getItem('giftcard_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 根据ID获取礼品卡
 * @param {string} id - 礼品卡ID
 * @returns {Object|null} 礼品卡对象或null
 */
export function getGiftCardById(id) {
    try {
        const cards = getGiftCards();
        return cards.find(c => c.id === id) || null;
    } catch (e) {
        return null;
    }
}

/**
 * 根据卡号获取礼品卡
 * @param {string} number - 礼品卡号
 * @returns {Object|null} 礼品卡对象或null
 */
export function getGiftCardByNumber(number) {
    try {
        const cards = getGiftCards();
        return cards.find(c => c.number === number) || null;
    } catch (e) {
        return null;
    }
}

/**
 * 新增礼品卡
 * @param {Object} card - 礼品卡数据
 * @param {string} card.number - 卡号
 * @param {string} card.holder - 持卡人
 * @param {number} card.balance - 余额
 * @returns {boolean} 是否成功
 */
export function addGiftCard(card) {
    try {
        const cards = getGiftCards();
        cards.push(card);
        localStorage.setItem('giftcard_data', JSON.stringify(cards));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 更新礼品卡
 * @param {string} id - 礼品卡ID
 * @param {Object} data - 要更新的数据
 * @returns {boolean} 是否成功
 */
export function updateGiftCard(id, data) {
    try {
        const cards = getGiftCards();
        const index = cards.findIndex(c => c.id === id);
        if (index >= 0) {
            cards[index] = { ...cards[index], ...data };
            localStorage.setItem('giftcard_data', JSON.stringify(cards));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * 删除礼品卡
 * @param {string} id - 礼品卡ID
 * @returns {boolean} 是否成功
 */
export function deleteGiftCard(id) {
    try {
        const cards = getGiftCards();
        const filtered = cards.filter(c => c.id !== id);
        localStorage.setItem('giftcard_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getGiftCards,
    getGiftCardById,
    getGiftCardByNumber,
    addGiftCard,
    updateGiftCard,
    deleteGiftCard
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('05-customers/gift-cards DOM ready');
    init();
});