/**
 * @file business-health.js
 * @module business-health
 * @description 经营健康 - 店铺经营状况评估
 * 
 * @example
 * import { init } from './business-health.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} HealthMetric
 * @property {string} name - 指标名称
 * @property {number} value - 当前值
 * @property {number} target - 目标值
 * @property {string} status - 状态 (good/warning/danger)
 * @property {string} trend - 趋势 (up/down/stable)
 * @property {string} unit - 单位
 * @property {string} description - 描述
 */

/**
 * @typedef {Object} HealthData
 * @property {HealthMetric[]} metrics - 健康指标
 * @property {number} overallScore - 综合评分
 * @property {string} overallStatus - 综合状态
 * @property {string[]} recommendations - 建议列表
 */

/** @type {{data: HealthData, loading: boolean}} 状态 */
const state = {
    data: {
        metrics: [],
        overallScore: 0,
        overallStatus: 'good',
        recommendations: []
    },
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
 * @returns {HealthData} 模拟经营健康数据
 */
function getMockHealthData() {
    return {
        metrics: [
            { name: '营业额', value: 28560, target: 30000, status: 'good', trend: 'up', unit: '¥', description: '本月营业额较上月增长8.3%' },
            { name: '客流量', value: 234, target: 250, status: 'warning', trend: 'up', unit: '人', description: '本月客流量较上月增长5.2%' },
            { name: '客单价', value: 122.05, target: 130, status: 'warning', trend: 'down', unit: '¥', description: '客单价较上月下降3.1%' },
            { name: '转化率', value: 68, target: 75, status: 'warning', trend: 'stable', unit: '%', description: '转化率较上月持平' },
            { name: '客户满意度', value: 4.5, target: 4.8, status: 'good', trend: 'up', unit: '⭐', description: '客户满意度较上月提升0.2分' },
            { name: '复购率', value: 42, target: 50, status: 'danger', trend: 'down', unit: '%', description: '复购率较上月下降3%' },
            { name: '库存周转率', value: 3.2, target: 4.0, status: 'warning', trend: 'up', unit: '次', description: '库存周转较上月提升0.3次' },
            { name: '员工效率', value: 85, target: 90, status: 'good', trend: 'up', unit: '%', description: '员工效率较上月提升2%' }
        ],
        overallScore: 78,
        overallStatus: 'warning',
        recommendations: [
            '建议提升客单价，可通过推出套餐服务实现',
            '客户满意度良好，建议继续保持服务质量',
            '复购率偏低，建议推出会员优惠活动',
            '库存周转需要优化，建议清理滞销商品'
        ]
    };
}

/**
 * @private
 * @description 加载经营健康数据
 */
function loadHealthData() {
    state.loading = true;
    
    try {
        const saved = localStorage.getItem('health_data');
        if (saved) {
            state.data = JSON.parse(saved);
        } else {
            state.data = getMockHealthData();
            localStorage.setItem('health_data', JSON.stringify(state.data));
        }
    } catch (e) {
        console.warn('加载经营健康数据失败:', e);
        state.data = getMockHealthData();
    }
    
    state.loading = false;
    renderHealth();
}

/**
 * @private
 * @description 渲染经营健康数据
 */
function renderHealth() {
    renderMetrics();
    renderScore();
    renderRecommendations();
}

/**
 * @private
 * @description 渲染健康指标
 */
function renderMetrics() {
    const container = document.getElementById('healthMetrics');
    if (!container) return;
    
    const metrics = state.data.metrics;
    if (metrics.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#9CA3AF;">暂无数据</div>';
        return;
    }
    
    const statusMap = {
        good: { label: '✅ 良好', color: '#D1FAE5', textColor: '#065F46' },
        warning: { label: '⚠️ 预警', color: '#FEF3C7', textColor: '#92400E' },
        danger: { label: '🚨 风险', color: '#FEE2E2', textColor: '#991B1B' }
    };
    
    const trendMap = {
        up: { icon: 'fa-arrow-up', color: '#10B981' },
        down: { icon: 'fa-arrow-down', color: '#EF4444' },
        stable: { icon: 'fa-minus', color: '#6B7280' }
    };
    
    container.innerHTML = metrics.map(metric => {
        const status = statusMap[metric.status] || statusMap.good;
        const trend = trendMap[metric.trend] || trendMap.stable;
        const progress = Math.min((metric.value / metric.target) * 100, 100);
        
        return `
            <div style="padding:12px 0;border-bottom:1px solid #F3F4F6;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="font-weight:500;">${metric.name}</span>
                        <span style="font-size:12px;color:#6B7280;margin-left:8px;">${metric.description}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-weight:700;font-size:18px;color:#1F2937;">
                            ${metric.unit}${metric.value}
                        </span>
                        <span style="font-size:12px;color:${trend.color};">
                            <i class="fas ${trend.icon}"></i>
                        </span>
                        <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:500;background:${status.color};color:${status.textColor};">
                            ${status.label}
                        </span>
                    </div>
                </div>
                <div style="margin-top:6px;display:flex;align-items:center;gap:12px;">
                    <div style="flex:1;height:6px;background:#F3F4F6;border-radius:9999px;overflow:hidden;">
                        <div style="height:100%;background:${progress > 80 ? '#10B981' : progress > 50 ? '#F59E0B' : '#EF4444'};border-radius:9999px;width:${Math.min(progress, 100)}%;"></div>
                    </div>
                    <span style="font-size:12px;color:#6B7280;">目标: ${metric.unit}${metric.target}</span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * @private
 * @description 渲染综合评分
 */
function renderScore() {
    const score = state.data.overallScore;
    const status = state.data.overallStatus;
    
    const statusMap = {
        good: { label: '健康', color: '#10B981', bg: '#D1FAE5' },
        warning: { label: '需关注', color: '#F59E0B', bg: '#FEF3C7' },
        danger: { label: '需改善', color: '#EF4444', bg: '#FEE2E2' }
    };
    
    const info = statusMap[status] || statusMap.warning;
    const circleDash = 2 * Math.PI * 40;
    const offset = circleDash * (1 - score / 100);
    
    const container = document.getElementById('healthScore');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align:center;position:relative;display:inline-block;">
            <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="40" fill="none" stroke="#F3F4F6" stroke-width="8"/>
                <circle cx="60" cy="60" r="40" fill="none" stroke="${info.color}" stroke-width="8"
                        stroke-linecap="round"
                        stroke-dasharray="${circleDash}"
                        stroke-dashoffset="${offset}"
                        transform="rotate(-90 60 60)"/>
            </svg>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
                <div style="font-size:28px;font-weight:700;color:#1F2937;">${score}</div>
                <div style="font-size:12px;color:${info.color};">${info.label}</div>
            </div>
        </div>
    `;
}

/**
 * @private
 * @description 渲染建议列表
 */
function renderRecommendations() {
    const container = document.getElementById('healthRecommendations');
    if (!container) return;
    
    const recommendations = state.data.recommendations;
    if (recommendations.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#9CA3AF;">暂无建议</div>';
        return;
    }
    
    const icons = ['📊', '👥', '📈', '🔄', '💡', '🎯'];
    
    container.innerHTML = recommendations.map((rec, index) => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:#F9FAFB;border-radius:8px;margin-bottom:8px;border-left:3px solid #4F46E5;">
            <span style="font-size:20px;">${icons[index % icons.length]}</span>
            <span style="font-size:14px;color:#374151;">${rec}</span>
        </div>
    `).join('');
}

/**
 * @private
 * @description 刷新经营健康数据
 */
function refreshHealth() {
    state.data = getMockHealthData();
    localStorage.setItem('health_data', JSON.stringify(state.data));
    renderHealth();
    showToast('经营健康数据已刷新', 'success');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    document.getElementById('refreshHealth')?.addEventListener('click', refreshHealth);
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {HealthData} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('💚 经营健康 初始化...');
    
    if (options?.data) {
        state.data = options.data;
        localStorage.setItem('health_data', JSON.stringify(state.data));
    }
    
    loadHealthData();
    bindEvents();
    
    window.HealthModule = {
        state,
        loadHealthData,
        renderHealth,
        refreshHealth
    };
    
    console.log('✅ 经营健康 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadHealthData,
    refreshHealth
};