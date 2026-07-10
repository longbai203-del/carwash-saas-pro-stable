/**
 * @file marketing.js
 * @module marketing
 * @description 营销概览 - 营销活动数据总览
 * 
 * @example
 * import { init } from './marketing.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} MarketingStats
 * @property {number} activeCampaigns - 进行中活动数
 * @property {number} conversionRate - 转化率提升
 * @property {number} newCustomers - 新增客户数
 * @property {number} revenue - 营销收入
 */

/**
 * @typedef {Object} PromotionItem
 * @property {string} name - 促销名称
 * @property {string} type - 促销类型
 * @property {string} status - 状态 (进行中/已结束/待开始)
 * @property {number} usage - 使用次数
 */

/**
 * @typedef {Object} MarketingData
 * @property {MarketingStats} stats - 统计数据
 * @property {PromotionItem[]} promotions - 促销列表
 */

/** @type {MarketingData} 默认数据 */
const DEFAULT_DATA = {
    stats: {
        activeCampaigns: 0,
        conversionRate: 0,
        newCustomers: 0,
        revenue: 0
    },
    promotions: []
};

/**
 * @private
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0';
    return Number(amount).toLocaleString('zh-CN');
}

/**
 * @private
 * @param {MarketingStats} stats - 统计数据
 * @description 渲染统计数据
 */
function renderStats(stats) {
    const cards = document.querySelectorAll('.marketing-card');
    const values = cards.length > 0 ? cards.querySelectorAll('.value') : [];
    
    if (values.length >= 4) {
        values[0].textContent = stats.activeCampaigns;
        values[1].textContent = stats.conversionRate + '%';
        values[2].textContent = stats.newCustomers;
        values[3].textContent = '¥' + formatCurrency(stats.revenue);
    } else {
        // 备用：通过ID查找
        const idMap = {
            'mktActive': stats.activeCampaigns,
            'mktConversion': stats.conversionRate + '%',
            'mktNewCustomers': stats.newCustomers,
            'mktRevenue': '¥' + formatCurrency(stats.revenue)
        };
        Object.keys(idMap).forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.textContent = idMap[id];
        });
        
        // 再尝试通过卡片内部的元素查找
        const allCards = document.querySelectorAll('.marketing-card, .stat-card, .card');
        allCards.forEach(function(card, index) {
            const valEl = card.querySelector('.value, .stat-value, .number');
            if (valEl) {
                const keys = ['activeCampaigns', 'conversionRate', 'newCustomers', 'revenue'];
                if (index < keys.length) {
                    const key = keys[index];
                    if (key === 'conversionRate') {
                        valEl.textContent = stats.conversionRate + '%';
                    } else if (key === 'revenue') {
                        valEl.textContent = '¥' + formatCurrency(stats.revenue);
                    } else {
                        valEl.textContent = stats[key];
                    }
                }
            }
        });
    }
}

/**
 * @private
 * @param {PromotionItem[]} promotions - 促销列表
 * @description 渲染促销列表
 */
function renderPromotions(promotions) {
    const tbody = document.querySelector('.table tbody') || 
                  document.querySelector('#promotionTable tbody') ||
                  document.querySelector('[data-promotion-table] tbody');
    
    if (!tbody) {
        console.warn('⚠️ 找不到促销表格');
        return;
    }

    if (!promotions || promotions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;padding:20px;color:#9CA3AF;">
                    暂无促销活动
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        '进行中': 'badge-success',
        '已结束': 'badge-secondary',
        '待开始': 'badge-info'
    };

    let html = '';
    for (let i = 0; i < Math.min(promotions.length, 5); i++) {
        const p = promotions[i];
        const badgeClass = statusMap[p.status] || 'badge-secondary';
        html += `
            <tr>
                <td>${p.name}</td>
                <td>${p.type}</td>
                <td><span class="badge ${badgeClass}">${p.status}</span></td>
                <td>${p.usage}</td>
            </tr>
        `;
    }
    tbody.innerHTML = html;
}

/**
 * @private
 * @param {MarketingData} data - 营销数据
 * @description 加载并渲染营销数据
 */
function loadMarketingData(data) {
    console.log('🔄 Loading marketing data...');
    
    const stats = data?.stats || DEFAULT_DATA.stats;
    const promotions = data?.promotions || DEFAULT_DATA.promotions;
    
    renderStats(stats);
    renderPromotions(promotions);
    console.log('✅ Marketing data loaded');
}

/**
 * @public
 * @param {MarketingData} data - 营销数据
 * @returns {Promise<void>}
 * @description 初始化营销概览
 */
export async function init(data) {
    console.log('📢 Marketing Dashboard 初始化...');

    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    // 使用传入数据或从API加载
    const marketingData = data || await loadFromAPI();
    loadMarketingData(marketingData);

    // 绑定刷新按钮
    const refreshBtn = document.querySelector('.page-header .btn-secondary, #refreshMarketingBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                setTimeout(function() {
                    icon.classList.remove('fa-spin');
                }, 1000);
            }
            const newData = await loadFromAPI();
            loadMarketingData(newData);
            showToast('营销数据已刷新', 'success');
        });
    }

    console.log('✅ Marketing Dashboard 初始化完成');
}

/**
 * @private
 * @returns {Promise<MarketingData>} 营销数据
 * @description 从API加载数据
 */
async function loadFromAPI() {
    try {
        const response = await apiClient.get('/marketing/stats');
        if (response && response.success) {
            return response.data;
        }
        return DEFAULT_DATA;
    } catch (error) {
        console.warn('⚠️ API加载失败，使用默认数据:', error);
        return DEFAULT_DATA;
    }
}

export default {
    init
};