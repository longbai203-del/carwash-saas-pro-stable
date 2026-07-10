/**
 * @file executive.js
 * @module executive
 * @description 高管视图 - 展示高管级别的业务概览数据
 * 
 * @example
 * import { init } from './executive.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} MetricData
 * @property {number} current - 当前值
 * @property {number} previous - 前值
 * @property {number} change - 变化百分比
 */

/**
 * @typedef {Object} ExecutiveMetrics
 * @property {MetricData} revenue - 收入指标
 * @property {MetricData} orders - 订单指标
 * @property {MetricData} customers - 客户指标
 * @property {MetricData} profit - 利润指标
 */

/**
 * @typedef {Object} ExecutiveOrder
 * @property {string} id - 订单ID
 * @property {string} customer - 客户名称
 * @property {number} total - 订单总额
 * @property {string} status - 订单状态
 */

/** @type {ExecutiveMetrics} 默认指标数据 */
const DEFAULT_METRICS = {
    revenue: { current: 0, previous: 0, change: 0 },
    orders: { current: 0, previous: 0, change: 0 },
    customers: { current: 0, previous: 0, change: 0 },
    profit: { current: 0, previous: 0, change: 0 }
};

/** @type {ExecutiveOrder[]} 默认订单数据 */
const DEFAULT_ORDERS = [];

/** @type {number|null} 自动刷新定时器 */
let refreshInterval = null;

/**
 * 状态颜色映射
 */
const STATUS_COLORS = {
    'completed': '#34c759',
    'processing': '#5ac8fa',
    'pending': '#ff9500',
    'cancelled': '#ff3b30'
};

const STATUS_LABELS = {
    'completed': '已完成',
    'processing': '处理中',
    'pending': '待处理',
    'cancelled': '已取消'
};

/**
 * @private
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 * @description 格式化货币
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '¥0';
    return '¥' + amount.toLocaleString('zh-CN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/**
 * @private
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('zh-CN');
}

/**
 * @private
 * @param {string} status - 状态码
 * @returns {string} 状态颜色
 */
function getStatusColor(status) {
    return STATUS_COLORS[status] || '#6e6e73';
}

/**
 * @private
 * @param {string} status - 状态码
 * @returns {string} 状态标签
 */
function getStatusLabel(status) {
    return STATUS_LABELS[status] || status;
}

/**
 * @private
 * @param {ExecutiveMetrics} metrics - 指标数据
 * @description 渲染指标卡片
 */
function renderMetricCards(metrics) {
    const container = document.querySelector('.metric-cards');
    if (!container) {
        console.warn('Metric cards container not found');
        return;
    }

    const cards = [
        {
            key: 'revenue',
            icon: 'fa-money-bill-wave',
            label: '今日收入',
            color: '#007aff',
            value: formatCurrency(metrics.revenue.current),
            change: metrics.revenue.change
        },
        {
            key: 'orders',
            icon: 'fa-clipboard-list',
            label: '今日订单',
            color: '#34c759',
            value: formatNumber(metrics.orders.current),
            change: metrics.orders.change
        },
        {
            key: 'customers',
            icon: 'fa-users',
            label: '活跃客户',
            color: '#5856d6',
            value: formatNumber(metrics.customers.current),
            change: metrics.customers.change
        },
        {
            key: 'profit',
            icon: 'fa-chart-line',
            label: '利润率',
            color: '#ff9500',
            value: metrics.profit.current + '%',
            change: metrics.profit.change
        }
    ];

    container.innerHTML = cards.map(function(card) {
        return `
            <div class="metric-card" style="border-top: 4px solid ${card.color};">
                <div class="metric-header">
                    <span class="metric-icon" style="background: ${card.color}20; color: ${card.color};">
                        <i class="fas ${card.icon}"></i>
                    </span>
                    <span class="metric-label">${card.label}</span>
                </div>
                <div class="metric-value">${card.value}</div>
                <div class="metric-footer">
                    <span class="metric-change ${card.change > 0 ? 'positive' : card.change < 0 ? 'negative' : ''}">
                        <i class="fas ${card.change > 0 ? 'fa-arrow-up' : card.change < 0 ? 'fa-arrow-down' : 'fa-minus'}"></i>
                        ${Math.abs(card.change)}%
                    </span>
                    <span class="metric-change-label">较昨日</span>
                </div>
            </div>
        `;
    }).join('');

    const updateEl = document.getElementById('lastUpdate');
    if (updateEl) {
        updateEl.textContent = '更新于: ' + new Date().toLocaleString('zh-CN');
    }

    console.log('✅ Metric cards rendered');
}

