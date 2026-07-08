/**
 * 01-dashboard/executive/executive.js - 高管视图
 * @module executive
 * @description 展示高管级别的业务概览数据
 */

console.log('🏠 Executive Dashboard loaded');

// ============================================================
// 1. 数据
// ============================================================

const mockData = {
    metrics: {
        revenue: { current: 125000, previous: 118000, change: 5.9 },
        orders: { current: 47, previous: 42, change: 11.9 },
        customers: { current: 89, previous: 82, change: 8.5 },
        profit: { current: 22, previous: 19, change: 15.8 }
    },
    recentOrders: [
        { id: 'ORD-001', customer: 'Ahmed Al-Harbi', total: 350, status: 'completed' },
        { id: 'ORD-002', customer: 'Sara Al-Otaibi', total: 210, status: 'processing' },
        { id: 'ORD-003', customer: 'Mohammed Al-Saud', total: 520, status: 'pending' },
        { id: 'ORD-004', customer: 'Nora Al-Faisal', total: 180, status: 'completed' },
        { id: 'ORD-005', customer: 'Faisal Al-Rajhi', total: 450, status: 'completed' }
    ]
};

// ============================================================
// 2. 工具函数
// ============================================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-SA').format(num);
}

function getStatusColor(status) {
    var map = {
        'completed': '#34c759',
        'processing': '#5ac8fa',
        'pending': '#ff9500',
        'cancelled': '#ff3b30'
    };
    return map[status] || '#6e6e73';
}

function getStatusLabel(status) {
    var map = {
        'completed': '已完成',
        'processing': '处理中',
        'pending': '待处理',
        'cancelled': '已取消'
    };
    return map[status] || status;
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
        position: fixed; bottom: 20px; right: 20px;
        padding: 12px 24px;
        background: ${colors[type] || '#4F46E5'};
        color: white;
        border-radius: 8px;
        z-index: 99999;
        font-size: 14px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
}

// ============================================================
// 3. 渲染函数
// ============================================================

function renderMetricCards(metrics) {
    var container = document.querySelector('.metric-cards');
    if (!container) {
        console.warn('Metric cards container not found');
        return;
    }

    var cards = [
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
        return '<div class="metric-card" style="border-top: 4px solid ' + card.color + ';">' +
            '<div class="metric-header">' +
            '<span class="metric-icon" style="background: ' + card.color + '20; color: ' + card.color + ';">' +
            '<i class="fas ' + card.icon + '"></i>' +
            '</span>' +
            '<span class="metric-label">' + card.label + '</span>' +
            '</div>' +
            '<div class="metric-value">' + card.value + '</div>' +
            '<div class="metric-footer">' +
            '<span class="metric-change ' + (card.change > 0 ? 'positive' : 'negative') + '">' +
            '<i class="fas ' + (card.change > 0 ? 'fa-arrow-up' : 'fa-arrow-down') + '"></i>' +
            Math.abs(card.change) + '%' +
            '</span>' +
            '<span class="metric-change-label">较昨日</span>' +
            '</div>' +
            '</div>';
    }).join('');

    var updateEl = document.getElementById('lastUpdate');
    if (updateEl) {
        updateEl.textContent = '更新于: ' + new Date().toLocaleString('zh-CN');
    }

    console.log('✅ Metric cards rendered');
}

function renderRecentOrders(orders) {
    var container = document.querySelector('.recent-orders');
    if (!container) {
        console.warn('Recent orders container not found');
        return;
    }

    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>暂无订单</p></div>';
        return;
    }

    var html = '';
    for (var i = 0; i < orders.length; i++) {
        var order = orders[i];
        var color = getStatusColor(order.status);
        var label = getStatusLabel(order.status);
        html += '<div class="order-item">' +
            '<div class="order-info">' +
            '<span class="order-id">#' + order.id + '</span>' +
            '<span class="order-customer">' + order.customer + '</span>' +
            '</div>' +
            '<div class="order-details">' +
            '<span class="order-amount">' + formatCurrency(order.total) + '</span>' +
            '<span class="order-status" style="background: ' + color + '20; color: ' + color + ';">' + label + '</span>' +
            '</div>' +
            '</div>';
    }
    container.innerHTML = html;

    console.log('✅ Recent orders rendered');
}

function renderQuickActions() {
    var container = document.querySelector('.quick-actions');
    if (!container) {
        console.warn('Quick actions container not found');
        return;
    }

    var actions = [
        { icon: 'fa-cash-register', label: '新销售', color: '#007aff', action: 'new-sale' },
        { icon: 'fa-user-plus', label: '新客户', color: '#34c759', action: 'new-customer' },
        { icon: 'fa-box', label: '盘点库存', color: '#ff9500', action: 'inventory-count' },
        { icon: 'fa-file-invoice', label: '生成报表', color: '#5856d6', action: 'generate-report' }
    ];

    var html = '';
    for (var i = 0; i < actions.length; i++) {
        var action = actions[i];
        html += '<div class="quick-action" style="border-color: ' + action.color + ';" data-action="' + action.action + '">' +
            '<div class="quick-action-icon" style="background: ' + action.color + '20; color: ' + action.color + ';">' +
            '<i class="fas ' + action.icon + '"></i>' +
            '</div>' +
            '<span class="quick-action-label">' + action.label + '</span>' +
            '</div>';
    }
    container.innerHTML = html;

    container.querySelectorAll('.quick-action').forEach(function(el) {
        el.addEventListener('click', function() {
            var label = this.querySelector('.quick-action-label').textContent;
            showToast(label + ' 功能开发中...', 'info');
        });
    });

    console.log('✅ Quick actions rendered');
}

