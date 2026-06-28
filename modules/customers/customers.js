/**
 * customers.js - 客户管理模块
 */
window.CustomersModule = {
    initialized: false,
    moduleName: 'customers',

    init: function() {
        if (this.initialized) return;
        console.log('[Customers] 初始化...');
        var self = this;
        setTimeout(function() {
            self.cacheDom();
            self.bindEvents();
            self.loadData();
            self.initialized = true;
            console.log('[Customers] 初始化完成');
        }, 50);
    },

    destroy: function() {
        console.log('[Customers] 销毁...');
        this.initialized = false;
    },

    cacheDom: function() {
        this.el = {
            list: document.getElementById('membersList'),
            search: document.getElementById('customerSearch'),
            levelFilter: document.getElementById('customerLevelFilter')
        };
    },

    bindEvents: function() {
        var self = this;
        if (this.el.search) {
            this.el.search.addEventListener('input', function() { self.loadData(); });
        }
        if (this.el.levelFilter) {
            this.el.levelFilter.addEventListener('change', function() { self.loadData(); });
        }
    },

    loadData: function() {
        var customers = AppStore.get('allCustomers') || [];
        var search = this.el.search ? this.el.search.value.trim() : '';
        var level = this.el.levelFilter ? this.el.levelFilter.value : 'all';

        if (search) {
            customers = customers.filter(function(c) {
                return (c.name || '').includes(search) ||
                       (c.phone || '').includes(search) ||
                       (c.plate_number || '').includes(search);
            });
        }
        if (level !== 'all') {
            customers = customers.filter(function(c) { return c.level === level; });
        }
        this.render(customers);
    },

    render: function(customers) {
        if (!this.el.list) return;
        if (!customers || customers.length === 0) {
            this.el.list.innerHTML = '<div class="text-center text-gray-400 py-8">暂无客户</div>';
            return;
        }

        var html = '';
        customers.forEach(function(c) {
            var levelClass = 'customer-level customer-level-' + (c.level || 'normal').toLowerCase();
            html += '<div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl">';
            html += '<div><strong>' + (c.name || 'Unknown') + '</strong>';
            html += '<span class="' + levelClass + '">' + (c.level || '普通') + '</span>';
            html += '<br><small>' + (c.phone || '') + ' | ' + (c.plate_number || '') + '</small></div>';
            html += '<div class="text-right">';
            html += '<div>余额: <span class="font-bold text-green-600">' + (c.balance || 0).toFixed(2) + ' SAR</span></div>';
            html += '<div class="text-sm">积分: ' + (c.points || 0) + ' | 到店: ' + (c.visit_count || 0) + '次</div>';
            html += '</div></div>';
        });
        this.el.list.innerHTML = html;
    }
};

console.log('[Customers] 模块已注册');