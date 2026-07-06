/**
 * modules/01-dashboard/sales/sales.js - Dashboard 仪表盘
 * 使用数据服务层获取数据
 */

// ============================================================
// 1. 导入数据服务
// ============================================================

// 尝试从全局获取服务，如果不存在则使用 Mock
function getServices() {
    if (typeof window !== 'undefined' && window.Services) {
        return window.Services;
    }
    return null;
}

// ============================================================
// 2. 状态管理
// ============================================================

const state = {
    stats: {
        todayRevenue: 0,
        todayOrders: 0,
        activeCustomers: 0,
        conversionRate: 0
    },
    recentOrders: [],
    chartData: {
        labels: [],
        values: []
    },
    loading: false
};

// ============================================================
// 3. Mock 数据（备用）
// ============================================================

function getMockStats() {
    return {
        stats: {
            todayRevenue: 28650.00,
            todayOrders: 47,
            activeCustomers: 328,
            conversionRate: 68.5
        },
        recentOrders: [
            { id: 'ORD-001', customer: '张伟', amount: 680, status: 'completed', time: '10:30' },
            { id: 'ORD-002', customer: '李娜', amount: 420, status: 'pending', time: '10:15' },
            { id: 'ORD-003', customer: '王强', amount: 1250, status: 'processing', time: '09:45' },
            { id: 'ORD-004', customer: '刘洋', amount: 380, status: 'completed', time: '09:20' },
            { id: 'ORD-005', customer: '陈静', amount: 890, status: 'completed', time: '08:55' }
        ],
        chartData: {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            values: [3200, 4500, 3800, 6200, 5800, 7200, 4800]
        }
    };
}

// ============================================================
// 4. 核心功能
// ============================================================

export async function init() {
    console.log('📊 Dashboard 初始化...');
    
    // 检查是否在浏览器环境
    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    await loadDashboardData();
    bindEvents();
}

// 加载仪表盘数据
async function loadDashboardData() {
    state.loading = true;
    showLoading();

    try {
        let data = null;
        const services = getServices();

        // 优先使用数据服务
        if (services && services.dashboard) {
            try {
                console.log('📦 使用数据服务加载 Dashboard 数据...');
                data = await services.dashboard.getDashboardData();
                console.log('✅ 数据服务返回数据:', data);
            } catch (serviceError) {
                console.warn('⚠️ 数据服务加载失败，使用 Mock 数据:', serviceError.message);
                data = getMockStats();
            }
        } else {
            console.log('📦 使用 Mock 数据加载 Dashboard...');
            data = getMockStats();
        }

        // 更新状态
        if (data) {
            state.stats = data.stats || state.stats;
            state.recentOrders = data.recentOrders || [];
            state.chartData = data.chartData || { labels: [], values: [] };
        }

        // 渲染UI
        renderStats();
        renderRecentOrders();
        renderChart();

    } catch (error) {
        console.error('❌ 加载仪表盘失败:', error);
        // 使用备用数据
        const fallbackData = getMockStats();
        state.stats = fallbackData.stats;
        state.recentOrders = fallbackData.recentOrders;
        state.chartData = fallbackData.chartData;
        renderStats();
        renderRecentOrders();
        renderChart();
        showToast('加载数据失败，显示备用数据', 'warning');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

// ============================================================
// 5. 渲染函数
// ============================================================

function renderStats() {
    const container = document.getElementById('statsContainer');
    if (!container) {
        console.warn('⚠️ statsContainer 不存在');
        return;
    }

    const statsMap = [
        { key: 'todayRevenue', label: '今日收入', icon: 'fa-money-bill-wave', color: 'blue', prefix: '¥' },
        { key: 'todayOrders', label: '今日订单', icon: 'fa-shopping-cart', color: 'green' },
        { key: 'activeCustomers', label: '活跃客户', icon: 'fa-users', color: 'purple' },
        { key: 'conversionRate', label: '转化率', icon: 'fa-percent', color: 'orange', suffix: '%' }
    ];

    let html = '';
    for (var i = 0; i < statsMap.length; i++) {
        var stat = statsMap[i];
        var value = state.stats[stat.key] || 0;
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
    }

    container.innerHTML = html;
}

function renderRecentOrders() {
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) {
        console.warn('⚠️ recentOrdersBody 不存在');
        return;
    }

    if (!state.recentOrders || state.recentOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-2xl"></i>
                    <p class="mt-2">暂无订单</p>
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        pending: { label: '待处理', color: 'warning' },
        processing: { label: '处理中', color: 'info' },
        completed: { label: '已完成', color: 'success' },
        cancelled: { label: '已取消', color: 'danger' }
    };

    let html = '';
    for (var i = 0; i < state.recentOrders.length; i++) {
        var order = state.recentOrders[i];
        var status = statusMap[order.status] || { label: order.status, color: 'secondary' };
        html += `
            <tr>
                <td class="font-mono">${order.id}</td>
                <td>${order.customer}</td>
                <td class="text-right">¥${formatCurrency(order.amount)}</td>
                <td>
                    <span class="badge badge-${status.color}">
                        ${status.label}
                    </span>
                </td>
                <td class="text-sm">${order.time}</td>
            </tr>
        `;
    }

    tbody.innerHTML = html;
}

function renderChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) {
        console.warn('⚠️ salesChart 不存在');
        return;
    }

    if (!state.chartData.labels || state.chartData.labels.length === 0) {
        console.warn('⚠️ 无图表数据');
        return;
    }

    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : { width: 800 };
    canvas.width = (rect.width - 40) || 800;
    canvas.height = 280;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxValue = Math.max.apply(null, state.chartData.values) * 1.2 || 100;

    ctx.clearRect(0, 0, width, height);

    // 绘制网格
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (var i = 0; i < 5; i++) {
        var y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        var val = Math.round(maxValue - (maxValue / 5) * i);
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val, padding - 8, y + 4);
    }

    // 绘制柱状图
    var barWidth = chartWidth / state.chartData.labels.length * 0.6;
    var gap = chartWidth / state.chartData.labels.length;

    // 修复 roundRect 方法
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (r > w/2) r = w/2;
            if (r > h/2) r = h/2;
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            return this;
        };
    }

    for (var j = 0; j < state.chartData.labels.length; j++) {
        var label = state.chartData.labels[j];
        var value = state.chartData.values[j] || 0;
        var barHeight = (value / maxValue) * chartHeight;
        var x = padding + j * gap + (gap - barWidth) / 2;
        var y = padding + chartHeight - barHeight;

        // 柱状条
        var gradient = ctx.createLinearGradient(x, y, x, padding + chartHeight);
        gradient.addColorStop(0, '#4F46E5');
        gradient.addColorStop(1, '#818CF8');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();

        // 数值标签
        ctx.fillStyle = '#6B7280';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(value, x + barWidth / 2, y - 8);

        // X轴标签
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '11px sans-serif';
        ctx.fillText(label, x + barWidth / 2, padding + chartHeight + 20);
    }
}

// ============================================================
// 6. 工具函数
// ============================================================

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return Number(amount).toFixed(2);
}

function showToast(message, type) {
    var toast = document.createElement('div');
    var colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${colors[type] || '#4F46E5'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-size: 14px;
        max-width: 400px;
        animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);
}

function showLoading() {
    var spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.remove('hidden');
}

function hideLoading() {
    var spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.add('hidden');
}

function bindEvents() {
    var refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadDashboardData();
            showToast('已刷新', 'success');
        });
    }
}

// ============================================================
// 7. 自动初始化（如果页面已加载）
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('✅ Dashboard 模块加载完成');