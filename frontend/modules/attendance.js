/**
 * @file settings.js
 * @module settings
 * @description 系统设置 - 系统配置和偏好管理
 * 
 * @example
 * import { init } from './settings.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Settings
 * @property {Object} general - 常规设置
 * @property {Object} company - 公司信息
 * @property {Object} appearance - 外观设置
 * @property {Object} business - 业务设置
 * @property {Object} notifications - 通知设置
 * @property {Object} security - 安全设置
 */

/**
 * @typedef {Object} SettingsState
 * @property {Settings} settings - 所有设置
 * @property {string} activeTab - 当前激活的选项卡
 * @property {boolean} loading - 加载状态
 * @property {boolean} saved - 是否已保存
 */

/** @type {SettingsState} 状态 */
const state = {
    settings: {
        general: {
            language: 'zh-CN',
            timezone: 'Asia/Shanghai',
            dateFormat: 'YYYY-MM-DD',
            currency: 'CNY',
            autoSave: true,
            debugMode: false
        },
        company: {
            name: '洗车店',
            address: '市区洗车路88号',
            phone: '400-888-8888',
            email: 'info@carwash.com',
            website: 'https://www.carwash.com',
            showOnReceipt: true
        },
        appearance: {
            primaryColor: '#4F46E5',
            theme: 'light',
            fontSize: 'medium',
            layout: 'default'
        },
        business: {
            taxRate: 6,
            lowStockThreshold: 10,
            businessStart: '08:00',
            businessEnd: '22:00',
            enableLoyalty: true,
            enableAutoPrint: true
        },
        notifications: {
            lowStockAlert: true,
            orderReminder: true,
            attendanceReminder: false,
            systemUpdate: true
        },
        security: {
            passwordExpiry: 90,
            sessionTimeout: 60,
            twoFactor: false,
            loginAlert: true
        }
    },
    activeTab: 'general',
    loading: false,
    saved: true
};

/**
 * @private
 * @description 加载设置数据
 */
function loadSettings() {
    try {
        const saved = localStorage.getItem('system_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            // 合并默认设置和保存的设置
            state.settings = deepMerge(state.settings, parsed);
        }
    } catch (e) {
        console.warn('加载设置数据失败:', e);
    }
}

/**
 * @private
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} 合并后的对象
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

/**
 * @private
 * @description 保存设置数据
 */
function saveSettings() {
    try {
        localStorage.setItem('system_settings', JSON.stringify(state.settings));
        state.saved = true;
        return true;
    } catch (e) {
        console.warn('保存设置数据失败:', e);
        return false;
    }
}

/**
 * @private
 * @description 应用设置到UI
 */
function applySettingsToUI() {
    const s = state.settings;
    
    // 常规设置
    document.getElementById('settingLanguage')?.value = s.general.language;
    document.getElementById('settingTimezone')?.value = s.general.timezone;
    document.getElementById('settingDateFormat')?.value = s.general.dateFormat;
    document.getElementById('settingCurrency')?.value = s.general.currency;
    document.getElementById('settingAutoSave')?.checked = s.general.autoSave;
    document.getElementById('settingDebugMode')?.checked = s.general.debugMode;
    
    // 公司信息
    document.getElementById('settingCompanyName')?.value = s.company.name;
    document.getElementById('settingCompanyAddress')?.value = s.company.address;
    document.getElementById('settingCompanyPhone')?.value = s.company.phone;
    document.getElementById('settingCompanyEmail')?.value = s.company.email;
    document.getElementById('settingCompanyWebsite')?.value = s.company.website;
    document.getElementById('settingShowCompanyOnReceipt')?.checked = s.company.showOnReceipt;
    
    // 外观设置
    document.querySelectorAll('.color-option').forEach(el => {
        el.classList.toggle('active', el.dataset.color === s.appearance.primaryColor);
    });
    document.getElementById('settingTheme')?.value = s.appearance.theme;
    document.getElementById('settingFontSize')?.value = s.appearance.fontSize;
    document.getElementById('settingLayout')?.value = s.appearance.layout;
    
    // 业务设置
    document.getElementById('settingTaxRate')?.value = s.business.taxRate;
    document.getElementById('settingLowStockThreshold')?.value = s.business.lowStockThreshold;
    document.getElementById('settingBusinessStart')?.value = s.business.businessStart;
    document.getElementById('settingBusinessEnd')?.value = s.business.businessEnd;
    document.getElementById('settingEnableLoyalty')?.checked = s.business.enableLoyalty;
    document.getElementById('settingEnableAutoPrint')?.checked = s.business.enableAutoPrint;
    
    // 通知设置
    document.querySelectorAll('.toggle-switch').forEach((el, index) => {
        const keys = ['lowStockAlert', 'orderReminder', 'attendanceReminder', 'systemUpdate'];
        if (index < keys.length) {
            el.checked = s.notifications[keys[index]] || false;
            // 更新开关样式
            const span = el.nextElementSibling;
            if (span) {
                span.style.background = el.checked ? '#10B981' : '#E5E7EB';
            }
        }
    });
    
    // 安全设置
    document.getElementById('settingPasswordExpiry')?.value = s.security.passwordExpiry;
    document.getElementById('settingSessionTimeout')?.value = s.security.sessionTimeout;
    document.getElementById('settingTwoFactor')?.checked = s.security.twoFactor;
    document.getElementById('settingLoginAlert')?.checked = s.security.loginAlert;
    
    // 应用主题
    applyTheme(s.appearance.theme, s.appearance.primaryColor);
}

