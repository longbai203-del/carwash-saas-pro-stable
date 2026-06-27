// ================================================================
//  audit.js - 审计日志模块
// ================================================================

const AuditModule = {
    // 初始化
    init() {
        console.log('📋 AuditModule 初始化');
        if (!document.getElementById('auditLogList')) {
            console.warn('⚠️ 审计日志元素未加载，延迟初始化');
            setTimeout(() => this.init(), 300);
            return;
        }
        this.loadAuditLog();
        this.bindEvents();
    },

    // 销毁
    destroy() {
        console.log('📋 AuditModule 销毁');
        const actionFilter = document.getElementById('auditActionFilter');
        if (actionFilter && this._boundAction) {
            actionFilter.removeEventListener('change', this._boundAction);
        }
        const tableFilter = document.getElementById('auditTableFilter');
        if (tableFilter && this._boundTable) {
            tableFilter.removeEventListener('change', this._boundTable);
        }
    },

    // 绑定事件
    bindEvents() {
        const actionFilter = document.getElementById('auditActionFilter');
        if (actionFilter) {
            this._boundAction = () => this.loadAuditLog();
            actionFilter.addEventListener('change', this._boundAction);
        }
        const tableFilter = document.getElementById('auditTableFilter');
        if (tableFilter) {
            this._boundTable = () => this.loadAuditLog();
            tableFilter.addEventListener('change', this._boundTable);
        }
    },

    // 加载审计日志
    async loadAuditLog() {
        const action = document.getElementById('auditActionFilter')?.value || 'all';
        const table = document.getElementById('auditTableFilter')?.value || 'all';

        let logs = allAuditLogs || [];
        if (action !== 'all') logs = logs.filter(l => l.action === action);
        if (table !== 'all') logs = logs.filter(l => l.table_name === table);

        const list = document.getElementById('auditLogList');
        if (!list) return;

        list.innerHTML = logs.slice(0, 50).map(log => {
            const actions = { INSERT: '🟢 新增', UPDATE: '🟡 修改', DELETE: '🔴 删除' };
            return `<div class="flex justify-between p-2 border-b hover:bg-gray-50">
                <div>
                    <span class="font-medium">${actions[log.action] || log.action}</span>
                    <span class="text-gray-600 ml-2">${log.table_name}</span>
                    <span class="text-xs text-gray-400 ml-2">${log.username || '系统'}</span>
                </div>
                <div class="text-right">
                    <span class="text-xs text-gray-400">${log.created_at ? new Date(log.created_at).toLocaleString() : ''}</span>
                </div>
            </div>`;
        }).join('') || '<div class="text-center text-gray-400">暂无审计记录</div>';

        const countEl = document.getElementById('auditCount');
        if (countEl) countEl.textContent = logs.length;
    },

    // 导出审计日志
    exportAuditLog() {
        if (!allAuditLogs || allAuditLogs.length === 0) { showToast('暂无数据可导出'); return; }
        const data = [['时间', '用户', '操作', '表', '记录ID']];
        allAuditLogs.forEach(log => {
            data.push([
                log.created_at ? new Date(log.created_at).toLocaleString() : '',
                log.username || '',
                log.action || '',
                log.table_name || '',
                log.record_id || ''
            ]);
        });
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '审计日志');
        XLSX.writeFile(wb, `审计日志_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast('✅ 审计日志已导出');
    }
};

// 暴露到全局
window.AuditModule = AuditModule;

// 兼容旧版函数
window.loadAuditLog = function() { AuditModule.loadAuditLog(); };
window.exportAuditLog = function() { AuditModule.exportAuditLog(); };

console.log('✅ audit.js 已加载 (模块化)');