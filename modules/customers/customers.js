/**
 * customers.js - 客户管理模块
 */
(function() {
    'use strict';

    window.CustomersModule = Object.create(ModuleBase);
    window.CustomersModule.moduleName = 'customers';

    window.CustomersModule.cacheDom = function() {
        this.el = {
            list: this.getEl('membersList'),
            search: this.getEl('customerSearch'),
            levelFilter: this.getEl('customerLevelFilter'),
            phone: this.getEl('memberPhone'),
            name: this.getEl('memberName'),
            plate: this.getEl('memberPlate'),
            amount: this.getEl('rechargeAmount'),
            addBtn: document.querySelector('[onclick="addCustomer()"]')
        };
    };

    window.CustomersModule.bindEvents = function() {
        var self = this;
        if (this.el.search) {
            this.el.search.addEventListener('input', function() { self.loadData(); });
        }
        if (this.el.levelFilter) {
            this.el.levelFilter.addEventListener('change', function() { self.loadData(); });
        }
        if (this.el.addBtn) {
            this.el.addBtn.addEventListener('click', function() { self.addCustomer(); });
        }
    };

    window.CustomersModule.loadData = function() {
        var customers = this.getData('allCustomers');
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
    };

    window.CustomersModule.render = function(customers) {
        var list = this.el.list;
        if (!list) return;
        if (!customers || customers.length === 0) {
            this.setEmpty(list);
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
        list.innerHTML = html;
    };

    window.CustomersModule.addCustomer = function() {
        var self = this;
        var currentUser = this.getCurrentUser();
        if (!currentUser.id) {
            this.toast('请先登录', 'error');
            return;
        }

        var phone = this.el.phone ? this.el.phone.value.trim() : '';
        var name = this.el.name ? this.el.name.value.trim() : '';
        var plate = this.el.plate ? this.el.plate.value.trim().toUpperCase() : '';
        var amount = this.el.amount ? parseFloat(this.el.amount.value) || 0 : 0;

        if (!phone || !name || !plate) {
            this.toast('请填写完整信息', 'error');
            return;
        }

        var customers = this.getData('allCustomers');
        var existing = customers.find(function(c) {
            return c.phone === phone || c.plate_number === plate;
        });

        if (existing) {
            var newBalance = (existing.balance || 0) + amount;
            AppApi.update('customers', existing.id, {
                balance: newBalance,
                name: name,
                total_spent: (existing.total_spent || 0) + amount
            }).then(function() {
                existing.balance = newBalance;
                existing.name = name;
                existing.total_spent = (existing.total_spent || 0) + amount;
                self.setData('allCustomers', customers);
                self.loadData();
                self.toast('✅ 客户已充值 ' + amount + ' SAR', 'success');
                if (self.el.phone) self.el.phone.value = '';
                if (self.el.name) self.el.name.value = '';
                if (self.el.plate) self.el.plate.value = '';
                if (self.el.amount) self.el.amount.value = '';
            }).catch(function(error) {
                self.toast('❌ 操作失败: ' + error.message, 'error');
            });
        } else {
            AppApi.insert('customers', [{
                phone: phone,
                name: name,
                plate_number: plate,
                balance: amount,
                points: 0,
                level: '普通',
                total_spent: amount,
                visit_count: 1,
                last_visit: new Date().toISOString().split('T')[0]
            }]).then(function(data) {
                if (data && data.length > 0) {
                    customers.unshift(data[0]);
                    self.setData('allCustomers', customers);
                    self.loadData();
                    self.toast('✅ 客户已添加', 'success');
                    if (self.el.phone) self.el.phone.value = '';
                    if (self.el.name) self.el.name.value = '';
                    if (self.el.plate) self.el.plate.value = '';
                    if (self.el.amount) self.el.amount.value = '';
                }
            }).catch(function(error) {
                self.toast('❌ 操作失败: ' + error.message, 'error');
            });
        }
    };

    console.log('[Customers] 模块已注册');
})();