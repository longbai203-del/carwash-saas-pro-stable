/**
 * Income - 收入管理
 */
export function init() {
    console.log('✅ Income 已加载');
    
    var tbody = document.getElementById('incomeTableBody');
    if (tbody) {
        var incomes = [
            { id: 'INC-001', category: '服务收入', description: '洗车服务', amount: 680, method: '微信' },
            { id: 'INC-002', category: '商品销售', description: '洗车液销售', amount: 420, method: '现金' },
            { id: 'INC-003', category: '会员费', description: '月卡会员', amount: 398, method: '支付宝' },
            { id: 'INC-004', category: '服务收入', description: '汽车美容', amount: 1250, method: '银行卡' },
            { id: 'INC-005', category: '商品销售', description: '车蜡销售', amount: 890, method: '微信' }
        ];
        
        var categoryColors = {
            '服务收入': 'badge-blue',
            '商品销售': 'badge-green',
            '会员费': 'badge-purple',
            '其他': 'badge-secondary'
        };
        
        var html = '';
        for (var i = 0; i < incomes.length; i++) {
            var inc = incomes[i];
            var color = categoryColors[inc.category] || 'badge-secondary';
            html += '<tr>';
            html += '  <td class="font-mono">' + inc.id + '</td>';
            html += '  <td><span class="badge ' + color + '">' + inc.category + '</span></td>';
            html += '  <td>' + inc.description + '</td>';
            html += '  <td class="text-right font-semibold text-green-600">+¥' + inc.amount + '</td>';
            html += '  <td>' + inc.method + '</td>';
            html += '  <td>散客</td>';
            html += '  <td class="text-sm">2026-07-06</td>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
        
        // 更新统计
        var totalEl = document.querySelector('.stat-value.text-green-600');
        if (totalEl) totalEl.textContent = '¥3,638';
        var countEl = document.querySelector('.stat-value:not(.text-green-600):not(.text-blue-600)');
        if (countEl) countEl.textContent = '5';
    }
}
