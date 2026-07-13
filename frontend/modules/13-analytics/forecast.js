/**
 * @file forecast.js
 * @module forecast
 * @description 预测分析 - 业务趋势预测
 * 
 * @example
 * import { init } from './forecast.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ForecastPoint
 * @property {string} date - 日期
 * @property {number} actual - 实际值
 * @property {number} forecast - 预测值
 * @property {number} lower - 下限
 * @property {number} upper - 上限
 */

/**
 * @typedef {Object} ForecastData
 * @property {ForecastPoint[]} revenue - 收入预测
 * @property {ForecastPoint[]} orders - 订单预测
 * @property {Object} summary - 预测摘要
 * @property {string} confidence - 置信度
 */

/** @type {{data: ForecastData, period: number, loading: boolean}} 状态 */
const state = {
    data: {
        revenue: [],
        orders: [],
        summary: {
            expectedRevenue: 0,
            expectedOrders: 0,
            growthRate: 0,
            peakDay: ''
        },
        confidence: '85%'
    },
    period: 30,
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
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
}

/**
 * @private
 * @param {number} days - 天数
 * @returns {ForecastData} 模拟预测数据
 */
function getMockForecast(days) {
    const now = new Date();
    const revenueData = [];
    const ordersData = [];
    let totalRevenue = 0;
    let totalOrders = 0;
    let peakRevenue = 0;
    let peakDay = '';
    
    // 基于最近7天的数据生成预测
    const baseRevenue = 2800 + Math.random() * 500;
    const baseOrders = 22 + Math.random() * 8;
    const trend = 0.02 + Math.random() * 0.03;
    
    for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i + 1);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const multiplier = isWeekend ? 1.3 : 1.0;
        
        // 收入预测
        const revenue = (baseRevenue + i * 15) * multiplier * (0.85 + Math.random() * 0.3);
        const revenueLower = revenue * 0.85;
        const revenueUpper = revenue * 1.15;
        
        // 订单预测
        const orders = Math.round((baseOrders + i * 0.3) * multiplier * (0.9 + Math.random() * 0.2));
        const ordersLower = Math.round(orders * 0.85);
        const ordersUpper = Math.round(orders * 1.15);
        
        const dateStr = date.toISOString().split('T')[0];
        
        revenueData.push({
            date: dateStr,
            actual: 0,
            forecast: Math.round(revenue),
            lower: Math.round(revenueLower),
            upper: Math.round(revenueUpper)
        });
        
        ordersData.push({
            date: dateStr,
            actual: 0,
            forecast: orders,
            lower: ordersLower,
            upper: ordersUpper
        });
        
        totalRevenue += revenue;
        totalOrders += orders;
        if (revenue > peakRevenue) {
            peakRevenue = revenue;
            peakDay = dateStr;
        }
    }
    
    return {
        revenue: revenueData,
        orders: ordersData,
        summary: {
            expectedRevenue: Math.round(totalRevenue / days * 30),
            expectedOrders: Math.round(totalOrders / days * 30),
            growthRate: Math.round((trend * 100) * 10) / 10,
            peakDay: peakDay
        },
        confidence: (80 + Math.random() * 15).toFixed(0) + '%'
    };
}

/**
 * @private
 * @description 加载预测数据
 */
function loadForecast() {
    state.loading = true;
    
    try {
        const saved = localStorage.getItem('forecast_data');
        if (saved) {
            state.data = JSON.parse(saved);
        } else {
            state.data = getMockForecast(state.period);
            localStorage.setItem('forecast_data', JSON.stringify(state.data));
        }
    } catch (e) {
        console.warn('加载预测数据失败:', e);
        state.data = getMockForecast(state.period);
    }
    
    state.loading = false;
    renderForecast();
}

/**
 * @private
 * @description 渲染预测数据
 */
function renderForecast() {
    renderRevenueForecast();
    renderOrdersForecast();
    renderSummary();
}

/**
 * @private
 * @description 渲染收入预测
 */
