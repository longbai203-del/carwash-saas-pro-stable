/**
 * @file reports.js
 * @module reports
 * @description 数据报表 - 业务数据分析和可视化
 * 
 * @example
 * import { init } from './reports.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ReportStats
 * @property {number} totalOrders - 总订单数
 * @property {number} totalRevenue - 总收入
 * @property {number} newCustomers - 新客户数
 * @property {number} avgOrder - 客单价
 * @property {number} orderChange - 订单变化率
 * @property {number} revenueChange - 收入变化率
 * @property {number} customerChange - 客户变化率
 * @property {number} avgChange - 客单价变化率
 */

/**
 * @typedef {Object} ReportData
 * @property {string} date - 日期
 * @property {number} orders - 订单数
 * @property {number} revenue - 收入
 * @property {number} avgOrder - 客单价
 * @property {string} status - 状态 (normal/high/low)
 */

/**
 * @typedef {Object} ReportState
 * @property {ReportStats} stats - 统计数据
 * @property {ReportData[]} data - 报表数据
 * @property {number} period - 周期(天)
 * @property {string} startDate - 开始日期
 * @property {string} endDate - 结束日期
 * @property {boolean} loading - 加载状态
 */

/** @type {ReportState} 状态 */
const state = {
    stats: {
        totalOrders: 0,
        totalRevenue: 0,
        newCustomers: 0,
        avgOrder: 0,
        orderChange: 0,
        revenueChange: 0,
        customerChange: 0,
        avgChange: 0
    },
    data: [],
    period: 7,
    startDate: '',
    endDate: '',
    loading: false
};

/** @type {Chart|null} 图表实例 */
let revenueChart = null;
let orderChart = null;

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
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

/**
 * @private
 * @returns {ReportStats} 模拟统计数据
 */
function getMockStats() {
    return {
        totalOrders: 234,
        totalRevenue: 28560,
        newCustomers: 45,
        avgOrder: 122.05,
        orderChange: 12.5,
        revenueChange: 8.3,
        customerChange: 5.2,
        avgChange: -3.1
    };
}

/**
 * @private
 * @param {number} days - 天数
 * @returns {ReportData[]} 模拟报表数据
 */
function getMockReportData(days) {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const orders = Math.floor(Math.random() * 20) + 5;
        const revenue = orders * (Math.floor(Math.random() * 50) + 80);
        const statuses = ['normal', 'normal', 'high', 'normal', 'low', 'normal', 'high'];
        
        data.push({
            date: date.toISOString().split('T')[0],
            orders: orders,
            revenue: revenue,
            avgOrder: Math.round(revenue / orders * 100) / 100,
            status: statuses[i % statuses.length]
        });
    }
    return data;
}

/**
 * @private
 * @description 加载报表数据
 */
function loadReportData() {
    state.loading = true;
    
    try {
        // 从本地存储加载历史数据
        const savedStats = localStorage.getItem('report_stats');
        const savedData = localStorage.getItem('report_data');
        
        if (savedStats && savedData) {
            state.stats = JSON.parse(savedStats);
            state.data = JSON.parse(savedData);
        } else {
            state.stats = getMockStats();
            state.data = getMockReportData(state.period);
            localStorage.setItem('report_stats', JSON.stringify(state.stats));
            localStorage.setItem('report_data', JSON.stringify(state.data));
        }
    } catch (e) {
        console.warn('加载报表数据失败:', e);
        state.stats = getMockStats();
        state.data = getMockReportData(state.period);
    }
    
    state.loading = false;
    renderStats();
    renderReportTable();
    renderCharts();
}

/**
 * @private
 * @description 渲染统计数据
 */
function renderStats() {
    const stats = state.stats;
    
    document.getElementById('statTotalOrders')?.textContent = formatNumber(stats.totalOrders);
    document.getElementById('statTotalRevenue')?.textContent = '¥' + formatCurrency(stats.totalRevenue);
    document.getElementById('statNewCustomers')?.textContent = formatNumber(stats.newCustomers);
    document.getElementById('statAvgOrder')?.textContent = '¥' + formatCurrency(stats.avgOrder);
    
    // 渲染变化
    const changes = [
        { id: 'statOrderChange', value: stats.orderChange, color: stats.orderChange >= 0 ? '#10B981' : '#EF4444' },
        { id: 'statRevenueChange', value: stats.revenueChange, color: stats.revenueChange >= 0 ? '#10B981' : '#EF4444' },
        { id: 'statCustomerChange', value: stats.customerChange, color: stats.customerChange >= 0 ? '#8B5CF6' : '#EF4444' },
        { id: 'statAvgChange', value: stats.avgChange, color: stats.avgChange >= 0 ? '#F59E0B' : '#EF4444' }
    ];
    
    changes.forEach(change => {
        const el = document.getElementById(change.id);
        if (el) {
            const sign = change.value >= 0 ? '+' : '';
            el.innerHTML = `
                <i class="fas ${change.value >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                ${sign}${Math.abs(change.value)}%
            `;
            el.style.color = change.color;
        }
    });
}

/**
 * @private
 * @description 渲染报表表格
 */
