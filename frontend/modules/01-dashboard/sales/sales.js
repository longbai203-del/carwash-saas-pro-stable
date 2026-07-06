// modules/01-dashboard/sales/sales.js
import { getDashboardStats, getRecentOrders, getSalesChart } from '../../../api/reports.js';
import { formatCurrency, formatDate, showToast } from '../../../js/utils.js';

const state = {
    stats: {
        todayRevenue: 0,
        todayOrders: 0,
        activeCustomers: 0,
        conversionRate: 0
    },
    recentOrders: [],
    chartData: [],
    loading: false
};

export async function init() {
    console.log('Dashboard 已加载');
    await loadDashboardData();
    bindEvents();
}

async function loadDashboardData() {
    state.loading = true;
    showLoading();

    try {
        // 使用Mock数据，方便开发
        const data = await getMockDashboardData();
        state.stats = data.stats;
        state.recentOrders = data.recentOrders;
        state.chartData = data.chartData;

        renderStats();
        renderRecentOrders();
        renderChart();
    } catch (error) {
        console.error('加载仪表盘失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockDashboardData() {
    return {
        stats: {
            todayRevenue: 28650.00,
            todayOrders: 47,
            activeCustomers: 328,
            conversionRate: 68.5
        },
        recentOrders: [
            { id: 'ORD-001', customer: '张伟', amount: 680.00, status: 'completed', time: '10:30' },
            { id: 'ORD-002', customer: '李娜', amount: 420.00, status: 'pending', time: '10:15' },
            { id: 'ORD-003', customer: '王强', amount: 1250.00, status: 'processing', time: '09:45' },
            { id: 'ORD-004', customer: '刘洋', amount: 380.00, status: 'completed', time: '09:20' },
            { id: 'ORD-005', customer: '陈静', amount: 890.00, status: 'completed', time: '08:55' }
        ],
        chartData: {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            values: [3200, 4500, 3800, 6200, 5800, 7200, 4800]
        }
    };
}

function renderStats() {
    const statsMap = [
        { key: 'todayRevenue', label: '今日收入', icon: 'fa-money-bill-wave', color: 'blue', prefix: '¥' },
        { key: 'todayOrders', label: '今日订单', icon: 'fa-shopping-cart', color: 'green' },
        { key: 'activeCustomers', label: '活跃客户', icon: 'fa-users', color: 'purple' },
        { key: 'conversionRate', label: '转化率', icon: 'fa-percent', color: 'orange', suffix: '%' }
    ];

    let html = '';
    statsMap.forEach(stat => {
        const value = state.stats[stat.key] || 0;
        html += `
            <div class="stat-card">
                <div class="stat-icon ${stat.color}">
                    <i class="fas ${stat.icon}"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${stat.prefix || ''}${value}${stat.suffix || ''}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
            </div>
        `;
    });

    document.getElementById('statsContainer').innerHTML = html;
}

function renderRecentOrders() {
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;

    const statusMap = {
        pending: { label: '待处理', color: 'warning' },
        processing: { label: '处理中', color: 'info' },
        completed: { label: '已完成', color: 'success' },
        cancelled: { label: '已取消', color: 'danger' }
    };

    tbody.innerHTML = state.recentOrders.map(order => `
        <tr>
            <td class="px-4 py-2 font-mono">${order.id}</td>
            <td class="px-4 py-2">${order.customer}</td>
            <td class="px-4 py-2 text-right">¥${formatCurrency(order.amount)}</td>
            <td class="px-4 py-2">
                <span class="badge badge-${statusMap[order.status]?.color || 'secondary'}">
                    ${statusMap[order.status]?.label || order.status}
                </span>
            </td>
            <td class="px-4 py-2 text-sm">${order.time}</td>
        </tr>
    `).join('');
}

function renderChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas || !state.chartData.labels) return;

    // 使用Canvas绘制简单的柱状图
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxValue = Math.max(...state.chartData.values) * 1.2;

    ctx.clearRect(0, 0, width, height);

    // 绘制网格
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    // 绘制柱状图
    const barWidth = chartWidth / state.chartData.labels.length * 0.6;
    const gap = chartWidth / state.chartData.labels.length;

    state.chartData.labels.forEach((label, index) => {
        const value = state.chartData.values[index];
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + index * gap + (gap - barWidth) / 2;
        const y = padding + chartHeight - barHeight;

        // 柱状条
        const gradient = ctx.createLinearGradient(x, y, x, padding + chartHeight);
        gradient.addColorStop(0, '#4F46E5');
        gradient.addColorStop(1, '#818CF8');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();

        // 数值标签
        ctx.fillStyle = '#6B7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(value, x + barWidth / 2, y - 8);

        // X轴标签
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '12px sans-serif';
        ctx.fillText(label, x + barWidth / 2, padding + chartHeight + 20);
    });
}

function bindEvents() {
    // 刷新按钮
    document.getElementById('refreshBtn')?.addEventListener('click', loadDashboardData);
}

function showLoading() {
    document.getElementById('loadingOverlay')?.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay')?.classList.add('hidden');
}

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}