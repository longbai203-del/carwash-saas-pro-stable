/**
 * @file preferences.js
 * @module preferences
 * @description 偏好设置 - 用户个性化偏好管理
 * 
 * @example
 * import { init } from './preferences.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Preferences
 * @property {string} theme - 主题 (light/dark/auto)
 * @property {string} language - 语言
 * @property {string} dateFormat - 日期格式
 * @property {string} timeFormat - 时间格式 (12h/24h)
 * @property {string} currency - 货币
 * @property {number} itemsPerPage - 每页显示数量
 * @property {string} sidebarBehavior - 侧边栏行为 (expand/collapse)
 * @property {boolean} showNotifications - 显示通知
 * @property {boolean} soundEnabled - 声音开关
 * @property {boolean} autoSave - 自动保存
 * @property {string} dashboardLayout - 仪表板布局
 * @property {string[]} favoriteModules - 收藏模块
 * @property {string} updatedAt - 更新时间
 */

/** @type {{prefs: Preferences, loading: boolean, saved: boolean}} 状态 */
const state = {
    prefs: {
        theme: 'light',
        language: 'zh-CN',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        currency: 'CNY',
        itemsPerPage: 10,
        sidebarBehavior: 'expand',
        showNotifications: true,
        soundEnabled: true,
        autoSave: true,
        dashboardLayout: 'default',
        favoriteModules: ['dashboard', 'pos', 'orders'],
        updatedAt: new Date().toISOString()
    },
    loading: false,
    saved: true
};

/**
 * @private
 * @description 加载偏好设置
 */
function loadPreferences() {
    try {
        const saved = localStorage.getItem('user_preferences');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.prefs = { ...state.prefs, ...parsed };
        }
        // 从store获取主题
        const theme = store.get('theme');
        if (theme) {
            state.prefs.theme = theme;
        }
    } catch (e) {
        console.warn('加载偏好设置失败:', e);
    }
}

/**
 * @private
 * @description 保存偏好设置
 */
