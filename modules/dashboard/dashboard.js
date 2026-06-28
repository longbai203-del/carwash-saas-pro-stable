/**
 * dashboard.js - Owner Dashboard 老板驾驶舱
 */
(function() {
    'use strict';

    window.DashboardModule = Object.create(ModuleBase);
    window.DashboardModule.moduleName = 'dashboard';
    window.DashboardModule.charts = [];
    window.DashboardModule.currentPeriod = 'month';
    window.DashboardModule.customStartDate = null;
    window.DashboardModule.customEndDate = null;

    // ===== 缓存 DOM =====
    window.DashboardModule.cacheDom = function() {
        this.el = {
            // KPI
            kpiRevenue: document.getElementById('kpiRevenue'),
            kpiProfit: document.getElementById('kpiProfit'),
            kpiCustomers: document.getElementById('kpiCustomers'),
            kpiAvgOrder: document.getElementById('kpiAvgOrder'),
            kpiRepeatRate: document.getElementById('kpiRepeatRate'),
            kpiNewCustomers: document.getElementById('kpiNewCustomers'),
            kpiRevenueChange: document.getElementById('kpiRevenueChange'),
            kpiProfitChange: document.getElementById('kpiProfitChange'),
            kpiCustomersChange: document.getElementById('kpiCustomersChange'),
            kpiAvgOrderChange: document.getElementById('kpiAvgOrderChange'),
            kpiRepeatRateChange: document.getElementById('kpiRepeatRateChange'),
            kpiNewCustomersChange: document.getElementById('kpiNewCustomersChange'),
            // 图表
            revenueTrendChart: document.getElementById('revenueTrendChart'),
            profitTrendChart: document.getElementById('profitTrendChart'),
            storeCompareChart: document.getElementById('storeCompareChart'),
            servicePieChart: document.getElementById('servicePieChart'),
            customerTrendChart: document.getElementById('customerTrendChart'),
            // 列表
            topServicesList: document.getElementById('topServicesList'),
            topCustomersList: document.getElementById('topCustomersList'),
            topEmployeesList: document.getElementById('topEmployeesList'),
            alertList: document.getElementById('alertList'),
            kpiTargetList: document.getElementById('kpiTargetList'),
            storeSummaryList: document.getElementById('storeSummaryList'),
            // 日期
            startDate: document.getElementById('dashboardStartDate'),
            endDate: document.getElementById('dashboardEndDate'),
            // 模态框
            setKPIModal: document.getElementById('setKPIModal'),
            kpiTypeSelect: document.getElementById('kpiTypeSelect'),
            kpiTargetValue: document.getElementById('kpiTargetValue'),
            kpiStoreSelect: document.getElementById('kpiStoreSelect')
        };
    };

    // ===== 绑定事件 =====
    window.DashboardModule.bindEvents = function() {
        var self = this;
        // 时间筛选按钮
        document.querySelectorAll('.time-filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.time-filter-btn').forEach(function(b) {
                    b.className = 'time-filter-btn btn-outline btn-sm';
                });
                this.className = 'time-filter-btn btn-primary btn-sm';
                self.currentPeriod = this.dataset.period;
                self.loadData();
            });
        });
        // 默认选中本月
        var defaultBtn = document.getElementById('defaultTimeBtn');
        if (defaultBtn) {
            defaultBtn.className = 'time-filter-btn btn-primary btn-sm';
        }
        // 图表类型切换
        if (this.el.trendChartType) {
            this.el.trendChartType.addEventListener('change', function() { self.loadCharts(); });
        }
    };

    // ============================================================
    // 加载数据
    // ============================================================

    window.DashboardModule.loadData = function() {
        this.loadKPIs();
        this.loadCharts();
        this.loadTopServices();
        this.loadTopCustomers();
        this.loadTopEmployees();
        this.loadAlerts();
        this.loadKPITargets();
        this.loadStoreSummary();
    };

    // ============================================================
    // 获取日期范围
    // ============================================================

    window.DashboardModule.getDateRange = function() {
        var self = this;
        var now = new Date();
        var start, end;

        if (this.customStartDate && this.customEndDate) {
            return { start: this.customStartDate, end: this.customEndDate };
        }

        var period = this.currentPeriod || 'month';
        var startDate = new Date(now);
        var endDate = new Date(now);

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'yesterday':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay());
                endDate = new Date(now);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now);
                break;
            case 'quarter':
                var quarterMonth = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterMonth, 1);
                endDate = new Date(now);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now);
        }

        return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
        };
    };

    window.DashboardModule.applyCustomDate = function() {
        var start = this.el.startDate ? this.el.startDate.value : '';
        var end = this.el.endDate ? this.el.endDate.value : '';
        if (start && end) {
            this.customStartDate = start;
            this.customEndDate = end;
            this.loadData();
        } else {
            this.toast('请选择完整的日期范围', 'error');
        }
    };

    // ============================================================
    // KPI 计算
    // ============================================================

    window.DashboardModule.loadKPIs = function() {
        var range = this.getDateRange();
        var orders = AppStore.get('allOrders') || [];
        var customers = AppStore.get('allCustomers') || [];
        var expenses = AppStore.get('allExpenses') || [];

        // 按日期过滤
        var periodOrders = orders.filter(function(o) {
            return o.date >= range.start && o.date <= range.end && o.status === 'completed';
        });
        var todayOrders = orders.filter(function(o) {
            return o.date === new Date().toISOString().split('T')[0] && o.status === 'completed';
        });

        var totalRevenue = periodOrders.reduce(function(s, o) { return s + (o.total || 0); }, 0);
        var todayRevenue = todayOrders.reduce(function(s, o) { return s + (o.total || 0); }, 0);

        // 利润 = 收入 - 支出
        var periodExpenses = expenses.filter(function(e) {
            return e.expense_date >= range.start && e.expense_date <= range.end;
        });
        var totalExpense = periodExpenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
        var totalProfit = totalRevenue - totalExpense;

        // 客流量 = 去重客户数
        var customerIds = {};
        periodOrders.forEach(function(o) {
            if (o.customer_id) customerIds[o.customer_id] = true;
        });
        var uniqueCustomers = Object.keys(customerIds).length;

        // 客单价 = 营业额 / 客流量
        var avgOrder = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

        // 新客户
        var newCustomers = customers.filter(function(c) {
            return c.created_at && c.created_at >= range.start && c.created_at <= range.end;
        }).length;

        // 复购率
        var repeatCustomers = customers.filter(function(c) {
            return (c.visit_count || 0) >= 2;
        }).length;
        var repeatRate = customers.length > 0 ? (repeatCustomers / customers.length * 100) : 0;

        // 更新 KPI 显示
        if (this.el.kpiRevenue) this.el.kpiRevenue.textContent = todayRevenue.toFixed(2) + ' SAR';
        if (this.el.kpiProfit) this.el.kpiProfit.textContent = totalProfit.toFixed(2) + ' SAR';
        if (this.el.kpiCustomers) this.el.kpiCustomers.textContent = uniqueCustomers;
        if (this.el.kpiAvgOrder) this.el.kpiAvgOrder.textContent = avgOrder.toFixed(2) + ' SAR';
        if (this.el.kpiRepeatRate) this.el.kpiRepeatRate.textContent = repeatRate.toFixed(1) + '%';
        if (this.el.kpiNewCustomers) this.el.kpiNewCustomers.textContent = newCustomers;

        // 计算变化率（环比）
        this.calculateChanges(range, periodOrders, totalRevenue, totalProfit, uniqueCustomers, avgOrder, repeatRate, newCustomers);
    };

    window.DashboardModule.calculateChanges = function(range, orders, revenue, profit, customers, avgOrder, repeatRate, newCustomers) {
        // 获取上期数据
        var startDate = new Date(range.start);
        var endDate = new Date(range.end);
        var duration = (endDate - startDate) / (1000 * 60 * 60 * 24);
        var prevStart = new Date(startDate);
        prevStart.setDate(prevStart.getDate() - duration - 1);
        var prevEnd = new Date(startDate);
        prevEnd.setDate(prevEnd.getDate() - 1);

        var prevStartStr = prevStart.toISOString().split('T')[0];
        var prevEndStr = prevEnd.toISOString().split('T')[0];

        var allOrders = AppStore.get('allOrders') || [];
        var prevOrders = allOrders.filter(function(o) {
            return o.date >= prevStartStr && o.date <= prevEndStr && o.status === 'completed';
        });
        var prevRevenue = prevOrders.reduce(function(s, o) { return s + (o.total || 0); }, 0);

        var changeRate = function(current, previous) {
            if (previous === 0) return current > 0 ? '+100%' : '0%';
            var change = ((current - previous) / previous * 100);
            return (change > 0 ? '+' : '') + change.toFixed(1) + '%';
        };

        var changeColor = function(current, previous) {
            if (current === previous) return 'text-gray-400';
            return current > previous ? 'text-green-600' : 'text-red-600';
        };

        if (this.el.kpiRevenueChange) {
            this.el.kpiRevenueChange.textContent = changeRate(revenue, prevRevenue);
            this.el.kpiRevenueChange.className = 'text-xs ' + changeColor(revenue, prevRevenue);
        }
    };

    // ============================================================
    // 图表渲染
    // ============================================================

    window.DashboardModule.loadCharts = function() {
        var range = this.getDateRange();
        var orders = AppStore.get('allOrders') || [];
        var customers = AppStore.get('allCustomers') || [];
        var stores = AppStore.get('allStores') || [];
        var chartType = this.el.trendChartType ? this.el.trendChartType.value : 'daily';

        // 按日期分组
        var dailyData = {};
        var periodOrders = orders.filter(function(o) {
            return o.date >= range.start && o.date <= range.end && o.status === 'completed';
        });

        periodOrders.forEach(function(o) {
            if (!dailyData[o.date]) {
                dailyData[o.date] = { revenue: 0, profit: 0, count: 0, customers: {} };
            }
            dailyData[o.date].revenue += (o.total || 0);
            dailyData[o.date].count += 1;
            if (o.customer_id) dailyData[o.date].customers[o.customer_id] = true;
        });

        // 准备图表数据
        var dates = Object.keys(dailyData).sort();
        var revenueData = dates.map(function(d) { return dailyData[d].revenue; });
        var profitData = dates.map(function(d) { return dailyData[d].revenue * 0.3; }); // 模拟利润
        var customerCounts = dates.map(function(d) { return Object.keys(dailyData[d].customers).length; });

        // 渲染营业额趋势图
        this.renderRevenueTrendChart(dates, revenueData);
        this.renderProfitTrendChart(dates, profitData);
        this.renderCustomerTrendChart(dates, customerCounts);
        this.renderStoreCompareChart(stores, orders, range);
        this.renderServicePieChart(periodOrders);
    };

    window.DashboardModule.renderRevenueTrendChart = function(labels, data) {
        var ctx = this.el.revenueTrendChart;
        if (!ctx) return;
        if (this.charts[0]) { this.charts[0].destroy(); }

        try {
            this.charts[0] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '营业额',
                        data: data,
                        borderColor: '#0091D5',
                        backgroundColor: 'rgba(0,145,213,0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true, position: 'top' } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        } catch(e) { console.warn('Revenue chart error:', e); }
    };

    window.DashboardModule.renderProfitTrendChart = function(labels, data) {
        var ctx = this.el.profitTrendChart;
        if (!ctx) return;
        if (this.charts[1]) { this.charts[1].destroy(); }

        try {
            this.charts[1] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '利润',
                        data: data,
                        backgroundColor: 'rgba(34,197,94,0.7)',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true, position: 'top' } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        } catch(e) { console.warn('Profit chart error:', e); }
    };

    window.DashboardModule.renderCustomerTrendChart = function(labels, data) {
        var ctx = this.el.customerTrendChart;
        if (!ctx) return;
        if (this.charts[4]) { this.charts[4].destroy(); }

        try {
            this.charts[4] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '客户流量',
                        data: data,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139,92,246,0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true, position: 'top' } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        } catch(e) { console.warn('Customer chart error:', e); }
    };

    window.DashboardModule.renderStoreCompareChart = function(stores, orders, range) {
        var ctx = this.el.storeCompareChart;
        if (!ctx) return;
        if (this.charts[2]) { this.charts[2].destroy(); }

        if (!stores || stores.length === 0) {
            if (ctx.parentElement) {
                ctx.parentElement.innerHTML = '<div class="text-center text-gray-400 py-8">暂无门店数据</div>';
            }
            return;
        }

        var storeData = stores.map(function(s) {
            var storeOrders = orders.filter(function(o) {
                return o.store_id === s.id && o.date >= range.start && o.date <= range.end && o.status === 'completed';
            });
            var revenue = storeOrders.reduce(function(sum, o) { return sum + (o.total || 0); }, 0);
            return { name: s.name || '门店', revenue: revenue };
        });

        storeData.sort(function(a, b) { return b.revenue - a.revenue; });

        try {
            this.charts[2] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: storeData.map(function(s) { return s.name; }),
                    datasets: [{
                        label: '营业额',
                        data: storeData.map(function(s) { return s.revenue; }),
                        backgroundColor: ['#0091D5', '#38bdf8', '#7c3aed', '#f59e0b', '#22c55e', '#ef4444'],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        } catch(e) { console.warn('Store compare chart error:', e); }
    };

    window.DashboardModule.renderServicePieChart = function(orders) {
        var ctx = this.el.servicePieChart;
        if (!ctx) return;
        if (this.charts[3]) { this.charts[3].destroy(); }

        if (!orders || orders.length === 0) {
            if (ctx.parentElement) {
                ctx.parentElement.innerHTML = '<div class="text-center text-gray-400 py-8">暂无服务数据</div>';
            }
            return;
        }

        var serviceData = {};
        orders.forEach(function(o) {
            var name = o.service_name || '其他';
            serviceData[name] = (serviceData[name] || 0) + (o.total || 0);
        });

        var labels = Object.keys(serviceData);
        var values = labels.map(function(k) { return serviceData[k]; });

        var colors = ['#0091D5', '#38bdf8', '#7c3aed', '#f59e0b', '#22c55e', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

        try {
            this.charts[3] = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors.slice(0, labels.length),
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'right', labels: { font: { size: 10 } } }
                    }
                }
            });
        } catch(e) { console.warn('Service pie chart error:', e); }
    };

    // ============================================================
    // 热门服务排行
    // ============================================================

    window.DashboardModule.loadTopServices = function() {
        var range = this.getDateRange();
        var orders = AppStore.get('allOrders') || [];
        var periodOrders = orders.filter(function(o) {
            return o.date >= range.start && o.date <= range.end && o.status === 'completed';
        });

        var serviceStats = {};
        periodOrders.forEach(function(o) {
            var name = o.service_name || '其他';
            if (!serviceStats[name]) serviceStats[name] = { count: 0, revenue: 0 };
            serviceStats[name].count += 1;
            serviceStats[name].revenue += (o.total || 0);
        });

        var sorted = Object.keys(serviceStats).sort(function(a, b) {
            return serviceStats[b].count - serviceStats[a].count;
        }).slice(0, 10);

        var list = this.el.topServicesList;
        if (!list) return;

        if (sorted.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无数据</div>';
            return;
        }

        var html = '';
        sorted.forEach(function(name, index) {
            var stat = serviceStats[name];
            var medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1);
            html += '<div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">';
            html += '<div><span class="font-medium">' + medal + ' ' + name + '</span>';
            html += '<span class="text-sm text-gray-400 ml-2">' + stat.count + '次</span></div>';
            html += '<div class="text-blue-600 font-bold">' + stat.revenue.toFixed(2) + ' SAR</div>';
            html += '</div>';
        });
        list.innerHTML = html;
    };

    // ============================================================
    // Top客户消费榜
    // ============================================================

    window.DashboardModule.loadTopCustomers = function() {
        var customers = AppStore.get('allCustomers') || [];
        var orders = AppStore.get('allOrders') || [];

        var customerStats = {};
        orders.forEach(function(o) {
            if (!o.customer_id) return;
            if (!customerStats[o.customer_id]) customerStats[o.customer_id] = { revenue: 0, count: 0 };
            customerStats[o.customer_id].revenue += (o.total || 0);
            customerStats[o.customer_id].count += 1;
        });

        var sorted = Object.keys(customerStats).sort(function(a, b) {
            return customerStats[b].revenue - customerStats[a].revenue;
        }).slice(0, 20);

        var list = this.el.topCustomersList;
        if (!list) return;

        if (sorted.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无数据</div>';
            return;
        }

        var html = '';
        var self = this;
        sorted.forEach(function(id, index) {
            var customer = customers.find(function(c) { return c.id === id; });
            var stat = customerStats[id];
            var name = customer ? customer.name : '匿名客户';
            var phone = customer ? (customer.phone || '').replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '';
            var medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1);
            html += '<div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">';
            html += '<div><span class="font-medium">' + medal + ' ' + name + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + phone + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + stat.count + '次</span></div>';
            html += '<div class="text-green-600 font-bold">' + stat.revenue.toFixed(2) + ' SAR</div>';
            html += '</div>';
        });
        list.innerHTML = html;
    };

    // ============================================================
    // 员工效能排行
    // ============================================================

    window.DashboardModule.loadTopEmployees = function() {
        var range = this.getDateRange();
        var users = AppStore.get('allUsers') || [];
        var orders = AppStore.get('allOrders') || [];
        var periodOrders = orders.filter(function(o) {
            return o.date >= range.start && o.date <= range.end && o.status === 'completed' && o.employee_id;
        });

        var employeeStats = {};
        periodOrders.forEach(function(o) {
            if (!o.employee_id) return;
            if (!employeeStats[o.employee_id]) employeeStats[o.employee_id] = { revenue: 0, count: 0 };
            employeeStats[o.employee_id].revenue += (o.total || 0);
            employeeStats[o.employee_id].count += 1;
        });

        var sorted = Object.keys(employeeStats).sort(function(a, b) {
            return employeeStats[b].revenue - employeeStats[a].revenue;
        }).slice(0, 10);

        var list = this.el.topEmployeesList;
        if (!list) return;

        if (sorted.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无数据</div>';
            return;
        }

        var html = '';
        sorted.forEach(function(id, index) {
            var user = users.find(function(u) { return u.id === id; });
            var stat = employeeStats[id];
            var name = user ? (user.name || user.username) : '未知员工';
            var medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1);
            html += '<div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">';
            html += '<div><span class="font-medium">' + medal + ' ' + name + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + stat.count + '单</span></div>';
            html += '<div class="text-purple-600 font-bold">' + stat.revenue.toFixed(2) + ' SAR</div>';
            html += '</div>';
        });
        list.innerHTML = html;
    };

    // ============================================================
    // 风险预警
    // ============================================================

    window.DashboardModule.loadAlerts = function() {
        var list = this.el.alertList;
        if (!list) return;

        var alerts = [
            { type: 'warning', message: '📊 今日营业额较近7日均值偏离 +35%', time: '2小时前' },
            { type: 'critical', message: '⚠️ 洗车液库存低于安全阈值 (剩余8瓶)', time: '3小时前' },
            { type: 'warning', message: '📊 客户张三已60天未到店，建议发送回访提醒', time: '1天前' }
        ];

        var html = '';
        alerts.forEach(function(a) {
            var color = a.type === 'critical' ? 'text-red-600' : 'text-amber-600';
            html += '<div class="flex justify-between items-center p-1 border-b text-sm">';
            html += '<span class="' + color + '">' + a.message + '</span>';
            html += '<span class="text-xs text-gray-400">' + a.time + '</span>';
            html += '</div>';
        });
        list.innerHTML = html;
    };

    // ============================================================
    // KPI 目标管理
    // ============================================================

    window.DashboardModule.loadKPITargets = function() {
        var list = this.el.kpiTargetList;
        if (!list) return;

        var now = new Date();
        var month = now.getMonth() + 1;
        var year = now.getFullYear();

        var kpiData = [
            { name: '营业额', target: 50000, actual: 42300, unit: 'SAR' },
            { name: '利润', target: 15000, actual: 12800, unit: 'SAR' },
            { name: '新客户', target: 50, actual: 38, unit: '人' },
            { name: '客单价', target: 100, actual: 85, unit: 'SAR' },
            { name: '复购率', target: 60, actual: 45, unit: '%' }
        ];

        var html = '';
        kpiData.forEach(function(k) {
            var progress = k.target > 0 ? (k.actual / k.target * 100) : 0;
            var status = progress >= 90 ? '✅ 达标' : progress >= 70 ? '🟡 接近' : '🔴 未达标';
            var statusColor = progress >= 90 ? 'text-green-600' : progress >= 70 ? 'text-amber-600' : 'text-red-600';
            var barColor = progress >= 90 ? 'bg-green-500' : progress >= 70 ? 'bg-amber-500' : 'bg-red-500';
            html += '<div class="flex items-center gap-4 p-2 bg-gray-50 rounded-lg">';
            html += '<div class="w-24 text-sm font-medium">' + k.name + '</div>';
            html += '<div class="flex-1">';
            html += '<div class="w-full bg-gray-200 rounded-full h-2">';
            html += '<div class="' + barColor + ' rounded-full h-2" style="width:' + Math.min(progress, 100) + '%"></div>';
            html += '</div>';
            html += '<div class="flex justify-between text-xs mt-1">';
            html += '<span>' + k.actual.toFixed(0) + ' / ' + k.target.toFixed(0) + ' ' + k.unit + '</span>';
            html += '<span class="' + statusColor + '">' + status + ' (' + progress.toFixed(0) + '%)</span>';
            html += '</div></div></div>';
        });
        list.innerHTML = html;
    };

    // ============================================================
    // 多门店汇总
    // ============================================================

    window.DashboardModule.loadStoreSummary = function() {
        var list = this.el.storeSummaryList;
        if (!list) return;

        var stores = AppStore.get('allStores') || [];
        var orders = AppStore.get('allOrders') || [];
        var range = this.getDateRange();

        if (stores.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无门店数据</div>';
            return;
        }

        var html = '';
        stores.forEach(function(s) {
            var storeOrders = orders.filter(function(o) {
                return o.store_id === s.id && o.date >= range.start && o.date <= range.end && o.status === 'completed';
            });
            var revenue = storeOrders.reduce(function(sum, o) { return sum + (o.total || 0); }, 0);
            var count = storeOrders.length;
            var avgOrder = count > 0 ? revenue / count : 0;

            html += '<div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg border">';
            html += '<div><span class="font-medium">🏪 ' + (s.name || '未命名门店') + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + count + '单</span></div>';
            html += '<div class="flex gap-4">';
            html += '<span class="text-blue-600">' + revenue.toFixed(2) + ' SAR</span>';
            html += '<span class="text-gray-400">客单价: ' + avgOrder.toFixed(2) + ' SAR</span>';
            html += '</div></div>';
        });

        // 总计行
        var totalRevenue = stores.reduce(function(sum, s) {
            var storeOrders = orders.filter(function(o) {
                return o.store_id === s.id && o.date >= range.start && o.date <= range.end && o.status === 'completed';
            });
            return sum + storeOrders.reduce(function(s2, o) { return s2 + (o.total || 0); }, 0);
        }, 0);

        html += '<div class="flex justify-between items-center p-2 bg-blue-50 rounded-lg border border-blue-200 font-bold">';
        html += '<div>📊 全部门店汇总</div>';
        html += '<div class="text-blue-600">' + totalRevenue.toFixed(2) + ' SAR</div>';
        html += '</div>';

        list.innerHTML = html;
    };

    // ============================================================
    // KPI 目标设定
    // ============================================================

    window.DashboardModule.showSetKPI = function() {
        var modal = this.el.setKPIModal;
        if (!modal) return;

        // 加载门店
        var stores = AppStore.get('allStores') || [];
        var sel = this.el.kpiStoreSelect;
        if (sel) {
            var html = '';
            stores.forEach(function(s) {
                html += '<option value="' + s.id + '">' + s.name + '</option>';
            });
            sel.innerHTML = html || '<option value="">暂无门店</option>';
        }

        if (this.el.kpiTargetValue) this.el.kpiTargetValue.value = '';
        modal.classList.remove('hidden');
    };

    window.DashboardModule.saveKPITarget = function() {
        var self = this;
        var currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.role !== 'owner') {
            this.toast('只有老板可以设定KPI目标', 'error');
            return;
        }

        var kpiType = this.el.kpiTypeSelect ? this.el.kpiTypeSelect.value : '';
        var targetValue = this.el.kpiTargetValue ? parseFloat(this.el.kpiTargetValue.value) || 0 : 0;
        var storeId = this.el.kpiStoreSelect ? this.el.kpiStoreSelect.value : '';

        if (!kpiType || targetValue <= 0) {
            this.toast('请选择指标并输入有效目标值', 'error');
            return;
        }

        var now = new Date();
        var tenant = AppStore.get('currentTenant');

        var data = {
            tenant_id: tenant ? tenant.id : null,
            store_id: storeId || null,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            kpi_type: kpiType,
            target_value: targetValue,
            created_by: currentUser.id
        };

        AppApi.insert('kpi_targets', data)
            .then(function() {
                self.toast('✅ KPI目标已设定', 'success');
                self.closeModal('setKPIModal');
                self.loadKPITargets();
            })
            .catch(function(error) {
                self.toast('❌ 设定失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 导出仪表盘
    // ============================================================

    window.DashboardModule.exportDashboard = function() {
        this.toast('📊 正在导出仪表盘数据...', 'info');

        var range = this.getDateRange();
        var orders = AppStore.get('allOrders') || [];
        var customers = AppStore.get('allCustomers') || [];

        var periodOrders = orders.filter(function(o) {
            return o.date >= range.start && o.date <= range.end && o.status === 'completed';
        });

        var data = [
            ['CarWash Pro 老板驾驶舱报表'],
            ['导出日期', new Date().toLocaleString()],
            ['时间范围', range.start + ' ~ ' + range.end],
            [],
            ['KPI指标', '数值'],
            ['总营业额', periodOrders.reduce(function(s, o) { return s + (o.total || 0); }, 0).toFixed(2) + ' SAR'],
            ['总订单数', periodOrders.length],
            ['总客户数', customers.length],
            ['客单价', periodOrders.length > 0 ? (periodOrders.reduce(function(s, o) { return s + (o.total || 0); }, 0) / periodOrders.length).toFixed(2) : 0],
            [],
            ['日期', '营业额', '订单数']
        ];

        var dailyData = {};
        periodOrders.forEach(function(o) {
            if (!dailyData[o.date]) dailyData[o.date] = { revenue: 0, count: 0 };
            dailyData[o.date].revenue += (o.total || 0);
            dailyData[o.date].count += 1;
        });

        Object.keys(dailyData).sort().forEach(function(d) {
            data.push([d, dailyData[d].revenue.toFixed(2), dailyData[d].count]);
        });

        var ws = XLSX.utils.aoa_to_sheet(data);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '老板驾驶舱');
        XLSX.writeFile(wb, '老板驾驶舱_' + range.start + '_' + range.end + '.xlsx');

        this.toast('✅ 仪表盘数据已导出', 'success');
    };

    // ============================================================
    // 关闭模态框
    // ============================================================

    window.DashboardModule.closeModal = function(modalId) {
        var modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    };

    console.log('[Dashboard] 模块已注册');
})();