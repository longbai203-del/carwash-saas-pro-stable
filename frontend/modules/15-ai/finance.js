/**
 * @file finance.js
 * @module ai-finance
 * @description AI财务分析 - 财务数据智能分析和预测
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';
import { formatNumber } from '../../../js/core/helpers.js';

/** @type {{stats: Object, predictions: Array, risks: Array, filters: Object}} */
const state = {
    stats: {
        revenue: 125800,
        expenses: 68900,
        profit: 56900,
        profitRate: 45.2,
        cashFlow: 38200,
        ar: 15600,
        ap: 8900,
        debtRatio: 32.5
    },
    predictions: [],
    risks: [],
    filters: { type: '', period: '' }
};

/**
 * @private
 */
function getMockData() {
    const now = new Date();
    return {
        predictions: [
            { id: 'fin-pred-001', metric: '月度收入', current: 125800, predicted: 138000, confidence: 0.92, period: '下月' },
            { id: 'fin-pred-002', metric: '净利润', current: 56900, predicted: 62000, confidence: 0.88, period: '下月' },
            { id: 'fin-pred-003', metric: '现金流', current: 38200, predicted: 41500, confidence: 0.83, period: '下月' }
        ],
        risks: [
            { id: 'fin-risk-001', title: '应收账款风险', description: '应收账款周转天数上升至45天，高于行业平均水平', severity: 'medium', impact: '现金流压力' },
            { id: 'fin-risk-002', title: '成本上升风险', description: '原材料成本上涨5%，可能影响毛利率', severity: 'high', impact: '利润下降' }
        ]
    };
}

/**
 * @private
 */
function render() {
    const container = document.getElementById('aiFinanceContainer');
    if (!container) return;
    
    const s = state.stats;
    
    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px;">
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#10B981;">¥${formatNumber(s.revenue)}</div>
                <div style="font-size:11px;color:#6B7280;">📊 月度收入</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#4F46E5;">¥${formatNumber(s.profit)}</div>
                <div style="font-size:11px;color:#6B7280;">📈 净利润</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#F59E0B;">${s.profitRate}%</div>
                <div style="font-size:11px;color:#6B7280;">📊 利润率</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#3B82F6;">¥${formatNumber(s.cashFlow)}</div>
                <div style="font-size:11px;color:#6B7280;">💰 现金流</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#EF4444;">${s.debtRatio}%</div>
                <div style="font-size:11px;color:#6B7280;">📉 资产负债率</div>
            </div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;">
                <div style="font-weight:600;margin-bottom:12px;">🔮 财务预测</div>
                ${state.predictions.map(p => `
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F3F4F6;">
                        <span>${p.metric}</span>
                        <div>
                            <span style="color:#6B7280;font-size:12px;">${formatNumber(p.current)} → </span>
                            <span style="font-weight:600;color:#4F46E5;">${formatNumber(p.predicted)}</span>
                            <span style="font-size:11px;color:#6B7280;"> (${Math.round(p.confidence * 100)}%)</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;">
                <div style="font-weight:600;margin-bottom:12px;">⚠️ 财务风险</div>
                ${state.risks.map(r => `
                    <div style="padding:10px;border-radius:6px;margin-bottom:8px;background:${r.severity === 'high' ? '#FEF2F2' : '#FEFCE8'};border:1px solid ${r.severity === 'high' ? '#FEE2E2' : '#FEF08A'};">
                        <div style="font-weight:500;">${r.severity === 'high' ? '🔴' : '🟡'} ${r.title}</div>
                        <div style="font-size:13px;color:#6B7280;">${r.description}</div>
                        <div style="font-size:12px;color:#EF4444;">影响: ${r.impact}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * @public
 */
export async function init(options) {
    console.log('🤖 AI财务分析 初始化...');
    const data = getMockData();
    state.predictions = data.predictions;
    state.risks = data.risks;
    render();
    
    window.AIFinanceModule = { state, render };
    console.log('✅ AI财务分析 初始化完成');
}

export default { init, render };