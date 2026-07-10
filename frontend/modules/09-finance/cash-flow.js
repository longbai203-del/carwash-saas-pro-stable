/**
 * @file cash-flow.js
 * @module cash-flow
 * @description 现金流量表 - 现金流分类汇总
 * 
 * @example
 * import { init } from './cash-flow.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} CashFlowItem
 * @property {string} category - 分类
 * @property {string} name - 项目名称
 * @property {number} amount - 金额
 * @property {string} type - 类型 (inflow/outflow)
 */

/**
 * @typedef {Object} CashFlowData
 * @property {CashFlowItem[]} operating - 经营活动
 * @property {CashFlowItem[]} investing - 投资活动
 * @property {CashFlowItem[]} financing - 筹资活动
 * @property {Object} totals - 汇总数据
 */

/** @type {{data: CashFlowData, period: string, loading: boolean}} 状态 */
const state = {
    data: {
        operating: [],
        investing: [],
        financing: [],
        totals: { netOperating: 0, netInvesting: 0, netFinancing: 0, netIncrease: 0 }
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
 * @returns {CashFlowData} 模拟现金流量数据
 */
function getMockData() {
    return {
        operating: [
            { category: '经营活动', name: '销售商品收到的现金', amount: 168000, type: 'inflow' },
            { category: '经营活动', name: '收到的税费返还', amount: 5000, type: 'inflow' },
            { category: '经营活动', name: '购买商品支付的现金', amount: -85000, type: 'outflow' },
            { category: '经营活动', name: '支付给职工的现金', amount: -25000, type: 'outflow' },
            { category: '经营活动', name: '支付的各项税费', amount: -12000, type: 'outflow' }
        ],
        investing: [
            { category: '投资活动', name: '收回投资收到的现金', amount: 30000, type: 'inflow' },
            { category: '投资活动', name: '购建固定资产支付的现金', amount: -45000, type: 'outflow' }
        ],
        financing: [
            { category: '筹资活动', name: '吸收投资收到的现金', amount: 50000, type: 'inflow' },
            { category: '筹资活动', name: '偿还债务支付的现金', amount: -20000, type: 'outflow' },
            { category: '筹资活动', name: '分配股利支付的现金', amount: -10000, type: 'outflow' }
        ],
        totals: { netOperating: 51000, netInvesting: -15000, netFinancing: 20000, netIncrease: 56000 }
    };
}

/**
 * @private
 * @description 加载现金流量数据
 */
function loadData() {
    state.loading = true;
    
    try {
        const saved = localStorage.getItem('cash_flow_data');
        if (saved) {
            state.data = JSON.parse(saved);
        } else {
            state.data = getMockData();
            localStorage.setItem('cash_flow_data', JSON.stringify(state.data));
        }
    } catch (e) {
        console.warn('加载现金流量数据失败:', e);
        state.data = getMockData();
    }
    
    state.loading = false;
    render();
}

/**
 * @private
 * @description 渲染现金流量表
 */
function render() {
    const sections = [
        { id: 'operatingBody', data: state.data.operating, label: '经营活动' },
        { id: 'investingBody', data: state.data.investing, label: '投资活动' },
        { id: 'financingBody', data: state.data.financing, label: '筹资活动' }
    ];
    
    sections.forEach(section => {
        const tbody = document.getElementById(section.id);
        if (!tbody) return;
        
        if (section.data.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="2" style="text-align:center;padding:20px;color:#9CA3AF;">暂无数据</td></tr>
            `;
            return;
        }
        
        tbody.innerHTML = section.data.map(item => {
            const isInflow = item.amount > 0;
            const color = isInflow ? '#10B981' : '#EF4444';
            const label = isInflow ? '流入' : '流出';
            
            return `
                <tr style="border-bottom:1px solid #F3F4F6;">
                    <td style="padding:8px 16px;">${item.name}</td>
                    <td style="padding:8px 16px;text-align:right;font-weight:600;color:${color};">
                        ${isInflow ? '+' : ''}¥${formatCurrency(Math.abs(item.amount))}
                        <span style="font-size:11px;color:#6B7280;margin-left:8px;">${label}</span>
                    </td>
                </tr>
            `;
        }).join('');
    });
    
    // 更新汇总
    const totals = state.data.totals;
    document.getElementById('netOperating')?.textContent = '¥' + formatCurrency(totals.netOperating);
    document.getElementById('netInvesting')?.textContent = '¥' + formatCurrency(totals.netInvesting);
    document.getElementById('netFinancing')?.textContent = '¥' + formatCurrency(totals.netFinancing);
    document.getElementById('netIncrease')?.textContent = '¥' + formatCurrency(totals.netIncrease);
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
    console.log('💰 现金流量表 初始化...');
    
    if (options?.data) {
        state.data = options.data;
        localStorage.setItem('cash_flow_data', JSON.stringify(state.data));
    }
    
    loadData();
    
    const refreshBtn = document.getElementById('refreshCF');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
    
    window.CashFlowModule = {
        state,
        loadData,
        render,
        refreshData
    };
    
    console.log('✅ 现金流量表 初始化完成');
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