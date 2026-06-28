/**
 * audit.js - 审计日志模块
 */
(function() {
    'use strict';

    window.AuditModule = Object.create(ModuleBase);
    window.AuditModule.moduleName = 'audit';

    window.AuditModule.cacheDom = function() {
        this.el = {
            list: this.getEl('auditLogList'),
            count: this.getEl('auditCount'),
            actionFilter: this.getEl('auditActionFilter'),
            tableFilter: this.getEl('auditTableFilter')
        };
    };

    window.AuditModule.bindEvents = function() {
        var self = this;
        if (this.el.actionFilter) {
            this.el.actionFilter.addEventListener('change', function() { self.loadData(); });
        }
        if (this.el.tableFilter) {
            this.el.tableFilter.addEventListener('change', function() { self.loadData(); });
        }
    };

    window.AuditModule.loadData = function() {
        var logs = this.getData('allAuditLogs');
        var action = this.el.actionFilter ? this.el.actionFilter.value : 'all';
        var table = this.el.tableFilter ? this.el.tableFilter.value : 'all';

        if (action !== 'all') {
            logs = logs.filter(function(l) { return l.action === action; });
        }
        if (table !== 'all') {
            logs = logs.filter(function(l) { return l.table_name === table; });
        }
        this.render(logs);
    };

    window.AuditModule.render = function(logs) {
        var list = this.el.list;
        if (!list) return;
        if (!logs || logs.length === 0) {
            this.setEmpty(list);
            if (this.el.count) this.el.count.textContent = '0';
            return;
        }

        var actions = { INSERT: '🟢 新增', UPDATE: '🟡 修改', DELETE: '🔴 删除' };
        var html = '';
        logs.slice(0, 50).forEach(function(log) {
            html += '<div class="flex justify-between p-2 border-b hover:bg-gray-50">';
            html += '<div><span class="font-medium">' + (actions[log.action] || log.action) + '</span>';
            html += '<span class="text-gray-600 ml-2">' + log.table_name + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + (log.username || '系统') + '</span></div>';
            html += '<div class="text-right"><span class="text-xs text-gray-400">' + (log.created_at ? new Date(log.created_at).toLocaleString() : '') + '</span></div>';
            html += '</div>';
        });
        list.innerHTML = html;
        if (this.el.count) this.el.count.textContent = logs.length;
    };

    console.log('[Audit] 模块已注册');
})();