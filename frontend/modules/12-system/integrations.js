/**
 * @file integrations.js
 * @module integrations
 * @description 集成管理 - 第三方服务集成配置
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Integration
 * @property {string} id - 集成ID
 * @property {string} name - 服务名称
 * @property {string} type - 类型 (payment/sms/email/storage/analytics)
 * @property {string} provider - 提供商
 * @property {string} status - 状态 (connected/disconnected/error)
 * @property {Object} config - 配置信息
 * @property {string} lastSyncAt - 最后同步时间
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{integrations: Integration[], filteredIntegrations: Integration[], filters: {name: string, type: string, status: string}, page: number, pageSize: number}} */
const state = {
    integrations: [],
    filteredIntegrations: [],
    filters: { name: '', type: '', status: '' },
    page: 1,
    pageSize: 10
};

/**
 * @private
 */
function getMockIntegrations() {
    const integrations = [
        {
            id: 'INT-000001',
            name: 'Stripe支付',
            type: 'payment',
            provider: 'Stripe',
            status: 'connected',
            config: { apiKey: 'sk_test_****', webhookSecret: 'whsec_****' },
            lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'INT-000002',
            name: '支付宝支付',
            type: 'payment',
            provider: 'Alipay',
            status: 'connected',
            config: { appId: '202100****', privateKey: 'MIIE****' },
            lastSyncAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'INT-000003',
            name: '微信支付',
            type: 'payment',
            provider: 'WeChat',
            status: 'error',
            config: { appId: 'wx****', mchId: '123****' },
            lastSyncAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'INT-000004',
            name: '阿里云短信',
            type: 'sms',
            provider: 'Aliyun',
            status: 'connected',
            config: { accessKey: 'LTAI****', secretKey: '****' },
            lastSyncAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'INT-000005',
            name: 'SendGrid邮件',
            type: 'email',
            provider: 'SendGrid',
            status: 'connected',
            config: { apiKey: 'SG.****', fromEmail: 'noreply@carwash.com' },
            lastSyncAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'INT-000006',
            name: 'AWS S3存储',
            type: 'storage',
            provider: 'AWS',
            status: 'connected',
            config: { bucket: 'carwash-pro', region: 'us-east-1' },
            lastSyncAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'INT-000007',
            name: 'Google Analytics',
            type: 'analytics',
            provider: 'Google',
            status: 'disconnected',
            config: { trackingId: 'UA-****' },
            lastSyncAt: '',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    return integrations;
}

/**
 * @private
 */
function loadIntegrations() {
    try {
        const saved = localStorage.getItem('system_integrations');
        if (saved) {
            state.integrations = JSON.parse(saved);
        } else {
            state.integrations = getMockIntegrations();
            localStorage.setItem('system_integrations', JSON.stringify(state.integrations));
        }
    } catch (e) {
        state.integrations = getMockIntegrations();
    }
    applyFilters();
}

/**
 * @private
 */
function saveIntegrations() {
    try {
        localStorage.setItem('system_integrations', JSON.stringify(state.integrations));
    } catch (e) {}
}

/**
 * @private
 */
function applyFilters() {
    let filtered = state.integrations;
    const f = state.filters;
    
    if (f.name) {
        filtered = filtered.filter(i => i.name.toLowerCase().includes(f.name.toLowerCase()));
    }
    if (f.type) {
        filtered = filtered.filter(i => i.type === f.type);
    }
    if (f.status) {
        filtered = filtered.filter(i => i.status === f.status);
    }
    
    state.filteredIntegrations = filtered;
}

/**
 * @private
 * @param {string} type - 集成类型
 * @returns {object} 类型样式
 */
function getTypeStyle(type) {
    const map = {
        payment: { color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-credit-card', label: '支付' },
        sms: { color: '#FEF3C7', textColor: '#92400E', icon: 'fa-sms', label: '短信' },
        email: { color: '#D1FAE5', textColor: '#065F46', icon: 'fa-envelope', label: '邮件' },
        storage: { color: '#E0E7FF', textColor: '#3730A3', icon: 'fa-cloud', label: '存储' },
        analytics: { color: '#FCE7F3', textColor: '#9D174D', icon: 'fa-chart-line', label: '分析' }
    };
    return map[type] || map.payment;
}

/**
 * @private
 * @param {string} status - 状态
 * @returns {object} 状态样式
 */
function getStatusStyle(status) {
    const map = {
        connected: { color: '#D1FAE5', textColor: '#065F46', icon: '✅', label: '已连接' },
        disconnected: { color: '#F3F4F6', textColor: '#6B7280', icon: '⛔', label: '未连接' },
        error: { color: '#FEE2E2', textColor: '#991B1B', icon: '❌', label: '错误' }
    };
    return map[status] || map.disconnected;
}

/**
 * @private
 */
function render() {
    const tbody = document.getElementById('integrationListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredIntegrations.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-plug" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无集成配置
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(i => {
        const type = getTypeStyle(i.type);
        const status = getStatusStyle(i.status);
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;font-size:14px;">${i.name}</div>
                    <div style="font-size:11px;color:#6B7280;">${i.id}</div>
                    <div style="font-size:12px;color:#4B5563;">${i.provider}</div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        <i class="fas ${type.icon}"></i>
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.icon} ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:12px;color:#6B7280;">
                    ${i.lastSyncAt ? new Date(i.lastSyncAt).toLocaleString() : '从未同步'}
                </td>
                <td style="padding:10px 16px;font-size:12px;color:#6B7280;">
                    ${Object.keys(i.config).length} 项配置
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.SystemIntegrationsModule.editIntegration('${i.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm ${i.status === 'connected' ? 'btn-outline' : 'btn-primary'}" 
                                onclick="window.SystemIntegrationsModule.connectIntegration('${i.id}')" 
                                title="${i.status === 'connected' ? '断开' : '连接'}">
                            <i class="fas ${i.status === 'connected' ? 'fa-link' : 'fa-plug'}"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.SystemIntegrationsModule.deleteIntegration('${i.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderPagination();
}

/**
 * @private
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredIntegrations.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个集成，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SystemIntegrationsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SystemIntegrationsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * @private
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredIntegrations.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function createIntegration() {
    const name = prompt('集成名称：');
    if (!name) return;
    
    const typeOptions = ['1. payment (支付)', '2. sms (短信)', '3. email (邮件)', '4. storage (存储)', '5. analytics (分析)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
    const types = ['payment', 'sms', 'email', 'storage', 'analytics'];
    const type = types[typeIdx - 1] || 'payment';
    
    const provider = prompt('提供商：');
    if (!provider) return;
    
    const newIntegration = {
        id: `INT-${Date.now().toString().slice(-6)}`,
        name: name.trim(),
        type: type,
        provider: provider.trim(),
        status: 'disconnected',
        config: {},
        lastSyncAt: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.integrations.push(newIntegration);
    saveIntegrations();
    applyFilters();
    render();
    showToast(`✅ 集成 "${newIntegration.name}" 已创建`, 'success');
}

/**
 * @private
 * @param {string} id - 集成ID
 */
function editIntegration(id) {
    const integration = state.integrations.find(i => i.id === id);
    if (!integration) { showToast('集成不存在', 'error'); return; }
    
    const newName = prompt('集成名称：', integration.name);
    if (!newName) return;
    
    const newProvider = prompt('提供商：', integration.provider);
    if (!newProvider) return;
    
    integration.name = newName.trim();
    integration.provider = newProvider.trim();
    integration.updatedAt = new Date().toISOString();
    
    saveIntegrations();
    applyFilters();
    render();
    showToast(`✅ 集成 "${integration.name}" 已更新`, 'success');
}

/**
 * @private
 * @param {string} id - 集成ID
 */
function connectIntegration(id) {
    const integration = state.integrations.find(i => i.id === id);
    if (!integration) { showToast('集成不存在', 'error'); return; }
    
    if (integration.status === 'connected') {
        // 断开
        integration.status = 'disconnected';
        integration.lastSyncAt = '';
        showToast(`已断开 ${integration.name}`, 'info');
    } else {
        // 连接
        integration.status = 'connected';
        integration.lastSyncAt = new Date().toISOString();
        showToast(`✅ ${integration.name} 已连接`, 'success');
    }
    
    integration.updatedAt = new Date().toISOString();
    saveIntegrations();
    applyFilters();
    render();
}

/**
 * @private
 * @param {string} id - 集成ID
 */
function deleteIntegration(id) {
    const integration = state.integrations.find(i => i.id === id);
    if (!integration) { showToast('集成不存在', 'error'); return; }
    if (!confirm(`确认删除集成 "${integration.name}"？`)) return;
    
    state.integrations = state.integrations.filter(i => i.id !== id);
    saveIntegrations();
    applyFilters();
    render();
    showToast(`集成 "${integration.name}" 已删除`, 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.type = document.getElementById('searchType')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    ['searchName', 'searchType', 'searchStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    state.filters = { name: '', type: '', status: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', createIntegration);
    
    document.querySelectorAll('#searchName, #searchType, #searchStatus').forEach(el => {
        el?.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 */
export async function init(options) {
    console.log('🔌 集成管理 初始化...');
    loadIntegrations();
    bindEvents();
    render();
    
    window.SystemIntegrationsModule = {
        state,
        loadIntegrations,
        saveIntegrations,
        render,
        renderPagination,
        goToPage,
        createIntegration,
        editIntegration,
        connectIntegration,
        deleteIntegration,
        handleSearch,
        handleReset,
        applyFilters
    };
    
    console.log('✅ 集成管理 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadIntegrations,
    saveIntegrations,
    createIntegration,
    editIntegration,
    connectIntegration,
    deleteIntegration,
    goToPage
};