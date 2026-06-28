/**
 * orders.js - 订单管理模块
 */
(function() {
    'use strict';

    // ===== 订单状态常量 =====
    var ORDER_STATUS_LABELS = {
        pending: '待确认',
        confirmed: '已确认',
        in_progress: '施工中',
        completed: '已完成',
        cancelled: '已取消',
        refunded: '已退款'
    };

    var ORDER_STATUS_CLASSES = {
        pending: 'status-pending',
        confirmed: 'status-confirmed',
        in_progress: 'status-in_progress',
        completed: 'status-completed',
        cancelled: 'status-cancelled',
        refunded: 'status-refunded'
    };

    window.OrdersModule = Object.create(ModuleBase);
    window.OrdersModule.moduleName = 'orders';

    window.OrdersModule.cacheDom = function() {
        this.el = {
            list: this.getEl('ordersList'),
            statusFilter: this.getEl('orderStatusFilter'),
            dateFilter: this.getEl('orderDateFilter'),
            search: this.getEl('orderSearch')
        };
    };

    window.OrdersModule.bindEvents = function() {
        var self = this;
        if (this.el.statusFilter) {
            this.el.statusFilter.addEventListener('change', function() { self.loadData(); });
        }
        if (this.el.dateFilter) {
            this.el.dateFilter.addEventListener('change', function() { self.loadData(); });
        }
        if (this.el.search) {
            this.el.search.addEventListener('input', function() { self.loadData(); });
        }
    };

    window.OrdersModule.loadData = function() {
        var orders = this.getData('allOrders');
        var status = this.el.statusFilter ? this.el.statusFilter.value : 'all';
        var date = this.el.dateFilter ? this.el.dateFilter.value : '';
        var search = this.el.search ? this.el.search.value.trim() : '';

        var filtered = orders;
        if (status !== 'all') {
            filtered = filtered.filter(function(o) { return o.status === status; });
        }
        if (date) {
            filtered = filtered.filter(function(o) { return o.date === date; });
        }
        if (search) {
            filtered = filtered.filter(function(o) {
                return (o.plate_number || '').includes(search) ||
                       (o.order_number || '').includes(search) ||
                       (o.staff_name || '').includes(search);
            });
        }
        this.render(filtered);
    };

    window.OrdersModule.render = function(orders) {
        var list = this.el.list;
        if (!list) return;
        if (!orders || orders.length === 0) {
            this.setEmpty(list);
            return;
        }

        var html = '';
        orders.slice(0, 50).forEach(function(o) {
            var statusLabel = ORDER_STATUS_LABELS[o.status] || o.status;
            var statusClass = ORDER_STATUS_CLASSES[o.status] || 'status-pending';
            html += '<div class="bg-white p-4 rounded-xl shadow-sm border hover:border-blue-300 cursor-pointer" onclick="window.OrdersModule.showDetail(\'' + o.id + '\')">';
            html += '<div class="flex justify-between items-center">';
            html += '<div><span class="font-bold text-blue-600">#' + (o.order_number || o.id.slice(0, 8)) + '</span>';
            html += '<span class="text-sm text-gray-400 ml-2">' + (o.date || '') + '</span>';
            html += '<span class="status-badge ' + statusClass + '">' + statusLabel + '</span></div>';
            html += '<div class="text-right"><div class="font-bold text-lg">' + (o.total || 0).toFixed(2) + ' SAR</div>';
            html += '<div class="text-sm text-gray-400">' + (o.plate_number || 'N/A') + '</div></div></div></div>';
        });
        list.innerHTML = html;
    };

    window.OrdersModule.showDetail = function(orderId) {
        var orders = this.getData('allOrders');
        var order = orders.find(function(o) { return o.id === orderId; });
        if (!order) {
            this.toast('订单不存在', 'error');
            return;
        }
        this.toast('📋 订单 #' + (order.order_number || order.id.slice(0, 8)) + ' | ' + (order.total || 0) + ' SAR', 'info');
    };

    console.log('[Orders] 模块已注册');
})();