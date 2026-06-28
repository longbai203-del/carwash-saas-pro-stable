/**
 * dashboard.js - 仪表板模块
 */
(function() {
    'use strict';

    window.DashboardModule = Object.create(ModuleBase);
    window.DashboardModule.moduleName = 'dashboard';
    window.DashboardModule.charts = [];

    window.DashboardModule.cacheDom = function() {
        this.el = {
            todayRevenue: document.getElementById('todayRevenue'),
            todayOrders: document.getElementById('todayOrdersValue'),
            customers: document.getElementById('customersValue'),
            totalSales: document.getElementById('totalSalesValue'),
            employees: document.getElementById('employeesCount'),
            preview: document.getElementById('todayOrdersPreview'),
            topServices: document.getElementById('topServicesContent'),
            alertBar: document.getElementById('stockAlertBar'),
            alertText: document.getElementById('stockAlertText'),
            kpiTodayOrders: document.getElementById('kpiTodayOrders'),
            kpiTodayRevenue: document.getElementById('kpiTodayRevenue'),
            kpiTotalRevenue: document.getElementById('kpiTotalRevenue'),
            kpiLowStock: document.getElementById('kpiLowStock'),
            kpiPendingOrders: document.getElementById('kpiPendingOrders'),
            kpiAvgOrder: document.getElementById('kpiAvgOrder'),
            kpiTopStaff: document.getElementById('kpiTopStaff'),
            kpiTopService: document.getElementById('kpiTopService')
        };
    };

    window.DashboardModule.bindEvents = function() {};

    window.DashboardModule.loadData = function() {
        var orders = this.getData('allOrders');
        var customers = this.getData('allCustomers');
        var inventory = this.getData('allInventory');
        var users = this.getData('allUsers');

        console.log('[Dashboard] 数据:', {
            orders: orders.length,
            customers: customers.length,
            inventory: inventory.length,
            users: users.length
        });

        this.render(orders, customers, inventory, users);
        this.initCharts(orders);
    };

    window.DashboardModule.render = function(orders, customers, inventory, users) {
        var total = orders.reduce(function(s, o) { return s + (o.total || 0); }, 0);
        var today = new Date().toISOString().split('T')[0];
        var todayOrders = orders.filter(function(o) { return o.date === today; });
        var todayRevenue = todayOrders.reduce(function(s, o) { return s + (o.total || 0); }, 0);

        if (this.el.todayRevenue) this.el.todayRevenue.textContent = todayRevenue.toFixed(2) + ' SAR';
        if (this.el.todayOrders) this.el.todayOrders.textContent = todayOrders.length;
        if (this.el.customers) this.el.customers.textContent = customers.length;
        if (this.el.totalSales) this.el.totalSales.textContent = total.toFixed(2) + ' SAR';
        if (this.el.employees) this.el.employees.textContent = users.filter(function(u) { return u.role !== 'owner' && u.status === 'approved'; }).length;

        var lowStock = inventory.filter(function(i) { return (i.quantity || 0) <= (i.min_qty || 5); }).length;
        var avgOrder = orders.length > 0 ? total / orders.length : 0;
        var pendingOrders = orders.filter(function(o) { return o.status === 'pending' || o.status === 'confirmed' || o.status === 'in_progress'; }).length;

        if (this.el.kpiTodayOrders) this.el.kpiTodayOrders.textContent = todayOrders.length;
        if (this.el.kpiTodayRevenue) this.el.kpiTodayRevenue.textContent = todayRevenue.toFixed(2) + ' SAR';
        if (this.el.kpiTotalRevenue) this.el.kpiTotalRevenue.textContent = total.toFixed(2) + ' SAR';
        if (this.el.kpiLowStock) this.el.kpiLowStock.textContent = lowStock;
        if (this.el.kpiPendingOrders) this.el.kpiPendingOrders.textContent = pendingOrders;
        if (this.el.kpiAvgOrder) this.el.kpiAvgOrder.textContent = avgOrder.toFixed(2) + ' SAR';

        var staffStats = {};
        orders.forEach(function(o) {
            var name = o.staff_name || '未知';
            staffStats[name] = (staffStats[name] || 0) + (o.total || 0);
        });
        var topStaff = Object.entries(staffStats).sort(function(a, b) { return b[1] - a[1]; })[0];
        if (this.el.kpiTopStaff) this.el.kpiTopStaff.textContent = topStaff ? topStaff[0] + ' (' + topStaff[1].toFixed(0) + ' SAR)' : '-';

        var serviceStats = {};
        orders.forEach(function(o) {
            var name = o.service_name || '基础';
            serviceStats[name] = (serviceStats[name] || 0) + 1;
        });
        var topService = Object.entries(serviceStats).sort(function(a, b) { return b[1] - a[1]; })[0];
        if (this.el.kpiTopService) this.el.kpiTopService.textContent = topService ? topService[0] + ' (' + topService[1] + '单)' : '-';

        var lowItems = inventory.filter(function(i) { return (i.quantity || 0) <= (i.min_qty || 5); });
        if (this.el.alertBar && this.el.alertText) {
            if (lowItems.length > 0) {
                this.el.alertBar.classList.remove('hidden');
                this.el.alertText.textContent = '⚠️ ' + lowItems.map(function(i) { return i.name + '(' + i.quantity + '/' + i.min_qty + ')'; }).join('、');
            } else {
                this.el.alertBar.classList.add('hidden');
            }
        }

        if (this.el.preview) {
            if (todayOrders.length === 0) {
                this.el.preview.innerHTML = '<div class="text-gray-400 text-center">今日暂无订单</div>';
            } else {
                var previewHtml = '';
                todayOrders.slice(0, 10).forEach(function(o) {
                    previewHtml += '<div class="flex justify-between p-2 bg-gray-50 rounded-lg">';
                    previewHtml += '<span>' + (o.plate_number || 'N/A') + '</span>';
                    previewHtml += '<span>' + (o.total || 0).toFixed(2) + ' SAR</span>';
                    previewHtml += '</div>';
                });
                this.el.preview.innerHTML = previewHtml;
            }
        }

        if (this.el.topServices) {
            var topServicesHtml = '';
            var sortedServices = Object.entries(serviceStats).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);
            if (sortedServices.length === 0) {
                topServicesHtml = '<div class="text-gray-400 text-center">暂无数据</div>';
            } else {
                sortedServices.forEach(function(item) {
                    topServicesHtml += '<div class="flex justify-between"><span>' + item[0] + '</span><span>' + item[1] + ' 单</span></div>';
                });
            }
            this.el.topServices.innerHTML = topServicesHtml;
        }
    };

    window.DashboardModule.initCharts = function(orders) {
        var ctx1 = document.getElementById('serviceStatsChart');
        if (ctx1) {
            if (this.charts[0]) { this.charts[0].destroy(); }
            var days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            var counts = days.map(function() { return Math.floor(Math.random() * 10) + 1; });
            try {
                this.charts[0] = new Chart(ctx1, {
                    type: 'bar',
                    data: { labels: days, datasets: [{ label: '订单数', data: counts, backgroundColor: '#0091D5', borderRadius: 6 }] },
                    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
                });
            } catch(e) { console.warn('[Dashboard] 图表1初始化失败:', e); }
        }
        var ctx2 = document.getElementById('monthlyRevenueChart');
        if (ctx2) {
            if (this.charts[1]) { this.charts[1].destroy(); }
            var months = ['1月', '2月', '3月', '4月', '5月', '6月'];
            var revenues = months.map(function() { return Math.floor(Math.random() * 5000) + 1000; });
            try {
                this.charts[1] = new Chart(ctx2, {
                    type: 'line',
                    data: { labels: months, datasets: [{ label: '收入', data: revenues, borderColor: '#0091D5', fill: true, tension: 0.3 }] },
                    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
                });
            } catch(e) { console.warn('[Dashboard] 图表2初始化失败:', e); }
        }
    };

    console.log('[Dashboard] 模块已注册');
})();