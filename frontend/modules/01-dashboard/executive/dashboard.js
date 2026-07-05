// frontend/modules/dashboard/dashboard.js
// 使用 IIFE 避免全局污染，依赖 window 上的全局对象（apiClient, store, showToast 等）

(function() {
    'use strict';

    // ============================
    // 1. 获取全局依赖（如果不存在则使用模拟实现）
    // ============================
    const apiClient = window.apiClient || null;
    const store = window.store || null;
    const showToast = window.showToast || function(msg, type) { console.log('['+type+']', msg); };
    const app = window.app || null;

    // ============================
    // 2. DOM 引用
    // ============================
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

    let trendChartInstance = null;
    let pieChartInstance = null;

    // ============================
    // 3. 工具函数
    // ============================
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

    // ============================
    // 4. 数据获取（兼容真实 API 或使用模拟数据）
    // ============================
    async function fetchDashboardData(params) {
        // 如果存在 apiClient，则调用真实接口
        if (apiClient && typeof apiClient.get === 'function') {
            try {
                const response = await apiClient.get('/reports/dashboard', { params });
                return response.data;
            } catch (err) {
                console.warn('API 调用失败，使用模拟数据', err);
                // 降级到模拟数据
            }
        }

        // 模拟数据（结构与之前一致）
        return {
            kpi: {
                revenue: 42300,
                profit: 12800,
                newCustomers: 38,
                revenueTrend: 35,
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
            stores: ['全部门店', '旗舰店', '万达店', '龙湖店'],
        };
    }

    // ============================
    // 5. 渲染函数
    // ============================
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

    function renderTrendChart(data, metric) {
        const ctx = dom.trendCanvas.getContext('2d');
        if (trendChartInstance) trendChartInstance.destroy();

        const isRevenue = (metric === 'revenue');
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
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } },
                },
            },
        });
    }

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
                plugins: { legend: { display: false } },
                cutout: '70%',
            },
        });

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

    function renderRankings(hot, customers, employees) {
        dom.hotServices.innerHTML = hot.map((item, i) => `
            <div class="rank-item">
                <span><span class="rank-index ${i < 3 ? 'top'+(i+1) : ''}">${i+1}</span>${item.name}</span>
                <span>${item.count}次</span>
            </div>
        `).join('');

        dom.topCustomers.innerHTML = customers.map((item, i) => `
            <div class="rank-item">
                <span><span class="rank-index ${i < 3 ? 'top'+(i+1) : ''}">${i+1}</span>${item.name}</span>
                <span>${formatCurrency(item.amount)}</span>
            </div>
        `).join('');

        dom.topEmployees.innerHTML = employees.map((item, i) => `
            <div class="rank-item">
                <span><span class="rank-index ${i < 3 ? 'top'+(i+1) : ''}">${i+1}</span>${item.name}</span>
                <span>${item.orders}单</span>
            </div>
        `).join('');
    }

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

    // ============================
    // 6. 主加载函数
    // ============================
    async function loadDashboard() {
        try {
            const params = {
                store: dom.storeSelect.value,
                timeRange: document.querySelector('#timeFilter .active')?.dataset.range || 'today',
                startDate: dom.startDate.value,
                endDate: dom.endDate.value,
            };

            const data = await fetchDashboardData(params);
            renderStoreSelect(data.stores || ['全部门店']);
            renderKPI(data.kpi);
            renderTrendChart(data.trend, 'revenue');
            renderPieChart(data.servicePie.labels, data.servicePie.values);
            renderRankings(data.hotServices, data.topCustomers, data.topEmployees);
            renderAlerts(data.alerts);

            // 图表切换事件
            document.querySelectorAll('.chart-tabs button').forEach(btn => {
                btn.onclick = function() {
                    document.querySelectorAll('.chart-tabs button').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    renderTrendChart(data.trend, this.dataset.metric);
                };
            });

        } catch (error) {
            console.error('仪表盘加载失败:', error);
            showToast('加载数据失败，请稍后重试', 'error');
        }
    }

    // ============================
    // 7. 事件绑定
    // ============================
    function initEvents() {
        dom.timeFilter.addEventListener('click', function(e) {
            const btn = e.target.closest('button');
            if (!btn) return;
            document.querySelectorAll('#timeFilter button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadDashboard();
        });

        dom.storeSelect.addEventListener('change', loadDashboard);
        dom.startDate.addEventListener('change', loadDashboard);
        dom.endDate.addEventListener('change', loadDashboard);
        dom.refreshBtn.addEventListener('click', loadDashboard);

        // 预警折叠
        let alertVisible = true;
        dom.alertToggle.addEventListener('click', function() {
            alertVisible = !alertVisible;
            dom.alertList.style.display = alertVisible ? 'block' : 'none';
            dom.alertArrow.textContent = alertVisible ? '▼' : '▶';
        });

        // 默认日期
        const today = new Date().toISOString().split('T')[0];
        dom.startDate.value = today;
        dom.endDate.value = today;
    }

    // ============================
    // 8. 初始化入口
    // ============================
    function init() {
        initEvents();
        loadDashboard();
    }

    // 如果 DOM 已加载则立即初始化，否则等待
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ============================
    // 9. 注册模块（供 loader 识别）
    // ============================
    // 尝试使用框架注册方式，若不存在则直接挂在 window 上
    if (typeof window.registerModule === 'function') {
        window.registerModule('DashboardModule', {
            init: init,
            reload: loadDashboard,
        });
    } else {
        // 兼容：直接挂载全局对象
        window.DashboardModule = {
            init: init,
            reload: loadDashboard,
        };
    }

})();