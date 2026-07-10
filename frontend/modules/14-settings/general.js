/**
 * @file general.js
 * @module general
 * @description 通用设置 - 系统通用配置
 * 
 * @example
 * import { init } from './general.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} GeneralSettings
 * @property {string} appName - 应用名称
 * @property {string} appVersion - 应用版本
 * @property {string} environment - 环境 (development/production)
 * @property {boolean} maintenanceMode - 维护模式
 * @property {string} timezone - 时区
 * @property {string} dateFormat - 日期格式
 * @property {string} timeFormat - 时间格式
 * @property {string} defaultLanguage - 默认语言
 * @property {number} sessionTimeout - 会话超时(分钟)
 * @property {boolean} registrationEnabled - 允许注册
 * @property {string} updatedAt - 更新时间
 */

/** @type {{settings: GeneralSettings, loading: boolean, saved: boolean}} 状态 */
const state = {
    settings: {
        appName: 'Carwash Pro',
        appVersion: '1.0.0',
        environment: 'production',
        maintenanceMode: false,
        timezone: 'Asia/Shanghai',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        defaultLanguage: 'zh-CN',
        sessionTimeout: 60,
        registrationEnabled: true,
        updatedAt: new Date().toISOString()
    },
    loading: false,
    saved: true
};

/**
 * @private
 * @description 加载通用设置
 */
function loadSettings() {
    try {
        const saved = localStorage.getItem('general_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.settings = { ...state.settings, ...parsed };
        }
    } catch (e) {
        console.warn('加载通用设置失败:', e);
    }
}

/**
 * @private
 * @description 保存通用设置
 */
function saveSettings() {
    try {
        state.settings.updatedAt = new Date().toISOString();
        localStorage.setItem('general_settings', JSON.stringify(state.settings));
        state.saved = true;
        return true;
    } catch (e) {
        console.warn('保存通用设置失败:', e);
        return false;
    }
}

/**
 * @private
 * @param {string} str - 字符串
 * @returns {string} 转义后的字符串
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * @private
 * @description 渲染通用设置表单
 */
