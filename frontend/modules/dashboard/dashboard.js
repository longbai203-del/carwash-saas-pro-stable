// frontend/modules/dashboard/dashboard.js

// ============================================================
// 1. 引入项目原有的 API 客户端和工具（请根据实际路径调整）
// ============================================================
import { apiClient } from '../../js/api-client.js';   // 您的 API 请求封装
import { store } from '../../js/store.js';           // 全局状态（如需使用）
import { showToast } from '../../js/utils.js';       // 提示工具

// ============================================================
// 2. 全局 Chart 实例
// ============================================================
let trendChartInstance = null;
let pieChartInstance = null;

// ============================================================
// 3. DOM 缓存
// ============================================================
const dom = {
    storeSelect: document.getElementById('storeSelect'),
    timeFilter: document.getElementById('timeFilter'),
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    refreshBtn: document.getElementById('refreshBtn'),
    kpiRevenue: document.getElementById('kpiRevenue'),
    kpiProfit: document.getElementById('kpiProfit'),
    kpiNewCustomers: document.getElementById('kpiNewCustomers'),
    revenueTrend: document.getElementById('revenueTrend'),
    profitTrend: document.getElementById('profitTrend'),
    customerTrend: document.getElementById('customerTrend'),
    trendCanvas: document.getElementById('trendChart'),
    pieCanvas: document.getElementById('servicePieChart'),
    serviceDetailList: document.getElementById('serviceDetailList'),
    hotServices: document.getElementById('hotServices'),
    topCustomers: document.getElementById('topCustomers'),
    topEmployees: document.getElementById('topEmployees'),
    alertList: document.getElementById('alertList'),
    alertCount: document.getElementById('alertCount'),
    alertToggle: document.getElementById('alertToggle'),
    alertArrow: document.getElementById('alertArrow'),
};

// ============================================================
// 4. 工具函数（格式化）
// ============================================================
function formatCurrency(val) {
    return Number(val).toLocaleString('zh-CN') + ' SAR';
}

function formatNumber(val) {
    return Number(val).toLocaleString('zh-CN');
}

function getTrendSymbol(percent) {
    if (percent > 0) return '↑';
    if (percent < 0) return '↓';
    return '→';
}

// ============================================================
// 5. 数据获取函数 — 请根据您的实际 API 修改此处
// ============================================================
async function fetchDashboardData(params) {
    // ★★★★★ 请替换为您的真实接口 ★★★★★
    // 例如：const response = await apiClient.get('/reports/dashboard', { params });
    // 或者使用 store.dispatch('fetchDashboard', params)
    // 以下为模拟数据（结构完全匹配设计稿所需字段）
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                kpi: {
                    revenue: 42300,
                    profit: 12800,
                    newCustomers: 38,
                    revenueTrend: 35,      // 百分比（正数表示增长）
                    profitTrend: 12,
                    customerTrend: 8,
                },
                trend: {
                    labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月'],
                    revenue: [320, 280, 390, 410, 380, 450, 500, 470, 520, 490],
                    profit: [90, 80, 110, 130, 120, 150, 170, 160, 180, 175],
                },
                servicePie: {
                    labels: ['洗车', '打蜡', '内饰清洁', '抛光', '其他'],
                    values: [40, 25, 20, 10, 5],
                },
                hotServices: [
                    { name: '标准洗车', count: 45 },
                    { name: '精致打蜡', count: 32 },
                    { name: '内饰深度清洁', count: 28 },
                    { name: '漆面抛光', count: 18 },
                    { name: '发动机舱清洗', count: 12 },
                ],
                topCustomers: [
                    { name: '张伟', amount: 680 },
                    { name: '李娜', amount: 520 },
                    { name: '王强', amount: 430 },
                    { name: '赵丽', amount: 390 },
                    { name: '陈明', amount: 310 },
                ],
                topEmployees: [
                    { name: '刘洋', orders: 38 },
                    { name: '王芳', orders: 35 },
                    { name: '陈浩', orders: 30 },
                    { name: '周敏', orders: 27 },
                    { name: '吴刚', orders: 23 },
                ],
                alerts: [
                    { level: 'high', message: '今日营业额较近7日均值偏离+35%', time: '2小时前' },
                    { level: 'medium', message: '洗车液库存低于安全阈值（剩余8瓶）', time: '3小时前' },
                    { level: 'low', message: '客户张三已60天未到店，建议发送回访提醒', time: '1天前' },
                ],
                // 门店列表（用于下拉框）
                stores: ['全部门店', '旗舰店', '万达店', '龙湖店'],
            });
        }, 300);
    });
}

