/**
 * @file executive.js
 * @module ai-executive
 * @description AI高管视图 - 高管级业务智能分析
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast, showLoading } from '../../../js/core/init.js';
import { formatNumber, formatDate, getRelativeTime } from '../../../js/core/helpers.js';

/**
 * @typedef {Object} ExecutiveMetrics
 * @property {Object} revenue - 收入指标
 * @property {Object} profit - 利润指标
 * @property {Object} growth - 增长指标
 * @property {Object} efficiency - 效率指标
 */

/** @type {{metrics: ExecutiveMetrics, predictions: Array, insights: Array, alerts: Array, filters: Object, page: number}} */
const state = {
    metrics: {
        revenue: { current: 125800, previous: 112400, change: 11.9, target: 150000, forecast: 138000 },
        profit: { current: 28900, previous: 25400, change: 13.8, target: 35000, forecast: 32000 },
        growth: { current: 15.2, previous: 12.8, change: 18.8, target: 20, forecast: 17.5 },
        efficiency: { current: 82.5, previous: 78.3, change: 5.4, target: 90, forecast: 85.2 }
    },
    predictions: [],
    insights: [],
    alerts: [],
    filters: { category: '', severity: '' },
    page: 1
};

/**
 * @private
 */
function getMockData() {
    const now = new Date();
    return {
        predictions: [
            { id: 'exec-pred-001', title: '季度收入预测', current: 125800, predicted: 138000, confidence: 0.92, trend: 'up', period: '本季度' },
            { id: 'exec-pred-002', title: '年度增长率', current: 15.2, predicted: 18.4, confidence: 0.85, trend: 'up', period: '年度' },
            { id: 'exec-pred-003', title: '运营效率提升', current: 82.5, predicted: 87.3, confidence: 0.78, trend: 'up', period: '下季度' }
        ],
        insights: [
            { id: 'exec-ins-001', title: '收入增长加速', description: '近3个月收入增长率从8.2%提升到11.9%，主要驱动力来自新客户获取', category: 'revenue', severity: 'low', recommendation: '建议加大市场投入，扩大获客渠道' },
            { id: 'exec-ins-002', title: '成本结构优化空间', description: '运营成本占比偏高，存在15-20%的优化空间', category: 'cost', severity: 'medium', recommendation: '建议优化供应链流程，降低采购成本' },
            { id: 'exec-ins-003', title: '市场份额扩张机会', description: '区域市场份额增长至18.5%，仍有较大提升空间', category: 'market', severity: 'low', recommendation: '建议拓展新区域市场，增加品牌曝光' }
        ],
        alerts: [
            { id: 'exec-alt-001', title: '现金流预警', description: '未来30天现金流可能低于安全线', severity: 'high', createdAt: now.toISOString() },
            { id: 'exec-alt-002', title: '人才流失风险', description: '核心岗位人才流失率上升至12%', severity: 'medium', createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() }
        ]
    };
}

/**
 * @private
 */