function renderForm() {
    const container = document.getElementById('generalForm');
    if (!container) return;

    const s = state.settings;

    container.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">应用名称</label>
                <input id="genAppName" type="text" value="${escapeHtml(s.appName)}"
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;" />
            </div>
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">应用版本</label>
                <input id="genAppVersion" type="text" value="${escapeHtml(s.appVersion)}" readonly
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;background:#F9FAFB;color:#6B7280;" />
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;">
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">环境</label>
                <select id="genEnvironment" style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;">
                    <option value="development" ${s.environment === 'development' ? 'selected' : ''}>开发环境</option>
                    <option value="staging" ${s.environment === 'staging' ? 'selected' : ''}>预发布环境</option>
                    <option value="production" ${s.environment === 'production' ? 'selected' : ''}>生产环境</option>
                </select>
            </div>
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">会话超时（分钟）</label>
                <input id="genSessionTimeout" type="number" value="${s.sessionTimeout}"
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;" />
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;">
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">时区</label>
                <select id="genTimezone" style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;">
                    <option value="Asia/Shanghai" ${s.timezone === 'Asia/Shanghai' ? 'selected' : ''}>Asia/Shanghai (UTC+8)</option>
                    <option value="Asia/Hong_Kong" ${s.timezone === 'Asia/Hong_Kong' ? 'selected' : ''}>Asia/Hong_Kong (UTC+8)</option>
                    <option value="Asia/Tokyo" ${s.timezone === 'Asia/Tokyo' ? 'selected' : ''}>Asia/Tokyo (UTC+9)</option>
                    <option value="America/New_York" ${s.timezone === 'America/New_York' ? 'selected' : ''}>America/New_York (UTC-5)</option>
                    <option value="Europe/London" ${s.timezone === 'Europe/London' ? 'selected' : ''}>Europe/London (UTC+0)</option>
                </select>
            </div>
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">默认语言</label>
                <select id="genDefaultLanguage" style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;">
                    <option value="zh-CN" ${s.defaultLanguage === 'zh-CN' ? 'selected' : ''}>简体中文</option>
                    <option value="zh-TW" ${s.defaultLanguage === 'zh-TW' ? 'selected' : ''}>繁體中文</option>
                    <option value="en-US" ${s.defaultLanguage === 'en-US' ? 'selected' : ''}>English</option>
                </select>
            </div>
        </div>

        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E5E7EB;">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px;">
                <input type="checkbox" id="genMaintenanceMode" ${s.maintenanceMode ? 'checked' : ''} />
                <span style="font-size:14px;color:#374151;">启用维护模式</span>
                <span style="font-size:12px;color:#6B7280;margin-left:8px;">（维护期间用户无法访问系统）</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                <input type="checkbox" id="genRegistrationEnabled" ${s.registrationEnabled ? 'checked' : ''} />
                <span style="font-size:14px;color:#374151;">允许新用户注册</span>
            </label>
        </div>

        <div style="margin-top:20px;padding-top:20px;border-top:1px solid #E5E7EB;display:flex;gap:12px;">
            <button id="saveGeneralBtn" style="padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;">
                <i class="fas fa-save"></i> 保存通用设置
            </button>
            <button id="resetGeneralBtn" style="padding:8px 24px;background:#F3F4F6;color:#374151;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
                <i class="fas fa-undo"></i> 重置默认
            </button>
        </div>
    `;

    // 绑定事件
    document.getElementById('saveGeneralBtn')?.addEventListener('click', saveAllSettings);
    document.getElementById('resetGeneralBtn')?.addEventListener('click', resetSettings);

    // 输入变化标记
    container.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', () => { state.saved = false; });
        el.addEventListener('input', () => { state.saved = false; });
    });
}

/**
 * @private
 * @description 保存所有通用设置
 */
function saveAllSettings() {
    const s = state.settings;

    s.appName = document.getElementById('genAppName')?.value || s.appName;
    s.appVersion = document.getElementById('genAppVersion')?.value || s.appVersion;
    s.environment = document.getElementById('genEnvironment')?.value || s.environment;
    s.sessionTimeout = parseInt(document.getElementById('genSessionTimeout')?.value) || s.sessionTimeout;
    s.timezone = document.getElementById('genTimezone')?.value || s.timezone;
    s.defaultLanguage = document.getElementById('genDefaultLanguage')?.value || s.defaultLanguage;
    s.maintenanceMode = document.getElementById('genMaintenanceMode')?.checked ?? s.maintenanceMode;
    s.registrationEnabled = document.getElementById('genRegistrationEnabled')?.checked ?? s.registrationEnabled;

    if (saveSettings()) {
        // 更新应用名称
        document.title = s.appName;
        showToast('通用设置已保存', 'success');
    } else {
        showToast('保存失败，请重试', 'error');
    }
}

/**
 * @private
 * @description 重置通用设置
 */
function resetSettings() {
    if (!confirm('确认重置所有通用设置为默认值？')) return;

    const defaultSettings = {
        appName: 'Carwash Pro',
        appVersion: '1.0.0',
        environment: 'production',
        maintenanceMode: false,
        timezone: 'Asia/Shanghai',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        defaultLanguage: 'zh-CN',
        sessionTimeout: 60,
        registrationEnabled: true,
        updatedAt: new Date().toISOString()
    };

    state.settings = defaultSettings;
    saveSettings();
    renderForm();
    showToast('已重置为默认值', 'info');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (document.getElementById('generalForm')) {
                saveAllSettings();
            }
        }
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {GeneralSettings} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('⚙️ 通用设置 初始化...');

    if (options?.data) {
        state.settings = { ...state.settings, ...options.data };
        saveSettings();
    }

    loadSettings();
    renderForm();
    bindEvents();

    window.GeneralModule = {
        state,
        loadSettings,
        saveSettings,
        saveAllSettings,
        resetSettings,
        renderForm
    };

    console.log('✅ 通用设置 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadSettings,
    saveSettings,
    saveAllSettings,
    resetSettings
};