/**
 * Customers - 客户管理
 */
export function init() {
    console.log('✅ Customers 已加载');
    
    var tbody = document.getElementById('customersTableBody');
    if (tbody) {
        var customers = [
            { name: '张伟', phone: '13800001111', level: '黄金', spent: 12500 },
            { name: '李娜', phone: '13800002222', level: 'VIP', spent: 32800 },
            { name: '王强', phone: '13800003333', level: '白银', spent: 5600 },
            { name: '刘洋', phone: '13800004444', level: '青铜', spent: 2300 },
            { name: '陈静', phone: '13800005555', level: 'VIP', spent: 45600 }
        ];
        
        var levelColors = {
            'VIP': '#8B5CF6',
            '黄金': '#F59E0B',
            '白银': '#9CA3AF',
            '青铜': '#D97706'
        };
        
        tbody.innerHTML = customers.map(function(c) {
            return '<tr>' +
                '<td><div class="flex items-center gap-3">' +
                '<div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">' + c.name.charAt(0) + '</div>' +
                '<div><div class="font-medium">' + c.name + '</div></div></div></td>' +
                '<td>' + c.phone + '</td>' +
                '<td class="text-sm">user@example.com</td>' +
                '<td><span class="badge" style="background:' + levelColors[c.level] + '20;color:' + levelColors[c.level] + ';">' + c.level + '</span></td>' +
                '<td class="text-right font-semibold">¥' + c.spent + '</td>' +
                '<td class="text-center">5</td>' +
                '<td class="text-sm">2026-07-05</td>' +
                '<td><div class="flex gap-1">' +
                '<button class="btn-sm btn-primary"><i class="fas fa-eye"></i></button>' +
                '<button class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    }
}