// ============================================================
// 6. 渲染函数
// ============================================================

// 6.1 KPI
function renderKPI(kpi) {
    dom.kpiRevenue.textContent = formatCurrency(kpi.revenue);
    dom.kpiProfit.textContent = formatCurrency(kpi.profit);
    dom.kpiNewCustomers.textContent = formatNumber(kpi.newCustomers);

    dom.revenueTrend.textContent = `${getTrendSymbol(kpi.revenueTrend)} ${Math.abs(kpi.revenueTrend)}%`;
    dom.revenueTrend.className = `trend-${kpi.revenueTrend >= 0 ? 'up' : 'down'}`;
    dom.profitTrend.textContent = `${getTrendSymbol(kpi.profitTrend)} ${Math.abs(kpi.profitTrend)}%`;
    dom.profitTrend.className = `trend-${kpi.profitTrend >= 0 ? 'up' : 'down'}`;
    dom.customerTrend.textContent = `${getTrendSymbol(kpi.customerTrend)} ${Math.abs(kpi.customerTrend)}%`;
    dom.customerTrend.className = `trend-${kpi.customerTrend >= 0 ? 'up' : 'down'}`;
}

// 6.2 营业趋势复合图（柱状+折线）
function renderTrendChart(data, metric = 'revenue') {
    const ctx = dom.trendCanvas.getContext('2d');
    if (trendChartInstance) trendChartInstance.destroy();

    const isRevenue = metric === 'revenue';
    const mainData = isRevenue ? data.revenue : data.profit;
    const label = isRevenue ? '营业额 (SAR)' : '利润 (SAR)';
    const color = isRevenue ? '#2563eb' : '#0d9488';

    trendChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: label,
                    data: mainData,
                    backgroundColor: color + '80',
                    borderColor: color,
                    borderWidth: 2,
                    borderRadius: 4,
                    order: 1,
                },
                {
                    label: '趋势线',
                    data: mainData,
                    type: 'line',
                    borderColor: '#ef4444',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#ef4444',
                    tension: 0.3,
                    fill: false,
                    order: 0,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } },
            },
        },
    });
}

// 6.3 服务收入占比（环形图 + 明细列表）
function renderPieChart(labels, values) {
    const ctx = dom.pieCanvas.getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();

    const colors = ['#2563eb', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6'];
    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
            },
            cutout: '70%',
        },
    });

    // 明细列表
    const total = values.reduce((a, b) => a + b, 0);
    dom.serviceDetailList.innerHTML = labels.map((label, i) => {
        const pct = ((values[i] / total) * 100).toFixed(1);
        const color = colors[i % colors.length];
        return `<div class="detail-item">
            <span><span class="color-dot" style="background:${color}"></span>${label}</span>
            <span>${values[i]} (${pct}%)</span>
        </div>`;
    }).join('');
}

