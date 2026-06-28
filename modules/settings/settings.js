/**
 * settings.js - 系统设置模块
 */
(function() {
    'use strict';

    window.SettingsModule = Object.create(ModuleBase);
    window.SettingsModule.moduleName = 'settings';

    window.SettingsModule.cacheDom = function() {
        this.el = {
            shopName: this.getEl('shopName'),
            shopTaxId: this.getEl('shopTaxId'),
            vatRate: this.getEl('vatRateInput'),
            commissionRate: this.getEl('commissionRate'),
            saveBtn: this.getEl('saveSettingsBtn')
        };
    };

    window.SettingsModule.bindEvents = function() {
        var self = this;
        if (this.el.saveBtn) {
            this.el.saveBtn.addEventListener('click', function() { self.saveSettings(); });
        }
    };

    window.SettingsModule.loadSettings = function() {
        var config = this.getData('config');
        if (this.el.shopName) this.el.shopName.value = config.shopName || '';
        if (this.el.shopTaxId) this.el.shopTaxId.value = config.shopTaxId || '';
        if (this.el.vatRate) this.el.vatRate.value = config.vatRate || 15;
        if (this.el.commissionRate) this.el.commissionRate.value = config.commissionRate || 5;
    };

    window.SettingsModule.saveSettings = function() {
        var currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.role !== 'owner') {
            this.toast('只有老板可以修改设置', 'error');
            return;
        }

        var config = this.getData('config');
        if (this.el.shopName) config.shopName = this.el.shopName.value.trim() || config.shopName;
        if (this.el.shopTaxId) config.shopTaxId = this.el.shopTaxId.value.trim() || config.shopTaxId;
        if (this.el.vatRate) config.vatRate = parseFloat(this.el.vatRate.value) || 15;
        if (this.el.commissionRate) config.commissionRate = parseFloat(this.el.commissionRate.value) || 5;

        this.setData('config', config);
        localStorage.setItem('cw_config', JSON.stringify(config));
        this.toast('✅ 设置已保存', 'success');
    };

    // 重写 loadData 为 loadSettings
    window.SettingsModule.loadData = function() {
        this.loadSettings();
    };

    console.log('[Settings] 模块已注册');
})();