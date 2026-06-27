// ================================================================
//  inventory.js - 库存管理模块
// ================================================================

const InventoryModule = {
    // 初始化
    init() {
        console.log('📦 InventoryModule 初始化');
        if (!document.getElementById('inventoryList')) {
            console.warn('⚠️ 库存元素未加载，延迟初始化');
            setTimeout(() => this.init(), 300);
            return;
        }
        this.refresh();
        this.bindEvents();
    },

    // 销毁
    destroy() {
        console.log('📦 InventoryModule 销毁');
    },

    // 绑定事件
    bindEvents() {
        // 可以添加搜索、筛选等事件
    },

    // 刷新库存列表
    refresh() {
        this.refreshInventory();
    },

    // 刷新库存
    refreshInventory() {
        const list = document.getElementById('inventoryList');
        if (!list) return;

        list.innerHTML = allInventory.map(i => {
            const isLow = (i.quantity || 0) <= (i.min_qty || 5);
            return `<div class="${isLow ? 'stock-low' : 'stock-normal'} flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border">
                <div>
                    <span class="font-medium">${i.name}</span>
                    <span class="text-xs text-gray-400 ml-2">${i.category || '其他'} · ${i.unit || '个'}</span>
                    ${isLow ? '<span class="text-xs text-red-500 ml-2">⚠️ 低库存</span>' : ''}
                </div>
                <div class="flex items-center gap-4">
                    <span class="font-bold ${isLow ? 'text-red-600' : 'text-green-600'}">${i.quantity || 0}</span>
                    <span class="text-sm text-gray-400">${(i.cost || 0).toFixed(2)} SAR</span>
                </div>
            </div>`;
        }).join('') || '<div class="text-center text-gray-400">暂无库存</div>';

        // 刷新出入库记录
        this.refreshStockLogs();
    },

    // 刷新出入库记录
    refreshStockLogs() {
        const list = document.getElementById('stockLogList');
        if (!list) return;

        const logs = [...(allStockIn || []), ...(allStockOut || [])]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 20);

        list.innerHTML = logs.map(log => {
            const isIn = log.inventory_id && log.supplier !== undefined;
            return `<div class="flex justify-between text-sm p-1 border-b">
                <span>${isIn ? '📥 入库' : '📤 出库'} ${log.product_name || '未知'}</span>
                <span>${log.quantity || 0} 件</span>
                <span class="text-gray-400">${log.created_by || '系统'}</span>
            </div>`;
        }).join('') || '<div class="text-center text-gray-400 text-sm">暂无记录</div>';
    },

    // 打开入库弹窗
    openStockInModal() {
        const sel = document.getElementById('stockInProduct');
        if (!sel) return;
        sel.innerHTML = allInventory.map(i => `<option value="${i.id}">${i.name} (库存: ${i.quantity || 0})</option>`).join('');
        document.getElementById('stockInModal').classList.remove('hidden');
        document.getElementById('stockInQty').value = '';
        document.getElementById('stockInPrice').value = '';
        document.getElementById('stockInSupplier').value = '';
    },

    // 打开出库弹窗
    openStockOutModal() {
        const sel = document.getElementById('stockOutProduct');
        if (!sel) return;
        sel.innerHTML = allInventory.map(i => `<option value="${i.id}">${i.name} (库存: ${i.quantity || 0})</option>`).join('');
        document.getElementById('stockOutModal').classList.remove('hidden');
        document.getElementById('stockOutQty').value = '';
    },

    // 打开新增产品弹窗
    openAddProductModal() {
        document.getElementById('addProductModal').classList.remove('hidden');
        document.getElementById('newProductName').value = '';
        document.getElementById('newProductQty').value = '';
        document.getElementById('newProductCost').value = '';
        document.getElementById('newProductMinQty').value = '5';
        document.getElementById('newProductUnit').value = '瓶';
    },

    // 提交入库
    async submitStockIn() {
        const productId = document.getElementById('stockInProduct')?.value;
        const qty = parseInt(document.getElementById('stockInQty')?.value);
        const price = parseFloat(document.getElementById('stockInPrice')?.value) || 0;
        const supplier = document.getElementById('stockInSupplier')?.value || '未知';
        if (!productId || !qty || qty <= 0) { showToast('请选择产品并输入数量'); return; }
        try {
            const product = allInventory.find(i => i.id === productId);
            const newQty = (product.quantity || 0) + qty;
            await supabaseClient.from('inventory').update({ quantity: newQty, cost: price || product.cost, last_updated: new Date().toISOString() }).eq('id', productId);
            product.quantity = newQty;
            if (price) product.cost = price;
            await supabaseClient.from('stock_in').insert([{ inventory_id: productId, product_name: product.name, quantity: qty, unit_price: price, total_price: price * qty, supplier: supplier, created_by: currentUser?.name || '系统' }]);
            closeModal('stockInModal');
            this.refreshInventory();
            showToast('✅ 入库成功: ' + qty + ' 件');
        } catch (error) { showToast('❌ 入库失败: ' + error.message); }
    },

    // 提交出库
    async submitStockOut() {
        const productId = document.getElementById('stockOutProduct')?.value;
        const qty = parseInt(document.getElementById('stockOutQty')?.value);
        const reason = document.getElementById('stockOutReason')?.value;
        if (!productId || !qty || qty <= 0) { showToast('请选择产品并输入数量'); return; }
        const product = allInventory.find(i => i.id === productId);
        if (!product) { showToast('产品不存在'); return; }
        if ((product.quantity || 0) < qty) { showToast('库存不足！当前库存: ' + product.quantity); return; }
        try {
            const newQty = product.quantity - qty;
            await supabaseClient.from('inventory').update({ quantity: newQty, last_updated: new Date().toISOString() }).eq('id', productId);
            product.quantity = newQty;
            await supabaseClient.from('stock_out').insert([{ inventory_id: productId, product_name: product.name, quantity: qty, reason: reason, created_by: currentUser?.name || '系统' }]);
            closeModal('stockOutModal');
            this.refreshInventory();
            showToast('✅ 出库成功: ' + qty + ' 件');
        } catch (error) { showToast('❌ 出库失败: ' + error.message); }
    },

    // 提交新产品
    async submitNewProduct() {
        const name = document.getElementById('newProductName')?.value?.trim();
        const category = document.getElementById('newProductCategory')?.value;
        const unit = document.getElementById('newProductUnit')?.value?.trim() || '个';
        const qty = parseInt(document.getElementById('newProductQty')?.value) || 0;
        const cost = parseFloat(document.getElementById('newProductCost')?.value) || 0;
        const minQty = parseInt(document.getElementById('newProductMinQty')?.value) || 5;
        if (!name) { showToast('请输入产品名称'); return; }
        try {
            const { data, error } = await supabaseClient.from('inventory').insert([{ name, category, unit, quantity: qty, cost, min_qty: minQty }]).select();
            if (error) throw new Error(error.message);
            if (data && data.length > 0) allInventory.unshift(data[0]);
            closeModal('addProductModal');
            this.refreshInventory();
            showToast('✅ 产品已添加: ' + name);
        } catch (error) { showToast('❌ 添加失败: ' + error.message); }
    }
};

// 暴露到全局
window.InventoryModule = InventoryModule;

// 兼容旧版函数
window.refreshInventory = function() { InventoryModule.refreshInventory(); };
window.openStockInModal = function() { InventoryModule.openStockInModal(); };
window.openStockOutModal = function() { InventoryModule.openStockOutModal(); };
window.openAddProductModal = function() { InventoryModule.openAddProductModal(); };
window.submitStockIn = function() { InventoryModule.submitStockIn(); };
window.submitStockOut = function() { InventoryModule.submitStockOut(); };
window.submitNewProduct = function() { InventoryModule.submitNewProduct(); };

console.log('✅ inventory.js 已加载 (模块化)');