/**
 * Tenants - 租户管理
 */
export function init() {
    console.log('✅ Tenants 已加载');
    
    var tbody = document.getElementById('tenantsTableBody');
    if (tbody) {
        var tenants = [
            { name: '洗车行A', plan: '专业版', users: 5, status: '已激活' },
            { name: '洗车行B', plan: '入门版', users: 2, status: '已激活' },
            { name: '汽车美容C', plan: '企业版', users: 12, status: '已激活' },
            { name: '4S店D', plan: '专业版', users: 8, status: '试用中' },
            { name: '连锁洗车E', plan: '企业版', users: 20, status: '已激活' }
        ];
        
        var planColors = {
            '入门版': 'badge-info',
            '专业版': 'badge-blue',
            '企业版': 'badge-purple'
        };
        
        var statusColors = {
            '已激活': 'badge-success',
            '已停用': 'badge-danger',
            '试用中': 'badge-warning'
        };
        
        var html = '';
        for (var i = 0; i < tenants.length; i++) {
            var t = tenants[i];
            var planColor = planColors[t.plan] || 'badge-secondary';
            var statusColor = statusColors[t.status] || 'badge-secondary';
            html += '<tr>';
            html += '  <td><div><div class="font-medium">' + t.name + '</div></div></td>';
            html += '  <td><span class="badge ' + planColor + '">' + t.plan + '</span></td>';
            html += '  <td class="text-right">¥299/月</td>';
            html += '  <td class="text-center">' + t.users + '</td>';
            html += '  <td class="text-center">10GB</td>';
            html += '  <td class="text-sm">2026-01-01</td>';
            html += '  <td><span class="badge ' + statusColor + '">' + t.status + '</span></td>';
            html += '  <td><div class="flex gap-1">';
            html += '    <button class="btn-sm btn-primary"><i class="fas fa-eye"></i></button>';
            html += '    <button class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>';
            html += '  </div></td>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
    }
}
