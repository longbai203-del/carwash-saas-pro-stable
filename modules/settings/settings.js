/**
 * settings.js - 系统设置模块
 */
window.SettingsModule = {
    initialized: false,
    moduleName: 'settings',

    init: function() {
        if (this.initialized) return;
        console.log('[Settings] 初始化...');
        var self = this;
        setTimeout(function() {
            self.cacheDom();
            self.bindEvents();
            self.loadSettings();
            self.initialized = true;
            console.log('[Settings] 初始化完成');
        }, 50);
    },

    destroy: function() {
        console.log('[Settings] 销毁...');
        this.initialized = false;
    },

    cacheDom: function() {
        this.el = {
            shopName: document.getElementById('shopName'),
            shopTaxId: document.getElementById('shopTaxId'),
            vatRate: document.getElementById('vatRateInput'),
            commissionRate: document.getElementById('commissionRate'),
            saveBtn: document.getElementById('saveSettingsBtn')
        };
    },

    bindEvents: function() {
        var self = this;
        if (this.el.saveBtn) {
            this.el.saveBtn.addEventListener('click', function() { self.saveSettings(); });
        }
    },

    loadSettings: function() {
        var config = AppStore.get('config') || {};
        if (this.el.shopName) this.el.shopName.value = config.shopName || '';
        if (this.el.shopTaxId) this.el.shopTaxId.value = config.shopTaxId || '';
        if (this.el.vatRate) this.el.vatRate.value = config.vatRate || 15;
        if (this.el.commissionRate) this.el.commissionRate.value = config.commissionRate || 5;
    },

    saveSettings: function() {
        var currentUser = AppStore.get('currentUser') || {};
        if (!currentUser || currentUser.role !== 'owner') {
            AppUtils.toast('只有老板可以修改设置', 'error');
            return;
        }

        var config = AppStore.get('config') || {};
        if (this.el.shopName) config.shopName = this.el.shopName.value.trim() || config.shopName;
        if (this.el.shopTaxId) config.shopTaxId = this.el.shopTaxId.value.trim() || config.shopTaxId;
        if (this.el.vatRate) config.vatRate = parseFloat(this.el.vatRate.value) || 15;
        if (this.el.commissionRate) config.commissionRate = parseFloat(this.el.commissionRate.value) || 5;

        AppStore.set('config', config);
        localStorage.setItem('cw_config', JSON.stringify(config));
        AppUtils.toast('✅ 设置已保存', 'success');
    }
};

console.log('[Settings] 模块已注册');