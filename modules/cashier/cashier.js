/**
 * cashier.js - POS收银模块 V5
 * 无 JSX，全部使用 AppApi，按钮统一调用 Module.method()
 */
window.CashierModule = {
    initialized: false,
    moduleName: 'cashier',

    // ===== 价格配置 =====
    servicePrices: {
        '基础清洗': 30,
        '深度清洗': 55,
        '外部抛光': 65,
        '内部护理': 70,
        '全车精洗': 110
    },

    // ===== 生命周期：初始化 =====
    init: function() {
        if (this.initialized) return;
        console.log('[Cashier] 初始化...');
        var self = this;

        // 等待 DOM 渲染完成
        return new Promise(function(resolve) {
            setTimeout(function() {
                self.cacheDom();
                self.bindEvents();
                self.loadData();
                self.initialized = true;
                console.log('[Cashier] 初始化完成');
                resolve();
            }, 50);
        });
    },

    // ===== 生命周期：销毁 =====
    destroy: function() {
        console.log('[Cashier] 销毁...');
        this.initialized = false;
    },

    // ===== 缓存 DOM =====
    cacheDom: function() {
        this.el = {
            customer: document.getElementById('posCustomer'),
            employee: document.getElementById('posEmployee'),
            service: document.getElementById('posService'),
            payment: document.getElementById('posPayment'),
            plate: document.getElementById('posPlate'),
            amount: document.getElementById('posAmount'),
            subtotal: document.getElementById('posSubtotal'),
            vat: document.getElementById('posVat'),
            total: document.getElementById('posTotal'),
            todayList: document.getElementById('todayOrdersList'),
            customerInfo: document.getElementById('posCustomerInfo'),
            custName: document.getElementById('posCustName'),
            custBalance: document.getElementById('posCustBalance'),
            custPoints: document.getElementById('posCustPoints'),
            custLevel: document.getElementById('posCustLevel')
        };
    },

    // ===== 绑定事件 =====
    bindEvents: function() {
        var self = this;

        if (this.el.service) {
            this.el.service.addEventListener('change', function() {
                self.updatePrice();
            });
        }
        if (this.el.amount) {
            this.el.amount.addEventListener('input', function() {
                self.updatePrice();
            });
        }
        if (this.el.plate) {
            this.el.plate.addEventListener('blur', function() {
                self.findCustomer();
            });
        }
        if (this.el.customer) {
            this.el.customer.addEventListener('change', function() {
                self.onCustomerChange();
            });
        }
    },

    // ===== 加载数据 =====
    loadData: function() {
        var self = this;
        var users = AppStore.get('allUsers') || [];
        var customers = AppStore.get('allCustomers') || [];
        var orders = AppStore.get('allOrders') || [];

        this.renderEmployees(users);
        this.renderCustomers(customers);
        this.renderTodayOrders(orders);
        this.updatePrice();
    },

    // ===== 渲染员工下拉 =====
    renderEmployees: function(users) {
        if (!this.el.employee) return;
        users = users || [];
        var staff = users.filter(function(u) {
            return u.role !== 'owner' && u.status === 'approved';
        });
        var currentUser = AppStore.get('currentUser') || {};
        var html = '';
        staff.forEach(function(u) {
            var selected = (u.id === currentUser.id) ? 'selected' : '';
            html += '<option value="' + u.id + '" ' + selected + '>' + (u.name || u.username) + '</option>';
        });
        this.el.employee.innerHTML = html || '<option value="">暂无员工</option>';
    },

    // ===== 渲染客户下拉 =====
    renderCustomers: function(customers) {
        if (!this.el.customer) return;
        customers = customers || [];
        var val = this.el.customer.value;
        var html = '<option value="">散客</option>';
        customers.forEach(function(c) {
            html += '<option value="' + c.id + '">' + c.name + ' (' + (c.plate_number || '') + ')</option>';
        });
        this.el.customer.innerHTML = html;
        if (val) this.el.customer.value = val;
    },

    // ===== 渲染今日订单 =====
    renderTodayOrders: function(orders) {
        if (!this.el.todayList) return;
        orders = orders || [];
        var today = new Date().toISOString().split('T')[0];
        var todayOrders = orders.filter(function(o) {
            return o.date === today;
        }).slice(0, 20);

        if (todayOrders.length === 0) {
            this.el.todayList.innerHTML = '<div class="text-center text-gray-400 py-4">今日暂无订单</div>';
            return;
        }

        var html = '';
        todayOrders.forEach(function(o) {
            html += '<div class="flex justify-between p-2 border-b hover:bg-gray-50">';
            html += '<span class="text-sm">' + (o.created_at ? new Date(o.created_at).toLocaleTimeString() : '') + '</span>';
            html += '<span class="font-medium">' + (o.plate_number || 'N/A') + '</span>';
            html += '<span class="font-bold text-blue-600">' + (o.total || 0).toFixed(2) + ' SAR</span>';
            html += '</div>';
        });
        this.el.todayList.innerHTML = html;
    },

    // ===== 更新价格 =====
    updatePrice: function() {
        var service = this.el.service ? this.el.service.value : '基础清洗';
        var amount = this.el.amount ? parseFloat(this.el.amount.value) || this.servicePrices[service] || 30 : 30;
        var config = AppStore.get('config') || {};
        var vatRate = config.vatRate || 15;
        var vatAmount = amount * vatRate / 100;
        var total = amount + vatAmount;

        if (this.el.amount) this.el.amount.value = amount;
        if (this.el.subtotal) this.el.subtotal.textContent = amount.toFixed(2) + ' SAR';
        if (this.el.vat) this.el.vat.textContent = vatAmount.toFixed(2) + ' SAR';
        if (this.el.total) this.el.total.textContent = total.toFixed(2) + ' SAR';
    },

    // ===== 查找客户 =====
    findCustomer: function() {
        if (!this.el.plate) return;
        var plate = this.el.plate.value.trim().toUpperCase();
        if (!plate) {
            if (this.el.customerInfo) this.el.customerInfo.classList.add('hidden');
            return;
        }

        var customers = AppStore.get('allCustomers') || [];
        var customer = customers.find(function(c) {
            return c.plate_number === plate;
        });

        if (customer) {
            if (this.el.customerInfo) this.el.customerInfo.classList.remove('hidden');
            if (this.el.custName) this.el.custName.textContent = customer.name || '未知';
            if (this.el.custBalance) this.el.custBalance.textContent = (customer.balance || 0).toFixed(2) + ' SAR';
            if (this.el.custPoints) this.el.custPoints.textContent = customer.points || 0;
            if (this.el.custLevel) this.el.custLevel.textContent = customer.level || '普通';

            if (this.el.customer) {
                var options = this.el.customer.options;
                for (var i = 0; i < options.length; i++) {
                    if (options[i].value === customer.id) {
                        options[i].selected = true;
                        break;
                    }
                }
            }
        } else {
            if (this.el.customerInfo) this.el.customerInfo.classList.add('hidden');
        }
    },

    // ===== 客户选择变化 =====
    onCustomerChange: function() {
        if (!this.el.customer || !this.el.customerInfo) return;
        if (!this.el.customer.value) {
            this.el.customerInfo.classList.add('hidden');
            return;
        }

        var customers = AppStore.get('allCustomers') || [];
        var customer = customers.find(function(c) {
            return c.id === this.el.customer.value;
        }.bind(this));

        if (customer) {
            this.el.customerInfo.classList.remove('hidden');
            if (this.el.custName) this.el.custName.textContent = customer.name || '未知';
            if (this.el.custBalance) this.el.custBalance.textContent = (customer.balance || 0).toFixed(2) + ' SAR';
            if (this.el.custPoints) this.el.custPoints.textContent = customer.points || 0;
            if (this.el.custLevel) this.el.custLevel.textContent = customer.level || '普通';
        }
    },

    // ===== 保存订单 =====
    saveOrder: function() {
        var self = this;
        var currentUser = AppStore.get('currentUser') || {};

        if (!currentUser.id) {
            AppUtils.toast('请先登录', 'error');
            return;
        }

        if (!this.el.plate) {
            AppUtils.toast('页面加载未完成', 'error');
            return;
        }

        var plate = this.el.plate.value.trim().toUpperCase();
        if (!plate) {
            AppUtils.toast('请输入车牌号', 'error');
            return;
        }

        var amount = this.el.amount ? parseFloat(this.el.amount.value) || 0 : 0;
        if (amount <= 0) {
            AppUtils.toast('金额必须大于0', 'error');
            return;
        }

        var employeeId = this.el.employee ? this.el.employee.value || null : null;
        var customerId = this.el.customer ? this.el.customer.value || null : null;
        var serviceName = this.el.service ? this.el.service.value : '基础清洗';
        var paymentMethod = this.el.payment ? this.el.payment.value : 'cash';

        var config = AppStore.get('config') || {};
        var vatRate = config.vatRate || 15;
        var vat = amount * vatRate / 100;
        var total = amount + vat;
        var today = new Date().toISOString().split('T')[0];

        var orders = AppStore.get('allOrders') || [];
        var todayOrders = orders.filter(function(o) { return o.date === today; });
        var orderNumber = 'ORD-' + today.replace(/-/g, '') + '-' + String(todayOrders.length + 1).padStart(4, '0');

        var users = AppStore.get('allUsers') || [];
        var employee = users.find(function(u) { return u.id === employeeId; });

        var orderData = {
            order_number: orderNumber,
            plate_number: plate,
            customer_id: customerId,
            employee_id: employeeId,
            staff_name: employee ? employee.name : currentUser.name,
            service_name: serviceName,
            amount: amount,
            vat: vat,
            total: total,
            payment_method: paymentMethod,
            status: 'completed',
            date: today,
            created_at: new Date().toISOString()
        };

        AppApi.insert('orders', orderData)
            .then(function(data) {
                if (data && data.length > 0) {
                    var allOrders = AppStore.get('allOrders') || [];
                    allOrders.unshift(data[0]);
                    AppStore.set('allOrders', allOrders);
                    self.renderTodayOrders(allOrders);
                    AppUtils.toast('✅ 订单保存成功: ' + total.toFixed(2) + ' SAR', 'success');

                    if (self.el.plate) self.el.plate.value = '';
                    if (self.el.amount) self.el.amount.value = '';
                    if (self.el.customerInfo) self.el.customerInfo.classList.add('hidden');
                    self.updatePrice();
                }
            })
            .catch(function(error) {
                AppUtils.toast('❌ 保存失败: ' + error.message, 'error');
            });
    },

    // ===== 打印小票 =====
    printReceipt: function() {
        var total = this.el.total ? this.el.total.textContent : '0 SAR';
        var plate = this.el.plate ? this.el.plate.value || 'N/A' : 'N/A';
        var config = AppStore.get('config') || {};
        var shopName = config.shopName || 'Car Wash Pro';
        var taxId = config.shopTaxId || 'N/A';

        var win = window.open('', '_blank');
        if (!win) {
            AppUtils.toast('请允许弹窗', 'error');
            return;
        }

        win.document.write(`
            <html>
            <head>
                <title>发票</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; text-align: center; }
                    .inv { max-width: 400px; margin: auto; border: 1px solid #ddd; padding: 30px; border-radius: 12px; }
                    .tot { font-size: 28px; font-weight: bold; color: #0091D5; }
                </style>
            </head>
            <body>
                <div class="inv">
                    <h2>🧼 CarWash Pro</h2>
                    <p>${shopName}</p>
                    <p>税号: ${taxId}</p>
                    <hr>
                    <p><strong>车牌:</strong> ${plate}</p>
                    <p><strong>日期:</strong> ${new Date().toLocaleString()}</p>
                    <hr>
                    <p class="tot">总计: ${total}</p>
                    <p style="font-size:12px;color:#999;">感谢光临</p>
                </div>
                <script>setTimeout(function(){ window.print(); }, 300)<\/script>
            </body>
            </html>
        `);
        win.document.close();
    },

    // ===== 语音播报 =====
    voiceTotal: function() {
        var total = this.el.total ? this.el.total.textContent : '0 SAR';
        var msg = new SpeechSynthesisUtterance('总计 ' + total);
        window.speechSynthesis.speak(msg);
    }
};

console.log('[Cashier] V5 模块已注册');