/**
 * @private
 * @param {ExecutiveOrder[]} orders - 订单列表
 * @description 渲染最近订单
 */
function renderRecentOrders(orders) {
    const container = document.querySelector('.recent-orders');
    if (!container) {
        console.warn('Recent orders container not found');
        return;
    }

    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>暂无订单</p>
            </div>
        `;
        return;
    }

    let html = '';
    for (let i = 0; i < Math.min(orders.length, 5); i++) {
        const order = orders[i];
        const color = getStatusColor(order.status);
        const label = getStatusLabel(order.status);
        html += `
            <div class="order-item">
                <div class="order-info">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-customer">${order.customer}</span>
                </div>
                <div class="order-details">
                    <span class="order-amount">${formatCurrency(order.total)}</span>
                    <span class="order-status" style="background: ${color}20; color: ${color};">
                        ${label}
                    </span>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;

    console.log('✅ Recent orders rendered');
}

/**
 * @private
 * @description 渲染快捷操作
 */
function renderQuickActions() {
    const container = document.querySelector('.quick-actions');
    if (!container) {
        console.warn('Quick actions container not found');
        return;
    }

    const actions = [
        { icon: 'fa-cash-register', label: '新销售', color: '#007aff', action: 'new-sale' },
        { icon: 'fa-user-plus', label: '新客户', color: '#34c759', action: 'new-customer' },
        { icon: 'fa-box', label: '盘点库存', color: '#ff9500', action: 'inventory-count' },
        { icon: 'fa-file-invoice', label: '生成报表', color: '#5856d6', action: 'generate-report' }
    ];

    let html = '';
    for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        html += `
            <div class="quick-action" style="border-color: ${action.color};" data-action="${action.action}">
                <div class="quick-action-icon" style="background: ${action.color}20; color: ${action.color};">
                    <i class="fas ${action.icon}"></i>
                </div>
                <span class="quick-action-label">${action.label}</span>
            </div>
        `;
    }
    container.innerHTML = html;

    container.querySelectorAll('.quick-action').forEach(function(el) {
        el.addEventListener('click', function() {
            const label = this.querySelector('.quick-action-label').textContent;
            showToast(label + ' 功能开发中...', 'info');
        });
    });

    console.log('✅ Quick actions rendered');
}

/**
 * @private
 * @param {ExecutiveMetrics} metrics - 指标数据
 * @param {ExecutiveOrder[]} orders - 订单数据
 * @description 加载并渲染数据
 */
