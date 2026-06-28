/**
 * inventory.js - 库存管理模块
 */
window.InventoryModule = {
    initialized: false,
    moduleName: 'inventory',

    init: function() {
        if (this.initialized) return;
        console.log('[Inventory] 初始化...');
        var self = this;
        setTimeout(function() {
            self.cacheDom();
            self.bindEvents();
            self.loadData();
            self.initialized = true;
            console.log('[Inventory] 初始化完成');
        }, 50);
    },

    destroy: function() {
        console.log('[Inventory] 销毁...');
        this.initialized = false;
    },

    cacheDom: function() {
        this.el = {
            list: document.getElementById('inventoryList'),
            search: document.getElementById('invSearch')
        };
    },

    bindEvents: function() {
        var self = this;
        if (this.el.search) {
            this.el.search.addEventListener('input', function() { self.loadData(); });
        }
    },

    loadData: function() {
        var inventory = AppStore.get('allInventory') || [];
        var search = this.el.search ? this.el.search.value.trim() : '';
        if (search) {
            inventory = inventory.filter(function(i) {
                return (i.name || '').includes(search) || (i.category || '').includes(search);
            });
        }
        this.render(inventory);
    },

    render: function(inventory) {
        if (!this.el.list) return;
        if (!inventory || inventory.length === 0) {
            this.el.list.innerHTML = '<div class="text-center text-gray-400 py-8">暂无库存</div>';
            return;
        }

        var html = '';
        inventory.forEach(function(i) {
            var isLow = (i.quantity || 0) <= (i.min_qty || 5);
            var rowClass = isLow ? 'stock-low' : 'stock-normal';
            var qtyClass = isLow ? 'text-red-600' : 'text-green-600';
            html += '<div class="' + rowClass + ' flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border">';
            html += '<div><span class="font-medium">' + i.name + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + (i.category || '其他') + ' · ' + (i.unit || '个') + '</span>';
            if (isLow) html += '<span class="text-xs text-red-500 ml-2">⚠️ 低库存</span>';
            html += '</div>';
            html += '<div class="flex items-center gap-4">';
            html += '<span class="font-bold ' + qtyClass + '">' + (i.quantity || 0) + '</span>';
            html += '<span class="text-sm text-gray-400">' + (i.cost || 0).toFixed(2) + ' SAR</span>';
            html += '</div></div>';
        });
        this.el.list.innerHTML = html;
    }
};

console.log('[Inventory] 模块已注册');