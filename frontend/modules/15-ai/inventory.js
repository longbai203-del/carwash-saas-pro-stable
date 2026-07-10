/**
 * @file inventory.js
 * @module ai-inventory
 * @description AI库存分析 - 库存智能优化和预测
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';
import { formatNumber } from '../../../js/core/helpers.js';

/** @type {{stats: Object, predictions: Array, alerts: Array, recommendations: Array}} */
const state = {
    stats: {
        totalItems: 456,
        totalValue: 234800,
        lowStock: 23,
        outOfStock: 5,
        turnoverRate: 4.8,
        daysInventory: 75,
        wasteRate: 2.3
    },
    predictions: [],
    alerts: [],
    recommendations: []
};

/**
 * @private
 */
function getMockData() {
    return {
        predictions: [
            { id: 'inv-pred-001', item: '洗车液A', currentStock: 120, predictedDemand: 150, confidence: 0.92, period: '下周' },
            { id: 'inv-pred-002', item: '洗车蜡B', currentStock: 45, predictedDemand: 35, confidence: 0.88, period: '下周' },
            { id: 'inv-pred-003', item: '毛巾套装', currentStock: 200, predictedDemand: 180, confidence: 0.85, period: '下周' }
        ],
        alerts: [
            { id: 'inv-alt-001', item: '洗车液A', current: 15, min: 50, severity: 'critical' },
            { id: 'inv-alt-002', item: '抛光剂C', current: 30, min: 40, severity: 'warning' }
        ],
        recommendations: [
            { id: 'inv-rec-001', title: '补货建议', description: '洗车液A需要紧急补货，建议采购200瓶', priority: 'high' },
            { id: 'inv-rec-002', title: '库存优化', description: '毛巾套装库存偏高，建议暂停采购', priority: 'medium' }
        ]
    };
}

/**
 * @private
 */
function render() {
    const container = document.getElementById('aiInventoryContainer');
    if (!container) return;
    
    const s = state.stats;
    
    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;">
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:10px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:#4F46E5;">${s.totalItems}</div>
                <div style="font-size:11px;color:#6B7280;">📦 总SKU</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:10px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:#10B981;">¥${formatNumber(s.totalValue)}</div>
                <div style="font-size:11px;color:#6B7280;">💰 库存价值</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:10px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:#EF4444;">${s.lowStock}</div>
                <div style="font-size:11px;color:#6B7280;">⚠️ 低库存</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:10px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:#F59E0B;">${s.turnoverRate}</div>
                <div style="font-size:11px;color:#6B7280;">🔄 周转率</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:10px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:#8B5CF6;">${s.daysInventory}天</div>
                <div style="font-size:11px;color:#6B7280;">📅 库存天数</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:10px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:#EF4444;">${s.wasteRate}%</div>
                <div style="font-size:11px;color:#6B7280;">🗑️ 损耗率</div>
            </div>
        </div>
        
        <!-- 告警 -->
        ${state.alerts.length > 0 ? `
            <div style="background:#FEF2F2;border:1px solid #FEE2E2;border-radius:8px;padding:12px;margin-bottom:16px;">
                <div style="font-weight:600;color:#991B1B;margin-bottom:6px;">⚠️ 库存告警</div>
                ${state.alerts.map(a => `
                    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
                        <span>${a.item}</span>
                        <span>当前: ${a.current} / 最低: ${a.min}</span>
                        <span style="color:${a.severity === 'critical' ? '#EF4444' : '#F59E0B'};">
                            ${a.severity === 'critical' ? '🔴 紧急' : '🟡 预警'}
                        </span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <!-- 预测 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;">
                <div style="font-weight:600;margin-bottom:12px;">🔮 需求预测</div>
                ${state.predictions.map(p => `
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F3F4F6;">
                        <span>${p.item}</span>
                        <div>
                            <span style="color:#6B7280;font-size:12px;">${p.currentStock} → </span>
                            <span style="font-weight:600;color:#4F46E5;">${p.predictedDemand}</span>
                            <span style="font-size:11px;color:#6B7280;"> (${Math.round(p.confidence * 100)}%)</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;">
                <div style="font-weight:600;margin-bottom:12px;">💡 优化建议</div>
                ${state.recommendations.map(r => `
                    <div style="padding:8px;border-radius:6px;margin-bottom:8px;background:${r.priority === 'high' ? '#FEF2F2' : '#F9FAFB'};border:1px solid ${r.priority === 'high' ? '#FEE2E2' : '#E5E7EB'};">
                        <div style="font-weight:500;">${r.priority === 'high' ? '🔴' : '🟡'} ${r.title}</div>
                        <div style="font-size:13px;color:#6B7280;">${r.description}</div>
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
    console.log('🤖 AI库存分析 初始化...');
    const data = getMockData();
    state.predictions = data.predictions;
    state.alerts = data.alerts;
    state.recommendations = data.recommendations;
    render();
    
    window.AIInventoryModule = { state, render };
    console.log('✅ AI库存分析 初始化完成');
}

export default { init, render };