/**
 * Purchase Orders - 采购订单
 */
export function init() {
    console.log('✅ Purchase Orders 已加载');
    
    var tbody = document.getElementById('ordersTableBody');
    if (tbody) {
        var orders = [
            { id: 'PO-001', supplier: '上海供应商有限公司', total: 12500, status: '已完成' },
            { id: 'PO-002', supplier: '深圳科技材料公司', total: 8500, status: '待审批' },
            { id: 'PO-003', supplier: '广州五金制品厂', total: 32000, status: '草稿' },
            { id: 'PO-004', supplier: '北京电子元件商行', total: 6800, status: '已批准' },
            { id: 'PO-005', supplier: '成都建材批发中心', total: 15600, status: '已完成' }
        ];
        
        var statusColors = {
            '已完成': 'badge-success',
            '待审批': 'badge-warning',
            '草稿': 'badge-secondary',
            '已批准': 'badge-info',
            '已取消': 'badge-danger'
        };
        
        tbody.innerHTML = orders.map(function(o) {
            return '<tr>' +
                '<td class="font-mono">' + o.id + '</td>' +
                '<td>' + o.supplier + '</td>' +
                '<td class="text-right font-semibold">¥' + o.total + '</td>' +
                '<td><span class="badge ' + (statusColors[o.status] || 'badge-secondary') + '">' + o.status + '</span></td>' +
                '<td class="text-center">5</td>' +
                '<td class="text-sm">2026-07-06</td>' +
                '<td><div class="flex gap-1">' +
                '<button class="btn-sm btn-primary"><i class="fas fa-eye"></i></button>' +
                '<button class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    }
}
