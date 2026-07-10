/**
 * @file balance-sheet.js
 * @module balance-sheet
 * @description 资产负债表 - 资产、负债、权益汇总
 * 
 * @example
 * import { init } from './balance-sheet.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} BalanceItem
 * @property {string} name - 项目名称
 * @property {number} current - 本期金额
 * @property {number} previous - 上期金额
 */

/**
 * @typedef {Object} BalanceSheetData
 * @property {BalanceItem[]} assets - 资产项目
 * @property {BalanceItem[]} liabilities - 负债项目
 * @property {BalanceItem[]} equity - 权益项目
 * @property {Object} totals - 汇总数据
 */

/** @type {{data: BalanceSheetData, period: string, loading: boolean}} 状态 */
const state = {
    data: {
        assets: [],
        liabilities: [],
        equity: [],
        totals: { totalAssets: 0, totalLiabilities: 0, totalEquity: 0 }
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
 * @returns {BalanceSheetData} 模拟资产负债表数据
 */
function getMockData() {
    return {
        assets: [
            { name: '货币资金', current: 98100, previous: 85600 },
            { name: '应收账款', current: 32000, previous: 28000 },
            { name: '存货', current: 45600, previous: 42000 },
            { name: '固定资产', current: 120000, previous: 115000 },
            { name: '无形资产', current: 15000, previous: 15000 }
        ],
        liabilities: [
            { name: '应付账款', current: 28000, previous: 25000 },
            { name: '应付职工薪酬', current: 15000, previous: 12000 },
            { name: '应交税费', current: 8500, previous: 7000 },
            { name: '长期借款', current: 50000, previous: 50000 }
        ],
        equity: [
            { name: '实收资本', current: 200000, previous: 180000 },
            { name: '盈余公积', current: 25000, previous: 20000 },
            { name: '未分配利润', current: 42500, previous: 35000 }
        ],
        totals: { totalAssets: 310700, totalLiabilities: 101500, totalEquity: 267500 }
    };
}

/**
 * @private
 * @description 加载资产负债表数据
 */
function loadData() {
    state.loading = true;
    
    try {
        const saved = localStorage.getItem('balance_sheet_data');
        if (saved) {
            state.data = JSON.parse(saved);
        } else {
            state.data = getMockData();
            localStorage.setItem('balance_sheet_data', JSON.stringify(state.data));
        }
    } catch (e) {
        console.warn('加载资产负债表数据失败:', e);
        state.data = getMockData();
    }
    
    state.loading = false;
    render();
}

/**
 * @private
 * @description 渲染资产负债表
 */
function render() {
    const sections = [
        { id: 'assetsBody', data: state.data.assets, label: '资产' },
        { id: 'liabilitiesBody', data: state.data.liabilities, label: '负债' },
        { id: 'equityBody', data: state.data.equity, label: '权益' }
    ];
    
    sections.forEach(section => {
        const tbody = document.getElementById(section.id);
        if (!tbody) return;
        
        if (section.data.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="3" style="text-align:center;padding:20px;color:#9CA3AF;">暂无数据</td></tr>
            `;
            return;
        }
        
        tbody.innerHTML = section.data.map(item => {
            const change = item.previous > 0 
                ? ((item.current - item.previous) / item.previous * 100) 
                : 0;
            
            return `
                <tr style="border-bottom:1px solid #F3F4F6;">
                    <td style="padding:8px 16px;">${item.name}</td>
                    <td style="padding:8px 16px;text-align:right;font-weight:600;">
                        ¥${formatCurrency(item.current)}
                    </td>
                    <td style="padding:8px 16px;text-align:right;color:${change >= 0 ? '#10B981' : '#EF4444'};">
                        ${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}%
                    </td>
                </tr>
            `;
        }).join('');
    });
    
    // 更新汇总
    const totals = state.data.totals;
    document.getElementById('totalAssets')?.textContent = '¥' + formatCurrency(totals.totalAssets);
    document.getElementById('totalLiabilities')?.textContent = '¥' + formatCurrency(totals.totalLiabilities);
    document.getElementById('totalEquity')?.textContent = '¥' + formatCurrency(totals.totalEquity);
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
    console.log('📋 资产负债表 初始化...');
    
    if (options?.data) {
        state.data = options.data;
        localStorage.setItem('balance_sheet_data', JSON.stringify(state.data));
    }
    
    loadData();
    
    const refreshBtn = document.getElementById('refreshBS');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
    
    window.BalanceSheetModule = {
        state,
        loadData,
        render,
        refreshData
    };
    
    console.log('✅ 资产负债表 初始化完成');
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