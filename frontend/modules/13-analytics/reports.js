/**
 * Reports - 报表管理
 */
export function init() {
    console.log('✅ Reports 已加载');
    
    var tbody = document.getElementById('reportsTableBody');
    if (tbody) {
        var reports = [
            { name: '2026年度销售报告', type: '销售报表', format: 'PDF', status: '已完成' },
            { name: 'Q2库存分析', type: '库存报表', format: 'Excel', status: '已完成' },
            { name: '客户增长报告', type: '客户报表', format: 'PDF', status: '已完成' },
            { name: '财务状况分析', type: '财务报表', format: '图表', status: '生成中' },
            { name: '营销活动效果', type: '营销报表', format: 'CSV', status: '已完成' }
        ];
        
        var typeColors = {
            '销售报表': 'badge-blue',
            '库存报表': 'badge-green',
            '客户报表': 'badge-purple',
            '财务报表': 'badge-gold',
            '员工报表': 'badge-teal',
            '营销报表': 'badge-pink'
        };
        
        var statusColors = {
            '已完成': 'badge-success',
            '生成中': 'badge-warning',
            '失败': 'badge-danger'
        };
        
        var html = '';
        for (var i = 0; i < reports.length; i++) {
            var r = reports[i];
            var typeColor = typeColors[r.type] || 'badge-secondary';
            var statusColor = statusColors[r.status] || 'badge-secondary';
            html += '<tr>';
            html += '  <td><div><div class="font-medium">' + r.name + '</div></div></td>';
            html += '  <td><span class="badge ' + typeColor + '">' + r.type + '</span></td>';
            html += '  <td><span class="badge badge-secondary">' + r.format + '</span></td>';
            html += '  <td>admin</td>';
            html += '  <td class="text-sm">2026-07-06</td>';
            html += '  <td class="text-sm">2.3MB</td>';
            html += '  <td><span class="badge ' + statusColor + '">' + r.status + '</span></td>';
            html += '  <td><div class="flex gap-1">';
            if (r.status === '已完成') {
                html += '    <button class="btn-sm btn-primary"><i class="fas fa-download"></i></button>';
                html += '    <button class="btn-sm btn-secondary"><i class="fas fa-eye"></i></button>';
            } else {
                html += '    <span class="text-sm text-gray-500">等待中...</span>';
            }
            html += '    <button class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>';
            html += '  </div></td>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
    }
}
