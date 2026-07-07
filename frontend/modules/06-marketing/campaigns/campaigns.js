/**
 * campaigns.js - 营销活动管理模块
 * @module campaigns
 * @description 提供营销活动的CRUD操作和数据管理
 */

// 06-marketing/campaigns.js
console.log('📄 06-marketing/campaigns page loaded');

/**
 * 初始化活动模块
 * @returns {void}
 */
export function init() {
    console.log('06-marketing/campaigns initialized');
    
    const saved = localStorage.getItem('campaign_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载活动数据:', data.length);
            if (typeof window.CampaignModule !== 'undefined') {
                window.CampaignModule.campaigns = data;
                window.CampaignModule.filteredCampaigns = [...data];
                window.CampaignModule.render();
            }
        } catch (e) {
            console.warn('加载活动数据失败');
        }
    }
}

/**
 * 获取所有活动
 * @returns {Array<Object>} 活动数组
 */
export function getCampaigns() {
    try {
        const data = localStorage.getItem('campaign_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 根据ID获取活动
 * @param {string} id - 活动ID
 * @returns {Object|null} 活动对象或null
 */
export function getCampaignById(id) {
    try {
        const campaigns = getCampaigns();
        return campaigns.find(c => c.id === id) || null;
    } catch (e) {
        return null;
    }
}

/**
 * 新增活动
 * @param {Object} campaign - 活动数据
 * @param {string} campaign.name - 活动名称
 * @param {string} campaign.desc - 描述
 * @param {string} campaign.status - 状态
 * @param {string} campaign.startDate - 开始日期
 * @param {string} campaign.endDate - 结束日期
 * @returns {boolean} 是否成功
 */
export function addCampaign(campaign) {
    try {
        const campaigns = getCampaigns();
        campaigns.push(campaign);
        localStorage.setItem('campaign_data', JSON.stringify(campaigns));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 更新活动
 * @param {string} id - 活动ID
 * @param {Object} data - 要更新的数据
 * @returns {boolean} 是否成功
 */
export function updateCampaign(id, data) {
    try {
        const campaigns = getCampaigns();
        const index = campaigns.findIndex(c => c.id === id);
        if (index >= 0) {
            campaigns[index] = { ...campaigns[index], ...data };
            localStorage.setItem('campaign_data', JSON.stringify(campaigns));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * 删除活动
 * @param {string} id - 活动ID
 * @returns {boolean} 是否成功
 */
export function deleteCampaign(id) {
    try {
        const campaigns = getCampaigns();
        const filtered = campaigns.filter(c => c.id !== id);
        localStorage.setItem('campaign_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getCampaigns,
    getCampaignById,
    addCampaign,
    updateCampaign,
    deleteCampaign
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('06-marketing/campaigns DOM ready');
    init();
});