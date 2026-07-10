/**
 * @file profit-loss.js
 * @module profit-loss
 * @description 损益表 - 收入费用汇总
 * 
 * @example
 * import { init } from './profit-loss.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} IncomeItem
 * @property {string} name - 项目名称
 * @property {number} current - 本期金额
 * @property {number} previous - 上期金额
 * @property {number} change - 变动百分比
 */

/**
 * @typedef {Object} ExpenseItem
 * @property {string} name - 项目名称
 * @property {number} current - 本期金额
 * @property {number} previous - 上期金额
 * @property {number} change - 变动百分比
 */

/**
 * @typedef {Object} ProfitLossData
 * @property {IncomeItem[]} income - 收入项目
 * @property {ExpenseItem[]} expenses - 费用项目
 * @property {Object} totals - 汇总数据
 */

/** @type {{data: ProfitLossData, period: string, loading: boolean}} 状态 */
const state = {
    data: {
        income: [],
        expenses: [],
        totals: { totalIncome: 0, totalExpenses: 0, netProfit: 0, profitRate: 0 }
    },
    period: 'current',
    loading: false
};

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
 * @returns {ProfitLossData} 模拟损益表数据
 */
function getMockData() {
    return {
        income: [
            { name: '主营业务收入', current: 158000, previous: 142000, change: 11.3 },
            { name: '其他业务收入', current: 12000, previous: 10000, change: 20.0 },
            { name: '投资收益', current: 5000, previous: 3000, change: 66.7 }
        ],
        expenses: [
            { name: '主营业务成本', current: 95000, previous: 88000, change: 8.0 },
            { name: '销售费用', current: 12000, previous: 11000, change: 9.1 },
            { name: '管理费用', current: 18000, previous: 16500, change: 9.1 },
            { name: '财务费用', current: 3000, previous: 2800, change: 7.1 },
            { name: '税金及附加', current: 4500, previous: 4000, change: 12.5 }
        ],
        totals: { totalIncome: 175000, totalExpenses: 132500, netProfit: 42500, profitRate: 24.3 }
    };
}

/**
 * @private
 * @description 加载损益表数据
 */
function loadData() {
    state.loading = true;
    
    try {
        const saved = localStorage.getItem('profit_loss_data');
        if (saved) {
            state.data = JSON.parse(saved);
        } else {
            state.data = getMockData();
            localStorage.setItem('profit_loss_data', JSON.stringify(state.data));
        }
    } catch (e) {
        console.warn('加载损益表数据失败:', e);
        state.data = getMockData();
    }
    
    state.loading = false;
    render();
}

/**
 * @private
 * @description 渲染损益表
 */
function render() {
    const incomeBody = document.getElementById('incomeBody');
    const expenseBody = document.getElementById('expenseBody');
    
    if (incomeBody) {
        if (state.data.income.length === 0) {
            incomeBody.innerHTML = `
                <tr><td colspan="3" style="text-align:center;padding:20px;color:#9CA3AF;">暂无收入数据</td></tr>
            `;
        } else {
            incomeBody.innerHTML = state.data.income.map(item => `
                <tr style="border-bottom:1px solid #F3F4F6;">
                    <td style="padding:8px 16px;">${item.name}</td>
                    <td style="padding:8px 16px;text-align:right;font-weight:600;color:#10B981;">
                        ¥${formatCurrency(item.current)}
                    </td>
                    <td style="padding:8px 16px;text-align:right;color:${item.change >= 0 ? '#10B981' : '#EF4444'};">
                        ${item.change >= 0 ? '↑' : '↓'} ${Math.abs(item.change)}%
                    </td>
                </tr>
            `).join('');
        }
    }
    
    if (expenseBody) {
        if (state.data.expenses.length === 0) {
            expenseBody.innerHTML = `
                <tr><td colspan="3" style="text-align:center;padding:20px;color:#9CA3AF;">暂无费用数据</td></tr>
            `;
        } else {
            expenseBody.innerHTML = state.data.expenses.map(item => `
                <tr style="border-bottom:1px solid #F3F4F6;">
                    <td style="padding:8px 16px;">${item.name}</td>
                    <td style="padding:8px 16px;text-align:right;font-weight:600;color:#EF4444;">
                        ¥${formatCurrency(item.current)}
                    </td>
                    <td style="padding:8px 16px;text-align:right;color:${item.change >= 0 ? '#EF4444' : '#10B981'};">
                        ${item.change >= 0 ? '↑' : '↓'} ${Math.abs(item.change)}%
                    </td>
                </tr>
            `).join('');
        }
    }
    
    // 更新汇总
    const totals = state.data.totals;
    document.getElementById('totalIncome')?.textContent = '¥' + formatCurrency(totals.totalIncome);
    document.getElementById('totalExpenses')?.textContent = '¥' + formatCurrency(totals.totalExpenses);
    document.getElementById('netProfit')?.textContent = '¥' + formatCurrency(totals.netProfit);
    document.getElementById('profitRate')?.textContent = totals.profitRate + '%';
}

/**
 * @private
 */
function refreshData() {
    loadData();
    showToast('数据已刷新', 'success');
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📊 损益表 初始化...');
    
    if (options?.data) {
        state.data = options.data;
        localStorage.setItem('profit_loss_data', JSON.stringify(state.data));
    }
    
    loadData();
    
    // 绑定刷新按钮
    const refreshBtn = document.getElementById('refreshPL');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
    
    window.ProfitLossModule = {
        state,
        loadData,
        render,
        refreshData
    };
    
    console.log('✅ 损益表 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadData,
    refreshData
};