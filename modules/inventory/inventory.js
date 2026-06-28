/**
 * inventory.js - 库存管理模块 V2
 * 包含：产品管理、供应商、采购订单、库存调整
 */
(function() {
    'use strict';

    window.InventoryModule = Object.create(ModuleBase);
    window.InventoryModule.moduleName = 'inventory';
    window.InventoryModule.poItems = [];

    // ===== 缓存 DOM =====
    window.InventoryModule.cacheDom = function() {
        this.el = {
            productList: document.getElementById('productList'),
            supplierList: document.getElementById('supplierList'),
            purchaseOrderList: document.getElementById('purchaseOrderList'),
            invSearch: document.getElementById('invSearch'),
            invCategoryFilter: document.getElementById('invCategoryFilter'),
            invStockFilter: document.getElementById('invStockFilter'),
            invTotalProducts: document.getElementById('invTotalProducts'),
            invTotalStock: document.getElementById('invTotalStock'),
            invLowStock: document.getElementById('invLowStock'),
            invTotalValue: document.getElementById('invTotalValue'),
            // 产品模态框
            addProductModal: document.getElementById('addProductModal'),
            productName: document.getElementById('productName'),
            productCategory: document.getElementById('productCategory'),
            productUnit: document.getElementById('productUnit'),
            productCost: document.getElementById('productCost'),
            productSellPrice: document.getElementById('productSellPrice'),
            productQty: document.getElementById('productQty'),
            productMinQty: document.getElementById('productMinQty'),
            productDesc: document.getElementById('productDesc'),
            // 供应商模态框
            addSupplierModal: document.getElementById('addSupplierModal'),
            supplierName: document.getElementById('supplierName'),
            supplierContact: document.getElementById('supplierContact'),
            supplierPhone: document.getElementById('supplierPhone'),
            supplierAddress: document.getElementById('supplierAddress'),
            // 采购单模态框
            purchaseOrderModal: document.getElementById('purchaseOrderModal'),
            poSupplier: document.getElementById('poSupplier'),
            poDate: document.getElementById('poDate'),
            poDelivery: document.getElementById('poDelivery'),
            poProduct: document.getElementById('poProduct'),
            poQty: document.getElementById('poQty'),
            poPrice: document.getElementById('poPrice'),
            poItemsList: document.getElementById('poItemsList'),
            poSubtotal: document.getElementById('poSubtotal'),
            poVat: document.getElementById('poVat'),
            poTotal: document.getElementById('poTotal'),
            poNotes: document.getElementById('poNotes'),
            // 库存调整模态框
            stockAdjustModal: document.getElementById('stockAdjustModal'),
            adjustProduct: document.getElementById('adjustProduct'),
            adjustCurrentQty: document.getElementById('adjustCurrentQty'),
            adjustNewQty: document.getElementById('adjustNewQty'),
            adjustReason: document.getElementById('adjustReason'),
            adjustNote: document.getElementById('adjustNote')
        };
    };

    // ===== 绑定事件 =====
    window.InventoryModule.bindEvents = function() {
        var self = this;
        if (this.el.invSearch) {
            this.el.invSearch.addEventListener('input', function() { self.filterProducts(); });
        }
        if (this.el.invCategoryFilter) {
            this.el.invCategoryFilter.addEventListener('change', function() { self.filterProducts(); });
        }
        if (this.el.invStockFilter) {
            this.el.invStockFilter.addEventListener('change', function() { self.filterProducts(); });
        }
        if (this.el.adjustProduct) {
            this.el.adjustProduct.addEventListener('change', function() {
                self.loadProductForAdjust(this.value);
            });
        }
    };

    // ============================================================
    // 加载数据
    // ============================================================

    window.InventoryModule.loadData = function() {
        this.loadProducts();
        this.loadSuppliers();
        this.loadPurchaseOrders();
        this.loadCategories();
    };

    // ===== 加载产品 =====
    window.InventoryModule.loadProducts = function() {
        var self = this;
        AppApi.query('products', { order: { by: 'name', ascending: true } })
            .then(function(data) {
                AppStore.set('allProducts', data || []);
                self.renderProducts(data || []);
                self.updateStats(data || []);
                self.updateProductSelects(data || []);
            })
            .catch(function(error) {
                console.error('[Inventory] 加载产品失败:', error);
            });
    };

    // ===== 加载供应商 =====
    window.InventoryModule.loadSuppliers = function() {
        var self = this;
        AppApi.query('suppliers', { order: { by: 'name', ascending: true } })
            .then(function(data) {
                self.renderSuppliers(data || []);
                self.updateSupplierSelects(data || []);
            })
            .catch(function(error) {
                console.error('[Inventory] 加载供应商失败:', error);
            });
    };

    // ===== 加载采购订单 =====
    window.InventoryModule.loadPurchaseOrders = function() {
        var self = this;
        AppApi.query('purchase_orders', { order: { by: 'created_at', ascending: false }, limit: 50 })
            .then(function(data) {
                self.renderPurchaseOrders(data || []);
            })
            .catch(function(error) {
                console.error('[Inventory] 加载采购单失败:', error);
            });
    };

    // ===== 加载分类 =====
    window.InventoryModule.loadCategories = function() {
        var self = this;
        AppApi.query('product_categories', { order: { by: 'name', ascending: true } })
            .then(function(data) {
                var sel = self.el.productCategory;
                if (sel) {
                    var html = '';
                    (data || []).forEach(function(c) {
                        html += '<option value="' + c.id + '">' + c.name + '</option>';
                    });
                    sel.innerHTML = html;
                }
                // 更新筛选器
                var filterSel = self.el.invCategoryFilter;
                if (filterSel) {
                    var html = '<option value="all">全部分类</option>';
                    (data || []).forEach(function(c) {
                        html += '<option value="' + c.id + '">' + c.name + '</option>';
                    });
                    filterSel.innerHTML = html;
                }
            })
            .catch(function(error) {
                console.error('[Inventory] 加载分类失败:', error);
            });
    };

    // ============================================================
    // 渲染函数
    // ============================================================

    // ===== 渲染产品列表 =====
    window.InventoryModule.renderProducts = function(products) {
        var list = this.el.productList;
        if (!list) return;

        if (!products || products.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-8">暂无产品</div>';
            return;
        }

        var html = '';
        products.forEach(function(p) {
            var isLow = (p.current_quantity || 0) <= (p.min_quantity || 5);
            var isOut = (p.current_quantity || 0) <= 0;
            var statusClass = isOut ? 'bg-red-100 border-red-300' : isLow ? 'bg-amber-50 border-amber-300' : 'bg-white';
            var statusText = isOut ? '🚫 缺货' : isLow ? '⚠️ 低库存' : '✅ 正常';

            html += '<div class="flex justify-between items-center p-3 ' + statusClass + ' rounded-xl border hover:shadow-md transition">';
            html += '<div><span class="font-medium">' + p.name + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + (p.sku || '') + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + (p.unit || '个') + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + (p.category_name || '') + '</span>';
            html += '<div class="text-sm font-bold ' + (isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600') + '">' + (p.current_quantity || 0) + '</div>';
            html += '</div>';
            html += '<div class="flex items-center gap-3">';
            html += '<span class="text-sm text-gray-400">成本: ' + (p.cost_price || 0).toFixed(2) + ' SAR</span>';
            html += '<span class="text-sm text-gray-400">售价: ' + (p.selling_price || 0).toFixed(2) + ' SAR</span>';
            html += '<span class="text-xs ' + (isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600') + '">' + statusText + '</span>';
            html += '<button onclick="InventoryModule.editProduct(\'' + p.id + '\')" class="text-blue-600 hover:text-blue-800 text-sm"><i class="fas fa-edit"></i></button>';
            html += '</div></div>';
        });
        list.innerHTML = html;
    };

    // ===== 渲染供应商列表 =====
    window.InventoryModule.renderSuppliers = function(suppliers) {
        var list = this.el.supplierList;
        if (!list) return;

        if (!suppliers || suppliers.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无供应商</div>';
            return;
        }

        var html = '';
        suppliers.forEach(function(s) {
            html += '<div class="flex justify-between items-center p-2 bg-gray-50 rounded-xl border">';
            html += '<div><span class="font-medium">' + s.name + '</span>';
            html += '<span class="text-sm text-gray-400 ml-2">' + (s.contact_person || '') + '</span>';
            html += '<span class="text-sm text-gray-400 ml-2">' + (s.phone || '') + '</span></div>';
            html += '<div class="flex gap-2">';
            html += '<span class="text-xs text-green-600">' + (s.status || 'active') + '</span>';
            html += '</div></div>';
        });
        list.innerHTML = html;
    };

    // ===== 渲染采购订单列表 =====
    window.InventoryModule.renderPurchaseOrders = function(orders) {
        var list = this.el.purchaseOrderList;
        if (!list) return;

        if (!orders || orders.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无采购订单</div>';
            return;
        }

        var statusMap = { draft: '📝 草稿', sent: '📤 已发送', received: '📥 已收货', completed: '✅ 已完成', cancelled: '❌ 已取消' };
        var html = '';
        orders.slice(0, 10).forEach(function(o) {
            html += '<div class="flex justify-between items-center p-2 bg-gray-50 rounded-xl border">';
            html += '<div><span class="font-medium">#' + (o.po_number || o.id.slice(0, 8)) + '</span>';
            html += '<span class="text-sm text-gray-400 ml-2">' + o.order_date + '</span>';
            html += '<span class="text-sm text-gray-400 ml-2">' + (o.supplier_name || '') + '</span></div>';
            html += '<div class="flex items-center gap-3">';
            html += '<span class="font-bold">' + (o.total || 0).toFixed(2) + ' SAR</span>';
            html += '<span class="text-xs text-gray-400">' + (statusMap[o.status] || o.status) + '</span>';
            html += '</div></div>';
        });
        list.innerHTML = html;
    };

    // ===== 更新统计 =====
    window.InventoryModule.updateStats = function(products) {
        var totalProducts = products.length;
        var totalStock = products.reduce(function(s, p) { return s + (p.current_quantity || 0); }, 0);
        var lowStock = products.filter(function(p) { return (p.current_quantity || 0) <= (p.min_quantity || 5); }).length;
        var totalValue = products.reduce(function(s, p) { return s + ((p.current_quantity || 0) * (p.cost_price || 0)); }, 0);

        if (this.el.invTotalProducts) this.el.invTotalProducts.textContent = totalProducts;
        if (this.el.invTotalStock) this.el.invTotalStock.textContent = totalStock;
        if (this.el.invLowStock) this.el.invLowStock.textContent = lowStock;
        if (this.el.invTotalValue) this.el.invTotalValue.textContent = totalValue.toFixed(2) + ' SAR';
    };

    // ===== 更新产品下拉选择 =====
    window.InventoryModule.updateProductSelects = function(products) {
        ['poProduct', 'adjustProduct'].forEach(function(id) {
            var sel = document.getElementById(id);
            if (sel) {
                var html = '';
                (products || []).forEach(function(p) {
                    html += '<option value="' + p.id + '">' + p.name + ' (库存: ' + (p.current_quantity || 0) + ')</option>';
                });
                sel.innerHTML = html;
            }
        });
    };

    // ===== 更新供应商下拉选择 =====
    window.InventoryModule.updateSupplierSelects = function(suppliers) {
        var sel = this.el.poSupplier;
        if (sel) {
            var html = '';
            (suppliers || []).forEach(function(s) {
                html += '<option value="' + s.id + '">' + s.name + '</option>';
            });
            sel.innerHTML = html;
        }
    };

    // ============================================================
    // 筛选产品
    // ============================================================

    window.InventoryModule.filterProducts = function() {
        var products = AppStore.get('allProducts') || [];
        var search = this.el.invSearch ? this.el.invSearch.value.trim().toLowerCase() : '';
        var category = this.el.invCategoryFilter ? this.el.invCategoryFilter.value : 'all';
        var stock = this.el.invStockFilter ? this.el.invStockFilter.value : 'all';

        var filtered = products.filter(function(p) {
            var matchSearch = !search || (p.name || '').toLowerCase().includes(search) || (p.sku || '').toLowerCase().includes(search);
            var matchCategory = category === 'all' || p.category_id === category;
            var matchStock = true;
            if (stock === 'low') matchStock = (p.current_quantity || 0) <= (p.min_quantity || 5) && (p.current_quantity || 0) > 0;
            else if (stock === 'out') matchStock = (p.current_quantity || 0) <= 0;
            else if (stock === 'normal') matchStock = (p.current_quantity || 0) > (p.min_quantity || 5);
            return matchSearch && matchCategory && matchStock;
        });

        this.renderProducts(filtered);
    };

    // ============================================================
    // 产品管理
    // ============================================================

    window.InventoryModule.showAddProduct = function() {
        var modal = this.el.addProductModal;
        if (modal) {
            modal.classList.remove('hidden');
            if (this.el.productName) this.el.productName.value = '';
            if (this.el.productUnit) this.el.productUnit.value = '个';
            if (this.el.productCost) this.el.productCost.value = '';
            if (this.el.productSellPrice) this.el.productSellPrice.value = '';
            if (this.el.productQty) this.el.productQty.value = '0';
            if (this.el.productMinQty) this.el.productMinQty.value = '5';
            if (this.el.productDesc) this.el.productDesc.value = '';
            if (this.el.productName) setTimeout(function() { this.el.productName.focus(); }.bind(this), 100);
        }
    };

    window.InventoryModule.saveProduct = function() {
        var self = this;
        var currentUser = this.getCurrentUser();

        var name = this.el.productName ? this.el.productName.value.trim() : '';
        var categoryId = this.el.productCategory ? this.el.productCategory.value : null;
        var unit = this.el.productUnit ? this.el.productUnit.value.trim() || '个' : '个';
        var cost = this.el.productCost ? parseFloat(this.el.productCost.value) || 0 : 0;
        var sellPrice = this.el.productSellPrice ? parseFloat(this.el.productSellPrice.value) || 0 : 0;
        var qty = this.el.productQty ? parseInt(this.el.productQty.value) || 0 : 0;
        var minQty = this.el.productMinQty ? parseInt(this.el.productMinQty.value) || 5 : 5;
        var desc = this.el.productDesc ? this.el.productDesc.value.trim() : '';

        if (!name) {
            this.toast('请输入产品名称', 'error');
            return;
        }

        var tenant = AppStore.get('currentTenant');
        var store = AppStore.get('currentStore');

        var productData = {
            tenant_id: tenant ? tenant.id : null,
            store_id: store ? store.id : null,
            category_id: categoryId,
            name: name,
            unit: unit,
            cost_price: cost,
            selling_price: sellPrice,
            current_quantity: qty,
            min_quantity: minQty,
            description: desc,
            status: 'active'
        };

        AppApi.insert('products', productData)
            .then(function(data) {
                if (data && data.length > 0) {
                    self.toast('✅ 产品已添加: ' + name, 'success');
                    self.closeModal('addProductModal');
                    self.loadProducts();
                }
            })
            .catch(function(error) {
                self.toast('❌ 添加失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 供应商管理
    // ============================================================

    window.InventoryModule.showAddSupplier = function() {
        var modal = this.el.addSupplierModal;
        if (modal) {
            modal.classList.remove('hidden');
            if (this.el.supplierName) this.el.supplierName.value = '';
            if (this.el.supplierContact) this.el.supplierContact.value = '';
            if (this.el.supplierPhone) this.el.supplierPhone.value = '';
            if (this.el.supplierAddress) this.el.supplierAddress.value = '';
            if (this.el.supplierName) setTimeout(function() { this.el.supplierName.focus(); }.bind(this), 100);
        }
    };

    window.InventoryModule.saveSupplier = function() {
        var self = this;
        var currentUser = this.getCurrentUser();

        var name = this.el.supplierName ? this.el.supplierName.value.trim() : '';
        var contact = this.el.supplierContact ? this.el.supplierContact.value.trim() : '';
        var phone = this.el.supplierPhone ? this.el.supplierPhone.value.trim() : '';
        var address = this.el.supplierAddress ? this.el.supplierAddress.value.trim() : '';

        if (!name) {
            this.toast('请输入供应商名称', 'error');
            return;
        }

        var tenant = AppStore.get('currentTenant');

        var supplierData = {
            tenant_id: tenant ? tenant.id : null,
            name: name,
            contact_person: contact,
            phone: phone,
            address: address,
            status: 'active'
        };

        AppApi.insert('suppliers', supplierData)
            .then(function(data) {
                if (data && data.length > 0) {
                    self.toast('✅ 供应商已添加: ' + name, 'success');
                    self.closeModal('addSupplierModal');
                    self.loadSuppliers();
                }
            })
            .catch(function(error) {
                self.toast('❌ 添加失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 采购订单管理
    // ============================================================

    window.InventoryModule.showPurchaseOrder = function() {
        var modal = this.el.purchaseOrderModal;
        if (modal) {
            this.poItems = [];
            this.updatePOItems();
            modal.classList.remove('hidden');
            if (this.el.poDate) this.el.poDate.value = new Date().toISOString().split('T')[0];
            if (this.el.poDelivery) {
                var d = new Date();
                d.setDate(d.getDate() + 7);
                this.el.poDelivery.value = d.toISOString().split('T')[0];
            }
            if (this.el.poNotes) this.el.poNotes.value = '';
            if (this.el.poQty) this.el.poQty.value = '';
            if (this.el.poPrice) this.el.poPrice.value = '';
        }
    };

    window.InventoryModule.addPurchaseItem = function() {
        var productId = this.el.poProduct ? this.el.poProduct.value : '';
        var qty = this.el.poQty ? parseInt(this.el.poQty.value) || 0 : 0;
        var price = this.el.poPrice ? parseFloat(this.el.poPrice.value) || 0 : 0;

        if (!productId) { this.toast('请选择产品', 'error'); return; }
        if (qty <= 0) { this.toast('请输入有效数量', 'error'); return; }

        var products = AppStore.get('allProducts') || [];
        var product = products.find(function(p) { return p.id === productId; });

        this.poItems.push({
            product_id: productId,
            product_name: product ? product.name : '未知',
            quantity: qty,
            unit_price: price,
            total: qty * price
        });

        if (this.el.poQty) this.el.poQty.value = '';
        if (this.el.poPrice) this.el.poPrice.value = '';
        this.updatePOItems();
    };

    window.InventoryModule.removePOItem = function(index) {
        this.poItems.splice(index, 1);
        this.updatePOItems();
    };

    window.InventoryModule.updatePOItems = function() {
        var list = this.el.poItemsList;
        if (!list) return;

        if (this.poItems.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-2">暂无采购项</div>';
            this.updatePOTotals();
            return;
        }

        var html = '';
        var subtotal = 0;
        this.poItems.forEach(function(item, index) {
            subtotal += item.total;
            html += '<div class="flex justify-between items-center p-1 border-b text-sm">';
            html += '<span>' + item.product_name + ' × ' + item.quantity + '</span>';
            html += '<span>' + item.total.toFixed(2) + ' SAR</span>';
            html += '<button onclick="InventoryModule.removePOItem(' + index + ')" class="text-red-500 hover:text-red-700 text-xs"><i class="fas fa-trash"></i></button>';
            html += '</div>';
        });
        list.innerHTML = html;
        this.updatePOTotals(subtotal);
    };

    window.InventoryModule.updatePOTotals = function(subtotal) {
        subtotal = subtotal || 0;
        var vat = subtotal * 0.15;
        var total = subtotal + vat;

        if (this.el.poSubtotal) this.el.poSubtotal.textContent = subtotal.toFixed(2) + ' SAR';
        if (this.el.poVat) this.el.poVat.textContent = vat.toFixed(2) + ' SAR';
        if (this.el.poTotal) this.el.poTotal.textContent = total.toFixed(2) + ' SAR';
    };

    window.InventoryModule.submitPurchaseOrder = function() {
        var self = this;
        var currentUser = this.getCurrentUser();

        var supplierId = this.el.poSupplier ? this.el.poSupplier.value : '';
        var orderDate = this.el.poDate ? this.el.poDate.value : new Date().toISOString().split('T')[0];
        var delivery = this.el.poDelivery ? this.el.poDelivery.value : null;
        var notes = this.el.poNotes ? this.el.poNotes.value.trim() : '';

        if (!supplierId) { this.toast('请选择供应商', 'error'); return; }
        if (this.poItems.length === 0) { this.toast('请添加采购项', 'error'); return; }

        var tenant = AppStore.get('currentTenant');
        var store = AppStore.get('currentStore');

        // 计算总计
        var subtotal = this.poItems.reduce(function(s, item) { return s + item.total; }, 0);
        var vat = subtotal * 0.15;
        var total = subtotal + vat;

        // 生成 PO 编号
        var poNumber = 'PO-' + Date.now().toString().slice(-8);

        var poData = {
            po_number: poNumber,
            tenant_id: tenant ? tenant.id : null,
            store_id: store ? store.id : null,
            supplier_id: supplierId,
            order_date: orderDate,
            expected_delivery: delivery,
            subtotal: subtotal,
            vat_rate: 15,
            vat_amount: vat,
            total: total,
            notes: notes,
            status: 'draft',
            created_by: currentUser ? currentUser.id : null
        };

        AppApi.insert('purchase_orders', poData)
            .then(function(poResult) {
                if (poResult && poResult.length > 0) {
                    var poId = poResult[0].id;
                    // 插入采购项
                    var items = self.poItems.map(function(item) {
                        return {
                            purchase_order_id: poId,
                            product_id: item.product_id,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            total: item.total
                        };
                    });
                    return AppApi.insert('purchase_order_items', items);
                }
                return null;
            })
            .then(function() {
                self.toast('✅ 采购单已创建: ' + poNumber, 'success');
                self.closeModal('purchaseOrderModal');
                self.poItems = [];
                self.loadPurchaseOrders();
            })
            .catch(function(error) {
                self.toast('❌ 创建失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 库存调整
    // ============================================================

    window.InventoryModule.showStockAdjust = function() {
        var modal = this.el.stockAdjustModal;
        if (modal) {
            this.loadProducts();
            modal.classList.remove('hidden');
            if (this.el.adjustNewQty) this.el.adjustNewQty.value = '';
            if (this.el.adjustNote) this.el.adjustNote.value = '';
        }
    };

    window.InventoryModule.loadProductForAdjust = function(productId) {
        if (!productId) {
            if (this.el.adjustCurrentQty) this.el.adjustCurrentQty.value = '';
            return;
        }
        var products = AppStore.get('allProducts') || [];
        var product = products.find(function(p) { return p.id === productId; });
        if (product && this.el.adjustCurrentQty) {
            this.el.adjustCurrentQty.value = product.current_quantity || 0;
        }
    };

    window.InventoryModule.submitStockAdjust = function() {
        var self = this;
        var currentUser = this.getCurrentUser();

        var productId = this.el.adjustProduct ? this.el.adjustProduct.value : '';
        var newQty = this.el.adjustNewQty ? parseInt(this.el.adjustNewQty.value) || 0 : 0;
        var reason = this.el.adjustReason ? this.el.adjustReason.value : 'adjustment';
        var note = this.el.adjustNote ? this.el.adjustNote.value.trim() : '';

        if (!productId) { this.toast('请选择产品', 'error'); return; }
        if (newQty < 0) { this.toast('数量不能为负数', 'error'); return; }

        var products = AppStore.get('allProducts') || [];
        var product = products.find(function(p) { return p.id === productId; });
        if (!product) { this.toast('产品不存在', 'error'); return; }

        var oldQty = product.current_quantity || 0;
        var diff = newQty - oldQty;

        // 更新产品库存
        AppApi.update('products', productId, { current_quantity: newQty })
            .then(function() {
                product.current_quantity = newQty;
                AppStore.set('allProducts', products);
                self.loadProducts();

                // 记录库存调整日志
                return AppApi.insert('inventory_transactions', [{
                    tenant_id: AppStore.get('currentTenant') ? AppStore.get('currentTenant').id : null,
                    store_id: AppStore.get('currentStore') ? AppStore.get('currentStore').id : null,
                    product_id: productId,
                    type: 'adjustment',
                    quantity: diff,
                    previous_quantity: oldQty,
                    new_quantity: newQty,
                    notes: reason + ': ' + note,
                    created_by: currentUser ? currentUser.id : null
                }]);
            })
            .then(function() {
                self.toast('✅ 库存已调整: ' + product.name + ' → ' + newQty, 'success');
                self.closeModal('stockAdjustModal');
            })
            .catch(function(error) {
                self.toast('❌ 调整失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 编辑产品（简化版）
    // ============================================================

    window.InventoryModule.editProduct = function(productId) {
        var products = AppStore.get('allProducts') || [];
        var product = products.find(function(p) { return p.id === productId; });
        if (!product) {
            this.toast('产品不存在', 'error');
            return;
        }

        // 填充表单并打开
        if (this.el.productName) this.el.productName.value = product.name || '';
        if (this.el.productUnit) this.el.productUnit.value = product.unit || '个';
        if (this.el.productCost) this.el.productCost.value = product.cost_price || 0;
        if (this.el.productSellPrice) this.el.productSellPrice.value = product.selling_price || 0;
        if (this.el.productQty) this.el.productQty.value = product.current_quantity || 0;
        if (this.el.productMinQty) this.el.productMinQty.value = product.min_quantity || 5;
        if (this.el.productDesc) this.el.productDesc.value = product.description || '';

        // 设置分类
        if (this.el.productCategory) {
            var options = this.el.productCategory.options;
            for (var i = 0; i < options.length; i++) {
                if (options[i].value === product.category_id) {
                    options[i].selected = true;
                    break;
                }
            }
        }

        // 修改保存按钮行为
        var self = this;
        var saveBtn = document.querySelector('#addProductModal .btn-primary');
        if (saveBtn) {
            saveBtn.textContent = '💾 更新产品';
            saveBtn.onclick = function() {
                self.updateProduct(productId);
            };
        }

        if (this.el.addProductModal) this.el.addProductModal.classList.remove('hidden');
    };

    window.InventoryModule.updateProduct = function(productId) {
        var self = this;
        var name = this.el.productName ? this.el.productName.value.trim() : '';
        var categoryId = this.el.productCategory ? this.el.productCategory.value : null;
        var unit = this.el.productUnit ? this.el.productUnit.value.trim() || '个' : '个';
        var cost = this.el.productCost ? parseFloat(this.el.productCost.value) || 0 : 0;
        var sellPrice = this.el.productSellPrice ? parseFloat(this.el.productSellPrice.value) || 0 : 0;
        var minQty = this.el.productMinQty ? parseInt(this.el.productMinQty.value) || 5 : 5;
        var desc = this.el.productDesc ? this.el.productDesc.value.trim() : '';

        if (!name) {
            this.toast('请输入产品名称', 'error');
            return;
        }

        AppApi.update('products', productId, {
            name: name,
            category_id: categoryId,
            unit: unit,
            cost_price: cost,
            selling_price: sellPrice,
            min_quantity: minQty,
            description: desc,
            updated_at: new Date().toISOString()
        })
            .then(function() {
                self.toast('✅ 产品已更新: ' + name, 'success');
                self.closeModal('addProductModal');
                self.loadProducts();
                // 恢复保存按钮
                var saveBtn = document.querySelector('#addProductModal .btn-primary');
                if (saveBtn) {
                    saveBtn.textContent = '💾 保存产品';
                    saveBtn.onclick = function() { self.saveProduct(); };
                }
            })
            .catch(function(error) {
                self.toast('❌ 更新失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 关闭模态框
    // ============================================================

    window.InventoryModule.closeModal = function(modalId) {
        var modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');

        // 恢复保存按钮
        if (modalId === 'addProductModal') {
            var saveBtn = document.querySelector('#addProductModal .btn-primary');
            if (saveBtn) {
                saveBtn.textContent = '💾 保存产品';
                saveBtn.onclick = function() { window.InventoryModule.saveProduct(); };
            }
        }
    };

    console.log('[Inventory] 模块已注册');
})();