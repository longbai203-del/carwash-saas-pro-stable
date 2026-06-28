/**
 * reports.js - 财务管理模块
 */
window.ReportsModule = {
    initialized: false,
    moduleName: 'reports',

    init: function() {
        if (this.initialized) return;
        console.log('[Reports] 初始化...');
        var self = this;
        setTimeout(function() {
            self.cacheDom();
            self.bindEvents();
            self.loadData();
            self.initialized = true;
            console.log('[Reports] 初始化完成');
        }, 50);
    },

    destroy: function() {
        console.log('[Reports] 销毁...');
        this.initialized = false;
    },

    cacheDom: function() {
        this.el = {
            orders: document.getElementById('dailyOrders'),
            revenue: document.getElementById('dailyRevenue'),
            vat: document.getElementById('dailyVat'),
            profit: document.getElementById('dailyProfit'),
            table: document.getElementById('reportTableBody'),
            picker: document.getElementById('reportDatePicker')
        };
    },

    bindEvents: function() {
        var self = this;
        if (this.el.picker) {
            this.el.picker.addEventListener('change', function() { self.loadData(); });
        }
    },

    loadData: function() {
        var date = this.el.picker ? this.el.picker.value || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        var orders = AppStore.get('allOrders') || [];
        var filtered = orders.filter(function(o) { return o.date === date; });
        var total = filtered.reduce(function(s, o) { return s + (o.total || 0); }, 0);
        var vat = filtered.reduce(function(s, o) { return s + (o.vat || 0); }, 0);

        if (this.el.orders) this.el.orders.textContent = filtered.length;
        if (this.el.revenue) this.el.revenue.textContent = total.toFixed(2) + ' SAR';
        if (this.el.vat) this.el.vat.textContent = vat.toFixed(2) + ' SAR';
        if (this.el.profit) this.el.profit.textContent = total.toFixed(2) + ' SAR';

        this.render(filtered);
    },

    render: function(orders) {
        if (!this.el.table) return;
        if (!orders || orders.length === 0) {
            this.el.table.innerHTML = '<div class="text-center text-gray-400 py-4">暂无数据</div>';
            return;
        }

        var html = '';
        orders.slice(0, 30).forEach(function(o) {
            html += '<div class="flex justify-between p-1 border-b text-sm">';
            html += '<span>' + (o.date || '') + '</span>';
            html += '<span>' + (o.plate_number || 'N/A') + '</span>';
            html += '<span>' + (o.total || 0).toFixed(2) + ' SAR</span>';
            html += '</div>';
        });
        this.el.table.innerHTML = html;
    }
};

console.log('[Reports] 模块已注册');