function loadDashboardData(metrics, orders) {
    console.log('🔄 Loading dashboard data...');

    try {
        renderMetricCards(metrics || DEFAULT_METRICS);
        renderRecentOrders(orders || DEFAULT_ORDERS);
        renderQuickActions();
        console.log('✅ Dashboard loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load dashboard:', error);

        const container = document.querySelector('.metric-cards');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #6e6e73;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff9500; margin-bottom: 16px; display: block;"></i>
                    <h3 style="margin-bottom: 8px;">加载数据失败</h3>
                    <p style="margin-bottom: 16px;">${error.message || '请检查网络连接'}</p>
                    <button onclick="window.ExecutiveDashboard?.refresh()" style="padding: 8px 24px; background: #007aff; color: #fff; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-redo"></i> 重试
                    </button>
                </div>
            `;
        }
    }
}

/**
 * @private
 * @param {string} plate - 车牌号
 * @description 快速记录车辆进入
 */
function quickEntry(plate) {
    if (!plate) {
        const input = document.getElementById('vmPlateInput');
        if (input) plate = input.value.trim().toUpperCase();
    }
    if (!plate) {
        showToast('请输入车牌号', 'warning');
        return;
    }

    // 检查是否已在场内
    const existing = window.VehicleMonitorModule?.activeVehicles?.find(function(v) {
        return v.plate === plate && !v.exit_time;
    });
    if (existing) {
        showToast('车辆 ' + plate + ' 已在场内', 'warning');
        return;
    }

    if (window.VehicleMonitorModule && typeof window.VehicleMonitorModule.quickEntry === 'function') {
        window.VehicleMonitorModule.quickEntry(plate);
    } else {
        // 降级方案：直接添加记录
        const record = {
            id: 'veh_' + Date.now(),
            plate: plate,
            vehicle_type: 'sedan',
            direction: 'in',
            date: new Date().toISOString().split('T')[0],
            entry_time: new Date().toISOString(),
            exit_time: null,
            duration_minutes: null,
            note: '手动登记'
        };
        
        const all = JSON.parse(localStorage.getItem('vehicle_records') || '[]');
        all.push(record);
        localStorage.setItem('vehicle_records', JSON.stringify(all));
        
        showToast('📥 车辆 ' + plate + ' 已进入', 'success');
        
        if (window.VehicleMonitorModule && typeof window.VehicleMonitorModule.refresh === 'function') {
            window.VehicleMonitorModule.refresh();
        }
    }
}

/**
 * @private
 * @param {string} plate - 车牌号
 * @description 快速记录车辆离开
 */
function quickExit(plate) {
    if (!plate) {
        const input = document.getElementById('vmPlateInput');
        if (input) plate = input.value.trim().toUpperCase();
    }
    if (!plate) {
        showToast('请输入车牌号', 'warning');
        return;
    }

    if (window.VehicleMonitorModule && typeof window.VehicleMonitorModule.quickExit === 'function') {
        window.VehicleMonitorModule.quickExit(plate);
    } else {
        const all = JSON.parse(localStorage.getItem('vehicle_records') || '[]');
        const index = all.findIndex(function(r) {
            return r.plate === plate && !r.exit_time;
        });
        
        if (index < 0) {
            showToast('车辆 ' + plate + ' 不在场内', 'warning');
            return;
        }
        
        const vehicle = all[index];
        const now = new Date();
        const entryTime = new Date(vehicle.entry_time);
        const duration = Math.floor((now - entryTime) / 1000 / 60);
        
        vehicle.exit_time = now.toISOString();
        vehicle.duration_minutes = duration;
        all[index] = vehicle;
        localStorage.setItem('vehicle_records', JSON.stringify(all));
        
        showToast('📤 车辆 ' + plate + ' 已离开，停留 ' + duration + ' 分钟', 'success');
        
        if (window.VehicleMonitorModule && typeof window.VehicleMonitorModule.refresh === 'function') {
            window.VehicleMonitorModule.refresh();
        }
    }
}

/**
 * @private
 * @description 启动自动刷新
 */
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(function() {
        console.log('🔄 Auto-refreshing executive dashboard...');
        if (typeof window.ExecutiveDashboard !== 'undefined') {
            window.ExecutiveDashboard.refresh();
        }
    }, 60000);
}

/**
 * @private
 * @description 停止自动刷新
 */
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

/**
 * @public
 * @param {Object} data - 数据对象
 * @param {ExecutiveMetrics} data.metrics - 指标数据
 * @param {ExecutiveOrder[]} data.orders - 订单数据
 * @returns {Promise<void>}
 * @description 初始化高管视图
 */
export async function init(data) {
    console.log('📊 Executive Dashboard initializing...');

    // 使用传入的数据或从API加载
    const metrics = data?.metrics || DEFAULT_METRICS;
    const orders = data?.orders || DEFAULT_ORDERS;
    
    loadDashboardData(metrics, orders);
    startAutoRefresh();

    console.log('✅ Executive Dashboard ready');
}

/**
 * @public
 * @param {ExecutiveMetrics} metrics - 指标数据
 * @param {ExecutiveOrder[]} orders - 订单数据
 * @description 刷新数据
 */
export function refresh(metrics, orders) {
    loadDashboardData(metrics || DEFAULT_METRICS, orders || DEFAULT_ORDERS);
}

/**
 * @public
 * @description 停止自动刷新
 */
export function stopRefresh() {
    stopAutoRefresh();
}

// 暴露全局方法
if (typeof window !== 'undefined') {
    window.ExecutiveDashboard = {
        refresh: refresh,
        stopRefresh: stopRefresh,
        quickEntry: quickEntry,
        quickExit: quickExit
    };
}

export default {
    init,
    refresh,
    stopRefresh,
    quickEntry,
    quickExit
};