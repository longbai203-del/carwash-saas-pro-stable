/**
 * feedback.js - 客户反馈模块
 * @module feedback
 * @description 提供客户反馈的CRUD操作和数据管理
 */

// 05-customers/feedback.js
console.log('📄 05-customers/feedback page loaded');

/**
 * 初始化反馈模块
 * @returns {void}
 */
export function init() {
    console.log('05-customers/feedback initialized');
    
    const saved = localStorage.getItem('feedback_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载反馈数据:', data.length);
            if (typeof window.FeedbackModule !== 'undefined') {
                window.FeedbackModule.feedbacks = data;
                window.FeedbackModule.filteredFeedbacks = [...data];
                window.FeedbackModule.render();
            }
        } catch (e) {
            console.warn('加载反馈数据失败');
        }
    }
}

/**
 * 获取所有反馈
 * @returns {Array<Object>} 反馈数组
 */
export function getFeedbacks() {
    try {
        const data = localStorage.getItem('feedback_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 根据ID获取反馈
 * @param {string} id - 反馈ID
 * @returns {Object|null} 反馈对象或null
 */
export function getFeedbackById(id) {
    try {
        const feedbacks = getFeedbacks();
        return feedbacks.find(f => f.id === id) || null;
    } catch (e) {
        return null;
    }
}

/**
 * 新增反馈
 * @param {Object} feedback - 反馈数据
 * @param {string} feedback.customer - 客户名称
 * @param {number} feedback.rating - 评分(1-5)
 * @param {string} feedback.content - 反馈内容
 * @returns {boolean} 是否成功
 */
export function addFeedback(feedback) {
    try {
        const feedbacks = getFeedbacks();
        feedbacks.push(feedback);
        localStorage.setItem('feedback_data', JSON.stringify(feedbacks));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 更新反馈
 * @param {string} id - 反馈ID
 * @param {Object} data - 要更新的数据
 * @returns {boolean} 是否成功
 */
export function updateFeedback(id, data) {
    try {
        const feedbacks = getFeedbacks();
        const index = feedbacks.findIndex(f => f.id === id);
        if (index >= 0) {
            feedbacks[index] = { ...feedbacks[index], ...data };
            localStorage.setItem('feedback_data', JSON.stringify(feedbacks));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * 删除反馈
 * @param {string} id - 反馈ID
 * @returns {boolean} 是否成功
 */
export function deleteFeedback(id) {
    try {
        const feedbacks = getFeedbacks();
        const filtered = feedbacks.filter(f => f.id !== id);
        localStorage.setItem('feedback_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 获取待回复反馈
 * @returns {Array<Object>} 待回复反馈数组
 */
export function getPendingFeedbacks() {
    try {
        const feedbacks = getFeedbacks();
        return feedbacks.filter(f => f.status === 'pending');
    } catch (e) {
        return [];
    }
}

export default {
    init,
    getFeedbacks,
    getFeedbackById,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    getPendingFeedbacks
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('05-customers/feedback DOM ready');
    init();
});