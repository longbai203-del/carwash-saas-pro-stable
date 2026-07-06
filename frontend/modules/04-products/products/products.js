/**
 * Products - 商品管理
 */
export function init() {
    console.log('✅ Products 已加载');
    
    var tbody = document.getElementById('productsTableBody');
    if (tbody) {
        var products = [
            { name: '泡沫洗车液', category: '洗车', price: 68, stock: 45, unit: '桶' },
            { name: '水蜡', category: '洗车', price: 128, stock: 30, unit: '瓶' },
            { name: '轮胎光亮剂', category: '美容', price: 88, stock: 20, unit: '瓶' },
            { name: '玻璃清洁剂', category: '美容', price: 58, stock: 15, unit: '瓶' },
            { name: '内饰清洗剂', category: '保养', price: 98, stock: 25, unit: '瓶' }
        ];
        
        tbody.innerHTML = products.map(function(p) {
            return '<tr>' +
                '<td><div><div class="font-medium">' + p.name + '</div></div></td>' +
                '<td>' + p.category + '</td>' +
                '<td class="text-right">¥' + p.price + '</td>' +
                '<td class="text-right">' + p.stock + '</td>' +
                '<td>' + p.unit + '</td>' +
                '<td><span class="badge badge-success">上架</span></td>' +
                '<td><div class="flex gap-1">' +
                '<button class="btn-sm btn-primary"><i class="fas fa-edit"></i></button>' +
                '<button class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    }
}
