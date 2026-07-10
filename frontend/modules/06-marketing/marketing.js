/**
 * @file marketing.js
 * @module marketing
 * @description 营销概览 - 营销数据总览仪表板
 * 
 * @example
 * import { init } from './marketing.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} MarketingStats
 * @property {number} activeCampaigns - 进行中活动
 * @property {number} totalPromotions - 促销总数
 * @property {number} activePromotions - 进行中促销
 * @property {number} totalReferrals - 推荐总数
 * @property {number} convertedReferrals - 已转化推荐
 * @property {number} totalReward - 总奖励积分
 * @property {number} conversionRate - 转化率
 * @property {number} totalBudget - 总预算
 * @property {number} totalSpent - 已花费
 * @property {number} avgConversion - 平均转化率
 */

/**
 * @typedef {Object} MarketingState
 * @property {MarketingStats} stats - 统计数据
 * @property {boolean} loading - 加载状态
 * @property {string|null} error - 错误信息
 */

/** @type {MarketingState} 状态 */
const state = {
    stats: {
        activeCampaigns: 0,
        totalPromotions: 0,
        activePromotions: 0,
        totalReferrals: 0,
        convertedReferrals: 0,
        totalReward: 0,
        conversionRate: 0,
        totalBudget: 0,
        totalSpent: 0,
        avgConversion: 0
    },
    loading: false,
    error: null
};

/** @type {number|null} 自动刷新定时器 */
let refreshInterval = null;

/**
 * @private
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return amount.toFixed(2);
}

/**
 * @private
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

/**
 * @private
 * @description 加载营销数据
 */
function loadMarketingData() {
    state.loading = true;
    
    try {
        // 从本地存储加载数据
        const promotions = JSON.parse(localStorage.getItem('promotion_data') || '[]');
        const campaigns = JSON.parse(localStorage.getItem('campaign_data') || '[]');
        const referrals = JSON.parse(localStorage.getItem('referral_data') || '[]');
        
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        const totalPromotions = promotions.length;
        const activePromotions = promotions.filter(p => p.status === 'active').length;
        const totalReferrals = referrals.length;
        const convertedReferrals = referrals.filter(r => r.status === 'converted').length;
        const totalReward = referrals
            .filter(r => r.status === 'converted')
            .reduce((sum, r) => sum + (r.reward || 0), 0);
        const conversionRate = totalReferrals > 0 
            ? Math.round((convertedReferrals / totalReferrals) * 100) 
            : 0;
        const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
        const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
        const avgConversion = campaigns.length > 0
            ? campaigns.reduce((sum, c) => sum + (c.conversion || 0), 0) / campaigns.length
            : 0;
        
        state.stats = {
            activeCampaigns,
            totalPromotions,
            activePromotions,
            totalReferrals,
            convertedReferrals,
            totalReward,
            conversionRate,
            totalBudget,
            totalSpent,
            avgConversion
        };
        
        state.loading = false;
        renderStats();
        
    } catch (error) {
        console.error('加载营销数据失败:', error);
        state.loading = false;
        state.error = error.message;
        showError('加载营销数据失败');
    }
}

/**
 * @private
 * @description 渲染统计数据
 */
function renderStats() {
    const stats = state.stats;
    
    const elements = {
        'statActiveCampaigns': stats.activeCampaigns,
        'statTotalPromotions': stats.totalPromotions,
        'statActivePromotions': stats.activePromotions,
        'statTotalReferrals': stats.totalReferrals,
        'statConvertedReferrals': stats.convertedReferrals,
        'statTotalReward': stats.totalReward,
        'statConversionRate': stats.conversionRate + '%',
        'statTotalBudget': '¥' + formatCurrency(stats.totalBudget),
        'statTotalSpent': '¥' + formatCurrency(stats.totalSpent),
        'statAvgConversion': stats.avgConversion.toFixed(1) + '%'
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @description 显示错误信息
 */
function showError(message) {
    const container = document.querySelector('.marketing-container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="padding:40px;text-align:center;">
            <i class="fas fa-exclamation-circle" style="font-size:48px;color:#EF4444;margin-bottom:16px;"></i>
            <h3 style="color:#374151;">加载失败</h3>
            <p style="color:#6B7280;">${message}</p>
            <button onclick="window.MarketingModule.refresh()" style="margin-top:16px;padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;">
                重新加载
            </button>
        </div>
    `;
}

/**
 * @private
 * @description 启动自动刷新
 */
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(() => {
        console.log('🔄 自动刷新营销数据...');
        loadMarketingData();
    }, 60000);
}

/**
 * @private
 * @description 停止自动刷新
 */
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const refreshBtn = document.getElementById('refreshMarketing');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadMarketingData();
            showToast('数据已刷新', 'success');
        });
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {MarketingStats} options.data - 初始数据
 * @returns {Promise<void>}
 * @description 初始化营销概览
 */
export async function init(options) {
    console.log('📢 营销概览 初始化...');
    
    if (options?.data) {
        state.stats = options.data;
        renderStats();
    } else {
        loadMarketingData();
    }
    
    bindEvents();
    startAutoRefresh();
    
    window.MarketingModule = {
        state,
        loadMarketingData,
        renderStats,
        refresh: loadMarketingData,
        stopAutoRefresh
    };
    
    console.log('✅ 营销概览 初始化完成');
}

/**
 * @public
 * @description 刷新数据
 */
export function refresh() {
    loadMarketingData();
}

/**
 * @public
 * @description 停止自动刷新
 */
export function stopRefresh() {
    stopAutoRefresh();
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    refresh,
    stopRefresh,
    loadMarketingData
};