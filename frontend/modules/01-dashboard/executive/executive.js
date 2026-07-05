/**
 * 01-dashboard/executive/executive.js
 * 执行仪表板 - 企业级管理层视图
 */
console.log('🏠 Executive Dashboard loaded');

const state = {
    metrics: {
        revenue: { current: 125000, previous: 118000, change: 5.9 },
        orders: { current: 47, previous: 42, change: 11.9 },
        customers: { current: 89, previous: 82, change: 8.5 },
        profit: { current: 22, previous: 19, change: 15.8 }
    },
    isLoading: true
};

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-SA').format(num);
}

function renderMetricCards(metrics) {
    const container = document.querySelector('.metric-cards');
    if (!container) return;
    
    const cards = [
        { key: 'revenue', icon: 'fa-money-bill-wave', label: '今日收入', color: '#007aff', value: formatCurrency(metrics.revenue.current), change: metrics.revenue.change },
        { key: 'orders', icon: 'fa-clipboard-list', label: '今日订单', color: '#34c759', value: formatNumber(metrics.orders.current), change: metrics.orders.change },
        { key: 'customers', icon: 'fa-users', label: '活跃客户', color: '#5856d6', value: formatNumber(metrics.customers.current), change: metrics.customers.change },
        { key: 'profit', icon: 'fa-chart-line', label: '利润率', color: '#ff9500', value: metrics.profit.current + '%', change: metrics.profit.change }
    ];
    
    container.innerHTML = cards.map(card => `
        <div class="metric-card" style="border-top: 4px solid ${card.color};">
            <div class="metric-header">
                <span class="metric-icon" style="background: ${card.color}20; color: ${card.color};">
                    <i class="fas ${card.icon}"></i>
                </span>
                <span class="metric-label">${card.label}</span>
            </div>
            <div class="metric-value">${card.value}</div>
            <div class="metric-footer">
                <span class="metric-change ${card.change > 0 ? 'positive' : 'negative'}">
                    <i class="fas ${card.change > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                    ${Math.abs(card.change)}%
                </span>
                <span class="metric-change-label">较昨日</span>
            </div>
        </div>
    `).join('');
}

function renderRecentOrders() {
    const container = document.querySelector('.recent-orders');
    if (!container) return;
    
    const orders = [
        { id: 'ORD-001', customer: 'Ahmed Al-Harbi', total: 350, status: '已完成' },
        { id: 'ORD-002', customer: 'Sara Al-Otaibi', total: 210, status: '处理中' },
        { id: 'ORD-003', customer: 'Mohammed Al-Saud', total: 520, status: '待处理' }
    ];
    
    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-info">
                <span class="order-id">#${order.id}</span>
                <span class="order-customer">${order.customer}</span>
            </div>
            <div class="order-details">
                <span class="order-amount">${formatCurrency(order.total)}</span>
                <span class="order-status">${order.status}</span>
            </div>
        </div>
    `).join('');
}

function renderQuickActions() {
    const container = document.querySelector('.quick-actions');
    if (!container) return;
    
    const actions = [
        { icon: 'fa-cash-register', label: '新销售', color: '#007aff' },
        { icon: 'fa-user-plus', label: '新客户', color: '#34c759' },
        { icon: 'fa-box', label: '盘点库存', color: '#ff9500' },
        { icon: 'fa-file-invoice', label: '生成报表', color: '#5856d6' }
    ];
    
    container.innerHTML = actions.map(action => `
        <div class="quick-action" style="border-color: ${action.color};">
            <div class="quick-action-icon" style="background: ${action.color}20; color: ${action.color};">
                <i class="fas ${action.icon}"></i>
            </div>
            <span class="quick-action-label">${action.label}</span>
        </div>
    `).click(function() {
        alert('功能开发中...');
    });
}

export function init() {
    console.log('📊 Executive Dashboard initializing...');
    renderMetricCards(state.metrics);
    renderRecentOrders();
    renderQuickActions();
    console.log('✅ Executive Dashboard ready');
}

export default { init };

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Executive Dashboard DOM ready');
});
