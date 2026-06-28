/**
 * orders.js - 订单管理模块
 */
window.OrdersModule = {
    initialized: false,
    moduleName: 'orders',

    init: function() {
        if (this.initialized) return;
        console.log('[Orders] 初始化...');
        var self = this;
        setTimeout(function() {
            self.cacheDom();
            self.bindEvents();
            self.loadData();
            self.initialized = true;
            console.log('[Orders] 初始化完成');
        }, 50);
    },

    destroy: function() {
        console.log('[Orders] 销毁...');
        this.initialized = false;
    },

    cacheDom: function() {
        this.el = {
            list: document.getElementById('ordersList'),
            statusFilter: document.getElementById('orderStatusFilter'),
            dateFilter: document.getElementById('orderDateFilter'),
            search: document.getElementById('orderSearch')
        };
    },

    bindEvents: function() {
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
    },

    loadData: function() {
        var orders = AppStore.get('allOrders') || [];
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
    },

    render: function(orders) {
        if (!this.el.list) return;
        if (!orders || orders.length === 0) {
            this.el.list.innerHTML = '<div class="text-center text-gray-400 py-8">暂无订单</div>';
            return;
        }

        var html = '';
        orders.slice(0, 50).forEach(function(o) {
            var statusLabel = ORDER_STATUS_LABELS ? ORDER_STATUS_LABELS[o.status] || o.status : o.status;
            var statusClass = ORDER_STATUS_CLASSES ? ORDER_STATUS_CLASSES[o.status] || 'status-pending' : 'status-pending';
            html += '<div class="bg-white p-4 rounded-xl shadow-sm border hover:border-blue-300 cursor-pointer" onclick="window.OrdersModule.showDetail(\'' + o.id + '\')">';
            html += '<div class="flex justify-between items-center">';
            html += '<div><span class="font-bold text-blue-600">#' + (o.order_number || o.id.slice(0, 8)) + '</span>';
            html += '<span class="text-sm text-gray-400 ml-2">' + (o.date || '') + '</span>';
            html += '<span class="status-badge ' + statusClass + '">' + statusLabel + '</span></div>';
            html += '<div class="text-right"><div class="font-bold text-lg">' + (o.total || 0).toFixed(2) + ' SAR</div>';
            html += '<div class="text-sm text-gray-400">' + (o.plate_number || 'N/A') + '</div></div></div></div>';
        });
        this.el.list.innerHTML = html;
    },

    showDetail: function(orderId) {
        var orders = AppStore.get('allOrders') || [];
        var order = orders.find(function(o) { return o.id === orderId; });
        if (!order) {
            AppUtils.toast('订单不存在', 'error');
            return;
        }
        AppUtils.toast('📋 订单 #' + (order.order_number || order.id.slice(0, 8)) + ' | ' + (order.total || 0) + ' SAR', 'info');
    }
};

console.log('[Orders] 模块已注册');