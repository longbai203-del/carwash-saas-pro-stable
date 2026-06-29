/**
 * audit.js - 审计日志模块
 */
(function() {
    'use strict';

    window.AuditModule = Object.create(ModuleBase);
    window.AuditModule.moduleName = 'audit';

    // ===== 缓存 DOM =====
    window.AuditModule.cacheDom = function() {
        this.el = {
            list: this.getEl('auditLogList'),
            count: this.getEl('auditCount'),
            actionFilter: this.getEl('auditActionFilter'),
            tableFilter: this.getEl('auditTableFilter')
        };
    };

    // ===== 绑定事件 =====
    window.AuditModule.bindEvents = function() {
        var self = this;
        if (this.el.actionFilter) {
            this.el.actionFilter.addEventListener('change', function() { self.loadData(); });
        }
        if (this.el.tableFilter) {
            this.el.tableFilter.addEventListener('change', function() { self.loadData(); });
        }
    };

    // ===== 加载数据 =====
    window.AuditModule.loadData = function() {
        var logs = this.getData('allAuditLogs') || [];
        var action = this.el.actionFilter ? this.el.actionFilter.value : 'all';
        var table = this.el.tableFilter ? this.el.tableFilter.value : 'all';

        var filtered = logs;

        if (action !== 'all') {
            filtered = filtered.filter(function(l) { return l.action === action; });
        }
        if (table !== 'all') {
            filtered = filtered.filter(function(l) { return l.table_name === table; });
        }

        this.render(filtered);
    };

    // ===== 渲染 =====
    window.AuditModule.render = function(logs) {
        var list = this.el.list;
        if (!list) return;

        if (!logs || logs.length === 0) {
            this.setEmpty(list, '暂无审计日志');
            if (this.el.count) this.el.count.textContent = '0';
            return;
        }

        var actions = { 
            INSERT: '🟢 新增', 
            UPDATE: '🟡 修改', 
            DELETE: '🔴 删除' 
        };

        var html = '';
        logs.slice(0, 50).forEach(function(log) {
            html += '<div class="flex justify-between items-center p-2 border-b hover:bg-gray-50">';
            html += '<div>';
            html += '<span class="font-medium">' + (actions[log.action] || log.action) + '</span>';
            html += '<span class="text-gray-600 ml-2">' + (log.table_name || '') + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + (log.username || '系统') + '</span>';
            html += '</div>';
            html += '<div class="text-right">';
            html += '<span class="text-xs text-gray-400">' + (log.created_at ? new Date(log.created_at).toLocaleString() : '') + '</span>';
            html += '</div>';
            html += '</div>';
        });

        list.innerHTML = html;
        if (this.el.count) this.el.count.textContent = logs.length;
    };

    // ===== 刷新 =====
    window.AuditModule.refresh = function() {
        var self = this;
        AppApi.getAuditLogs().then(function(data) {
            AppStore.set('allAuditLogs', data || []);
            self.loadData();
            self.toast('✅ 审计日志已刷新', 'success');
        }).catch(function(err) {
            self.toast('❌ 刷新失败: ' + err.message, 'error');
        });
    };

    // ===== 导出 =====
    window.AuditModule.exportLogs = function() {
        var logs = this.getData('allAuditLogs') || [];
        if (logs.length === 0) {
            this.toast('暂无数据可导出', 'error');
            return;
        }

        var actions = { INSERT: '新增', UPDATE: '修改', DELETE: '删除' };
        var data = [['时间', '操作', '表名', '用户', '数据']];

        logs.forEach(function(log) {
            data.push([
                log.created_at ? new Date(log.created_at).toLocaleString() : '',
                actions[log.action] || log.action,
                log.table_name || '',
                log.username || '系统',
                log.data ? JSON.stringify(log.data).substring(0, 100) : ''
            ]);
        });

        try {
            var ws = XLSX.utils.aoa_to_sheet(data);
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, '审计日志');
            XLSX.writeFile(wb, '审计日志_' + new Date().toISOString().split('T')[0] + '.xlsx');
            this.toast('✅ 审计日志已导出', 'success');
        } catch(e) {
            this.toast('❌ 导出失败: ' + e.message, 'error');
        }
    };

    console.log('[Audit] 模块已注册');
})();