// ============================================================
// 4. 加载数据
// ============================================================

function loadDashboardData() {
    console.log('🔄 Loading dashboard data...');

    try {
        renderMetricCards(mockData.metrics);
        renderRecentOrders(mockData.recentOrders);
        renderQuickActions();
        console.log('✅ Dashboard loaded successfully with mock data');
    } catch (error) {
        console.error('❌ Failed to load dashboard:', error);

        var container = document.querySelector('.metric-cards');
        if (container) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #6e6e73;">' +
                '<i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff9500; margin-bottom: 16px; display: block;"></i>' +
                '<h3 style="margin-bottom: 8px;">加载数据失败</h3>' +
                '<p style="margin-bottom: 16px;">' + (error.message || '请检查网络连接') + '</p>' +
                '<button onclick="window.ExecutiveDashboard?.refresh()" style="padding: 8px 24px; background: #007aff; color: #fff; border: none; border-radius: 6px; cursor: pointer;">' +
                '<i class="fas fa-redo"></i> 重试' +
                '</button>' +
                '</div>';
        }
    }
}

// ============================================================
// 5. 快捷登记函数（供 HTML 调用）
// ============================================================

/**
 * 快速记录车辆进入
 * @param {string} plate - 车牌号
 */
window.quickEntry = function(plate) {
    if (!plate) {
        var input = document.getElementById('vmPlateInput');
        if (input) plate = input.value.trim().toUpperCase();
    }
    if (!plate) {
        showToast('请输入车牌号', 'warning');
        return;
    }

    // 检查是否已在场内
    var existing = window.VehicleMonitorModule?.activeVehicles?.find(function(v) {
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
        var record = {
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
        
        var all = JSON.parse(localStorage.getItem('vehicle_records') || '[]');
        all.push(record);
        localStorage.setItem('vehicle_records', JSON.stringify(all));
        
        showToast('📥 车辆 ' + plate + ' 已进入', 'success');
        
        if (window.VehicleMonitorModule && typeof window.VehicleMonitorModule.refresh === 'function') {
            window.VehicleMonitorModule.refresh();
        }
    }
};

/**
 * 快速记录车辆离开
 * @param {string} plate - 车牌号
 */
window.quickExit = function(plate) {
    if (!plate) {
        var input = document.getElementById('vmPlateInput');
        if (input) plate = input.value.trim().toUpperCase();
    }
    if (!plate) {
        showToast('请输入车牌号', 'warning');
        return;
    }

    if (window.VehicleMonitorModule && typeof window.VehicleMonitorModule.quickExit === 'function') {
        window.VehicleMonitorModule.quickExit(plate);
    } else {
        var all = JSON.parse(localStorage.getItem('vehicle_records') || '[]');
        var index = all.findIndex(function(r) {
            return r.plate === plate && !r.exit_time;
        });
        
        if (index < 0) {
            showToast('车辆 ' + plate + ' 不在场内', 'warning');
            return;
        }
        
        var vehicle = all[index];
        var now = new Date();
        var entryTime = new Date(vehicle.entry_time);
        var duration = Math.floor((now - entryTime) / 1000 / 60);
        
        vehicle.exit_time = now.toISOString();
        vehicle.duration_minutes = duration;
        all[index] = vehicle;
        localStorage.setItem('vehicle_records', JSON.stringify(all));
        
        showToast('📤 车辆 ' + plate + ' 已离开，停留 ' + duration + ' 分钟', 'success');
        
        if (window.VehicleMonitorModule && typeof window.VehicleMonitorModule.refresh === 'function') {
            window.VehicleMonitorModule.refresh();
        }
    }
};

// ============================================================
// 6. 自动刷新
// ============================================================

var refreshInterval = null;

function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(function() {
        console.log('🔄 Auto-refreshing dashboard...');
        loadDashboardData();
    }, 60000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// ============================================================
// 7. 初始化
// ============================================================

export function init() {
    console.log('📊 Executive Dashboard initializing...');

    loadDashboardData();
    startAutoRefresh();

    console.log('✅ Executive Dashboard ready');
}

// ============================================================
// 8. 导出
// ============================================================

export default {
    init: init,
    loadData: loadDashboardData,
    refresh: loadDashboardData,
    stopAutoRefresh: stopAutoRefresh
};

// ============================================================
// 9. DOM 就绪
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Executive Dashboard DOM ready');
});

// ============================================================
// 10. 暴露全局方法
// ============================================================

if (typeof window !== 'undefined') {
    window.ExecutiveDashboard = {
        loadData: loadDashboardData,
        refresh: loadDashboardData,
        stopAutoRefresh: stopAutoRefresh
    };
}

console.log('🏁 Executive Dashboard module loaded successfully');