/**
 * @private
 * @param {string} theme - 主题名称
 * @param {string} primaryColor - 主色
 */
function applyTheme(theme, primaryColor) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        // 跟随系统
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
    
    // 应用主色
    if (primaryColor) {
        document.documentElement.style.setProperty('--color-primary', primaryColor);
    }
}

/**
 * @private
 * @description 从UI收集设置
 */
function collectSettingsFromUI() {
    const s = state.settings;
    
    // 常规设置
    s.general.language = document.getElementById('settingLanguage')?.value || s.general.language;
    s.general.timezone = document.getElementById('settingTimezone')?.value || s.general.timezone;
    s.general.dateFormat = document.getElementById('settingDateFormat')?.value || s.general.dateFormat;
    s.general.currency = document.getElementById('settingCurrency')?.value || s.general.currency;
    s.general.autoSave = document.getElementById('settingAutoSave')?.checked ?? s.general.autoSave;
    s.general.debugMode = document.getElementById('settingDebugMode')?.checked ?? s.general.debugMode;
    
    // 公司信息
    s.company.name = document.getElementById('settingCompanyName')?.value || s.company.name;
    s.company.address = document.getElementById('settingCompanyAddress')?.value || s.company.address;
    s.company.phone = document.getElementById('settingCompanyPhone')?.value || s.company.phone;
    s.company.email = document.getElementById('settingCompanyEmail')?.value || s.company.email;
    s.company.website = document.getElementById('settingCompanyWebsite')?.value || s.company.website;
    s.company.showOnReceipt = document.getElementById('settingShowCompanyOnReceipt')?.checked ?? s.company.showOnReceipt;
    
    // 外观设置
    const activeColor = document.querySelector('.color-option.active');
    if (activeColor) {
        s.appearance.primaryColor = activeColor.dataset.color;
    }
    s.appearance.theme = document.getElementById('settingTheme')?.value || s.appearance.theme;
    s.appearance.fontSize = document.getElementById('settingFontSize')?.value || s.appearance.fontSize;
    s.appearance.layout = document.getElementById('settingLayout')?.value || s.appearance.layout;
    
    // 业务设置
    s.business.taxRate = parseFloat(document.getElementById('settingTaxRate')?.value) || s.business.taxRate;
    s.business.lowStockThreshold = parseInt(document.getElementById('settingLowStockThreshold')?.value) || s.business.lowStockThreshold;
    s.business.businessStart = document.getElementById('settingBusinessStart')?.value || s.business.businessStart;
    s.business.businessEnd = document.getElementById('settingBusinessEnd')?.value || s.business.businessEnd;
    s.business.enableLoyalty = document.getElementById('settingEnableLoyalty')?.checked ?? s.business.enableLoyalty;
    s.business.enableAutoPrint = document.getElementById('settingEnableAutoPrint')?.checked ?? s.business.enableAutoPrint;
    
    // 通知设置
    document.querySelectorAll('.toggle-switch').forEach((el, index) => {
        const keys = ['lowStockAlert', 'orderReminder', 'attendanceReminder', 'systemUpdate'];
        if (index < keys.length) {
            s.notifications[keys[index]] = el.checked;
        }
    });
    
    // 安全设置
    s.security.passwordExpiry = parseInt(document.getElementById('settingPasswordExpiry')?.value) || s.security.passwordExpiry;
    s.security.sessionTimeout = parseInt(document.getElementById('settingSessionTimeout')?.value) || s.security.sessionTimeout;
    s.security.twoFactor = document.getElementById('settingTwoFactor')?.checked ?? s.security.twoFactor;
    s.security.loginAlert = document.getElementById('settingLoginAlert')?.checked ?? s.security.loginAlert;
}

/**
 * @private
 * @description 保存所有设置
 */
