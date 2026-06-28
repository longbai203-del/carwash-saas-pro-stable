/**
 * dashboard.js - 仪表板模块
 */
window.DashboardModule = {
    initialized: false,
    moduleName: 'dashboard',
    charts: [],

    init() {
        if (this.initialized) return;
        console.log('[Dashboard] 初始化...');
        this.cacheDom();
        this.bindEvents();
        this.loadData();
        this.initialized = true;
        console.log('[Dashboard] 初始化完成');
    },

    destroy() {
        console.log('[Dashboard] 销毁...');
        this.charts.forEach(c => { if (c && c.destroy) c.destroy(); });
        this.charts = [];
        this.initialized = false;
    },

    cacheDom() {
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
    },

    bindEvents() {
        // 无需额外事件
    },

    async loadData() {
        try {
            const orders = AppStore.get('allOrders') || [];
            const customers = AppStore.get('allCustomers') || [];
            const inventory = AppStore.get('allInventory') || [];
            const users = AppStore.get('allUsers') || [];

            this.render(orders, customers, inventory, users);
            this.initCharts(orders);
        } catch (error) {
            console.error('[Dashboard] 加载失败:', error);
        }
    },

    render(orders, customers, inventory, users) {
        const total = orders.reduce((s, o) => s + (o.total || 0), 0);
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => o.date === today);
        const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);

        if (this.el.todayRevenue) this.el.todayRevenue.textContent = todayRevenue.toFixed(2) + ' SAR';
        if (this.el.todayOrders) this.el.todayOrders.textContent = todayOrders.length;
        if (this.el.customers) this.el.customers.textContent = customers.length;
        if (this.el.totalSales) this.el.totalSales.textContent = total.toFixed(2) + ' SAR';
        if (this.el.employees) this.el.employees.textContent = users.filter(u => u.role !== 'owner' && u.status === 'approved').length;

        // KPI
        const lowStock = inventory.filter(i => (i.quantity || 0) <= (i.min_qty || 5)).length;
        const avgOrder = orders.length > 0 ? total / orders.length : 0;
        const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'in_progress').length;

        if (this.el.kpiTodayOrders) this.el.kpiTodayOrders.textContent = todayOrders.length;
        if (this.el.kpiTodayRevenue) this.el.kpiTodayRevenue.textContent = todayRevenue.toFixed(2) + ' SAR';
        if (this.el.kpiTotalRevenue) this.el.kpiTotalRevenue.textContent = total.toFixed(2) + ' SAR';
        if (this.el.kpiLowStock) this.el.kpiLowStock.textContent = lowStock;
        if (this.el.kpiPendingOrders) this.el.kpiPendingOrders.textContent = pendingOrders;
        if (this.el.kpiAvgOrder) this.el.kpiAvgOrder.textContent = avgOrder.toFixed(2) + ' SAR';

        // 最佳员工
        const staffStats = {};
        orders.forEach(o => {
            const name = o.staff_name || '未知';
            staffStats[name] = (staffStats[name] || 0) + (o.total || 0);
        });
        const topStaff = Object.entries(staffStats).sort((a, b) => b[1] - a[1])[0];
        if (this.el.kpiTopStaff) this.el.kpiTopStaff.textContent = topStaff ? topStaff[0] + ' (' + topStaff[1].toFixed(0) + ' SAR)' : '-';

        // 热门服务
        const serviceStats = {};
        orders.forEach(o => {
            const name = o.service_name || '基础';
            serviceStats[name] = (serviceStats[name] || 0) + 1;
        });
        const topService = Object.entries(serviceStats).sort((a, b) => b[1] - a[1])[0];
        if (this.el.kpiTopService) this.el.kpiTopService.textContent = topService ? topService[0] + ' (' + topService[1] + '单)' : '-';

        // 库存预警
        const lowItems = inventory.filter(i => (i.quantity || 0) <= (i.min_qty || 5));
        if (this.el.alertBar && this.el.alertText) {
            if (lowItems.length > 0) {
                this.el.alertBar.classList.remove('hidden');
                this.el.alertText.textContent = '⚠️ ' + lowItems.map(i => i.name + '(' + i.quantity + '/' + i.min_qty + ')').join('、');
            } else {
                this.el.alertBar.classList.add('hidden');
            }
        }

        // 今日订单预览
        if (this.el.preview) {
            this.el.preview.innerHTML = todayOrders.slice(0, 10).map(o => `
                <div class="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span>${o.plate_number || 'N/A'}</span>
                    <span class="status-badge ${ORDER_STATUS_CLASSES?.[o.status] || 'status-pending'}">${ORDER_STATUS_LABELS?.[o.status] || o.status}</span>
                    <span>${(o.total || 0).toFixed(2)} SAR</span>
                </div>
            `).join('') || '<div class="text-gray-400 text-center">今日暂无订单</div>';
        }

        // 热门服务
        if (this.el.topServices) {
            this.el.topServices.innerHTML = Object.entries(serviceStats).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) =>
                `<div class="flex justify-between"><span>${name}</span><span>${count} 单</span></div>`
            ).join('') || '<div class="text-gray-400 text-center">暂无数据</div>';
        }
    },

    initCharts(orders) {
        const ctx1 = document.getElementById('serviceStatsChart');
        if (ctx1) {
            if (this.charts[0]) { this.charts[0].destroy(); }
            const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            const counts = days.map(() => Math.floor(Math.random() * 10) + 1);
            this.charts[0] = new Chart(ctx1, {
                type: 'bar',
                data: { labels: days, datasets: [{ label: '订单数', data: counts, backgroundColor: '#0091D5', borderRadius: 6 }] },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        }
        const ctx2 = document.getElementById('monthlyRevenueChart');
        if (ctx2) {
            if (this.charts[1]) { this.charts[1].destroy(); }
            const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
            const revenues = months.map(() => Math.floor(Math.random() * 5000) + 1000);
            this.charts[1] = new Chart(ctx2, {
                type: 'line',
                data: { labels: months, datasets: [{ label: '收入', data: revenues, borderColor: '#0091D5', fill: true, tension: 0.3 }] },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        }
    }
};
