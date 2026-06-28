/**
 * inventory.js - 库存管理模块
 */
(function() {
    'use strict';

    window.InventoryModule = Object.create(ModuleBase);
    window.InventoryModule.moduleName = 'inventory';

    window.InventoryModule.cacheDom = function() {
        this.el = {
            list: this.getEl('inventoryList'),
            search: this.getEl('invSearch')
        };
    };

    window.InventoryModule.bindEvents = function() {
        var self = this;
        if (this.el.search) {
            this.el.search.addEventListener('input', function() { self.loadData(); });
        }
    };

    window.InventoryModule.loadData = function() {
        var inventory = this.getData('allInventory');
        var search = this.el.search ? this.el.search.value.trim() : '';
        if (search) {
            inventory = inventory.filter(function(i) {
                return (i.name || '').includes(search) || (i.category || '').includes(search);
            });
        }
        this.render(inventory);
    };

    window.InventoryModule.render = function(inventory) {
        var list = this.el.list;
        if (!list) return;
        if (!inventory || inventory.length === 0) {
            this.setEmpty(list);
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
        list.innerHTML = html;
    };

    console.log('[Inventory] 模块已注册');
})();