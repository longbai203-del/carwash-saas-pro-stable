/**
 * Orders - 订单管理
 */
export function init() {
    console.log('✅ Orders 已加载');
    
    var tbody = document.getElementById('ordersTableBody');
    if (tbody) {
        var orders = [
            { id: 'ORD-001', customer: '张伟', total: 680, status: '已完成', time: '2026-07-06 10:30' },
            { id: 'ORD-002', customer: '李娜', total: 420, status: '待处理', time: '2026-07-06 10:15' },
            { id: 'ORD-003', customer: '王强', total: 1250, status: '处理中', time: '2026-07-06 09:45' },
            { id: 'ORD-004', customer: '刘洋', total: 380, status: '已完成', time: '2026-07-06 09:20' },
            { id: 'ORD-005', customer: '陈静', total: 890, status: '已完成', time: '2026-07-06 08:55' }
        ];
        
        var statusColors = {
            '已完成': 'badge-success',
            '待处理': 'badge-warning',
            '处理中': 'badge-info',
            '已取消': 'badge-danger'
        };
        
        var html = '';
        for (var i = 0; i < orders.length; i++) {
            var o = orders[i];
            var color = statusColors[o.status] || 'badge-secondary';
            html += '<tr>';
            html += '  <td class=\"font-mono\">' + o.id + '</td>';
            html += '  <td>' + o.customer + '</td>';
            html += '  <td>洗车服务 × 1</td>';
            html += '  <td class=\"text-right font-semibold\">¥' + o.total + '</td>';
            html += '  <td><span class=\"badge ' + color + '\">' + o.status + '</span></td>';
            html += '  <td class=\"text-sm\">' + o.time + '</td>';
            html += '  <td><div class=\"flex gap-1\">';
            html += '    <button class=\"btn-sm btn-primary\"><i class=\"fas fa-eye\"></i></button>';
            html += '    <button class=\"btn-sm btn-danger\"><i class=\"fas fa-trash\"></i></button>';
            html += '  </div></td>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
        
        var totalEl = document.getElementById('totalCount');
        if (totalEl) totalEl.textContent = orders.length;
    }
}
