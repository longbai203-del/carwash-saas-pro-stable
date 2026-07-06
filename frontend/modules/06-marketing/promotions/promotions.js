/**
 * Promotions - 促销管理
 */
export function init() {
    console.log('✅ Promotions 已加载');
    
    var tbody = document.getElementById('promotionsTableBody');
    if (tbody) {
        var promotions = [
            { name: '夏日特惠', type: '折扣', discount: '20%', status: '进行中' },
            { name: '新客立减', type: '优惠券', discount: '¥50', status: '进行中' },
            { name: '会员折扣', type: '会员专享', discount: '15%', status: '已结束' },
            { name: '满减优惠', type: '满减', discount: '满300减50', status: '进行中' },
            { name: '节日特惠', type: '限时抢购', discount: '30%', status: '待开始' }
        ];
        
        var statusColors = {
            '进行中': 'badge-success',
            '已结束': 'badge-secondary',
            '待开始': 'badge-info'
        };
        
        var html = '';
        for (var i = 0; i < promotions.length; i++) {
            var p = promotions[i];
            var color = statusColors[p.status] || 'badge-secondary';
            html += '<tr>';
            html += '  <td><div><div class="font-medium">' + p.name + '</div></div></td>';
            html += '  <td><span class="badge badge-info">' + p.type + '</span></td>';
            html += '  <td class="text-center font-bold">' + p.discount + '</td>';
            html += '  <td class="text-center">0</td>';
            html += '  <td><span class="badge ' + color + '">' + p.status + '</span></td>';
            html += '  <td><div class="flex gap-1">';
            html += '    <button class="btn-sm btn-primary"><i class="fas fa-edit"></i></button>';
            html += '    <button class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>';
            html += '  </div></td>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
    }
}