function renderRevenueForecast() {
    const container = document.getElementById('revenueForecast');
    if (!container) return;
    
    const data = state.data.revenue;
    if (data.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#9CA3AF;">暂无预测数据</div>';
        return;
    }
    
    // 显示前10天的预测
    const displayData = data.slice(0, 10);
    
    let html = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;">
    `;
    
    displayData.forEach(item => {
        const isWeekend = new Date(item.date).getDay() === 0 || new Date(item.date).getDay() === 6;
        const bgColor = isWeekend ? '#FEF3C7' : '#F3F4F6';
        const borderColor = isWeekend ? '#F59E0B' : '#4F46E5';
        
        html += `
            <div style="background:${bgColor};border-radius:8px;padding:12px;text-align:center;border-left:3px solid ${borderColor};">
                <div style="font-size:11px;color:#6B7280;">${formatDate(item.date)}</div>
                <div style="font-size:16px;font-weight:700;color:#1F2937;margin:4px 0;">¥${formatCurrency(item.forecast)}</div>
                <div style="font-size:10px;color:#6B7280;">
                    范围: ¥${formatCurrency(item.lower)} - ¥${formatCurrency(item.upper)}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * @private
 * @description 渲染订单预测
 */
function renderOrdersForecast() {
    const container = document.getElementById('ordersForecast');
    if (!container) return;
    
    const data = state.data.orders;
    if (data.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#9CA3AF;">暂无预测数据</div>';
        return;
    }
    
    const displayData = data.slice(0, 10);
    
    let html = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;">
    `;
    
    displayData.forEach(item => {
        const isWeekend = new Date(item.date).getDay() === 0 || new Date(item.date).getDay() === 6;
        const bgColor = isWeekend ? '#FEF3C7' : '#F3F4F6';
        const borderColor = isWeekend ? '#F59E0B' : '#3B82F6';
        
        html += `
            <div style="background:${bgColor};border-radius:8px;padding:10px;text-align:center;border-left:3px solid ${borderColor};">
                <div style="font-size:10px;color:#6B7280;">${formatDate(item.date)}</div>
                <div style="font-size:18px;font-weight:700;color:#1F2937;">${item.forecast}</div>
                <div style="font-size:10px;color:#6B7280;">
                    ${item.lower} - ${item.upper}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * @private
 * @description 渲染预测摘要
 */
function renderSummary() {
    const summary = state.data.summary;
    const confidence = state.data.confidence;
    
    document.getElementById('forecastRevenue')?.textContent = '¥' + formatCurrency(summary.expectedRevenue);
    document.getElementById('forecastOrders')?.textContent = summary.expectedOrders;
    document.getElementById('forecastGrowth')?.textContent = summary.growthRate + '%';
    document.getElementById('forecastPeak')?.textContent = formatDate(summary.peakDay);
    document.getElementById('forecastConfidence')?.textContent = confidence;
}

/**
 * @private
 * @param {number} days - 天数
 * @description 更新预测周期
 */
function updatePeriod(days) {
    state.period = days;
    state.data = getMockForecast(days);
    localStorage.setItem('forecast_data', JSON.stringify(state.data));
    renderForecast();
    showToast(`预测周期已更新为 ${days} 天`, 'success');
}

/**
 * @private
 * @description 刷新预测数据
 */
function refreshForecast() {
    state.data = getMockForecast(state.period);
    localStorage.setItem('forecast_data', JSON.stringify(state.data));
    renderForecast();
    showToast('预测数据已刷新', 'success');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    document.querySelectorAll('.forecast-period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const days = parseInt(this.dataset.days);
            document.querySelectorAll('.forecast-period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updatePeriod(days);
        });
    });
    
    document.getElementById('refreshForecast')?.addEventListener('click', refreshForecast);
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {ForecastData} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('📈 预测分析 初始化...');
    
    if (options?.data) {
        state.data = options.data;
        localStorage.setItem('forecast_data', JSON.stringify(state.data));
    }
    
    loadForecast();
    bindEvents();
    
    // 设置默认激活的周期按钮
    document.querySelector('.forecast-period-btn[data-days="30"]')?.classList.add('active');
    
    window.ForecastModule = {
        state,
        loadForecast,
        renderForecast,
        updatePeriod,
        refreshForecast
    };
    
    console.log('✅ 预测分析 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadForecast,
    updatePeriod,
    refreshForecast
};