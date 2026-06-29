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

    // ===== 缓存 DOM =====
    window.OrdersModule.cacheDom = function() {
        this.el = {
            list: this.getEl('ordersList'),
            statusFilter: this.getEl('orderStatusFilter'),
            dateFilter: this.getEl('orderDateFilter'),
            search: this.getEl('orderSearch'),
            totalCount: this.getEl('orderTotalCount'),
            todayCount: this.getEl('orderTodayCount'),
            pendingCount: this.getEl('orderPendingCount'),
            completedCount: this.getEl('orderCompletedCount'),
            cancelledCount: this.getEl('orderCancelledCount')
        };
    };

    // ===== 绑定事件 =====
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

    // ===== 加载数据 =====
    window.OrdersModule.loadData = function() {
        var orders = this.getData('allOrders');
        var status = this.el.statusFilter ? this.el.statusFilter.value : 'all';
        var date = this.el.dateFilter ? this.el.dateFilter.value : '';
        var search = this.el.search ? this.el.search.value.trim() : '';

        var filtered = orders || [];

        if (status !== 'all') {
            filtered = filtered.filter(function(o) { return o.status === status; });
        }
        if (date) {
            filtered = filtered.filter(function(o) { return o.date === date; });
        }
        if (search) {
            var s = search.toLowerCase();
            filtered = filtered.filter(function(o) {
                return (o.plate_number || '').toLowerCase().includes(s) ||
                       (o.order_number || '').toLowerCase().includes(s) ||
                       (o.staff_name || '').toLowerCase().includes(s) ||
                       (o.id || '').toLowerCase().includes(s);
            });
        }

        this.render(filtered);
        this.updateStats(filtered);
    };

    // ===== 更新统计 =====
    window.OrdersModule.updateStats = function(orders) {
        var total = orders.length;
        var today = new Date().toISOString().split('T')[0];
        var todayOrders = orders.filter(function(o) { return o.date === today; });
        var pending = orders.filter(function(o) { return o.status === 'pending' || o.status === 'confirmed'; });
        var completed = orders.filter(function(o) { return o.status === 'completed'; });
        var cancelled = orders.filter(function(o) { return o.status === 'cancelled'; });

        if (this.el.totalCount) this.el.totalCount.textContent = total;
        if (this.el.todayCount) this.el.todayCount.textContent = todayOrders.length;
        if (this.el.pendingCount) this.el.pendingCount.textContent = pending.length;
        if (this.el.completedCount) this.el.completedCount.textContent = completed.length;
        if (this.el.cancelledCount) this.el.cancelledCount.textContent = cancelled.length;
    };

    // ===== 渲染 =====
    window.OrdersModule.render = function(orders) {
        var list = this.el.list;
        if (!list) return;

        if (!orders || orders.length === 0) {
            this.setEmpty(list, '暂无订单数据');
            return;
        }

        var html = '';
        var self = this;
        orders.slice(0, 50).forEach(function(o) {
            var statusLabel = ORDER_STATUS_LABELS[o.status] || o.status;
            var statusClass = ORDER_STATUS_CLASSES[o.status] || 'status-pending';
            var total = parseFloat(o.total) || 0;

            html += '<div class="bg-white p-4 rounded-xl shadow-sm border hover:border-blue-300 cursor-pointer transition" onclick="OrdersModule.showDetail(\'' + o.id + '\')">';
            html += '<div class="flex justify-between items-center flex-wrap gap-2">';
            html += '<div class="flex items-center gap-2 flex-wrap">';
            html += '<span class="font-bold text-blue-600">#' + (o.order_number || o.id.slice(0, 8)) + '</span>';
            html += '<span class="text-sm text-gray-400">' + (o.date || '') + '</span>';
            html += '<span class="status-badge ' + statusClass + '">' + statusLabel + '</span>';
            if (o.plate_number) {
                html += '<span class="text-sm font-medium text-gray-600">🚗 ' + o.plate_number + '</span>';
            }
            html += '</div>';
            html += '<div class="text-right">';
            html += '<div class="font-bold text-lg text-blue-600">' + total.toFixed(2) + ' SAR</div>';
            html += '<div class="text-xs text-gray-400">' + (o.staff_name || '') + '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });

        list.innerHTML = html;
    };

    // ===== 刷新 =====
    window.OrdersModule.refresh = function() {
        var self = this;
        AppApi.getOrders().then(function(data) {
            AppStore.set('allOrders', data || []);
            self.loadData();
            self.toast('✅ 订单数据已刷新', 'success');
        }).catch(function(err) {
            self.toast('❌ 刷新失败: ' + err.message, 'error');
        });
    };

    // ===== 导出 =====
    window.OrdersModule.exportOrders = function() {
        var orders = this.getData('allOrders') || [];
        if (orders.length === 0) {
            this.toast('暂无数据可导出', 'error');
            return;
        }

        var data = [['订单号', '日期', '车牌', '员工', '服务', '金额', '增值税', '总计', '状态']];
        orders.forEach(function(o) {
            data.push([
                o.order_number || o.id.slice(0, 8),
                o.date || '',
                o.plate_number || '',
                o.staff_name || '',
                o.service_name || '',
                (parseFloat(o.amount) || 0).toFixed(2),
                (parseFloat(o.vat) || 0).toFixed(2),
                (parseFloat(o.total) || 0).toFixed(2),
                ORDER_STATUS_LABELS[o.status] || o.status
            ]);
        });

        try {
            var ws = XLSX.utils.aoa_to_sheet(data);
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, '订单数据');
            XLSX.writeFile(wb, '订单数据_' + new Date().toISOString().split('T')[0] + '.xlsx');
            this.toast('✅ 订单数据已导出', 'success');
        } catch(e) {
            this.toast('❌ 导出失败: ' + e.message, 'error');
        }
    };

    // ===== 查看详情 =====
    window.OrdersModule.showDetail = function(orderId) {
        var orders = this.getData('allOrders') || [];
        var order = orders.find(function(o) { return o.id === orderId; });
        if (!order) {
            this.toast('订单不存在', 'error');
            return;
        }

        var msg = '📋 订单详情\n';
        msg += '订单号: ' + (order.order_number || order.id.slice(0, 8)) + '\n';
        msg += '日期: ' + (order.date || '') + '\n';
        msg += '车牌: ' + (order.plate_number || 'N/A') + '\n';
        msg += '服务: ' + (order.service_name || '') + '\n';
        msg += '员工: ' + (order.staff_name || '') + '\n';
        msg += '金额: ' + (parseFloat(order.amount) || 0).toFixed(2) + ' SAR\n';
        msg += '增值税: ' + (parseFloat(order.vat) || 0).toFixed(2) + ' SAR\n';
        msg += '总计: ' + (parseFloat(order.total) || 0).toFixed(2) + ' SAR\n';
        msg += '状态: ' + (ORDER_STATUS_LABELS[order.status] || order.status);

        this.toast(msg, 'info');
    };

    console.log('[Orders] 模块已注册');
})();