function render() {
    const container = document.getElementById('aiExecutiveContainer');
    if (!container) return;
    
    const m = state.metrics;
    
    // 核心指标
    const metricsHtml = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px;">
            <div style="background:white;border:1px solid #E5E7EB;border-radius:10px;padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;color:#6B7280;">💰 收入</span>
                    <span style="font-size:13px;color:${m.revenue.change > 0 ? '#10B981' : '#EF4444'};font-weight:600;">
                        ${m.revenue.change > 0 ? '↑' : '↓'} ${Math.abs(m.revenue.change)}%
                    </span>
                </div>
                <div style="font-size:24px;font-weight:700;color:#1F2937;margin:4px 0;">¥${formatNumber(m.revenue.current)}</div>
                <div style="display:flex;gap:8px;font-size:12px;color:#6B7280;">
                    <span>目标: ¥${formatNumber(m.revenue.target)}</span>
                    <span>预测: ¥${formatNumber(m.revenue.forecast)}</span>
                </div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:10px;padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;color:#6B7280;">📈 利润</span>
                    <span style="font-size:13px;color:${m.profit.change > 0 ? '#10B981' : '#EF4444'};font-weight:600;">
                        ${m.profit.change > 0 ? '↑' : '↓'} ${Math.abs(m.profit.change)}%
                    </span>
                </div>
                <div style="font-size:24px;font-weight:700;color:#1F2937;margin:4px 0;">¥${formatNumber(m.profit.current)}</div>
                <div style="display:flex;gap:8px;font-size:12px;color:#6B7280;">
                    <span>目标: ¥${formatNumber(m.profit.target)}</span>
                    <span>预测: ¥${formatNumber(m.profit.forecast)}</span>
                </div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:10px;padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;color:#6B7280;">🚀 增长</span>
                    <span style="font-size:13px;color:${m.growth.change > 0 ? '#10B981' : '#EF4444'};font-weight:600;">
                        ${m.growth.change > 0 ? '↑' : '↓'} ${Math.abs(m.growth.change)}%
                    </span>
                </div>
                <div style="font-size:24px;font-weight:700;color:#1F2937;margin:4px 0;">${m.growth.current}%</div>
                <div style="display:flex;gap:8px;font-size:12px;color:#6B7280;">
                    <span>目标: ${m.growth.target}%</span>
                    <span>预测: ${m.growth.forecast}%</span>
                </div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:10px;padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;color:#6B7280;">⚡ 效率</span>
                    <span style="font-size:13px;color:${m.efficiency.change > 0 ? '#10B981' : '#EF4444'};font-weight:600;">
                        ${m.efficiency.change > 0 ? '↑' : '↓'} ${Math.abs(m.efficiency.change)}%
                    </span>
                </div>
                <div style="font-size:24px;font-weight:700;color:#1F2937;margin:4px 0;">${m.efficiency.current}%</div>
                <div style="display:flex;gap:8px;font-size:12px;color:#6B7280;">
                    <span>目标: ${m.efficiency.target}%</span>
                    <span>预测: ${m.efficiency.forecast}%</span>
                </div>
            </div>
        </div>
    `;
    
    // 告警
    const alertsHtml = state.alerts.length > 0 ? `
        <div style="background:#FEF2F2;border:1px solid #FEE2E2;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:8px;font-weight:600;color:#991B1B;margin-bottom:8px;">
                <i class="fas fa-exclamation-triangle"></i> AI实时告警
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
                ${state.alerts.map(a => `
                    <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:white;border-radius:4px;font-size:13px;border:1px solid #FEE2E2;">
                        ${a.severity === 'high' ? '🔴' : '🟡'} ${a.title}
                    </span>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    // 预测和洞察
    const contentHtml = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;">
                <div style="font-weight:600;color:#1F2937;margin-bottom:12px;">🔮 AI预测</div>
                ${state.predictions.map(p => `
                    <div style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
                        <div style="display:flex;justify-content:space-between;">
                            <span style="font-weight:500;">${p.title}</span>
                            <span style="color:${p.trend === 'up' ? '#10B981' : '#EF4444'};">
                                ${p.trend === 'up' ? '📈' : '📉'} ${p.predicted}
                            </span>
                        </div>
                        <div style="font-size:12px;color:#6B7280;">
                            置信度: ${Math.round(p.confidence * 100)}% · ${p.period}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;">
                <div style="font-weight:600;color:#1F2937;margin-bottom:12px;">💡 战略洞察</div>
                ${state.insights.map(i => `
                    <div style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
                        <div style="font-weight:500;">${i.title}</div>
                        <div style="font-size:13px;color:#6B7280;">${i.description}</div>
                        <div style="font-size:12px;color:#4F46E5;margin-top:2px;">💡 ${i.recommendation}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = metricsHtml + alertsHtml + contentHtml;
}

/**
 * @public
 */
export async function init(options) {
    console.log('🤖 AI高管视图 初始化...');
    const data = getMockData();
    state.predictions = data.predictions;
    state.insights = data.insights;
    state.alerts = data.alerts;
    
    render();
    
    window.AIExecutiveModule = {
        state,
        render,
        refreshData: () => {
            const data = getMockData();
            state.predictions = data.predictions;
            state.insights = data.insights;
            state.alerts = data.alerts;
            render();
            showToast('✅ AI数据已刷新', 'success');
        }
    };
    
    console.log('✅ AI高管视图 初始化完成');
}

export default {
    init,
    render,
    refreshData: () => {
        const data = getMockData();
        state.predictions = data.predictions;
        state.insights = data.insights;
        state.alerts = data.alerts;
        render();
    }
};