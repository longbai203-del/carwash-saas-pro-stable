/**
 * employees.js - 员工审核管理模块
 */
(function() {
    'use strict';

    // ===== 角色标签 =====
    var ROLE_LABELS = {
        owner: '老板',
        manager: '店长',
        cashier: '收银员',
        employee: '员工'
    };

    window.EmployeesModule = Object.create(ModuleBase);
    window.EmployeesModule.moduleName = 'employees';

    // ===== 缓存 DOM =====
    window.EmployeesModule.cacheDom = function() {
        this.el = {
            list: this.getEl('usersReviewList'),
            filter: this.getEl('userStatusFilter')
        };
    };

    // ===== 绑定事件 =====
    window.EmployeesModule.bindEvents = function() {
        var self = this;
        if (this.el.filter) {
            this.el.filter.addEventListener('change', function() { self.loadData(); });
        }
    };

    // ===== 加载数据 =====
    window.EmployeesModule.loadData = function() {
        var users = this.getData('allUsers') || [];
        var status = this.el.filter ? this.el.filter.value : 'all';

        var filtered = users;
        if (status !== 'all') {
            filtered = filtered.filter(function(u) { return u.status === status; });
        }
        this.render(filtered);
    };

    // ===== 渲染 =====
    window.EmployeesModule.render = function(users) {
        var list = this.el.list;
        if (!list) return;

        if (!users || users.length === 0) {
            this.setEmpty(list, '暂无用户数据');
            return;
        }

        var html = '';
        var self = this;
        users.forEach(function(u) {
            var statusClass = u.status === 'pending' ? 'status-badge-pending' : 
                             u.status === 'approved' ? 'status-badge-approved' : 
                             'status-badge-rejected';
            var statusLabel = u.status === 'pending' ? '⏳ 待审核' : 
                             u.status === 'approved' ? '✅ 已通过' : 
                             '❌ 已拒绝';
            var rowClass = u.status === 'pending' ? 'pending-user' : 
                           u.status === 'approved' ? 'approved-user' : 
                           'rejected-user';
            var roleLabel = ROLE_LABELS[u.role] || u.role;

            html += '<div class="' + rowClass + ' flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border">';
            html += '<div>';
            html += '<span class="font-bold">' + (u.name || u.username) + '</span>';
            html += '<span class="text-sm text-gray-400 ml-2">@' + u.username + '</span>';
            html += '<span class="role-badge role-' + u.role + ' ml-2">' + roleLabel + '</span>';
            html += '<span class="status-badge ' + statusClass + ' ml-2">' + statusLabel + '</span>';
            html += '<div class="text-xs text-gray-400 mt-1">注册: ' + (u.registered_at ? new Date(u.registered_at).toLocaleString() : '未知') + '</div>';
            html += '</div>';
            html += '<div class="flex gap-2 flex-wrap">';

            if (u.status === 'pending') {
                html += '<button onclick="window.EmployeesModule.approve(\'' + u.id + '\')" class="btn-success btn-sm">✅ 通过</button>';
                html += '<button onclick="window.EmployeesModule.reject(\'' + u.id + '\')" class="btn-danger btn-sm">❌ 拒绝</button>';
            } else if (u.status === 'approved') {
                html += '<button onclick="window.EmployeesModule.reject(\'' + u.id + '\')" class="btn-warning btn-sm">⛔ 停用</button>';
            } else if (u.status === 'rejected') {
                html += '<button onclick="window.EmployeesModule.approve(\'' + u.id + '\')" class="btn-success btn-sm">✅ 恢复</button>';
            }

            html += '</div></div>';
        });

        list.innerHTML = html;
    };

    // ===== 刷新 =====
    window.EmployeesModule.refresh = function() {
        var self = this;
        AppApi.getUsers().then(function(data) {
            AppStore.set('allUsers', data || []);
            self.loadData();
            self.toast('✅ 用户数据已刷新', 'success');
        }).catch(function(err) {
            self.toast('❌ 刷新失败: ' + err.message, 'error');
        });
    };

    // ===== 批准用户 =====
    window.EmployeesModule.approve = function(userId) {
        var self = this;
        var currentUser = this.getCurrentUser();

        if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'manager')) {
            this.toast('❌ 只有老板和店长可以审核', 'error');
            return;
        }

        AppApi.update('users', userId, { 
            status: 'approved', 
            approved_at: new Date().toISOString() 
        }).then(function() {
            var users = self.getData('allUsers') || [];
            var user = users.find(function(u) { return u.id === userId; });
            if (user) user.status = 'approved';
            self.setData('allUsers', users);
            self.loadData();
            self.toast('✅ 用户已审核通过', 'success');
        }).catch(function(error) {
            self.toast('❌ 操作失败: ' + error.message, 'error');
        });
    };

    // ===== 拒绝用户 =====
    window.EmployeesModule.reject = function(userId) {
        var self = this;
        var currentUser = this.getCurrentUser();

        if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'manager')) {
            this.toast('❌ 只有老板和店长可以审核', 'error');
            return;
        }

        if (!confirm('确认拒绝/停用该用户？')) return;

        AppApi.update('users', userId, { 
            status: 'rejected', 
            approved_at: new Date().toISOString() 
        }).then(function() {
            var users = self.getData('allUsers') || [];
            var user = users.find(function(u) { return u.id === userId; });
            if (user) user.status = 'rejected';
            self.setData('allUsers', users);
            self.loadData();
            self.toast('✅ 用户已拒绝/停用', 'success');
        }).catch(function(error) {
            self.toast('❌ 操作失败: ' + error.message, 'error');
        });
    };

    console.log('[Employees] 模块已注册');
})();