function savePreferences() {
    try {
        state.prefs.updatedAt = new Date().toISOString();
        localStorage.setItem('user_preferences', JSON.stringify(state.prefs));
        // 同步到store
        store.set('theme', state.prefs.theme);
        store.set('language', state.prefs.language);
        state.saved = true;
        return true;
    } catch (e) {
        console.warn('保存偏好设置失败:', e);
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
 * @description 渲染偏好设置表单
 */
function renderForm() {
    const container = document.getElementById('preferencesForm');
    if (!container) return;

    const p = state.prefs;

    container.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">主题模式</label>
                <select id="prefTheme" style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;">
                    <option value="light" ${p.theme === 'light' ? 'selected' : ''}>浅色</option>
                    <option value="dark" ${p.theme === 'dark' ? 'selected' : ''}>深色</option>
                    <option value="auto" ${p.theme === 'auto' ? 'selected' : ''}>跟随系统</option>
                </select>
            </div>
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">语言</label>
                <select id="prefLanguage" style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;">
                    <option value="zh-CN" ${p.language === 'zh-CN' ? 'selected' : ''}>简体中文</option>
                    <option value="zh-TW" ${p.language === 'zh-TW' ? 'selected' : ''}>繁體中文</option>
                    <option value="en-US" ${p.language === 'en-US' ? 'selected' : ''}>English</option>
                </select>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;">
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">日期格式</label>
                <select id="prefDateFormat" style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;">
                    <option value="YYYY-MM-DD" ${p.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                    <option value="DD/MM/YYYY" ${p.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY" ${p.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                    <option value="YYYY年MM月DD日" ${p.dateFormat === 'YYYY年MM月DD日' ? 'selected' : ''}>YYYY年MM月DD日</option>
                </select>
            </div>
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">时间格式</label>
                <select id="prefTimeFormat" style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;">
                    <option value="24h" ${p.timeFormat === '24h' ? 'selected' : ''}>24小时制</option>
                    <option value="12h" ${p.timeFormat === '12h' ? 'selected' : ''}>12小时制</option>
                </select>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;">
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">货币单位</label>
                <select id="prefCurrency" style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;">
                    <option value="CNY" ${p.currency === 'CNY' ? 'selected' : ''}>CNY (¥)</option>
                    <option value="USD" ${p.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                    <option value="EUR" ${p.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                    <option value="HKD" ${p.currency === 'HKD' ? 'selected' : ''}>HKD (HK$)</option>
                </select>
            </div>
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">每页显示数量</label>
                <select id="prefItemsPerPage" style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;">
                    <option value="5" ${p.itemsPerPage === 5 ? 'selected' : ''}>5</option>
                    <option value="10" ${p.itemsPerPage === 10 ? 'selected' : ''}>10</option>
                    <option value="20" ${p.itemsPerPage === 20 ? 'selected' : ''}>20</option>
                    <option value="50" ${p.itemsPerPage === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${p.itemsPerPage === 100 ? 'selected' : ''}>100</option>
                </select>
            </div>
        </div>

        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E5E7EB;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" id="prefShowNotifications" ${p.showNotifications ? 'checked' : ''} />
                    <span style="font-size:14px;color:#374151;">显示通知</span>
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" id="prefSoundEnabled" ${p.soundEnabled ? 'checked' : ''} />
                    <span style="font-size:14px;color:#374151;">声音开关</span>
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" id="prefAutoSave" ${p.autoSave ? 'checked' : ''} />
                    <span style="font-size:14px;color:#374151;">自动保存</span>
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" id="prefCompactSidebar" ${p.sidebarBehavior === 'collapse' ? 'checked' : ''} />
                    <span style="font-size:14px;color:#374151;">紧凑侧边栏</span>
                </label>
            </div>
        </div>

        <div style="margin-top:20px;padding-top:20px;border-top:1px solid #E5E7EB;display:flex;gap:12px;">
            <button id="savePrefsBtn" style="padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;">
                <i class="fas fa-save"></i> 保存偏好设置
            </button>
            <button id="resetPrefsBtn" style="padding:8px 24px;background:#F3F4F6;color:#374151;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
                <i class="fas fa-undo"></i> 重置默认
            </button>
        </div>
    `;

    // 绑定事件
    document.getElementById('savePrefsBtn')?.addEventListener('click', saveAllPreferences);
    document.getElementById('resetPrefsBtn')?.addEventListener('click', resetPreferences);

    // 输入变化标记
    container.querySelectorAll('select, input').forEach(el => {
        el.addEventListener('change', () => { state.saved = false; });
    });

    // 开关切换视觉反馈
    container.querySelectorAll('input[type="checkbox"]').forEach(el => {
        el.addEventListener('change', function() {
            state.saved = false;
        });
    });
}

/**
 * @private
 * @description 保存所有偏好设置
 */
function saveAllPreferences() {
    const prefs = state.prefs;

    prefs.theme = document.getElementById('prefTheme')?.value || prefs.theme;
    prefs.language = document.getElementById('prefLanguage')?.value || prefs.language;
    prefs.dateFormat = document.getElementById('prefDateFormat')?.value || prefs.dateFormat;
    prefs.timeFormat = document.getElementById('prefTimeFormat')?.value || prefs.timeFormat;
    prefs.currency = document.getElementById('prefCurrency')?.value || prefs.currency;
    prefs.itemsPerPage = parseInt(document.getElementById('prefItemsPerPage')?.value) || prefs.itemsPerPage;
    prefs.showNotifications = document.getElementById('prefShowNotifications')?.checked ?? prefs.showNotifications;
    prefs.soundEnabled = document.getElementById('prefSoundEnabled')?.checked ?? prefs.soundEnabled;
    prefs.autoSave = document.getElementById('prefAutoSave')?.checked ?? prefs.autoSave;
    prefs.sidebarBehavior = document.getElementById('prefCompactSidebar')?.checked ? 'collapse' : 'expand';

    if (savePreferences()) {
        // 应用主题变化
        applyTheme(prefs.theme);
        showToast('偏好设置已保存', 'success');
    } else {
        showToast('保存失败，请重试', 'error');
    }
}

/**
 * @private
 * @param {string} theme - 主题名称
 */
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
}

/**
 * @private
 * @description 重置偏好设置
 */
function resetPreferences() {
    if (!confirm('确认重置所有偏好设置为默认值？')) return;

    const defaultPrefs = {
        theme: 'light',
        language: 'zh-CN',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        currency: 'CNY',
        itemsPerPage: 10,
        sidebarBehavior: 'expand',
        showNotifications: true,
        soundEnabled: true,
        autoSave: true,
        dashboardLayout: 'default',
        favoriteModules: ['dashboard', 'pos', 'orders'],
        updatedAt: new Date().toISOString()
    };

    state.prefs = defaultPrefs;
    savePreferences();
    renderForm();
    applyTheme(defaultPrefs.theme);
    showToast('已重置为默认值', 'info');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    // Ctrl+S 保存
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (document.getElementById('preferencesForm')) {
                saveAllPreferences();
            }
        }
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {Preferences} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('⚙️ 偏好设置 初始化...');

    if (options?.data) {
        state.prefs = { ...state.prefs, ...options.data };
        savePreferences();
    }

    loadPreferences();
    renderForm();
    bindEvents();

    // 应用主题
    applyTheme(state.prefs.theme);

    window.PreferencesModule = {
        state,
        loadPreferences,
        savePreferences,
        saveAllPreferences,
        resetPreferences,
        renderForm,
        applyTheme
    };

    console.log('✅ 偏好设置 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadPreferences,
    savePreferences,
    saveAllPreferences,
    resetPreferences
};