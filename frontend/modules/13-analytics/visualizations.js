/**
 * @file visualizations.js
 * @module visualizations
 * @description 数据可视化 - 图表和可视化组件
 * 
 * @example
 * import { init } from './visualizations.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ChartConfig
 * @property {string} id - 图表ID
 * @property {string} title - 图表标题
 * @property {string} type - 类型 (line/bar/pie/doughnut)
 * @property {Array} labels - 标签
 * @property {Array} datasets - 数据集
 * @property {Object} options - 图表选项
 */

/** @type {{charts: ChartConfig[], activeChart: string|null, loading: boolean}} 状态 */
const state = {
    charts: [],
    activeChart: null,
    loading: false
};

/** @type {Chart|null} 图表实例 */
let chartInstance = null;

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
 * @returns {ChartConfig[]} 模拟图表配置
 */
function getMockCharts() {
    const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const revenueData = [3200, 2800, 3500, 4100, 3800, 5200, 4800];
    const orderData = [28, 22, 30, 35, 32, 45, 42];
    
    return [
        {
            id: 'chart-001',
            title: '收入趋势',
            type: 'line',
            labels: labels,
            datasets: [
                { label: '收入', data: revenueData, backgroundColor: '#10B981', borderColor: '#10B981' }
            ],
            options: { responsive: true }
        },
        {
            id: 'chart-002',
            title: '订单数量',
            type: 'bar',
            labels: labels,
            datasets: [
                { label: '订单数', data: orderData, backgroundColor: '#3B82F6', borderColor: '#3B82F6' }
            ],
            options: { responsive: true }
        },
        {
            id: 'chart-003',
            title: '收入分布',
            type: 'pie',
            labels: ['洗车', '美容', '保养', '其他'],
            datasets: [
                { data: [45, 25, 20, 10], backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#6B7280'] }
            ],
            options: { responsive: true }
        },
        {
            id: 'chart-004',
            title: '客户等级分布',
            type: 'doughnut',
            labels: ['VIP', '黄金', '白银', '青铜'],
            datasets: [
                { data: [15, 30, 35, 20], backgroundColor: ['#8B5CF6', '#F59E0B', '#6B7280', '#FDE68A'] }
            ],
            options: { responsive: true }
        }
    ];
}

/**
 * @private
 * @description 加载图表配置
 */
function loadCharts() {
    try {
        const saved = localStorage.getItem('visualization_data');
        if (saved) {
            state.charts = JSON.parse(saved);
        } else {
            state.charts = getMockCharts();
            localStorage.setItem('visualization_data', JSON.stringify(state.charts));
        }
    } catch (e) {
        console.warn('加载图表数据失败:', e);
        state.charts = getMockCharts();
    }
    renderChartList();
    if (state.charts.length > 0) {
        state.activeChart = state.charts[0].id;
        renderChart(state.activeChart);
    }
}

/**
 * @private
 * @description 保存图表配置
 */
function saveCharts() {
    try {
        localStorage.setItem('visualization_data', JSON.stringify(state.charts));
    } catch (e) {
        console.warn('保存图表数据失败:', e);
    }
}

/**
 * @private
 * @description 渲染图表列表
 */
function renderChartList() {
    const container = document.getElementById('chartList');
    if (!container) return;
    
    if (state.charts.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#9CA3AF;">暂无图表</div>';
        return;
    }
    
    container.innerHTML = state.charts.map(chart => `
        <div style="padding:10px 16px;cursor:pointer;border-bottom:1px solid #F3F4F6;${state.activeChart === chart.id ? 'background:#EEF2FF;border-left:3px solid #4F46E5;' : ''}"
             onclick="window.VisualizationsModule.selectChart('${chart.id}')">
            <div style="font-weight:500;font-size:14px;">${chart.title}</div>
            <div style="font-size:12px;color:#6B7280;">${chart.type}</div>
        </div>
    `).join('');
}

/**
 * @private
 * @param {string} chartId - 图表ID
 */
function selectChart(chartId) {
    state.activeChart = chartId;
    renderChartList();
    renderChart(chartId);
}

/**
 * @private
 * @param {string} chartId - 图表ID
 */
function renderChart(chartId) {
    const container = document.getElementById('chartContainer');
    if (!container) return;
    
    const chart = state.charts.find(c => c.id === chartId);
    if (!chart) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;">图表不存在</div>';
        return;
    }
    
    const canvas = document.getElementById('visualizationChart');
    if (!canvas) return;
    
    if (typeof Chart === 'undefined') {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#9CA3AF;">
                <i class="fas fa-chart-pie" style="font-size:48px;display:block;margin-bottom:16px;"></i>
                <p>Chart.js 库未加载，请确保已引入 Chart.js</p>
            </div>
        `;
        return;
    }
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: chart.type,
        data: {
            labels: chart.labels,
            datasets: chart.datasets.map(ds => ({
                ...ds,
                fill: chart.type === 'line' ? true : false,
                tension: 0.4,
                pointRadius: 4
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: chart.type === 'line' || chart.type === 'bar' ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (chart.datasets[0]?.label?.includes('收入') || chart.title?.includes('收入')) {
                                return '¥' + value;
                            }
                            return value;
                        }
                    }
                }
            } : undefined
        }
    });
}

/**
 * @private
 * @description 刷新图表数据
 */
function refreshData() {
    // 重新生成模拟数据
    const mockData = getMockCharts();
    state.charts = mockData;
    localStorage.setItem('visualization_data', JSON.stringify(mockData));
    renderChartList();
    if (state.activeChart) {
        renderChart(state.activeChart);
    }
    showToast('图表数据已刷新', 'success');
}

/**
 * @private
 * @description 导出图表为图片
 */
function exportChart() {
    const canvas = document.getElementById('visualizationChart');
    if (!canvas) {
        showToast('暂无图表可导出', 'warning');
        return;
    }
    
    const link = document.createElement('a');
    link.download = `图表_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('图表已导出', 'success');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    document.getElementById('refreshVisualizations')?.addEventListener('click', refreshData);
    document.getElementById('exportChart')?.addEventListener('click', exportChart);
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📊 数据可视化 初始化...');
    
    if (options?.data) {
        state.charts = options.data;
        localStorage.setItem('visualization_data', JSON.stringify(state.charts));
    }
    
    loadCharts();
    bindEvents();
    
    window.VisualizationsModule = {
        state,
        loadCharts,
        renderChartList,
        selectChart,
        renderChart,
        refreshData,
        exportChart,
        saveCharts
    };
    
    console.log('✅ 数据可视化 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadCharts,
    selectChart,
    refreshData,
    exportChart,
    saveCharts
};