// 6.4 三大排行
function renderRankings(hot, customers, employees) {
    // 最热服务
    dom.hotServices.innerHTML = hot.map((item, i) => `
        <div class="rank-item">
            <span><span class="rank-index ${i < 3 ? 'top'+(i+1) : ''}">${i+1}</span>${item.name}</span>
            <span>${item.count}次</span>
        </div>
    `).join('');

    // Top客户
    dom.topCustomers.innerHTML = customers.map((item, i) => `
        <div class="rank-item">
            <span><span class="rank-index ${i < 3 ? 'top'+(i+1) : ''}">${i+1}</span>${item.name}</span>
            <span>${formatCurrency(item.amount)}</span>
        </div>
    `).join('');

    // 员工排行
    dom.topEmployees.innerHTML = employees.map((item, i) => `
        <div class="rank-item">
            <span><span class="rank-index ${i < 3 ? 'top'+(i+1) : ''}">${i+1}</span>${item.name}</span>
            <span>${item.orders}单</span>
        </div>
    `).join('');
}

// 6.5 风险预警
function renderAlerts(alerts) {
    dom.alertCount.textContent = alerts.length;
    if (alerts.length === 0) {
        dom.alertList.innerHTML = '<div style="padding:12px 0;color:#94a3b8;">暂无风险预警</div>';
        return;
    }
    dom.alertList.innerHTML = alerts.map(a => `
        <div class="alert-item">
            <span class="alert-level ${a.level}"></span>
            <span>${a.message}</span>
            <span class="alert-time">${a.time}</span>
        </div>
    `).join('');
}

// 6.6 门店下拉框填充
function renderStoreSelect(stores) {
    const select = dom.storeSelect;
    select.innerHTML = '';
    stores.forEach(store => {
        const opt = document.createElement('option');
        opt.value = store === '全部门店' ? 'all' : store;
        opt.textContent = store;
        select.appendChild(opt);
    });
}

// ============================================================
// 7. 主加载函数
// ============================================================
async function loadDashboard() {
    try {
        // 构造请求参数（根据当前筛选状态）
        const params = {
            store: dom.storeSelect.value,
            timeRange: document.querySelector('#timeFilter .active')?.dataset.range || 'today',
            startDate: dom.startDate.value,
            endDate: dom.endDate.value,
        };

        // 调用数据接口
        const data = await fetchDashboardData(params);

        // 渲染所有模块
        renderStoreSelect(data.stores || ['全部门店']);   // 如果接口返回门店列表
        renderKPI(data.kpi);
        renderTrendChart(data.trend, 'revenue'); // 默认营业额视图
        renderPieChart(data.servicePie.labels, data.servicePie.values);
        renderRankings(data.hotServices, data.topCustomers, data.topEmployees);
        renderAlerts(data.alerts);

        // 绑定图表切换事件（营业额/利润切换）
        document.querySelectorAll('.chart-tabs button').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.chart-tabs button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const metric = btn.dataset.metric;
                renderTrendChart(data.trend, metric);
            };
        });

    } catch (error) {
        console.error('仪表盘加载失败:', error);
        showToast('加载数据失败，请稍后重试', 'error');
    }
}

// ============================================================
// 8. 事件绑定 & 初始化
// ============================================================
function initEvents() {
    // 时间筛选按钮
    dom.timeFilter.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        document.querySelectorAll('#timeFilter button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadDashboard();
    });

    // 门店切换
    dom.storeSelect.addEventListener('change', loadDashboard);

    // 日期范围变更
    dom.startDate.addEventListener('change', loadDashboard);
    dom.endDate.addEventListener('change', loadDashboard);

    // 刷新按钮
    dom.refreshBtn.addEventListener('click', loadDashboard);

    // 预警折叠
    let alertVisible = true;
    dom.alertToggle.addEventListener('click', () => {
        alertVisible = !alertVisible;
        dom.alertList.style.display = alertVisible ? 'block' : 'none';
        dom.alertArrow.textContent = alertVisible ? '▼' : '▶';
    });

    // 初始化日期（默认今日）
    const today = new Date().toISOString().split('T')[0];
    dom.startDate.value = today;
    dom.endDate.value = today;
}

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    loadDashboard();
});

// 暴露 reload 方法供外部调用（例如路由切换时刷新）
window.dashboard = { reload: loadDashboard };