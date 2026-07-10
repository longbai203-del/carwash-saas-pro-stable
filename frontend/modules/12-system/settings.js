/**
 * @file settings.js
 * @module settings
 * @description 系统设置 - 系统配置管理
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Setting
 * @property {string} key - 设置键
 * @property {string} value - 设置值
 * @property {string} group - 分组
 * @property {string} type - 类型 (string/number/boolean/select/json)
 * @property {string} label - 显示标签
 * @property {string} description - 描述
 * @property {string[]} options - 选项（select类型）
 * @property {string} updatedAt - 更新时间
 */

/** @type {{settings: Setting[], groups: string[], activeGroup: string, searchQuery: string, editingKey: string|null}} */
const state = {
    settings: [],
    groups: [],
    activeGroup: 'general',
    searchQuery: '',
    editingKey: null
};

/**
 * @private
 */
function getDefaultSettings() {
    return [
        // 通用设置
        { key: 'site_name', value: 'Carwash Pro', group: 'general', type: 'string', label: '系统名称', description: '显示在浏览器标签和系统标题中' },
        { key: 'site_logo', value: '/assets/images/logo.png', group: 'general', type: 'string', label: 'Logo路径', description: '系统Logo图片路径' },
        { key: 'timezone', value: 'Asia/Shanghai', group: 'general', type: 'select', label: '时区', description: '系统默认时区', options: ['Asia/Shanghai', 'Asia/Tokyo', 'America/New_York', 'Europe/London'] },
        { key: 'date_format', value: 'YYYY-MM-DD', group: 'general', type: 'select', label: '日期格式', description: '日期显示格式', options: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'] },
        { key: 'currency', value: 'CNY', group: 'general', type: 'select', label: '货币单位', description: '系统默认货币', options: ['CNY', 'USD', 'EUR', 'JPY'] },
        
        // 业务设置
        { key: 'tax_rate', value: '6', group: 'business', type: 'number', label: '税率 (%)', description: '默认税率' },
        { key: 'discount_max', value: '30', group: 'business', type: 'number', label: '最大折扣 (%)', description: '允许的最大折扣比例' },
        { key: 'order_timeout', value: '30', group: 'business', type: 'number', label: '订单超时 (分钟)', description: '未支付订单自动取消时间' },
        { key: 'allow_returns', value: 'true', group: 'business', type: 'boolean', label: '允许退货', description: '是否允许退货操作' },
        { key: 'return_days', value: '7', group: 'business', type: 'number', label: '退货期限 (天)', description: '允许退货的天数限制' },
        
        // 通知设置
        { key: 'email_notifications', value: 'true', group: 'notifications', type: 'boolean', label: '邮件通知', description: '是否发送邮件通知' },
        { key: 'sms_notifications', value: 'false', group: 'notifications', type: 'boolean', label: '短信通知', description: '是否发送短信通知' },
        { key: 'low_stock_alert', value: '5', group: 'notifications', type: 'number', label: '低库存预警', description: '库存低于此值时触发预警' },
        { key: 'auto_backup', value: 'true', group: 'notifications', type: 'boolean', label: '自动备份', description: '是否启用自动备份' },
        { key: 'backup_frequency', value: 'daily', group: 'notifications', type: 'select', label: '备份频率', description: '自动备份频率', options: ['hourly', 'daily', 'weekly', 'monthly'] },
        
        // 安全设置
        { key: 'session_timeout', value: '60', group: 'security', type: 'number', label: '会话超时 (分钟)', description: '用户会话超时时间' },
        { key: 'max_login_attempts', value: '5', group: 'security', type: 'number', label: '最大登录尝试', description: '锁定前允许的登录尝试次数' },
        { key: 'password_policy', value: 'medium', group: 'security', type: 'select', label: '密码策略', description: '密码强度要求', options: ['low', 'medium', 'high'] },
        { key: 'two_factor_auth', value: 'false', group: 'security', type: 'boolean', label: '双因素认证', description: '是否启用双因素认证' },
        { key: 'ip_whitelist', value: '[]', group: 'security', type: 'json', label: 'IP白名单', description: '允许访问的IP列表 (JSON格式)' },
        
        // 集成设置
        { key: 'payment_gateway', value: 'stripe', group: 'integrations', type: 'select', label: '支付网关', description: '默认支付网关', options: ['stripe', 'paypal', 'alipay', 'wechat'] },
        { key: 'payment_api_key', value: '', group: 'integrations', type: 'string', label: '支付API密钥', description: '支付网关API密钥' },
        { key: 'webhook_url', value: '', group: 'integrations', type: 'string', label: 'Webhook URL', description: '系统Webhook回调地址' }
    ];
}

/**
 * @private
 */
function loadSettings() {
    try {
        const saved = localStorage.getItem('system_settings');
        if (saved) {
            state.settings = JSON.parse(saved);
        } else {
            state.settings = getDefaultSettings();
            localStorage.setItem('system_settings', JSON.stringify(state.settings));
        }
    } catch (e) {
        state.settings = getDefaultSettings();
    }
    loadGroups();
}

/**
 * @private
 */
function loadGroups() {
    const groupSet = new Set(state.settings.map(s => s.group));
    state.groups = ['general', 'business', 'notifications', 'security', 'integrations'].filter(g => groupSet.has(g));
}

/**
 * @private
 */
function saveSettings() {
    try {
        localStorage.setItem('system_settings', JSON.stringify(state.settings));
    } catch (e) {}
}

/**
 * @private
 * @param {string} group - 分组名
 * @returns {string} 分组中文名
 */
function getGroupLabel(group) {
    const map = {
        general: '通用设置',
        business: '业务设置',
        notifications: '通知设置',
        security: '安全设置',
        integrations: '集成设置'
    };
    return map[group] || group;
}

/**
 * @private
 */
function render() {
    const container = document.getElementById('settingsContainer');
    if (!container) return;
    
    // 渲染分组导航
    const navHtml = `
        <div style="display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid #E5E7EB;padding-bottom:12px;margin-bottom:16px;">
            ${state.groups.map(g => `
                <button class="btn ${state.activeGroup === g ? 'btn-primary' : 'btn-outline'}" 
                        onclick="window.SystemSettingsModule.switchGroup('${g}')"
                        style="padding:6px 16px;font-size:13px;">
                    ${getGroupLabel(g)}
                </button>
            `).join('')}
        </div>
    `;
    
    // 渲染当前分组的设置
    const groupSettings = state.settings.filter(s => s.group === state.activeGroup);
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        const filtered = groupSettings.filter(s => 
            s.key.toLowerCase().includes(query) || 
            s.label.toLowerCase().includes(query) || 
            (s.description && s.description.toLowerCase().includes(query))
        );
        groupSettings.length = 0;
        groupSettings.push(...filtered);
    }
    
    if (groupSettings.length === 0) {
        container.innerHTML = `
            ${navHtml}
            <div style="text-align:center;padding:40px;color:#9CA3AF;">
                <i class="fas fa-cog" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                ${state.searchQuery ? '没有匹配的设置' : '暂无设置项'}
            </div>
        `;
        return;
    }
    
    const settingsHtml = groupSettings.map(s => {
        const valueDisplay = renderSettingValue(s);
        
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                 onmouseover="this.style.background='#F9FAFB'"
                 onmouseout="this.style.background=''">
                <div style="flex:1;">
                    <div style="font-weight:500;font-size:14px;color:#1F2937;">${s.label}</div>
                    <div style="font-size:12px;color:#6B7280;">${s.key}</div>
                    ${s.description ? `<div style="font-size:12px;color:#9CA3AF;margin-top:2px;">${s.description}</div>` : ''}
                </div>
                <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
                    <span style="font-size:13px;color:#4B5563;">${valueDisplay}</span>
                    <button class="btn btn-sm btn-outline" onclick="window.SystemSettingsModule.editSetting('${s.key}')" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        ${navHtml}
        ${settingsHtml}
    `;
}

/**
 * @private
 * @param {Setting} setting - 设置项
 * @returns {string} 渲染的值
 */
function renderSettingValue(setting) {
    if (setting.type === 'boolean') {
        return setting.value === 'true' 
            ? '<span style="color:#065F46;">✅ 启用</span>' 
            : '<span style="color:#6B7280;">⛔ 停用</span>';
    }
    if (setting.type === 'number') {
        return `<span style="color:#4F46E5;">${setting.value}</span>`;
    }
    if (setting.type === 'select') {
        return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:#F3F4F6;font-size:12px;">${setting.value}</span>`;
    }
    if (setting.type === 'json') {
        try {
            const parsed = JSON.parse(setting.value);
            return `<span style="font-size:11px;color:#6B7280;font-family:monospace;">${JSON.stringify(parsed).slice(0, 30)}${JSON.stringify(parsed).length > 30 ? '...' : ''}</span>`;
        } catch {
            return `<span style="font-size:11px;color:#EF4444;">❌ 无效JSON</span>`;
        }
    }
    if (setting.type === 'string') {
        const display = setting.value || '未设置';
        return `<span style="color:#4B5563;max-width:200px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${display}</span>`;
    }
    return `<span>${setting.value}</span>`;
}

/**
 * @private
 * @param {string} key - 设置键
 */
function editSetting(key) {
    const setting = state.settings.find(s => s.key === key);
    if (!setting) { showToast('设置不存在', 'error'); return; }
    
    let newValue;
    
    switch (setting.type) {
        case 'boolean':
            newValue = confirm(`当前值: ${setting.value === 'true' ? '启用' : '停用'}\n点击确定启用，取消停用`) ? 'true' : 'false';
            break;
        case 'select':
            const options = setting.options || [];
            const idx = parseInt(prompt(`选择值：\n${options.map((o, i) => `${i+1}. ${o}`).join('\n')}`, options.indexOf(setting.value) + 1));
            newValue = options[idx - 1] || setting.value;
            break;
        case 'number':
            const num = prompt('请输入数值：', setting.value);
            if (num === null) return;
            newValue = parseFloat(num);
            if (isNaN(newValue)) {
                showToast('请输入有效数字', 'error');
                return;
            }
            newValue = String(newValue);
            break;
        case 'json':
            const json = prompt('请输入JSON：', setting.value);
            if (json === null) return;
            try {
                JSON.parse(json);
                newValue = json;
            } catch {
                showToast('无效JSON格式', 'error');
                return;
            }
            break;
        default:
            const val = prompt('请输入值：', setting.value);
            if (val === null) return;
            newValue = val;
    }
    
    setting.value = newValue;
    setting.updatedAt = new Date().toISOString();
    saveSettings();
    render();
    showToast(`✅ 设置 "${setting.label}" 已更新`, 'success');
}

/**
 * @private
 * @param {string} group - 分组名
 */
function switchGroup(group) {
    state.activeGroup = group;
    state.searchQuery = '';
    render();
}

/**
 * @private
 */
function handleSearch() {
    state.searchQuery = document.getElementById('settingSearch')?.value || '';
    render();
}

/**
 * @private
 */
function resetToDefaults() {
    if (!confirm('⚠️ 确认重置所有设置为默认值？')) return;
    
    state.settings = getDefaultSettings();
    saveSettings();
    render();
    showToast('✅ 所有设置已重置为默认值', 'success');
}

/**
 * @private
 */
function exportSettings() {
    const data = JSON.stringify(state.settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('设置已导出', 'success');
}

/**
 * @private
 */
function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (Array.isArray(data) && data.length > 0 && data[0].key) {
                    state.settings = data;
                    saveSettings();
                    loadGroups();
                    render();
                    showToast('✅ 设置已导入', 'success');
                } else {
                    showToast('无效的设置文件格式', 'error');
                }
            } catch {
                showToast('无效的JSON文件', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

/**
 * @private
 */
function bindEvents() {
    document.getElementById('settingSearch')?.addEventListener('input', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', resetToDefaults);
    document.getElementById('exportBtn')?.addEventListener('click', exportSettings);
    document.getElementById('importBtn')?.addEventListener('click', importSettings);
}

/**
 * @public
 */
export async function init(options) {
    console.log('⚙️ 系统设置 初始化...');
    loadSettings();
    bindEvents();
    render();
    
    window.SystemSettingsModule = {
        state,
        loadSettings,
        saveSettings,
        render,
        renderSettingValue,
        switchGroup,
        editSetting,
        handleSearch,
        resetToDefaults,
        exportSettings,
        importSettings
    };
    
    console.log('✅ 系统设置 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadSettings,
    saveSettings,
    switchGroup,
    editSetting,
    resetToDefaults,
    exportSettings,
    importSettings
};