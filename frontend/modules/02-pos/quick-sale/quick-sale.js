/**
 * POS - 收银系统
 */
export function init() {
    console.log('✅ POS 已加载');
    
    var grid = document.getElementById('productGrid');
    if (grid) {
        var products = [
            { name: '标准洗车', price: 68, icon: 'fa-car', color: '#4F46E5' },
            { name: '精致洗车', price: 128, icon: 'fa-car', color: '#4F46E5' },
            { name: '深度清洁', price: 268, icon: 'fa-spray-can', color: '#10B981' },
            { name: '抛光打蜡', price: 388, icon: 'fa-wax', color: '#F59E0B' },
            { name: '内饰清洗', price: 328, icon: 'fa-couch', color: '#8B5CF6' },
            { name: '发动机清洗', price: 188, icon: 'fa-engine', color: '#EF4444' },
            { name: '空调清洗', price: 158, icon: 'fa-snowflake', color: '#3B82F6' },
            { name: '轮胎养护', price: 88, icon: 'fa-circle', color: '#6B7280' },
            { name: '玻璃镀膜', price: 228, icon: 'fa-glass-whiskey', color: '#06B6D4' },
            { name: '漆面镀晶', price: 688, icon: 'fa-gem', color: '#EC4899' },
            { name: '洗车月卡', price: 398, icon: 'fa-id-card', color: '#14B8A6' },
            { name: '洗车季卡', price: 998, icon: 'fa-id-card', color: '#14B8A6' }
        ];
        
        var html = '';
        for (var i = 0; i < products.length; i++) {
            var p = products[i];
            html += '<div class=\"product-item\" onclick=\"alert(\'已添加: ' + p.name + '\')\">';
            html += '  <div class=\"product-icon\" style=\"background:' + p.color + '20;color:' + p.color + '\">';
            html += '    <i class=\"fas ' + p.icon + '\"></i>';
            html += '  </div>';
            html += '  <div class=\"product-name\">' + p.name + '</div>';
            html += '  <div class=\"product-price\">¥' + p.price + '</div>';
            html += '</div>';
        }
        grid.innerHTML = html;
    }
}