function renderReportTable() {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    
    if (state.data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:32px;color:#9CA3AF;">
                    暂无数据
                </td>
            </tr>
        `;
        return;
    }
    
    const statusMap = {
        high: { label: '📈 高', color: '#D1FAE5', textColor: '#065F46' },
        normal: { label: '📊 正常', color: '#DBEAFE', textColor: '#1E40AF' },
        low: { label: '📉 低', color: '#FEF3C7', textColor: '#92400E' }
    };
    
    tbody.innerHTML = state.data.map(row => {
        const status = statusMap[row.status] || statusMap.normal;
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-size:13px;">${formatDate(row.date)}</td>
                <td style="padding:10px 16px;text-align:center;font-weight:600;">${row.orders}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#10B981;">
                    ¥${formatCurrency(row.revenue)}
                </td>
                <td style="padding:10px 16px;text-align:right;color:#6B7280;">
                    ¥${formatCurrency(row.avgOrder)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * @private
 * @description 渲染图表
 */
function renderCharts() {
    const revenueCanvas = document.getElementById('revenueChart');
    const orderCanvas = document.getElementById('orderChart');
    
    if (revenueCanvas && typeof Chart !== 'undefined') {
        if (revenueChart) revenueChart.destroy();
        
        const labels = state.data.map(d => formatDate(d.date));
        const revenueData = state.data.map(d => d.revenue);
        const orderData = state.data.map(d => d.orders);
        
        revenueChart = new Chart(revenueCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '收入',
                    data: revenueData,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '¥' + value;
                            }
                        }
                    }
                }
            }
        });
    }
    
    if (orderCanvas && typeof Chart !== 'undefined') {
        if (orderChart) orderChart.destroy();
        
        const labels = state.data.map(d => formatDate(d.date));
        const orderData = state.data.map(d => d.orders);
        
        orderChart = new Chart(orderCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '订单数',
                    data: orderData,
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#3B82F6', '#10B981'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

/**
 * @private
 * @param {number} days - 天数
 * @description 切换时间周期
 */
function changePeriod(days) {
    state.period = days;
    state.data = getMockReportData(days);
    localStorage.setItem('report_data', JSON.stringify(state.data));
    
    // 更新日期范围显示
    const startDate = state.data.length > 0 ? state.data[0].date : '';
    const endDate = state.data.length > 0 ? state.data[state.data.length - 1].date : '';
    document.getElementById('analyticsDateRange').textContent = 
        `${startDate} ~ ${endDate}`;
    
    // 更新按钮状态
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.period) === days);
    });
    
    // 隐藏自定义日期输入
    document.getElementById('analyticsStartDate').style.display = 'none';
    
    renderReportTable();
    renderCharts();
}

/**
 * @private
 * @description 自定义日期范围
 */
function setCustomDateRange() {
    const startInput = document.getElementById('analyticsStartDate');
    const dateRange = document.getElementById('analyticsDateRange');
    
    if (startInput) {
        startInput.style.display = 'inline-block';
        startInput.focus();
        startInput.addEventListener('change', function() {
            const date = this.value;
            if (date) {
                // 生成从指定日期到今天的模拟数据
                const days = Math.ceil((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
                if (days > 0 && days <= 365) {
                    state.data = getMockReportData(Math.min(days, 90));
                    localStorage.setItem('report_data', JSON.stringify(state.data));
                    dateRange.textContent = `${date} ~ ${new Date().toISOString().split('T')[0]}`;
                    renderReportTable();
                    renderCharts();
                }
            }
            this.style.display = 'none';
        });
    }
}

/**
 * @private
 * @description 导出报表
 */
function exportReport() {
    if (state.data.length === 0) {
        showToast('暂无数据可导出', 'warning');
        return;
    }
    
    const headers = ['日期', '订单数', '收入', '客单价', '状态'];
    const rows = state.data.map(row => [
        row.date,
        row.orders,
        row.revenue.toFixed(2),
        row.avgOrder.toFixed(2),
        row.status
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `报表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('报表已导出', 'success');
}

/**
 * @private
 * @description 刷新数据
 */
function refreshData() {
    loadReportData();
    showToast('数据已刷新', 'success');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    // 周期切换
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const period = parseInt(this.dataset.period);
            if (period === 'custom') {
                setCustomDateRange();
            } else {
                changePeriod(period);
            }
        });
    });
    
    // 刷新按钮
    document.getElementById('refreshAnalytics')?.addEventListener('click', refreshData);
    
    // 导出按钮
    document.getElementById('exportReport')?.addEventListener('click', exportReport);
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {ReportData[]} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('📊 数据报表 初始化...');
    
    if (options?.data) {
        state.data = options.data;
        localStorage.setItem('report_data', JSON.stringify(state.data));
    }
    
    loadReportData();
    bindEvents();
    
    // 设置日期范围显示
    if (state.data.length > 0) {
        document.getElementById('analyticsDateRange').textContent = 
            `${state.data[0].date} ~ ${state.data[state.data.length - 1].date}`;
    }
    
    window.ReportsModule = {
        state,
        loadReportData,
        renderStats,
        renderReportTable,
        renderCharts,
        changePeriod,
        refreshData,
        exportReport
    };
    
    console.log('✅ 数据报表 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadReportData,
    changePeriod,
    refreshData,
    exportReport
};