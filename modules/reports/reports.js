/**
 * reports.js - 财务管理模块
 */
(function() {
    'use strict';

    window.ReportsModule = Object.create(ModuleBase);
    window.ReportsModule.moduleName = 'reports';

    window.ReportsModule.cacheDom = function() {
        this.el = {
            orders: this.getEl('dailyOrders'),
            revenue: this.getEl('dailyRevenue'),
            vat: this.getEl('dailyVat'),
            profit: this.getEl('dailyProfit'),
            table: this.getEl('reportTableBody'),
            picker: this.getEl('reportDatePicker')
        };
    };

    window.ReportsModule.bindEvents = function() {
        var self = this;
        if (this.el.picker) {
            this.el.picker.addEventListener('change', function() { self.loadData(); });
        }
    };

    window.ReportsModule.loadData = function() {
        var date = this.el.picker ? this.el.picker.value || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        var orders = this.getData('allOrders');
        var filtered = orders.filter(function(o) { return o.date === date; });
        var total = filtered.reduce(function(s, o) { return s + (o.total || 0); }, 0);
        var vat = filtered.reduce(function(s, o) { return s + (o.vat || 0); }, 0);

        if (this.el.orders) this.el.orders.textContent = filtered.length;
        if (this.el.revenue) this.el.revenue.textContent = total.toFixed(2) + ' SAR';
        if (this.el.vat) this.el.vat.textContent = vat.toFixed(2) + ' SAR';
        if (this.el.profit) this.el.profit.textContent = total.toFixed(2) + ' SAR';

        this.render(filtered);
    };

    window.ReportsModule.render = function(orders) {
        var table = this.el.table;
        if (!table) return;
        if (!orders || orders.length === 0) {
            this.setEmpty(table);
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
        table.innerHTML = html;
    };

    console.log('[Reports] 模块已注册');
})();