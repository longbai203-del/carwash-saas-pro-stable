/**
 * cashier.js - POS收银模块 V2.3
 * 三栏式布局 + QRCode.js 二维码生成
 * 优化：打印功能异步化，减少 INP 阻塞
 */
(function() {
    'use strict';

    window.CashierModule = Object.create(ModuleBase);
    window.CashierModule.moduleName = 'cashier';

    // ============================================================
    // 服务数据
    // ============================================================
    window.CashierModule.services = [
        { id: 's1', name: '基础清洗', price: 30, category: 'wash', icon: '🧽', desc: '外部冲洗+擦干', popular: true },
        { id: 's2', name: '深度清洗', price: 55, category: 'wash', icon: '🧼', desc: '内外深度清洁', popular: true },
        { id: 's3', name: '全车精洗', price: 110, category: 'wash', icon: '🚗', desc: '内外全面清洁+打蜡', popular: true },
        { id: 's4', name: '外部抛光', price: 65, category: 'detail', icon: '✨', desc: '漆面抛光去划痕' },
        { id: 's5', name: '内部护理', price: 70, category: 'detail', icon: '🪑', desc: '内饰深度护理' },
        { id: 's6', name: '全车镀晶', price: 299, category: 'detail', icon: '💎', desc: '全车镀晶保护' },
        { id: 'p1', name: '月度洗车卡', price: 299, category: 'package', icon: '📅', desc: '30天无限次基础洗' },
        { id: 'p2', name: '季度护理套餐', price: 899, category: 'package', icon: '📦', desc: '精洗+抛光+内部护理' },
        { id: 'pr1', name: '车用香薰', price: 25, category: 'product', icon: '🌺', desc: '车载香薰' },
        { id: 'pr2', name: '玻璃清洁液', price: 18, category: 'product', icon: '🧴', desc: '500ml玻璃清洁' },
        { id: 'pr3', name: '轮胎光亮剂', price: 22, category: 'product', icon: '⚫', desc: '轮胎养护' }
    ];

    // ============================================================
    // 状态
    // ============================================================
    window.CashierModule.cart = [];
    window.CashierModule.selectedCustomer = null;
    window.CashierModule.selectedPayment = null;
    window.CashierModule.currentFilter = 'all';
    window.CashierModule.recentServices = [];
    window.CashierModule.currentOrderStatus = 'pending';
    window.CashierModule._couponDiscount = 0;
    window.CashierModule._pointsDiscount = 0;
    window.CashierModule._currentOrderNumber = null;
    window.CashierModule._currentInvoiceNumber = null;
    
    // 打印队列
    window.CashierModule._printQueue = [];
    window.CashierModule._isPrinting = false;

    // ============================================================
    // 缓存 DOM
    // ============================================================
    window.CashierModule.cacheDom = function() {
        this.el = {
            quickSearch: this.getEl('posQuickSearch'),
            cashierName: this.getEl('posCashierName'),
            cashierStatus: this.getEl('cashierStatus'),
            plate: this.getEl('posPlate'),
            phone: this.getEl('posPhone'),
            customerCard: this.getEl('customerCard'),
            guestHint: this.getEl('guestHint'),
            custDisplayName: this.getEl('custDisplayName'),
            custDisplayPhone: this.getEl('custDisplayPhone'),
            custDisplayPlate: this.getEl('custDisplayPlate'),
            custDisplayLevel: this.getEl('custDisplayLevel'),
            custDisplayBalance: this.getEl('custDisplayBalance'),
            custDisplayPoints: this.getEl('custDisplayPoints'),
            custDisplayVisits: this.getEl('custDisplayVisits'),
            custDisplayPackage: this.getEl('custDisplayPackage'),
            serviceGrid: this.getEl('serviceGrid'),
            serviceSearch: this.getEl('serviceSearch'),
            recentServices: this.getEl('recentServices'),
            cartItems: this.getEl('cartItems'),
            cartSubtotal: this.getEl('cartSubtotal'),
            cartDiscount: this.getEl('cartDiscount'),
            cartVat: this.getEl('cartVat'),
            cartTotal: this.getEl('cartTotal'),
            selectedPayment: this.getEl('selectedPayment'),
            couponInput: this.getEl('couponInput'),
            checkoutBtn: this.getEl('checkoutBtn'),
            splitPaymentArea: this.getEl('splitPaymentArea'),
            splitCash: this.getEl('splitCash'),
            splitMada: this.getEl('splitMada'),
            splitCard: this.getEl('splitCard'),
            splitRemaining: this.getEl('splitRemaining'),
            queuePending: this.getEl('queuePending'),
            queueInProgress: this.getEl('queueInProgress'),
            queueCompleted: this.getEl('queueCompleted'),
            queueDelivered: this.getEl('queueDelivered'),
            todayRevenue: this.getEl('todayRevenue'),
            todayOrderCount: this.getEl('todayOrderCount')
        };
        this.cart = [];
        this.recentServices = JSON.parse(localStorage.getItem('recentServices') || '[]');
    };

    // ============================================================
    // 绑定事件
    // ============================================================
    window.CashierModule.bindEvents = function() {
        var self = this;

        if (this.el.quickSearch) {
            this.el.quickSearch.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') self.quickSearch();
            });
        }
        if (this.el.plate) {
            this.el.plate.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') self.searchPlate();
            });
        }
        if (this.el.serviceSearch) {
            this.el.serviceSearch.addEventListener('input', function() {
                self.renderServices();
            });
        }
        ['splitCash', 'splitMada', 'splitCard'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', function() {
                    self.updateSplitRemaining();
                });
            }
        });
    };

    // ============================================================
    // 加载数据
    // ============================================================
    window.CashierModule.loadData = function() {
        var user = AppStore.get('currentUser');
        if (user && this.el.cashierName) {
            this.el.cashierName.textContent = user.name || user.username;
        }
        this.renderServices();
        this.renderRecentServices();
        this.updateCart();
        this.updateQueue();
        this.updateTodayStats();
        this.updateStatus();
        this.loadStores();
    };

    // ============================================================
    // 门店
    // ============================================================
    window.CashierModule.loadStores = function() {
        var stores = AppStore.get('allStores') || [];
        var sel = document.getElementById('posStoreSelect');
        if (sel) {
            var html = '';
            stores.forEach(function(s) {
                html += '<option value="' + s.id + '">' + s.name + '</option>';
            });
            sel.innerHTML = html || '<option value="main">总部店</option>';
        }
    };

    // ============================================================
    // 状态
    // ============================================================
    window.CashierModule.updateStatus = function() {
        if (this.el.cashierStatus) {
            var client = window.SupabaseService ? window.SupabaseService.getClient() : null;
            if (client) {
                this.el.cashierStatus.textContent = '🟢 在线';
                this.el.cashierStatus.className = 'text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full';
            } else {
                this.el.cashierStatus.textContent = '🔴 离线';
                this.el.cashierStatus.className = 'text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full';
            }
        }
    };

    // ============================================================
    // 快速搜索
    // ============================================================
    window.CashierModule.quickSearch = function() {
        var query = this.el.quickSearch ? this.el.quickSearch.value.trim() : '';
        if (!query) {
            this.toast('请输入车牌或手机号', 'error');
            return;
        }
        if (this.el.plate) {
            this.el.plate.value = query.toUpperCase();
        }
        this.searchPlate();
    };

    // ============================================================
    // 车牌搜索
    // ============================================================
    window.CashierModule.searchPlate = function() {
        var plate = this.el.plate ? this.el.plate.value.trim().toUpperCase() : '';
        if (!plate) {
            this.toast('请输入车牌号', 'error');
            return;
        }

        var customers = AppStore.get('allCustomers') || [];
        var customer = null;
        for (var i = 0; i < customers.length; i++) {
            if (customers[i].plate_number === plate) {
                customer = customers[i];
                break;
            }
        }

        if (customer) {
            this.selectedCustomer = customer;
            this.showCustomerInfo(customer);
            if (this.el.guestHint) this.el.guestHint.classList.add('hidden');
            this.toast('👤 找到客户: ' + (customer.name || customer.phone), 'success');
        } else {
            this.selectedCustomer = null;
            this.hideCustomerInfo();
            if (this.el.guestHint) this.el.guestHint.classList.remove('hidden');
            this.toast('⚠️ 未找到该车牌，可点击 "+" 快速添加', 'warning');
        }
    };

    // ============================================================
    // 客户信息显示
    // ============================================================
    window.CashierModule.showCustomerInfo = function(customer) {
        var card = this.el.customerCard;
        if (!card) return;
        card.classList.remove('hidden');
        if (this.el.guestHint) this.el.guestHint.classList.add('hidden');

        if (this.el.custDisplayName) this.el.custDisplayName.textContent = customer.name || '-';
        if (this.el.custDisplayPhone) this.el.custDisplayPhone.textContent = customer.phone || '-';
        if (this.el.custDisplayPlate) this.el.custDisplayPlate.textContent = customer.plate_number || '-';
        if (this.el.custDisplayBalance) this.el.custDisplayBalance.textContent = (customer.balance || 0).toFixed(2) + ' SAR';
        if (this.el.custDisplayPoints) this.el.custDisplayPoints.textContent = customer.points || 0;
        if (this.el.custDisplayVisits) this.el.custDisplayVisits.textContent = customer.visit_count || 0;
        if (this.el.custDisplayLevel) {
            var level = customer.level || '普通';
            this.el.custDisplayLevel.textContent = level;
            this.el.custDisplayLevel.className = 'customer-level customer-level-' + level.toLowerCase();
        }
        if (this.el.custDisplayPackage) {
            this.el.custDisplayPackage.textContent = customer.package_name || '-';
        }
    };

    window.CashierModule.hideCustomerInfo = function() {
        if (this.el.customerCard) this.el.customerCard.classList.add('hidden');
        if (this.el.guestHint) this.el.guestHint.classList.remove('hidden');
    };

    // ============================================================
    // 快速添加客户
    // ============================================================
    window.CashierModule.showQuickAddCustomer = function() {
        var modal = document.getElementById('quickAddCustomerModal');
        if (modal) {
            modal.classList.remove('hidden');
            var plate = this.el.plate ? this.el.plate.value.trim().toUpperCase() : '';
            if (plate) {
                document.getElementById('quickCustPlate').value = plate;
            }
            setTimeout(function() {
                document.getElementById('quickCustName').focus();
            }, 100);
        }
    };

    window.CashierModule.closeQuickAddCustomer = function() {
        var modal = document.getElementById('quickAddCustomerModal');
        if (modal) modal.classList.add('hidden');
    };

    window.CashierModule.saveQuickCustomer = function() {
        var self = this;
        var plate = document.getElementById('quickCustPlate').value.trim().toUpperCase();
        var name = document.getElementById('quickCustName').value.trim();
        var phone = document.getElementById('quickCustPhone').value.trim();

        if (!plate || !name) {
            this.toast('请填写车牌和姓名', 'error');
            return;
        }

        var tenant = AppStore.get('currentTenant');
        var store = AppStore.get('currentStore');

        var customerData = {
            tenant_id: tenant ? tenant.id : null,
            store_id: store ? store.id : null,
            name: name,
            phone: phone || '',
            plate_number: plate,
            points: 0,
            balance: 0,
            level: '普通',
            visit_count: 0
        };

        AppApi.insert('customers', customerData)
            .then(function(data) {
                if (data && data.length > 0) {
                    var customers = AppStore.get('allCustomers') || [];
                    customers.push(data[0]);
                    AppStore.set('allCustomers', customers);
                    self.selectedCustomer = data[0];
                    self.showCustomerInfo(data[0]);
                    self.closeQuickAddCustomer();
                    self.toast('✅ 客户已添加: ' + name, 'success');
                }
            })
            .catch(function(error) {
                self.toast('❌ 添加失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 服务网格
    // ============================================================
    window.CashierModule.renderServices = function() {
        var grid = this.el.serviceGrid;
        if (!grid) return;

        var filter = this.currentFilter || 'all';
        var search = this.el.serviceSearch ? this.el.serviceSearch.value.trim().toLowerCase() : '';

        var services = this.services.filter(function(s) {
            var matchFilter = filter === 'all' || s.category === filter;
            var matchSearch = !search || s.name.toLowerCase().indexOf(search) !== -1 || s.desc.toLowerCase().indexOf(search) !== -1;
            return matchFilter && matchSearch;
        });

        if (services.length === 0) {
            grid.innerHTML = '<div class="col-span-2 text-center text-gray-400 py-8 text-sm">未找到服务</div>';
            return;
        }

        var html = '';
        services.forEach(function(s) {
            var popularBadge = s.popular ? '<span class="text-[8px] bg-amber-100 text-amber-600 px-1 rounded-full ml-1">热门</span>' : '';
            html += '<div onclick="CashierModule.addToCart(\'' + s.id + '\')" ' +
                    'class="service-item bg-gray-50 hover:bg-blue-50 rounded-xl p-2 border hover:border-blue-300 cursor-pointer transition">' +
                    '<div class="flex items-center gap-2">' +
                    '<span class="text-lg">' + s.icon + '</span>' +
                    '<div class="flex-1 min-w-0">' +
                    '<div class="font-medium text-sm truncate">' + s.name + popularBadge + '</div>' +
                    '<div class="text-xs font-bold text-blue-600">' + s.price.toFixed(2) + ' SAR</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
        });
        grid.innerHTML = html;
    };

    window.CashierModule.filterServices = function(category) {
        if (category) {
            this.currentFilter = category;
            var btns = document.querySelectorAll('.tab-btn');
            for (var i = 0; i < btns.length; i++) {
                btns[i].classList.remove('active');
                if (btns[i].dataset.cat === category) {
                    btns[i].classList.add('active');
                }
            }
        }
        this.renderServices();
    };

    // ============================================================
    // 最近服务
    // ============================================================
    window.CashierModule.renderRecentServices = function() {
        var el = this.el.recentServices;
        if (!el) return;

        var recent = this.recentServices.slice(0, 6);
        if (recent.length === 0) {
            el.innerHTML = '<span class="text-xs text-gray-400">暂无最近使用</span>';
            return;
        }

        var html = '';
        for (var i = 0; i < recent.length; i++) {
            var id = recent[i];
            var service = null;
            for (var j = 0; j < this.services.length; j++) {
                if (this.services[j].id === id) {
                    service = this.services[j];
                    break;
                }
            }
            if (service) {
                html += '<button onclick="CashierModule.addToCart(\'' + service.id + '\')" ' +
                        'class="text-xs bg-gray-100 hover:bg-blue-100 px-2 py-1 rounded-lg">' +
                        service.icon + ' ' + service.name +
                        '</button>';
            }
        }
        el.innerHTML = html;
    };

    // ============================================================
    // 添加到购物车
    // ============================================================
    window.CashierModule.addToCart = function(serviceId) {
        var service = null;
        for (var i = 0; i < this.services.length; i++) {
            if (this.services[i].id === serviceId) {
                service = this.services[i];
                break;
            }
        }
        if (!service) return;

        var existing = null;
        for (var j = 0; j < this.cart.length; j++) {
            if (this.cart[j].id === serviceId) {
                existing = this.cart[j];
                break;
            }
        }
        if (existing) {
            existing.qty += 1;
        } else {
            this.cart.push({
                id: service.id,
                name: service.name,
                price: service.price,
                icon: service.icon,
                qty: 1
            });
        }

        this.recentServices = this.recentServices.filter(function(id) { return id !== serviceId; });
        this.recentServices.unshift(serviceId);
        if (this.recentServices.length > 20) this.recentServices.pop();
        localStorage.setItem('recentServices', JSON.stringify(this.recentServices));

        this.updateCart();
        this.renderRecentServices();
        this.toast('✅ 已添加: ' + service.name, 'success');
    };

    // ============================================================
    // 购物车
    // ============================================================
    window.CashierModule.updateCart = function() {
        var list = this.el.cartItems;
        if (!list) return;

        if (this.cart.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-8 text-sm">请选择服务</div>';
            this.updateTotals();
            return;
        }

        var html = '';
        for (var i = 0; i < this.cart.length; i++) {
            var item = this.cart[i];
            var total = item.price * item.qty;
            html += '<div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">' +
                    '<div class="flex items-center gap-2">' +
                    '<span>' + item.icon + '</span>' +
                    '<span class="text-sm font-medium">' + item.name + '</span>' +
                    '<div class="flex items-center gap-1">' +
                    '<button onclick="CashierModule.changeQty(' + i + ', -1)" class="text-xs text-gray-400 hover:text-blue-600 w-5 h-5 rounded-full hover:bg-blue-50">−</button>' +
                    '<span class="text-xs w-5 text-center">' + item.qty + '</span>' +
                    '<button onclick="CashierModule.changeQty(' + i + ', 1)" class="text-xs text-gray-400 hover:text-blue-600 w-5 h-5 rounded-full hover:bg-blue-50">+</button>' +
                    '</div>' +
                    '</div>' +
                    '<div class="flex items-center gap-2">' +
                    '<span class="text-sm font-bold text-blue-600">' + total.toFixed(2) + ' SAR</span>' +
                    '<button onclick="CashierModule.removeFromCart(' + i + ')" class="text-red-400 hover:text-red-600 text-xs">✕</button>' +
                    '</div>' +
                    '</div>';
        }
        list.innerHTML = html;
        this.updateTotals();
    };

    window.CashierModule.changeQty = function(index, delta) {
        if (index < 0 || index >= this.cart.length) return;
        var item = this.cart[index];
        item.qty = Math.max(1, item.qty + delta);
        this.updateCart();
    };

    window.CashierModule.removeFromCart = function(index) {
        if (index < 0 || index >= this.cart.length) return;
        this.cart.splice(index, 1);
        this.updateCart();
    };

    window.CashierModule.clearCart = function() {
        if (this.cart.length === 0) return;
        if (!confirm('确认清空购物车？')) return;
        this.cart = [];
        this._couponDiscount = 0;
        this._pointsDiscount = 0;
        this.selectedPayment = null;
        this.currentOrderStatus = 'pending';
        this.updateCart();
        this.resetPaymentUI();
        this.toast('🗑️ 已清空购物车', 'info');
    };

    // ============================================================
    // 结算
    // ============================================================
    window.CashierModule.updateTotals = function() {
        var subtotal = 0;
        for (var i = 0; i < this.cart.length; i++) {
            subtotal += this.cart[i].price * this.cart[i].qty;
        }

        var discount = this._couponDiscount + this._pointsDiscount;
        var vatRate = 15;
        var vat = (subtotal - discount) * vatRate / 100;
        var total = subtotal - discount + vat;

        if (this.el.cartSubtotal) this.el.cartSubtotal.textContent = subtotal.toFixed(2) + ' SAR';
        if (this.el.cartDiscount) this.el.cartDiscount.textContent = discount.toFixed(2) + ' SAR';
        if (this.el.cartVat) this.el.cartVat.textContent = vat.toFixed(2) + ' SAR';
        if (this.el.cartTotal) this.el.cartTotal.textContent = total.toFixed(2) + ' SAR';

        return total;
    };

    window.CashierModule.getTotal = function() {
        var subtotal = 0;
        for (var i = 0; i < this.cart.length; i++) {
            subtotal += this.cart[i].price * this.cart[i].qty;
        }
        var discount = this._couponDiscount + this._pointsDiscount;
        var vatRate = 15;
        return subtotal - discount + (subtotal - discount) * vatRate / 100;
    };

    // ============================================================
    // 支付方式
    // ============================================================
    window.CashierModule.selectPayment = function(method) {
        this.selectedPayment = method;
        var labels = {
            cash: '💰 现金',
            mada: '🇸🇦 mada',
            visa: '💳 Visa',
            mastercard: '💳 Mastercard',
            apple_pay: '📱 Apple Pay',
            stc_pay: '📱 STC Pay'
        };
        if (this.el.selectedPayment) {
            this.el.selectedPayment.textContent = '✅ 已选择: ' + (labels[method] || method);
            this.el.selectedPayment.className = 'text-xs text-green-600 mt-1 text-center';
        }
        var btns = document.querySelectorAll('.payment-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.remove('border-blue-400', 'bg-blue-50');
            if (btns[i].dataset.payment === method) {
                btns[i].classList.add('border-blue-400', 'bg-blue-50');
            }
        }
        if (this.el.splitPaymentArea) {
            this.el.splitPaymentArea.classList.add('hidden');
        }
    };

    // ============================================================
    // 混合支付
    // ============================================================
    window.CashierModule.showSplitPayment = function() {
        if (this.el.splitPaymentArea) {
            this.el.splitPaymentArea.classList.toggle('hidden');
            if (!this.el.splitPaymentArea.classList.contains('hidden')) {
                this.updateSplitRemaining();
            }
        }
    };

    window.CashierModule.updateSplitRemaining = function() {
        var total = this.getTotal();
        var cash = parseFloat(document.getElementById('splitCash')?.value) || 0;
        var mada = parseFloat(document.getElementById('splitMada')?.value) || 0;
        var card = parseFloat(document.getElementById('splitCard')?.value) || 0;
        var paid = cash + mada + card;
        var remaining = total - paid;

        if (this.el.splitRemaining) {
            if (remaining > 0) {
                this.el.splitRemaining.textContent = remaining.toFixed(2);
                this.el.splitRemaining.className = 'text-xs text-red-600';
            } else {
                this.el.splitRemaining.textContent = '0.00 (已付清)';
                this.el.splitRemaining.className = 'text-xs text-green-600';
            }
        }
    };

    // ============================================================
    // 优惠券/积分
    // ============================================================
    window.CashierModule.applyCoupon = function() {
        var input = this.el.couponInput;
        if (!input) return;
        var code = input.value.trim();
        if (!code) {
            this.toast('请输入优惠券码', 'error');
            return;
        }

        if (code === 'WELCOME10') {
            this._couponDiscount = 10;
            this.updateCart();
            this.toast('✅ 优惠券已应用: -10 SAR', 'success');
        } else if (code === 'VIP20') {
            this._couponDiscount = 20;
            this.updateCart();
            this.toast('✅ 优惠券已应用: -20 SAR', 'success');
        } else {
            this.toast('❌ 无效优惠券码', 'error');
        }
        input.value = '';
    };

    window.CashierModule.usePoints = function() {
        var customer = this.selectedCustomer;
        if (!customer) {
            this.toast('请先选择客户', 'error');
            return;
        }
        var points = customer.points || 0;
        if (points < 100) {
            this.toast('积分不足，至少需要100积分', 'error');
            return;
        }
        var discount = Math.floor(points / 100) * 5;
        this._pointsDiscount = Math.min(discount, this.getTotal() * 0.3);
        this.updateCart();
        this.toast('✅ 已使用 ' + Math.ceil(this._pointsDiscount / 5 * 100) + ' 积分抵扣 ' + this._pointsDiscount.toFixed(2) + ' SAR', 'success');
    };

    // ============================================================
    // 收款（优化版 - 使用 setTimeout 减少阻塞）
    // ============================================================
    window.CashierModule.checkout = function() {
        if (this.cart.length === 0) {
            this.toast('购物车为空', 'error');
            return;
        }

        if (!this.selectedPayment) {
            this.toast('请选择支付方式', 'error');
            return;
        }

        var currentUser = AppStore.get('currentUser') || {};
        if (!currentUser.id) {
            this.toast('请先登录', 'error');
            return;
        }

        // 禁用按钮，防止重复点击
        var btn = this.el.checkoutBtn;
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
        }

        // 使用 setTimeout 延迟执行，减少 UI 阻塞
        var self = this;
        setTimeout(function() {
            self._processCheckout();
        }, 50);
    };

    window.CashierModule._processCheckout = function() {
        var self = this;
        var total = this.getTotal();
        var currentUser = AppStore.get('currentUser') || {};

        var cash = parseFloat(document.getElementById('splitCash')?.value) || 0;
        var mada = parseFloat(document.getElementById('splitMada')?.value) || 0;
        var card = parseFloat(document.getElementById('splitCard')?.value) || 0;
        var splitTotal = cash + mada + card;

        var paymentMethod = this.selectedPayment;

        if (splitTotal > 0) {
            if (Math.abs(splitTotal - total) > 0.01) {
                this.toast('混合支付金额不匹配！总计: ' + total.toFixed(2) + ' SAR', 'error');
                // 恢复按钮
                var btn = this.el.checkoutBtn;
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-check"></i> 完成收款';
                }
                return;
            }
            paymentMethod = '混合支付';
        }

        var plate = this.selectedCustomer ? (this.selectedCustomer.plate_number || 'GUEST') : 'GUEST';
        var today = new Date().toISOString().split('T')[0];
        var orderNumber = 'ORD-' + today.replace(/-/g, '') + '-' + String(Date.now()).slice(-6);
        var invoiceNumber = 'INV-' + today.replace(/-/g, '') + '-' + String(Date.now()).slice(-6);

        this._currentOrderNumber = orderNumber;
        this._currentInvoiceNumber = invoiceNumber;

        var serviceNames = '';
        for (var i = 0; i < this.cart.length; i++) {
            if (i > 0) serviceNames += ', ';
            serviceNames += this.cart[i].name + '×' + this.cart[i].qty;
        }

        var subtotal = 0;
        for (var j = 0; j < this.cart.length; j++) {
            subtotal += this.cart[j].price * this.cart[j].qty;
        }
        var discount = this._couponDiscount + this._pointsDiscount;
        var vatRate = 15;
        var vat = (subtotal - discount) * vatRate / 100;

        var posTxnId = document.getElementById('posTransactionId')?.value || '';

        var orderData = {
            order_number: orderNumber,
            plate_number: plate,
            customer_id: this.selectedCustomer ? this.selectedCustomer.id : null,
            employee_id: currentUser.id,
            staff_name: currentUser.name || currentUser.username,
            service_name: serviceNames,
            amount: subtotal,
            discount: discount,
            vat: vat,
            total: total,
            payment_method: paymentMethod,
            status: this.currentOrderStatus || 'pending',
            date: today,
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        AppApi.insert('orders', orderData)
            .then(function(data) {
                if (data && data.length > 0) {
                    var order = data[0];
                    var allOrders = AppStore.get('allOrders') || [];
                    allOrders.unshift(order);
                    AppStore.set('allOrders', allOrders);

                    if (self.selectedCustomer) {
                        var customers = AppStore.get('allCustomers') || [];
                        for (var k = 0; k < customers.length; k++) {
                            if (customers[k].id === self.selectedCustomer.id) {
                                customers[k].visit_count = (customers[k].visit_count || 0) + 1;
                                customers[k].last_visit = new Date().toISOString();
                                customers[k].points = (customers[k].points || 0) + Math.floor(total / 10);
                                break;
                            }
                        }
                        AppStore.set('allCustomers', customers);
                    }

                    var paymentData = {
                        order_id: order.id,
                        amount: total,
                        payment_method: paymentMethod,
                        pos_transaction_id: posTxnId || null,
                        cashier_id: currentUser.id,
                        paid_at: new Date().toISOString()
                    };
                    AppApi.insert('payment_records', paymentData).catch(function() {});

                    self.toast('✅ 收款成功: ' + total.toFixed(2) + ' SAR', 'success');

                    self.cart = [];
                    self._couponDiscount = 0;
                    self._pointsDiscount = 0;
                    self.selectedPayment = null;
                    self.updateCart();
                    self.resetPaymentUI();
                    self.updateQueue();
                    self.updateTodayStats();
                    self.voiceTotal(total);

                    // 恢复按钮
                    var btn = self.el.checkoutBtn;
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-check"></i> 完成收款';
                    }

                    setTimeout(function() {
                        self.showPrintOptions();
                    }, 500);
                }
            })
            .catch(function(error) {
                self.toast('❌ 收款失败: ' + error.message, 'error');
                // 恢复按钮
                var btn = self.el.checkoutBtn;
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-check"></i> 完成收款';
                }
            });
    };

    // ============================================================
    // 重置支付UI
    // ============================================================
    window.CashierModule.resetPaymentUI = function() {
        if (this.el.selectedPayment) {
            this.el.selectedPayment.textContent = '请选择支付方式';
            this.el.selectedPayment.className = 'text-xs text-blue-600 mt-1 text-center';
        }
        var btns = document.querySelectorAll('.payment-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.remove('border-blue-400', 'bg-blue-50');
        }
        if (this.el.splitPaymentArea) {
            this.el.splitPaymentArea.classList.add('hidden');
        }
        if (this.el.couponInput) {
            this.el.couponInput.value = '';
        }
        document.getElementById('posTransactionId').value = '';
    };

    // ============================================================
    // 服务状态联动
    // ============================================================
    window.CashierModule.setOrderStatus = function(status) {
        this.currentOrderStatus = status;
        var labels = {
            pending: '⏳ 等待',
            in_progress: '🔄 施工中',
            completed: '✅ 已完成',
            delivered: '🚗 已交车'
        };
        var btns = document.querySelectorAll('.status-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.remove('border-blue-400', 'bg-blue-50');
            if (btns[i].dataset.status === status) {
                btns[i].classList.add('border-blue-400', 'bg-blue-50');
            }
        }
        this.toast('📌 状态已设为: ' + (labels[status] || status), 'info');
    };

    // ============================================================
    // 队列
    // ============================================================
    window.CashierModule.updateQueue = function() {
        var orders = AppStore.get('allOrders') || [];
        var today = new Date().toISOString().split('T')[0];
        var todayOrders = orders.filter(function(o) { return o.date === today; });

        var counts = { pending: 0, in_progress: 0, completed: 0, delivered: 0 };
        todayOrders.forEach(function(o) {
            if (counts[o.status] !== undefined) counts[o.status]++;
        });

        if (this.el.queuePending) this.el.queuePending.textContent = counts.pending;
        if (this.el.queueInProgress) this.el.queueInProgress.textContent = counts.in_progress;
        if (this.el.queueCompleted) this.el.queueCompleted.textContent = counts.completed;
        if (this.el.queueDelivered) this.el.queueDelivered.textContent = counts.delivered;
    };

    // ============================================================
    // 今日统计
    // ============================================================
    window.CashierModule.updateTodayStats = function() {
        var orders = AppStore.get('allOrders') || [];
        var today = new Date().toISOString().split('T')[0];
        var todayOrders = orders.filter(function(o) { return o.date === today && o.status !== 'cancelled'; });

        var revenue = todayOrders.reduce(function(s, o) { return s + (parseFloat(o.total) || 0); }, 0);

        if (this.el.todayRevenue) this.el.todayRevenue.textContent = revenue.toFixed(2) + ' SAR';
        if (this.el.todayOrderCount) this.el.todayOrderCount.textContent = todayOrders.length;
    };

    // ============================================================
    // 语音播报
    // ============================================================
    window.CashierModule.voiceTotal = function(total) {
        var msg = new SpeechSynthesisUtterance('收款成功，总计 ' + total.toFixed(2) + ' 沙地里亚尔');
        msg.lang = 'zh-CN';
        window.speechSynthesis.speak(msg);
    };

    // ============================================================
    // 轻量二维码生成（优化版）
    // ============================================================
    window.CashierModule.generateLightQR = function(content, size) {
        size = size || 80;
        
        if (!content) return '';
        
        // 检查 QRCode 是否可用
        if (typeof QRCode === 'undefined') {
            // 使用文本替代二维码
            return '<div style="font-size:8px;color:#999;text-align:center;">' + content.substring(0, 30) + '...</div>';
        }
        
        try {
            var div = document.createElement('div');
            var qr = new QRCode(div, {
                text: content,
                width: size,
                height: size,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.L  // 最低纠错级别，最快生成
            });
            
            var canvas = div.querySelector('canvas');
            if (canvas) {
                return '<img src="' + canvas.toDataURL('image/png') + '" alt="QR" style="display:inline-block;margin:3px auto;width:' + size + 'px;height:' + size + 'px;">';
            }
            return '<div style="font-size:8px;color:#999;">QR: ' + content.substring(0, 20) + '...</div>';
        } catch(e) {
            console.warn('[QR] 生成失败，使用备用方案');
            return '<div style="font-size:8px;color:#999;">QR: ' + content.substring(0, 20) + '...</div>';
        }
    };

    // ============================================================
    // 打印功能（异步优化版）
    // ============================================================
    
    // ===== 小票打印 =====
    window.CashierModule.printReceipt = function() {
        this.closePrintOptions();
        this.toast('🖨️ 正在生成小票...', 'info');
        
        var self = this;
        // 使用 requestAnimationFrame + setTimeout 分离UI更新
        requestAnimationFrame(function() {
            setTimeout(function() {
                self._generateReceiptAsync();
            }, 50);
        });
    };

    window.CashierModule._generateReceiptAsync = function() {
        var self = this;
        
        try {
            var data = this._prepareReceiptData();
            
            setTimeout(function() {
                try {
                    var html = self._buildReceiptHTML(data);
                    var win = window.open('', '_blank', 'width=400,height=700');
                    if (win) {
                        win.document.write(html);
                        win.document.close();
                        setTimeout(function() {
                            win.print();
                        }, 300);
                    } else {
                        self.toast('请允许弹窗', 'error');
                    }
                } catch(e) {
                    console.error('[Print] 生成小票HTML失败:', e);
                    self.toast('❌ 打印失败: ' + e.message, 'error');
                }
            }, 100);
        } catch(error) {
            console.error('[Print] 准备数据失败:', error);
            this.toast('❌ 打印失败: ' + error.message, 'error');
        }
    };

    window.CashierModule._prepareReceiptData = function() {
        var config = AppStore.get('config') || {};
        var now = new Date();
        var cart = this.cart || [];
        var customer = this.selectedCustomer || {};
        var total = this.el.cartTotal ? this.el.cartTotal.textContent : '0 SAR';
        var orderNumber = this._currentOrderNumber || 'RCP-' + Date.now().toString().slice(-8);
        
        return {
            shopName: config.shopName || 'Car Wash Pro',
            taxId: config.shopTaxId || 'N/A',
            address: config.shopAddress || '',
            phone: config.shopPhone || '',
            date: now.toLocaleDateString('zh-CN'),
            time: now.toLocaleTimeString('zh-CN'),
            orderNumber: orderNumber,
            cart: cart,
            customer: customer,
            total: total,
            payment: this.selectedPayment || '现金',
            discount: this._couponDiscount + this._pointsDiscount,
            receiptFooter: config.receiptFooter || '欢迎再次光临'
        };
    };

    window.CashierModule._buildReceiptHTML = function(data) {
        // 计算小计
        var subtotal = 0;
        data.cart.forEach(function(item) {
            subtotal += item.price * item.qty;
        });
        var discount = data.discount || 0;
        var vatAmount = (subtotal - discount) * 15 / 100;
        
        var html = '<!DOCTYPE html><html><head><title>小票</title><style>';
        html += 'body{font-family:"Courier New",monospace;padding:8px;max-width:280px;margin:auto;font-size:11px;}';
        html += '.center{text-align:center;}';
        html += '.header{font-size:16px;font-weight:bold;}';
        html += '.line{border-top:1px dashed #999;margin:6px 0;}';
        html += '.double-line{border-top:2px solid #000;margin:6px 0;}';
        html += '.row{display:flex;justify-content:space-between;padding:1px 0;}';
        html += '.total{font-size:18px;font-weight:bold;}';
        html += '.footer{font-size:9px;color:#666;margin-top:6px;}';
        html += '.small{font-size:9px;}';
        html += '.qr{text-align:center;margin:4px 0;}';
        html += '@media print{body{padding:4px;}}';
        html += '</style></head><body>';
        
        html += '<div class="center">';
        html += '<div class="header">🧼 ' + data.shopName + '</div>';
        html += '<div class="small">' + data.address + '</div>';
        html += '<div class="small">📞 ' + data.phone + '</div>';
        html += '<div class="line"></div>';
        html += '<div class="row"><span>日期</span><span>' + data.date + ' ' + data.time + '</span></div>';
        html += '<div class="row"><span>单号</span><span>' + data.orderNumber + '</span></div>';
        html += '<div class="row"><span>车牌</span><span><strong>' + (data.customer.plate_number || 'GUEST') + '</strong></span></div>';
        html += '<div class="line"></div>';
        
        // 商品列表
        data.cart.forEach(function(item) {
            var totalPrice = item.price * item.qty;
            html += '<div class="row"><span>' + item.icon + ' ' + item.name + ' ×' + item.qty + '</span><span>' + totalPrice.toFixed(2) + '</span></div>';
        });
        
        html += '<div class="line"></div>';
        if (discount > 0) {
            html += '<div class="row"><span>折扣</span><span>- ' + discount.toFixed(2) + '</span></div>';
        }
        html += '<div class="row"><span>小计</span><span>' + (subtotal - discount).toFixed(2) + '</span></div>';
        html += '<div class="row"><span>VAT 15%</span><span>' + vatAmount.toFixed(2) + '</span></div>';
        html += '<div class="double-line"></div>';
        html += '<div class="row total"><span>总计</span><span>' + data.total + '</span></div>';
        html += '<div class="line"></div>';
        html += '<div class="row"><span>支付</span><span>' + data.payment + '</span></div>';
        html += '<div class="line"></div>';
        html += '<div class="center" style="font-size:13px;">✅ 感谢光临！</div>';
        html += '<div class="footer center">' + data.receiptFooter + '</div>';
        html += '</div>';
        html += '<script>setTimeout(function(){ window.print(); }, 300);<\/script>';
        html += '</body></html>';
        
        return html;
    };

    // ===== 税务发票打印 =====
    window.CashierModule.printTaxInvoice = function() {
        this.closePrintOptions();
        this.toast('🖨️ 正在生成税务发票...', 'info');
        
        var self = this;
        requestAnimationFrame(function() {
            setTimeout(function() {
                self._generateTaxInvoiceAsync();
            }, 50);
        });
    };

    window.CashierModule._generateTaxInvoiceAsync = function() {
        var self = this;
        
        setTimeout(function() {
            try {
                var data = self._prepareInvoiceData();
                var html = self._buildInvoiceHTML(data);
                
                var win = window.open('', '_blank', 'width=900,height=1200');
                if (win) {
                    win.document.write(html);
                    win.document.close();
                    setTimeout(function() {
                        win.print();
                    }, 400);
                } else {
                    self.toast('请允许弹窗', 'error');
                }
            } catch(error) {
                console.error('[Print] 生成发票失败:', error);
                self.toast('❌ 打印失败: ' + error.message, 'error');
            }
        }, 100);
    };

    window.CashierModule._prepareInvoiceData = function() {
        var config = AppStore.get('config') || {};
        var now = new Date();
        var cart = this.cart || [];
        var customer = this.selectedCustomer || {};
        var currentUser = AppStore.get('currentUser') || {};
        var invoiceNumber = this._currentInvoiceNumber || 'INV-' + Date.now().toString().slice(-8);
        
        var subtotal = 0;
        cart.forEach(function(item) {
            subtotal += item.price * item.qty;
        });
        var discount = this._couponDiscount + this._pointsDiscount;
        var vatAmount = (subtotal - discount) * 15 / 100;
        var totalAmount = subtotal - discount + vatAmount;
        
        return {
            shopNameAr: config.companyNameAr || 'شركة الخدمات البترولية',
            shopNameEn: config.companyNameEn || 'Petroleum Services Co.',
            taxId: config.vatNumber || config.shopTaxId || '300056462300003',
            crNumber: config.crNumber || '4030571509',
            address: config.companyAddress || config.shopAddress || 'الرياض، النيسيم الشرقى',
            phone: config.companyPhone || config.shopPhone || '920002667',
            date: now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0'),
            time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
            invoiceNumber: invoiceNumber,
            cart: cart,
            customer: customer,
            currentUser: currentUser,
            subtotal: subtotal,
            discount: discount,
            vatAmount: vatAmount,
            totalAmount: totalAmount,
            payment: this.selectedPayment || 'cash',
            invoiceFooter: config.invoiceFooter || 'شكراً لتعاملكم معنا'
        };
    };

    window.CashierModule._buildInvoiceHTML = function(data) {
        // 生成商品列表HTML
        var itemsHtml = '';
        data.cart.forEach(function(item, index) {
            var totalPrice = item.price * item.qty;
            itemsHtml += '<tr>' +
                '<td>' + (index + 1) + '</td>' +
                '<td>' + item.name + '</td>' +
                '<td>' + item.qty + '</td>' +
                '<td>' + item.price.toFixed(2) + ' SAR</td>' +
                '<td>0.00 SAR</td>' +
                '<td>15%</td>' +
                '<td>' + (totalPrice * 0.15).toFixed(2) + ' SAR</td>' +
                '<td>' + totalPrice.toFixed(2) + ' SAR</td>' +
                '</tr>';
        });
        
        // 二维码内容（简化版）
        var qrContent = 'https://carwash-saas-pro.vercel.app/invoice/' + data.invoiceNumber;
        var qrHtml = this.generateLightQR(qrContent, 120);
        
        var html = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><title>فاتورة ضريبية</title><style>';
        html += 'body{font-family:"Times New Roman",Arial,sans-serif;padding:30px;max-width:900px;margin:auto;background:#f5f5f5;}';
        html += '.invoice{background:white;padding:35px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);}';
        html += '.header{text-align:center;border-bottom:3px solid #1a3a6b;padding-bottom:15px;margin-bottom:20px;}';
        html += '.shop-name-ar{font-size:26px;font-weight:bold;color:#1a3a6b;}';
        html += '.shop-name-en{font-size:16px;color:#666;}';
        html += '.shop-details{font-size:12px;color:#555;margin-top:3px;}';
        html += '.title{text-align:center;font-size:22px;font-weight:bold;background:#f0f4f9;padding:10px;margin:10px 0;border-radius:6px;}';
        html += '.title-en{text-align:center;font-size:14px;color:#666;margin-bottom:15px;}';
        html += '.info-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px 20px;font-size:12px;margin:10px 0;padding:12px;background:#f8fafc;border-radius:6px;}';
        html += '.info-grid .label{font-weight:bold;color:#333;}';
        html += '.table{width:100%;border-collapse:collapse;margin:15px 0;font-size:12px;}';
        html += '.table th{background:#1a3a6b;color:white;padding:8px 6px;text-align:center;font-size:11px;}';
        html += '.table td{padding:6px;text-align:center;border-bottom:1px solid #eee;}';
        html += '.totals{width:55%;margin-right:auto;margin-top:15px;padding:15px;background:#f8fafc;border-radius:6px;}';
        html += '.totals .row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;}';
        html += '.totals .grand-total{font-size:20px;font-weight:bold;color:#1a3a6b;border-top:2px solid #1a3a6b;padding-top:8px;margin-top:4px;}';
        html += '.footer{margin-top:20px;font-size:11px;text-align:center;border-top:1px solid #ddd;padding-top:15px;color:#666;}';
        html += '.declaration{font-size:11px;text-align:justify;margin-top:15px;padding:12px;background:#f9f9f9;border-radius:6px;border-right:3px solid #1a3a6b;}';
        html += '.signature{display:flex;justify-content:space-between;margin-top:20px;font-size:12px;}';
        html += '.signature div{border-top:1px solid #999;padding-top:5px;min-width:150px;}';
        html += '.qr-section{text-align:center;margin:10px 0;}';
        html += '@media print{body{padding:10px;background:white;}.invoice{box-shadow:none;}}';
        html += '</style></head><body>';
        
        html += '<div class="invoice">';
        html += '<div class="header">';
        html += '<div class="shop-name-ar">🧼 ' + data.shopNameAr + '</div>';
        html += '<div class="shop-name-en">' + data.shopNameEn + '</div>';
        html += '<div class="shop-details">' + data.address + ' | 📞 ' + data.phone + '</div>';
        html += '<div class="shop-details">الرقم الضريبي: ' + data.taxId + ' | سجل تجاري: ' + data.crNumber + '</div>';
        html += '</div>';
        html += '<div class="title">فاتورة ضريبية مبسطة</div>';
        html += '<div class="title-en">Simplified Tax Invoice</div>';
        html += '<div class="info-grid">';
        html += '<div><span class="label">رقم الفاتورة:</span> ' + data.invoiceNumber + '</div>';
        html += '<div><span class="label">التاريخ:</span> ' + data.date + ' ' + data.time + '</div>';
        html += '<div><span class="label">نوع الدفع:</span> ' + data.payment + '</div>';
        html += '<div><span class="label">رقم اللوحة:</span> ' + (data.customer.plate_number || '-') + '</div>';
        html += '<div><span class="label">المستفيد:</span> ' + (data.customer.name || 'عميل عام') + '</div>';
        html += '<div><span class="label">الموظف:</span> ' + (data.currentUser.name || data.currentUser.username || '-') + '</div>';
        html += '</div>';
        html += '<table class="table"><thead><tr><th>#</th><th>المنتج / الخدمة</th><th>الكمية</th><th>السعر</th><th>الخصم</th><th>نسبة الضريبة</th><th>الضريبة</th><th>الإجمالي</th></tr></thead><tbody>' + itemsHtml + '</tbody></table>';
        html += '<div class="totals">';
        html += '<div class="row"><span>المبلغ غير شامل الضريبة</span><span>' + (data.subtotal - data.discount).toFixed(2) + ' SAR</span></div>';
        if (data.discount > 0) {
            html += '<div class="row"><span>الخصم</span><span>' + data.discount.toFixed(2) + ' SAR</span></div>';
        }
        html += '<div class="row"><span>ضريبة القيمة المضافة (15%)</span><span>' + data.vatAmount.toFixed(2) + ' SAR</span></div>';
        html += '<div class="row grand-total"><span>المبلغ شامل الضريبة</span><span>' + data.totalAmount.toFixed(2) + ' SAR</span></div>';
        html += '</div>';
        html += '<div class="qr-section">' + qrHtml + '</div>';
        html += '<div class="declaration">أقر أنا الموقع على هذه الفاتورة إنني استلمت كافة البضاعة المدونة بها بحالة سليمة وإنني سأقوم بسداد قيمتها وفي حالة عدم السداد تعتبر هذه الورقة تجارية واجبة الدفع<br><br>I confirm that I have received all the goods listed above in good condition and will pay the full amount.</div>';
        html += '<div class="signature"><div>اسم المستلم: _________________</div><div>اسم البائع: _________________</div></div>';
        html += '<div class="footer">' + data.invoiceFooter + '<br>📍 ' + data.address + ' | 📞 ' + data.phone + '</div>';
        html += '</div>';
        html += '<script>setTimeout(function(){ window.print(); }, 400);<\/script>';
        html += '</body></html>';
        
        return html;
    };

    // ============================================================
    // 打印选项
    // ============================================================
    window.CashierModule.showPrintOptions = function() {
        var modal = document.getElementById('printOptionsModal');
        if (modal) modal.classList.remove('hidden');
    };

    window.CashierModule.closePrintOptions = function() {
        var modal = document.getElementById('printOptionsModal');
        if (modal) modal.classList.add('hidden');
    };

    // ============================================================
    // 挂单/取单
    // ============================================================
    window.CashierModule.holdCart = function() {
        if (this.cart.length === 0) {
            this.toast('购物车为空', 'error');
            return;
        }

        var plate = this.selectedCustomer ? (this.selectedCustomer.plate_number || 'GUEST') : 'GUEST';
        var holdData = {
            id: Date.now(),
            plate: plate,
            customer: this.selectedCustomer,
            cart: JSON.parse(JSON.stringify(this.cart)),
            discount: this._couponDiscount || 0,
            pointsDiscount: this._pointsDiscount || 0,
            payment: this.selectedPayment,
            held_at: new Date().toISOString()
        };

        if (!window.heldOrders) window.heldOrders = [];
        window.heldOrders.push(holdData);

        this.cart = [];
        this._couponDiscount = 0;
        this._pointsDiscount = 0;
        this.selectedPayment = null;
        this.updateCart();
        this.resetPaymentUI();
        this.toast('📌 已挂单: ' + plate, 'success');
        this.showHoldOrders();
    };

    window.CashierModule.showHoldOrders = function() {
        var orders = window.heldOrders || [];
        if (orders.length === 0) {
            this.toast('暂无挂单', 'info');
            return;
        }

        var msg = '📋 挂单列表\n';
        orders.forEach(function(o, i) {
            var time = new Date(o.held_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            var items = o.cart.map(function(item) { return item.name; }).join(', ');
            msg += (i + 1) + '. ' + o.plate + ' | ' + items + ' | ' + time + '\n';
        });
        msg += '\n点击加载: 输入序号 (1-' + orders.length + ')';
        var choice = prompt(msg);
        if (choice) {
            var idx = parseInt(choice) - 1;
            if (idx >= 0 && idx < orders.length) {
                this.loadHoldOrder(idx);
            }
        }
    };

    window.CashierModule.loadHoldOrder = function(index) {
        var orders = window.heldOrders || [];
        if (index < 0 || index >= orders.length) return;
        var o = orders[index];

        this.selectedCustomer = o.customer;
        this.cart = JSON.parse(JSON.stringify(o.cart));
        this._couponDiscount = o.discount || 0;
        this._pointsDiscount = o.pointsDiscount || 0;
        this.selectedPayment = o.payment;

        if (this.selectedPayment) {
            this.selectPayment(this.selectedPayment);
        }
        if (this.selectedCustomer) {
            this.showCustomerInfo(this.selectedCustomer);
        }

        orders.splice(index, 1);
        this.updateCart();
        this.toast('✅ 已加载挂单', 'success');
    };

    // ============================================================
    // 占位方法
    // ============================================================
    window.CashierModule.editCustomer = function() {
        this.toast('✏️ 编辑客户功能开发中', 'info');
    };

    window.CashierModule.recharge = function() {
        this.toast('💰 充值功能开发中', 'info');
    };

    window.CashierModule.scanQR = function() {
        this.toast('📱 扫码功能开发中', 'info');
    };

    console.log('[Cashier] V2.3 模块已注册 - 打印性能优化版');
})();