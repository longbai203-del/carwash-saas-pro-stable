/**
 * @file finance.js
 * @module finance
 * @description 财务概览 - 财务状况总览
 * 
 * @example
 * import { init } from './finance.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} FinanceStats
 * @property {number} income - 本月收入
 * @property {number} expenses - 本月支出
 * @property {number} profit - 净利润
 * @property {number} profitRate - 利润率
 */

/** @type {FinanceStats} 默认数据 */
const DEFAULT_STATS = {
    income: 0,
    expenses: 0,
    profit: 0,
    profitRate: 0
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
 * @param {FinanceStats} stats - 统计数据
 * @description 渲染统计数据
 */
function renderStats(stats) {
    const cards = document.querySelectorAll('.finance-card');
    const values = cards.length > 0 ? cards.querySelectorAll('.value') : [];
    
    if (values.length >= 4) {
        values[0].textContent = '¥' + formatCurrency(stats.income);
        values[1].textContent = '¥' + formatCurrency(stats.expenses);
        values[2].textContent = '¥' + formatCurrency(stats.profit);
        values[3].textContent = stats.profitRate + '%';
        
        // 添加颜色类
        if (values[0]) values[0].classList.add('positive');
        if (values[1]) values[1].classList.add('negative');
        if (values[2]) values[2].classList.add('positive');
        if (values[3]) values[3].classList.add('positive');
    } else {
        // 备用：通过ID查找
        const idMap = {
            'finIncome': '¥' + formatCurrency(stats.income),
            'finExpenses': '¥' + formatCurrency(stats.expenses),
            'finProfit': '¥' + formatCurrency(stats.profit),
            'finProfitRate': stats.profitRate + '%'
        };
        Object.keys(idMap).forEach(function(id) {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = idMap[id];
                if (id === 'finIncome' || id === 'finProfit') {
                    el.classList.add('positive');
                } else if (id === 'finExpenses') {
                    el.classList.add('negative');
                }
            }
        });
        
        // 再尝试通过卡片内部的元素查找
        const allCards = document.querySelectorAll('.finance-card, .stat-card, .card');
        allCards.forEach(function(card, index) {
            const valEl = card.querySelector('.value, .stat-value, .number');
            if (valEl) {
                const keys = ['income', 'expenses', 'profit', 'profitRate'];
                if (index < keys.length) {
                    const key = keys[index];
                    if (key === 'income') {
                        valEl.textContent = '¥' + formatCurrency(stats.income);
                        valEl.classList.add('positive');
                    } else if (key === 'expenses') {
                        valEl.textContent = '¥' + formatCurrency(stats.expenses);
                        valEl.classList.add('negative');
                    } else if (key === 'profit') {
                        valEl.textContent = '¥' + formatCurrency(stats.profit);
                        valEl.classList.add('positive');
                    } else if (key === 'profitRate') {
                        valEl.textContent = stats.profitRate + '%';
                        valEl.classList.add('positive');
                    }
                }
            }
        });
    }
}

/**
 * @private
 * @param {FinanceStats} stats - 统计数据
 * @description 加载并渲染财务数据
 */
function loadFinanceData(stats) {
    console.log('🔄 Loading finance data...');
    renderStats(stats || DEFAULT_STATS);
    console.log('✅ Finance data loaded');
}

/**
 * @public
 * @param {FinanceStats} data - 财务数据
 * @returns {Promise<void>}
 * @description 初始化财务概览
 */
export async function init(data) {
    console.log('💰 Finance Dashboard 初始化...');

    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    // 使用传入数据或从API加载
    const stats = data || await loadFromAPI();
    loadFinanceData(stats);

    // 绑定刷新按钮
    const refreshBtn = document.querySelector('.page-header .btn-secondary, #refreshFinanceBtn');
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
            loadFinanceData(newData);
            showToast('财务数据已刷新', 'success');
        });
    }

    console.log('✅ Finance Dashboard 初始化完成');
}

/**
 * @private
 * @returns {Promise<FinanceStats>} 财务数据
 * @description 从API加载数据
 */
async function loadFromAPI() {
    try {
        const response = await apiClient.get('/finance/stats');
        if (response && response.success) {
            return response.data;
        }
        return DEFAULT_STATS;
    } catch (error) {
        console.warn('⚠️ API加载失败，使用默认数据:', error);
        return DEFAULT_STATS;
    }
}

export default {
    init
};