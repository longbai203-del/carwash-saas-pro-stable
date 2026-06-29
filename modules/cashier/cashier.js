/**
 * cashier.js - POS收银模块 V6
 * 升级版：快捷服务、会员识别、折扣、多支付方式、小票+税务发票
 */
(function() {
    'use strict';

    window.CashierModule = Object.create(ModuleBase);
    window.CashierModule.moduleName = 'cashier';

    // ===== 服务价格配置 =====
    window.CashierModule.servicePrices = {
        '基础清洗': 30,
        '深度清洗': 55,
        '外部抛光': 65,
        '内部护理': 70,
        '全车精洗': 110,
        '全车镀晶': 299
    };

    // ===== 缓存 DOM =====
    window.CashierModule.cacheDom = function() {
        this.el = {
            customer: this.getEl('posCustomer'),
            employee: this.getEl('posEmployee'),
            service: this.getEl('posService'),
            payment: this.getEl('posPayment'),
            plate: this.getEl('posPlate'),
            amount: this.getEl('posAmount'),
            discountInput: this.getEl('posDiscountInput'),
            subtotal: this.getEl('posSubtotal'),
            vat: this.getEl('posVat'),
            discount: this.getEl('posDiscount'),
            total: this.getEl('posTotal'),
            todayList: this.getEl('todayOrdersList'),
            todayRevenue: this.getEl('todayRevenue'),
            todayOrderCount: this.getEl('todayOrderCount'),
            customerInfo: this.getEl('posCustomerInfo'),
            custName: this.getEl('posCustName'),
            custBalance: this.getEl('posCustBalance'),
            custPoints: this.getEl('posCustPoints'),
            custLevel: this.getEl('posCustLevel'),
            orderItemsList: this.getEl('orderItemsList'),
            cashierStatus: this.getEl('cashierStatus'),
            showQR: this.getEl('posShowQR'),
            qrContent: this.getEl('posQRContent')
        };
        this.orderItems = [];
        this.selectedCustomer = null;
    };

    // ===== 绑定事件 =====
    window.CashierModule.bindEvents = function() {
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
        if (this.el.discountInput) {
            this.el.discountInput.addEventListener('input', function() {
                self.updatePrice();
            });
        }
        if (this.el.plate) {
            this.el.plate.addEventListener('blur', function() {
                self.findCustomer();
            });
            this.el.plate.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') self.findCustomer();
            });
        }
        if (this.el.customer) {
            this.el.customer.addEventListener('change', function() {
                self.onCustomerChange();
            });
        }
    };

    // ===== 加载数据 =====
    window.CashierModule.loadData = function() {
        var self = this;
        var users = AppStore.get('allUsers') || [];
        var customers = AppStore.get('allCustomers') || [];
        var orders = AppStore.get('allOrders') || [];

        this.renderEmployees(users);
        this.renderCustomers(customers);
        this.renderTodayOrders(orders);
        this.updatePrice();
        this.updateStatus();

        var config = AppStore.get('config') || {};
        if (this.el.showQR) {
            this.el.showQR.checked = config.showQR !== false;
        }
        if (this.el.qrContent) {
            this.el.qrContent.value = config.qrContent || 'https://carwash.com';
        }
    };

    // ===== 更新状态 =====
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

    // ===== 选择快捷服务 =====
    window.CashierModule.selectService = function(name, price) {
        if (this.el.service) {
            var options = this.el.service.options;
            for (var i = 0; i < options.length; i++) {
                if (options[i].value === name) {
                    options[i].selected = true;
                    break;
                }
            }
        }
        if (this.el.amount) {
            this.el.amount.value = price;
        }
        this.updatePrice();
        this.toast('✅ 已选择: ' + name + ' (' + price + ' SAR)', 'success');
    };

    // ===== 更新价格 =====
    window.CashierModule.updatePrice = function() {
        var service = this.el.service ? this.el.service.value : '基础清洗';
        var amount = this.el.amount ? parseFloat(this.el.amount.value) || this.servicePrices[service] || 30 : 30;
        var discount = this.el.discountInput ? parseFloat(this.el.discountInput.value) || 0 : 0;
        var config = AppStore.get('config') || {};
        var vatRate = config.vatRate || 15;

        if (discount > amount) {
            discount = amount;
            if (this.el.discountInput) this.el.discountInput.value = discount;
        }

        var vatAmount = (amount - discount) * vatRate / 100;
        var total = amount - discount + vatAmount;

        if (this.el.subtotal) this.el.subtotal.textContent = amount.toFixed(2) + ' SAR';
        if (this.el.vat) this.el.vat.textContent = vatAmount.toFixed(2) + ' SAR';
        if (this.el.discount) this.el.discount.textContent = discount.toFixed(2) + ' SAR';
        if (this.el.total) this.el.total.textContent = total.toFixed(2) + ' SAR';
    };

    // ===== 查找客户 =====
    window.CashierModule.findCustomer = function() {
        if (!this.el.plate) return;
        var plate = this.el.plate.value.trim().toUpperCase();
        if (!plate) {
            if (this.el.customerInfo) this.el.customerInfo.classList.add('hidden');
            this.selectedCustomer = null;
            return;
        }

        var customers = AppStore.get('allCustomers') || [];
        var customer = customers.find(function(c) {
            return c.plate_number === plate;
        });

        if (customer) {
            this.selectedCustomer = customer;
            if (this.el.customerInfo) this.el.customerInfo.classList.remove('hidden');
            if (this.el.custName) this.el.custName.textContent = customer.name || '未知';
            if (this.el.custBalance) this.el.custBalance.textContent = (customer.balance || 0).toFixed(2) + ' SAR';
            if (this.el.custPoints) this.el.custPoints.textContent = customer.points || 0;
            if (this.el.custLevel) {
                var level = customer.level || '普通';
                this.el.custLevel.textContent = level;
                this.el.custLevel.className = 'customer-level customer-level-' + level.toLowerCase();
            }

            if (this.el.customer) {
                var options = this.el.customer.options;
                for (var i = 0; i < options.length; i++) {
                    if (options[i].value === customer.id) {
                        options[i].selected = true;
                        break;
                    }
                }
            }
            this.toast('👤 找到客户: ' + (customer.name || customer.phone), 'success');
        } else {
            this.selectedCustomer = null;
            if (this.el.customerInfo) this.el.customerInfo.classList.add('hidden');
            this.toast('⚠️ 未找到该车牌对应的客户', 'warning');
        }
    };

    // ===== 客户选择变化 =====
    window.CashierModule.onCustomerChange = function() {
        if (!this.el.customer || !this.el.customerInfo) return;
        var customerId = this.el.customer.value;
        if (!customerId) {
            this.el.customerInfo.classList.add('hidden');
            this.selectedCustomer = null;
            return;
        }

        var customers = AppStore.get('allCustomers') || [];
        var customer = customers.find(function(c) {
            return c.id === customerId;
        });

        if (customer) {
            this.selectedCustomer = customer;
            this.el.customerInfo.classList.remove('hidden');
            if (this.el.custName) this.el.custName.textContent = customer.name || '未知';
            if (this.el.custBalance) this.el.custBalance.textContent = (customer.balance || 0).toFixed(2) + ' SAR';
            if (this.el.custPoints) this.el.custPoints.textContent = customer.points || 0;
            if (this.el.custLevel) {
                var level = customer.level || '普通';
                this.el.custLevel.textContent = level;
                this.el.custLevel.className = 'customer-level customer-level-' + level.toLowerCase();
            }
            if (this.el.plate && customer.plate_number) {
                this.el.plate.value = customer.plate_number;
            }
        }
    };

    // ===== 渲染员工下拉 =====
    window.CashierModule.renderEmployees = function(users) {
        if (!this.el.employee) return;
        users = users || [];
        var staff = users.filter(function(u) {
            return u.status === 'approved';
        });
        var currentUser = AppStore.get('currentUser') || {};
        var html = '';
        staff.forEach(function(u) {
            var selected = (u.id === currentUser.id) ? 'selected' : '';
            var label = (u.name || u.username) + (u.role ? ' (' + u.role + ')' : '');
            html += '<option value="' + u.id + '" ' + selected + '>' + label + '</option>';
        });
        this.el.employee.innerHTML = html || '<option value="">暂无员工</option>';
    };

    // ===== 渲染客户下拉 =====
    window.CashierModule.renderCustomers = function(customers) {
        if (!this.el.customer) return;
        customers = customers || [];
        var val = this.el.customer.value;
        var html = '<option value="">散客</option>';
        customers.forEach(function(c) {
            var label = c.name + (c.plate_number ? ' (' + c.plate_number + ')' : '');
            html += '<option value="' + c.id + '">' + label + '</option>';
        });
        this.el.customer.innerHTML = html;
        if (val) this.el.customer.value = val;
    };

    // ===== 渲染今日订单 =====
    window.CashierModule.renderTodayOrders = function(orders) {
        if (!this.el.todayList) return;
        orders = orders || [];
        var today = new Date().toISOString().split('T')[0];
        var todayOrders = orders.filter(function(o) {
            return o.date === today && o.status !== 'cancelled';
        });

        var totalRevenue = todayOrders.reduce(function(s, o) {
            return s + (parseFloat(o.total) || 0);
        }, 0);

        if (this.el.todayRevenue) {
            this.el.todayRevenue.textContent = totalRevenue.toFixed(2) + ' SAR';
        }
        if (this.el.todayOrderCount) {
            this.el.todayOrderCount.textContent = todayOrders.length;
        }

        if (todayOrders.length === 0) {
            this.el.todayList.innerHTML = '<div class="text-center text-gray-400 py-4">今日暂无订单</div>';
            return;
        }

        var html = '';
        todayOrders.slice(0, 20).forEach(function(o) {
            var time = o.created_at ? new Date(o.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
            var statusMap = {
                pending: '⏳',
                confirmed: '✅',
                in_progress: '🔄',
                completed: '✔️',
                cancelled: '❌'
            };
            html += '<div class="flex justify-between items-center p-2 border-b hover:bg-gray-50 rounded">';
            html += '<div class="flex items-center gap-3">';
            html += '<span class="text-xs text-gray-400">' + time + '</span>';
            html += '<span class="font-medium">' + (o.plate_number || 'N/A') + '</span>';
            html += '<span class="text-xs text-gray-400">' + (o.service_name || '') + '</span>';
            html += '<span class="text-xs">' + (statusMap[o.status] || '') + '</span>';
            html += '</div>';
            html += '<div class="font-bold text-blue-600">' + (parseFloat(o.total) || 0).toFixed(2) + ' SAR</div>';
            html += '</div>';
        });
        this.el.todayList.innerHTML = html;
    };

    // ===== 保存订单 =====
    window.CashierModule.saveOrder = function() {
        var self = this;
        var currentUser = AppStore.get('currentUser') || {};

        if (!currentUser.id) {
            this.toast('请先登录', 'error');
            return;
        }

        if (!this.el.plate) {
            this.toast('页面加载未完成', 'error');
            return;
        }

        var plate = this.el.plate.value.trim().toUpperCase();
        if (!plate) {
            this.toast('请输入车牌号', 'error');
            return;
        }

        var serviceName = this.el.service ? this.el.service.value : '基础清洗';
        var amount = this.el.amount ? parseFloat(this.el.amount.value) || this.servicePrices[serviceName] || 30 : 30;
        var discount = this.el.discountInput ? parseFloat(this.el.discountInput.value) || 0 : 0;
        var paymentMethod = this.el.payment ? this.el.payment.value : 'cash';
        var employeeId = this.el.employee ? this.el.employee.value || null : null;
        var customerId = this.el.customer ? this.el.customer.value || null : null;

        if (amount <= 0) {
            this.toast('金额必须大于0', 'error');
            return;
        }

        var config = AppStore.get('config') || {};
        var vatRate = config.vatRate || 15;
        var netAmount = amount - discount;
        var vat = netAmount * vatRate / 100;
        var total = netAmount + vat;
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
            staff_name: employee ? (employee.name || employee.username) : (currentUser.name || currentUser.username),
            service_name: serviceName,
            amount: amount,
            discount: discount,
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
                    self.toast('✅ 订单保存成功: ' + total.toFixed(2) + ' SAR', 'success');

                    if (self.el.plate) self.el.plate.value = '';
                    if (self.el.amount) self.el.amount.value = '';
                    if (self.el.discountInput) self.el.discountInput.value = '0';
                    if (self.el.customerInfo) self.el.customerInfo.classList.add('hidden');
                    if (self.el.customer) self.el.customer.value = '';
                    self.selectedCustomer = null;
                    self.updatePrice();

                    self.voiceTotal();
                }
            })
            .catch(function(error) {
                self.toast('❌ 保存失败: ' + error.message, 'error');
            });
    };

    // ===== 显示打印选项 =====
    window.CashierModule.showPrintOptions = function() {
        var modal = document.getElementById('printOptionsModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    };

    // ===== 关闭打印选项 =====
    window.CashierModule.closePrintOptions = function() {
        var modal = document.getElementById('printOptionsModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    };

    // ===== 小票打印（热敏纸格式）=====
    window.CashierModule.printReceipt = function() {
        this.closePrintOptions();

        var total = this.el.total ? this.el.total.textContent : '0 SAR';
        var plate = this.el.plate ? this.el.plate.value || 'N/A' : 'N/A';
        var service = this.el.service ? this.el.service.value : 'N/A';
        var amount = this.el.amount ? parseFloat(this.el.amount.value) || 0 : 0;
        var discount = this.el.discountInput ? parseFloat(this.el.discountInput.value) || 0 : 0;
        var vatRate = 15;
        var vatAmount = (amount - discount) * vatRate / 100;
        var netAmount = amount - discount;
        var totalAmount = netAmount + vatAmount;
        var paymentMethod = this.el.payment ? this.el.payment.options[this.el.payment.selectedIndex].text : '现金';

        var config = AppStore.get('config') || {};
        var shopName = config.shopName || 'Car Wash Pro';
        var taxId = config.shopTaxId || 'N/A';
        var address = config.shopAddress || '';
        var phone = config.shopPhone || '';

        var now = new Date();
        var dateStr = now.toLocaleDateString('zh-CN');
        var timeStr = now.toLocaleTimeString('zh-CN');
        var orderNumber = 'ORD-' + now.getFullYear() + 
                          String(now.getMonth() + 1).padStart(2, '0') + 
                          String(now.getDate()).padStart(2, '0') + 
                          '-' + String(Date.now()).slice(-6);

        var win = window.open('', '_blank', 'width=400,height=600');
        if (!win) {
            this.toast('请允许弹窗', 'error');
            return;
        }

        var html = '<!DOCTYPE html><html><head><title>小票</title><style>' +
            'body { font-family: "Courier New", monospace; padding: 10px; max-width: 300px; margin: auto; font-size: 12px; }' +
            '.center { text-align: center; }' +
            '.header { font-size: 18px; font-weight: bold; }' +
            '.line { border-top: 1px dashed #999; margin: 8px 0; }' +
            '.double-line { border-top: 2px solid #000; margin: 8px 0; }' +
            '.row { display: flex; justify-content: space-between; padding: 2px 0; }' +
            '.bold { font-weight: bold; }' +
            '.total { font-size: 20px; font-weight: bold; }' +
            '.footer { font-size: 10px; color: #666; margin-top: 8px; }' +
            '.small { font-size: 10px; }' +
            '@media print { body { padding: 5px; } }' +
            '</style></head><body>' +
            '<div class="center">' +
            '<div class="header">🧼 ' + shopName + '</div>' +
            '<div class="small">' + address + '</div>' +
            '<div class="small">📞 ' + phone + '</div>' +
            '<div class="small">税号: ' + taxId + '</div>' +
            '<div class="line"></div>' +
            '<div class="row"><span>日期</span><span>' + dateStr + ' ' + timeStr + '</span></div>' +
            '<div class="row"><span>单号</span><span>' + orderNumber + '</span></div>' +
            '<div class="row"><span>车牌</span><span><strong>' + plate + '</strong></span></div>' +
            '<div class="line"></div>' +
            '<div class="row"><span>服务项目</span><span>' + service + '</span></div>' +
            '<div class="row"><span>金额</span><span>' + amount.toFixed(2) + ' SAR</span></div>' +
            (discount > 0 ? '<div class="row"><span>折扣</span><span>- ' + discount.toFixed(2) + ' SAR</span></div>' : '') +
            '<div class="row"><span>小计</span><span>' + netAmount.toFixed(2) + ' SAR</span></div>' +
            '<div class="row"><span>增值税 15%</span><span>' + vatAmount.toFixed(2) + ' SAR</span></div>' +
            '<div class="double-line"></div>' +
            '<div class="row total"><span>总计</span><span>' + totalAmount.toFixed(2) + ' SAR</span></div>' +
            '<div class="double-line"></div>' +
            '<div class="row"><span>支付方式</span><span>' + paymentMethod + '</span></div>' +
            '<div class="line"></div>' +
            '<div class="center" style="font-size:14px;">✅ 感谢光临！</div>' +
            '<div class="footer center">' + (config.receiptFooter || '欢迎再次光临') + '</div>' +
            '</div>' +
            '<script>setTimeout(function(){ window.print(); }, 500);<\/script>' +
            '</body></html>';

        win.document.write(html);
        win.document.close();
    };

    // ===== 税务发票打印（A4格式）=====
    window.CashierModule.printTaxInvoice = function() {
        this.closePrintOptions();

        var plate = this.el.plate ? this.el.plate.value || 'N/A' : 'N/A';
        var service = this.el.service ? this.el.service.value : 'N/A';
        var amount = this.el.amount ? parseFloat(this.el.amount.value) || 0 : 0;
        var discount = this.el.discountInput ? parseFloat(this.el.discountInput.value) || 0 : 0;
        var vatRate = 15;
        var vatAmount = (amount - discount) * vatRate / 100;
        var netAmount = amount - discount;
        var totalAmount = netAmount + vatAmount;
        var paymentMethod = this.el.payment ? this.el.payment.options[this.el.payment.selectedIndex].text : '现金';
        var customerName = this.selectedCustomer ? this.selectedCustomer.name : 'عميل عام (散客)';
        var customerPhone = this.selectedCustomer ? this.selectedCustomer.phone : '';

        var config = AppStore.get('config') || {};
        var shopName = config.companyNameAr || config.shopName || 'شركة الخدمات البترولية';
        var shopNameEn = config.companyNameEn || 'Petroleum Services Co.';
        var taxId = config.vatNumber || config.shopTaxId || '300056462300003';
        var address = config.companyAddress || config.shopAddress || 'الرياض، النيسيم الشرقى';
        var phone = config.companyPhone || config.shopPhone || '920002667';
        var crNumber = config.crNumber || '4030571509';

        var now = new Date();
        var dateStr = now.getFullYear() + '/' + 
                      String(now.getMonth() + 1).padStart(2, '0') + '/' + 
                      String(now.getDate()).padStart(2, '0');
        var timeStr = String(now.getHours()).padStart(2, '0') + ':' + 
                      String(now.getMinutes()).padStart(2, '0') + ':' + 
                      String(now.getSeconds()).padStart(2, '0');
        var invoiceNumber = 'INV-' + now.getFullYear() + 
                            String(now.getMonth() + 1).padStart(2, '0') + 
                            String(now.getDate()).padStart(2, '0') + 
                            '-' + String(Date.now()).slice(-8);

        var currentUser = AppStore.get('currentUser') || {};

        var win = window.open('', '_blank', 'width=800,height=1000');
        if (!win) {
            this.toast('请允许弹窗', 'error');
            return;
        }

        var html = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><title>فاتورة ضريبية</title><style>' +
            'body { font-family: "Times New Roman", Arial, sans-serif; padding: 40px; max-width: 800px; margin: auto; }' +
            '.invoice { border: 1px solid #333; padding: 30px; border-radius: 8px; }' +
            '.header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 15px; }' +
            '.shop-name { font-size: 24px; font-weight: bold; color: #1a3a6b; }' +
            '.shop-details { font-size: 12px; color: #555; margin-top: 5px; }' +
            '.title { text-align: center; font-size: 20px; font-weight: bold; background: #f0f0f0; padding: 8px; margin: 10px 0; }' +
            '.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 20px; font-size: 13px; margin: 10px 0; }' +
            '.info-grid .label { font-weight: bold; }' +
            '.table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }' +
            '.table th { background: #1a3a6b; color: white; padding: 8px; text-align: center; }' +
            '.table td { padding: 8px; text-align: center; border-bottom: 1px solid #ddd; }' +
            '.totals { width: 60%; margin-right: auto; margin-top: 15px; }' +
            '.totals .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }' +
            '.totals .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 8px; }' +
            '.footer { margin-top: 20px; font-size: 11px; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }' +
            '.declaration { font-size: 11px; text-align: justify; margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 4px; }' +
            '.signature { display: flex; justify-content: space-between; margin-top: 20px; font-size: 12px; }' +
            '@media print { body { padding: 20px; } }' +
            '</style></head><body>' +
            '<div class="invoice">' +
            '<div class="header">' +
            '<div class="shop-name">🧼 ' + shopName + '</div>' +
            '<div class="shop-details">' + shopNameEn + '</div>' +
            '<div class="shop-details">' + address + '</div>' +
            '<div class="shop-details">📞 ' + phone + ' | الرقم الضريبي: ' + taxId + ' | سجل تجاري: ' + crNumber + '</div>' +
            '</div>' +
            '<div class="title">فاتورة ضريبية مبسطة</div>' +
            '<div class="title" style="font-size:16px;background:transparent;">Simplified Tax Invoice</div>' +
            '<div class="info-grid">' +
            '<div><span class="label">رقم الفاتورة:</span> ' + invoiceNumber + '</div>' +
            '<div><span class="label">التاريخ:</span> ' + dateStr + ' ' + timeStr + '</div>' +
            '<div><span class="label">نوع الدفع:</span> ' + paymentMethod + '</div>' +
            '<div><span class="label">رقم اللوحة:</span> ' + plate + '</div>' +
            '<div><span class="label">المستفيد:</span> ' + customerName + (customerPhone ? ' (' + customerPhone + ')' : '') + '</div>' +
            '<div><span class="label">الموظف:</span> ' + (currentUser.name || currentUser.username || '') + '</div>' +
            '</div>' +
            '<table class="table">' +
            '<thead><tr><th>#</th><th>المنتج / الخدمة</th><th>الكمية</th><th>السعر</th><th>الخصم</th><th>الضريبة 15%</th><th>الإجمالي</th></tr></thead>' +
            '<tbody><tr><td>1</td><td>' + service + '</td><td>1</td><td>' + amount.toFixed(2) + '</td><td>' + (discount > 0 ? discount.toFixed(2) : '0.00') + '</td><td>' + vatAmount.toFixed(2) + '</td><td>' + totalAmount.toFixed(2) + '</td></tr></tbody></table>' +
            '<div class="totals">' +
            '<div class="row"><span>إجمالي السعر</span><span>' + amount.toFixed(2) + ' ريال</span></div>' +
            (discount > 0 ? '<div class="row"><span>إجمالي الخصم</span><span>' + discount.toFixed(2) + ' ريال</span></div>' : '') +
            '<div class="row"><span>المبلغ غير شامل الضريبة</span><span>' + netAmount.toFixed(2) + ' ريال</span></div>' +
            '<div class="row"><span>ضريبة القيمة المضافة (15%)</span><span>' + vatAmount.toFixed(2) + ' ريال</span></div>' +
            '<div class="row grand-total"><span>المبلغ شامل الضريبة</span><span>' + totalAmount.toFixed(2) + ' ريال</span></div>' +
            '</div>' +
            '<div class="declaration">أقر أنا الموقع على هذه الفاتورة إنني استلمت كافة البضاعة المدونة بها بحالة سليمة وإنني سأقوم بسداد قيمتها وفي حالة عدم السداد تعتبر هذه الورقة تجارية واجبة الدفع<br><br>I agree that I have received all the goods in which it is properly written and that I will pay for it and in case of non-payment this paper is considered Commercial to be paid</div>' +
            '<div class="signature"><div>اسم المستلم: _________________</div><div>اسم البائع: _________________</div></div>' +
            '<div class="signature"><div>توقيع المستلم: _________________</div><div>توقيع البائع: _________________</div></div>' +
            '<div class="footer">' + (config.invoiceFooter || 'شكراً لتعاملكم معنا') + '<br>📍 ' + address + ' | 📞 ' + phone + '</div>' +
            '</div>' +
            '<script>setTimeout(function(){ window.print(); }, 800);<\/script>' +
            '</body></html>';

        win.document.write(html);
        win.document.close();
    };

    // ===== 语音播报 =====
    window.CashierModule.voiceTotal = function() {
        var total = this.el.total ? this.el.total.textContent : '0 SAR';
        var msg = new SpeechSynthesisUtterance('总计 ' + total);
        msg.lang = 'zh-CN';
        window.speechSynthesis.speak(msg);
    };

    // ===== 清空订单 =====
    window.CashierModule.clearOrder = function() {
        if (this.el.plate) this.el.plate.value = '';
        if (this.el.amount) this.el.amount.value = '';
        if (this.el.discountInput) this.el.discountInput.value = '0';
        if (this.el.customerInfo) this.el.customerInfo.classList.add('hidden');
        if (this.el.customer) this.el.customer.value = '';
        this.selectedCustomer = null;
        this.updatePrice();
        this.toast('🗑️ 已清空', 'info');
    };

    console.log('[Cashier] V6 模块已注册');
})();