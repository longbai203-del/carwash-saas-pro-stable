/**
 * Audit Logs - 审计日志
 */
export function init() {
    console.log('✅ Audit Logs 已加载');
    
    var tbody = document.getElementById('logsTableBody');
    if (tbody) {
        var logs = [
            { user: 'admin', action: '登录', resource: '系统', time: '2026-07-06 10:30:00' },
            { user: 'zhangwei', action: '创建', resource: '订单', time: '2026-07-06 10:15:00' },
            { user: 'lina', action: '更新', resource: '商品', time: '2026-07-06 09:45:00' },
            { user: 'admin', action: '删除', resource: '客户', time: '2026-07-06 09:20:00' },
            { user: 'wangqiang', action: '导出', resource: '报表', time: '2026-07-06 08:55:00' }
        ];
        
        var actionColors = {
            '登录': 'badge-blue',
            '登出': 'badge-secondary',
            '创建': 'badge-green',
            '更新': 'badge-warning',
            '删除': 'badge-danger',
            '导出': 'badge-purple',
            '导入': 'badge-info',
            '权限变更': 'badge-danger'
        };
        
        var html = '';
        for (var i = 0; i < logs.length; i++) {
            var log = logs[i];
            var color = actionColors[log.action] || 'badge-secondary';
            html += '<tr>';
            html += '  <td class="font-mono text-sm">LOG-' + String(i + 1).padStart(6, '0') + '</td>';
            html += '  <td><span class="font-medium">' + log.user + '</span></td>';
            html += '  <td><span class="badge ' + color + '">' + log.action + '</span></td>';
            html += '  <td>' + log.resource + '</td>';
            html += '  <td class="text-sm">' + log.action + ' ' + log.resource + '</td>';
            html += '  <td class="font-mono text-sm">192.168.1.100</td>';
            html += '  <td class="text-sm">' + log.time + '</td>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
    }
}