function saveAllSettings() {
    collectSettingsFromUI();
    if (saveSettings()) {
        showToast('所有设置已保存', 'success');
        // 应用主题变化
        applyTheme(state.settings.appearance.theme, state.settings.appearance.primaryColor);
    } else {
        showToast('保存设置失败', 'error');
    }
}

/**
 * @private
 * @description 重置设置
 */
function resetSettings() {
    if (!confirm('确认重置所有设置为默认值？')) return;
    
    // 重新加载默认设置
    const defaultSettings = {
        general: {
            language: 'zh-CN',
            timezone: 'Asia/Shanghai',
            dateFormat: 'YYYY-MM-DD',
            currency: 'CNY',
            autoSave: true,
            debugMode: false
        },
        company: {
            name: '洗车店',
            address: '市区洗车路88号',
            phone: '400-888-8888',
            email: 'info@carwash.com',
            website: 'https://www.carwash.com',
            showOnReceipt: true
        },
        appearance: {
            primaryColor: '#4F46E5',
            theme: 'light',
            fontSize: 'medium',
            layout: 'default'
        },
        business: {
            taxRate: 6,
            lowStockThreshold: 10,
            businessStart: '08:00',
            businessEnd: '22:00',
            enableLoyalty: true,
            enableAutoPrint: true
        },
        notifications: {
            lowStockAlert: true,
            orderReminder: true,
            attendanceReminder: false,
            systemUpdate: true
        },
        security: {
            passwordExpiry: 90,
            sessionTimeout: 60,
            twoFactor: false,
            loginAlert: true
        }
    };
    
    state.settings = defaultSettings;
    saveSettings();
    applySettingsToUI();
    showToast('设置已重置', 'success');
}

/**
 * @private
 * @description 切换选项卡
 */
function switchTab(tabId) {
    state.activeTab = tabId;
    
    // 更新选项卡按钮样式
    document.querySelectorAll('.settings-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // 显示对应的面板
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.style.display = panel.id === `tab-${tabId}` ? 'block' : 'none';
    });
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    // 选项卡切换
    document.querySelectorAll('.settings-tab').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // 颜色选择
    document.querySelectorAll('.color-option').forEach(el => {
        el.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            state.saved = false;
        });
    });
    
    // 开关切换
    document.querySelectorAll('.toggle-switch').forEach(el => {
        el.addEventListener('change', function() {
            const span = this.nextElementSibling;
            if (span) {
                span.style.background = this.checked ? '#10B981' : '#E5E7EB';
            }
            state.saved = false;
        });
    });
    
    // 表单输入变化标记
    document.querySelectorAll('#settings-container input, #settings-container select').forEach(el => {
        el.addEventListener('change', () => { state.saved = false; });
        el.addEventListener('input', () => { state.saved = false; });
    });
    
    // 保存按钮
    document.getElementById('saveAllSettings')?.addEventListener('click', saveAllSettings);
    
    // 重置按钮
    document.getElementById('resetSettings')?.addEventListener('click', resetSettings);
    
    // 清空数据
    window.SettingsModule = window.SettingsModule || {};
    window.SettingsModule.clearAllData = function() {
        if (!confirm('⚠️ 确认清空所有数据？此操作不可恢复！')) return;
        if (!confirm('再次确认：所有数据将被永久删除！')) return;
        
        localStorage.clear();
        showToast('所有数据已清空', 'warning');
        setTimeout(() => {
            location.reload();
        }, 1500);
    };
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {Settings} options.data - 初始设置数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('⚙️ 系统设置 初始化...');
    
    if (options?.data) {
        state.settings = deepMerge(state.settings, options.data);
        saveSettings();
    }
    
    loadSettings();
    applySettingsToUI();
    bindEvents();
    
    window.SettingsModule = {
        state,
        loadSettings,
        saveSettings,
        saveAllSettings,
        resetSettings,
        switchTab,
        applySettingsToUI,
        clearAllData: window.SettingsModule?.clearAllData || function() {}
    };
    
    console.log('✅ 系统设置 初始化完成');
}

/**
 * @public
 * @description 获取设置
 * @param {string} key - 设置键名 (如 'general.language')
 * @returns {any} 设置值
 */
export function getSetting(key) {
    const keys = key.split('.');
    let value = state.settings;
    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            return undefined;
        }
    }
    return value;
}

/**
 * @public
 * @param {string} key - 设置键名
 * @param {any} value - 设置值
 * @returns {boolean} 是否成功
 */
export function setSetting(key, value) {
    const keys = key.split('.');
    let target = state.settings;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) {
            target[keys[i]] = {};
        }
        target = target[keys[i]];
    }
    target[keys[keys.length - 1]] = value;
    state.saved = false;
    return true;
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    getSetting,
    setSetting,
    saveAllSettings,
    resetSettings
};