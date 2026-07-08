/**
 * modules/01-dashboard/dashboard/dashboard.js - 仪表盘模块
 * @module dashboard
 * @description 展示业务概览、实时数据、销售趋势和最新订单
 * 
 * @example
 * import { init } from './dashboard.js';
 * init();
 */

import { apiClient } from '../../../js/api/api-client.js';
import { appStore } from '../../../js/core/store.js';

/**
 * 仪表盘状态
 */
const state = {
    stats: {
        todayRevenue: 0,
        todayOrders: 0,
        activeCustomers: 0,
        conversionRate: 0
    },
    recentOrders: [],
    chartData: {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        values: []
    },
    loading: true,
    error: null
};

/**
 * 初始化仪表盘
 * @returns {Promise<void>}
 */
export async function init() {
    console.log('📊 Dashboard 模块初始化...');
    
    try {
        // 加载数据
        await loadDashboardData();
        // 渲染统计卡片
        renderStats();
        // 渲染最新订单
        renderRecentOrders();
        // 渲染图表
        renderChart();
        // 绑定事件
        bindEvents();
        
        console.log('✅ Dashboard 初始化完成');
    } catch (error) {
        console.error('❌ Dashboard 初始化失败:', error);
        showError('加载仪表盘数据失败，请刷新重试');
    }
}

/**
 * 加载仪表盘数据
 * @returns {Promise<void>}
 */
async function loadDashboardData() {
    try {
        state.loading = true;
        
        // 从API获取数据
        const response = await apiClient.getDashboardStats();
        
        if (response && response.code === 200) {
            const data = response.data;
            state.stats = data.stats || state.stats;
            state.recentOrders = data.recentOrders || [];
            state.chartData = data.chartData || state.chartData;
        } else {
            // 如果API返回错误，尝试从Store获取缓存
            const cached = appStore.get('dashboardData');
            if (cached) {
                state.stats = cached.stats || state.stats;
                state.recentOrders = cached.recentOrders || [];
                state.chartData = cached.chartData || state.chartData;
            }
        }
        
        state.loading = false;
    } catch (error) {
        console.warn('⚠️ API获取失败，使用缓存数据:', error);
        // 使用缓存数据
        const cached = appStore.get('dashboardData');
        if (cached) {
            state.stats = cached.stats || state.stats;
            state.recentOrders = cached.recentOrders || [];
            state.chartData = cached.chartData || state.chartData;
        }
        state.loading = false;
    }
}

/**
 * 渲染统计卡片
 * @returns {void}
 */
function renderStats() {
    const stats = state.stats;
    
    // 更新DOM
    const elements = {
        todayRevenue: document.getElementById('todayRevenue'),
        todayOrders: document.getElementById('todayOrders'),
        activeCustomers: document.getElementById('activeCustomers'),
        conversionRate: document.getElementById('conversionRate')
    };
    
    if (elements.todayRevenue) {
        elements.todayRevenue.textContent = '¥' + stats.todayRevenue.toFixed(2);
    }
    if (elements.todayOrders) {
        elements.todayOrders.textContent = stats.todayOrders;
    }
    if (elements.activeCustomers) {
        elements.activeCustomers.textContent = stats.activeCustomers;
    }
    if (elements.conversionRate) {
        elements.conversionRate.textContent = stats.conversionRate + '%';
    }
}

/**
 * 渲染最新订单
 * @returns {void}
 */
function renderRecentOrders() {
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;
    
    const orders = state.recentOrders.slice(0, 5);
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:20px;color:#9CA3AF;">
                    暂无订单
                </td>
            </tr>
        `;
        return;
    }
    
    const statusMap = {
        'completed': { label: '已完成', color: '#D1FAE5', textColor: '#065F46' },
        'pending': { label: '待处理', color: '#FEF3C7', textColor: '#92400E' },
        'processing': { label: '处理中', color: '#DBEAFE', textColor: '#1E40AF' },
        'cancelled': { label: '已取消', color: '#FEE2E2', textColor: '#991B1B' }
    };
    
    tbody.innerHTML = orders.map(order => {
        const status = statusMap[order.status] || statusMap.pending;
        return `
            <tr>
                <td style="padding:10px;border-bottom:1px solid #F3F4F6;font-family:monospace;">${order.id}</td>
                <td style="padding:10px;border-bottom:1px solid #F3F4F6;">${order.customer}</td>
                <td style="padding:10px;border-bottom:1px solid #F3F4F6;text-align:right;font-weight:600;">¥${order.amount.toFixed(2)}</td>
                <td style="padding:10px;border-bottom:1px solid #F3F4F6;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px;border-bottom:1px solid #F3F4F6;">${order.time || ''}</td>
            </tr>
        `;
    }).join('');
}

/**
 * 渲染图表
 * @returns {void}
 */
function renderChart() {
    const container = document.getElementById('chartContainer');
    if (!container) return;
    
    const data = state.chartData;
    const maxValue = Math.max(...data.values, 1);
    
    let html = `
        <div style="padding:16px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3 style="margin:0;font-size:16px;font-weight:600;">📈 近7天销售趋势</h3>
                <span style="font-size:13px;color:#6B7280;">单位: 元</span>
            </div>
            <div style="display:flex;align-items:flex-end;height:180px;gap:12px;padding:0 8px;">
    `;
    
    data.labels.forEach((label, index) => {
        const value = data.values[index] || 0;
        const height = (value / maxValue) * 150;
        
        html += `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
                <div style="height:${height}px;width:100%;background:linear-gradient(180deg,#4F46E5, #818CF8);border-radius:4px 4px 0 0;transition:height 0.5s;min-height:4px;"></div>
                <span style="font-size:11px;color:#6B7280;">${label}</span>
                <span style="font-size:11px;font-weight:600;color:#1F2937;">${value}</span>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * 绑定事件
 * @returns {void}
 */
function bindEvents() {
    // 刷新按钮
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            // 清除缓存
            appStore.set('dashboardData', null);
            await loadDashboardData();
            renderStats();
            renderRecentOrders();
            renderChart();
        });
    }
    
    // 查看全部订单
    const viewAllBtn = document.getElementById('viewAllOrders');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            window.location.hash = '#/orders';
        });
    }
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 * @returns {void}
 */
function showError(message) {
    const container = document.querySelector('.dashboard-container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="padding:40px;text-align:center;">
            <i class="fas fa-exclamation-circle" style="font-size:48px;color:#EF4444;margin-bottom:16px;"></i>
            <h3 style="color:#374151;">加载失败</h3>
            <p style="color:#6B7280;">${message}</p>
            <button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;">
                重新加载
            </button>
        </div>
    `;
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default { init };