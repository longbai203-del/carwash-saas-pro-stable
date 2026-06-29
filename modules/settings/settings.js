/**
 * settings.js - 系统设置模块 V2
 * 包含：门店、税务、支付、打印、通知、备份、高级设置
 */
(function() {
    'use strict';

    window.SettingsModule = Object.create(ModuleBase);
    window.SettingsModule.moduleName = 'settings';
    window.SettingsModule.currentTab = 'general';

    // ===== 缓存 DOM =====
    window.SettingsModule.cacheDom = function() {
        this.el = {
            // 门店
            shopName: this.getEl('settingShopName'),
            taxId: this.getEl('settingTaxId'),
            shopPhone: this.getEl('settingShopPhone'),
            shopEmail: this.getEl('settingShopEmail'),
            shopAddress: this.getEl('settingShopAddress'),
            logoUrl: this.getEl('settingLogoUrl'),
            language: this.getEl('settingLanguage'),
            // 税务
            vatRate: this.getEl('settingVatRate'),
            vatEnabled: this.getEl('settingVatEnabled'),
            commissionRate: this.getEl('settingCommissionRate'),
            serviceTaxRate: this.getEl('settingServiceTaxRate'),
            // 支付
            paymentCash: this.getEl('settingPaymentCash'),
            paymentCard: this.getEl('settingPaymentCard'),
            paymentMada: this.getEl('settingPaymentMada'),
            paymentApplePay: this.getEl('settingPaymentApplePay'),
            paymentGooglePay: this.getEl('settingPaymentGooglePay'),
            paymentBankTransfer: this.getEl('settingPaymentBankTransfer'),
            defaultPayment: this.getEl('settingDefaultPayment'),
            // 打印
            receiptTitle: this.getEl('settingReceiptTitle'),
            receiptFooter: this.getEl('settingReceiptFooter'),
            showQR: this.getEl('settingShowQR'),
            qrContent: this.getEl('settingQRContent'),
            // 通知
            notifyNewOrder: this.getEl('settingNotifyNewOrder'),
            notifyLowStock: this.getEl('settingNotifyLowStock'),
            notifyAttendance: this.getEl('settingNotifyAttendance'),
            notifyBirthday: this.getEl('settingNotifyBirthday'),
            notificationSound: this.getEl('settingNotificationSound'),
            // 高级
            apiUrl: this.getEl('settingApiUrl'),
            supabaseUrl: this.getEl('settingSupabaseUrl'),
            debugMode: this.getEl('settingDebugMode'),
            offlineMode: this.getEl('settingOfflineMode'),
            logLevel: this.getEl('settingLogLevel')
        };
    };

    // ===== 加载数据 =====
    window.SettingsModule.loadData = function() {
        this.loadSettings();
    };

    // ===== 加载设置 =====
    window.SettingsModule.loadSettings = function() {
        var config = AppStore.get('config') || {};

        // 门店设置
        if (this.el.shopName) this.el.shopName.value = config.shopName || 'Car Wash Pro';
        if (this.el.taxId) this.el.taxId.value = config.shopTaxId || '310245678900003';
        if (this.el.shopPhone) this.el.shopPhone.value = config.shopPhone || '';
        if (this.el.shopEmail) this.el.shopEmail.value = config.shopEmail || '';
        if (this.el.shopAddress) this.el.shopAddress.value = config.shopAddress || '';
        if (this.el.logoUrl) this.el.logoUrl.value = config.logoUrl || '';
        if (this.el.language) this.el.language.value = config.language || 'zh';

        // 税务设置
        if (this.el.vatRate) this.el.vatRate.value = config.vatRate || 15;
        if (this.el.vatEnabled) this.el.vatEnabled.value = config.vatEnabled !== false ? 'true' : 'false';
        if (this.el.commissionRate) this.el.commissionRate.value = config.commissionRate || 5;
        if (this.el.serviceTaxRate) this.el.serviceTaxRate.value = config.serviceTaxRate || 0;

        // 支付设置
        if (this.el.paymentCash) this.el.paymentCash.checked = config.paymentCash !== false;
        if (this.el.paymentCard) this.el.paymentCard.checked = config.paymentCard !== false;
        if (this.el.paymentMada) this.el.paymentMada.checked = config.paymentMada !== false;
        if (this.el.paymentApplePay) this.el.paymentApplePay.checked = config.paymentApplePay !== false;
        if (this.el.paymentGooglePay) this.el.paymentGooglePay.checked = config.paymentGooglePay !== false;
        if (this.el.paymentBankTransfer) this.el.paymentBankTransfer.checked = config.paymentBankTransfer || false;
        if (this.el.defaultPayment) this.el.defaultPayment.value = config.defaultPayment || 'cash';

        // 打印设置
        if (this.el.receiptTitle) this.el.receiptTitle.value = config.receiptTitle || '🧼 CarWash Pro';
        if (this.el.receiptFooter) this.el.receiptFooter.value = config.receiptFooter || '感谢光临！';
        if (this.el.showQR) this.el.showQR.value = config.showQR !== false ? 'true' : 'false';
        if (this.el.qrContent) this.el.qrContent.value = config.qrContent || 'https://carwash.com';

        // 通知设置
        if (this.el.notifyNewOrder) this.el.notifyNewOrder.checked = config.notifyNewOrder !== false;
        if (this.el.notifyLowStock) this.el.notifyLowStock.checked = config.notifyLowStock !== false;
        if (this.el.notifyAttendance) this.el.notifyAttendance.checked = config.notifyAttendance !== false;
        if (this.el.notifyBirthday) this.el.notifyBirthday.checked = config.notifyBirthday !== false;
        if (this.el.notificationSound) this.el.notificationSound.value = config.notificationSound || 'default';

        // 高级设置
        if (this.el.apiUrl) this.el.apiUrl.value = config.apiUrl || '';
        if (this.el.supabaseUrl) {
            var supabaseConfig = AppConfig.supabase || {};
            this.el.supabaseUrl.value = supabaseConfig.url || '';
        }
        if (this.el.debugMode) this.el.debugMode.checked = config.debugMode || false;
        if (this.el.offlineMode) this.el.offlineMode.checked = config.offlineMode || false;
        if (this.el.logLevel) this.el.logLevel.value = config.logLevel || 'info';

        // 加载门店列表到下拉
        this.loadStoreSelector();
    };

    // ===== 加载门店选择器 =====
    window.SettingsModule.loadStoreSelector = function() {
        var stores = AppStore.get('allStores') || [];
        // 如果门店下拉存在，填充
        var sel = document.getElementById('settingStore');
        if (sel) {
            var html = '';
            stores.forEach(function(s) {
                html += '<option value="' + s.id + '">' + s.name + '</option>';
            });
            sel.innerHTML = html || '<option value="">暂无门店</option>';
        }
    };

    // ===== 切换标签页 =====
    window.SettingsModule.switchTab = function(tab) {
        this.currentTab = tab;

        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });

        // 更新面板
        document.querySelectorAll('.panel-content').forEach(function(panel) {
            panel.classList.add('hidden');
        });
        var target = document.getElementById('panel-' + tab);
        if (target) {
            target.classList.remove('hidden');
        }
    };

    // ===== 保存门店设置 =====
    window.SettingsModule.saveGeneralSettings = function() {
        var config = AppStore.get('config') || {};
        config.shopName = this.el.shopName ? this.el.shopName.value : 'Car Wash Pro';
        config.shopTaxId = this.el.taxId ? this.el.taxId.value : '';
        config.shopPhone = this.el.shopPhone ? this.el.shopPhone.value : '';
        config.shopEmail = this.el.shopEmail ? this.el.shopEmail.value : '';
        config.shopAddress = this.el.shopAddress ? this.el.shopAddress.value : '';
        config.logoUrl = this.el.logoUrl ? this.el.logoUrl.value : '';
        config.language = this.el.language ? this.el.language.value : 'zh';

        AppStore.set('config', config);
        localStorage.setItem('cw_config', JSON.stringify(config));
        this.toast('✅ 门店设置已保存', 'success');
    };

    // ===== 保存税务设置 =====
    window.SettingsModule.saveTaxSettings = function() {
        var config = AppStore.get('config') || {};
        config.vatRate = this.el.vatRate ? parseFloat(this.el.vatRate.value) || 15 : 15;
        config.vatEnabled = this.el.vatEnabled ? this.el.vatEnabled.value === 'true' : true;
        config.commissionRate = this.el.commissionRate ? parseFloat(this.el.commissionRate.value) || 5 : 5;
        config.serviceTaxRate = this.el.serviceTaxRate ? parseFloat(this.el.serviceTaxRate.value) || 0 : 0;

        AppStore.set('config', config);
        localStorage.setItem('cw_config', JSON.stringify(config));
        this.toast('✅ 税务设置已保存', 'success');
    };

    // ===== 保存支付设置 =====
    window.SettingsModule.savePaymentSettings = function() {
        var config = AppStore.get('config') || {};
        config.paymentCash = this.el.paymentCash ? this.el.paymentCash.checked : true;
        config.paymentCard = this.el.paymentCard ? this.el.paymentCard.checked : true;
        config.paymentMada = this.el.paymentMada ? this.el.paymentMada.checked : true;
        config.paymentApplePay = this.el.paymentApplePay ? this.el.paymentApplePay.checked : true;
        config.paymentGooglePay = this.el.paymentGooglePay ? this.el.paymentGooglePay.checked : true;
        config.paymentBankTransfer = this.el.paymentBankTransfer ? this.el.paymentBankTransfer.checked : false;
        config.defaultPayment = this.el.defaultPayment ? this.el.defaultPayment.value : 'cash';

        AppStore.set('config', config);
        localStorage.setItem('cw_config', JSON.stringify(config));
        this.toast('✅ 支付设置已保存', 'success');
    };

    // ===== 保存打印设置 =====
    window.SettingsModule.savePrintSettings = function() {
        var config = AppStore.get('config') || {};
        config.receiptTitle = this.el.receiptTitle ? this.el.receiptTitle.value : '🧼 CarWash Pro';
        config.receiptFooter = this.el.receiptFooter ? this.el.receiptFooter.value : '感谢光临！';
        config.showQR = this.el.showQR ? this.el.showQR.value === 'true' : true;
        config.qrContent = this.el.qrContent ? this.el.qrContent.value : 'https://carwash.com';

        AppStore.set('config', config);
        localStorage.setItem('cw_config', JSON.stringify(config));
        this.toast('✅ 打印设置已保存', 'success');
    };

    // ===== 保存通知设置 =====
    window.SettingsModule.saveNotificationSettings = function() {
        var config = AppStore.get('config') || {};
        config.notifyNewOrder = this.el.notifyNewOrder ? this.el.notifyNewOrder.checked : true;
        config.notifyLowStock = this.el.notifyLowStock ? this.el.notifyLowStock.checked : true;
        config.notifyAttendance = this.el.notifyAttendance ? this.el.notifyAttendance.checked : true;
        config.notifyBirthday = this.el.notifyBirthday ? this.el.notifyBirthday.checked : true;
        config.notificationSound = this.el.notificationSound ? this.el.notificationSound.value : 'default';

        AppStore.set('config', config);
        localStorage.setItem('cw_config', JSON.stringify(config));
        this.toast('✅ 通知设置已保存', 'success');
    };

    // ===== 保存高级设置 =====
    window.SettingsModule.saveAdvancedSettings = function() {
        var config = AppStore.get('config') || {};
        config.apiUrl = this.el.apiUrl ? this.el.apiUrl.value : '';
        config.debugMode = this.el.debugMode ? this.el.debugMode.checked : false;
        config.offlineMode = this.el.offlineMode ? this.el.offlineMode.checked : false;
        config.logLevel = this.el.logLevel ? this.el.logLevel.value : 'info';

        AppStore.set('config', config);
        localStorage.setItem('cw_config', JSON.stringify(config));
        this.toast('✅ 高级设置已保存', 'success');
    };

    // ===== 保存所有设置 =====
    window.SettingsModule.saveAllSettings = function() {
        this.saveGeneralSettings();
        this.saveTaxSettings();
        this.savePaymentSettings();
        this.savePrintSettings();
        this.saveNotificationSettings();
        this.saveAdvancedSettings();
        this.toast('✅ 所有设置已保存', 'success');
    };

    // ===== 导出所有数据 =====
    window.SettingsModule.exportAllData = function() {
        var data = {
            exported_at: new Date().toISOString(),
            config: AppStore.get('config'),
            users: AppStore.get('allUsers') || [],
            orders: AppStore.get('allOrders') || [],
            customers: AppStore.get('allCustomers') || [],
            products: AppStore.get('allProducts') || [],
            inventory: AppStore.get('allInventory') || [],
            attendance: AppStore.get('allAttendance') || []
        };

        try {
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'backup_' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);
            this.toast('✅ 数据导出成功', 'success');
        } catch(e) {
            this.toast('❌ 导出失败: ' + e.message, 'error');
        }
    };

    // ===== 导入数据 =====
    window.SettingsModule.importData = function(event) {
        var self = this;
        var file = event.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                if (data.config) {
                    AppStore.set('config', data.config);
                    localStorage.setItem('cw_config', JSON.stringify(data.config));
                }
                if (data.users) AppStore.set('allUsers', data.users);
                if (data.orders) AppStore.set('allOrders', data.orders);
                if (data.customers) AppStore.set('allCustomers', data.customers);
                if (data.products) AppStore.set('allProducts', data.products);
                self.toast('✅ 数据导入成功', 'success');
                self.loadSettings();
            } catch(err) {
                self.toast('❌ 导入失败: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    // ===== 同步数据 =====
    window.SettingsModule.syncData = function() {
        var self = this;
        this.toast('🔄 正在同步数据...', 'info');

        var promises = [
            AppApi.getUsers().then(function(d) { AppStore.set('allUsers', d); }),
            AppApi.getOrders().then(function(d) { AppStore.set('allOrders', d); }),
            AppApi.getCustomers().then(function(d) { AppStore.set('allCustomers', d); }),
            AppApi.query('products').then(function(d) { AppStore.set('allProducts', d); }),
            AppApi.getAttendance().then(function(d) { AppStore.set('allAttendance', d); })
        ];

        Promise.all(promises).then(function() {
            self.toast('✅ 数据同步完成', 'success');
        }).catch(function(err) {
            self.toast('❌ 同步失败: ' + err.message, 'error');
        });
    };

    // ===== 重置系统 =====
    window.SettingsModule.resetSystem = function() {
        var self = this;
        if (!confirm('⚠️ 确认要重置所有数据吗？此操作不可恢复！')) return;
        if (!confirm('⚠️ 再次确认：所有数据将被删除！')) return;

        var tables = ['orders', 'customers', 'products', 'attendance', 'audit_logs'];
        var promises = tables.map(function(table) {
            return AppApi.query(table).then(function(data) {
                if (data && data.length > 0) {
                    var deletePromises = data.map(function(item) {
                        return AppApi.delete(table, item.id);
                    });
                    return Promise.all(deletePromises);
                }
                return Promise.resolve();
            });
        });

        Promise.all(promises).then(function() {
            AppStore.reset();
            localStorage.removeItem('cw_session');
            localStorage.removeItem('cw_config');
            self.toast('✅ 系统已重置，即将刷新页面', 'warning');
            setTimeout(function() { window.location.reload(); }, 1500);
        }).catch(function(err) {
            self.toast('❌ 重置失败: ' + err.message, 'error');
        });
    };

    console.log('[Settings] V2 模块已注册');
})();