/**
 * @file webhooks.js
 * @module webhooks
 * @description Webhook管理 - 配置和管理Webhook端点
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Webhook
 * @property {string} id - Webhook ID
 * @property {string} name - 名称
 * @property {string} url - 目标URL
 * @property {string[]} events - 事件列表
 * @property {string} status - 状态 (active/inactive)
 * @property {number} timeout - 超时时间（毫秒）
 * @property {number} retryCount - 重试次数
 * @property {string} secret - 签名密钥
 * @property {Object} headers - 自定义请求头
 * @property {string} lastTriggeredAt - 最后触发时间
 * @property {number} totalCalls - 调用次数
 * @property {number} successCalls - 成功次数
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{webhooks: Webhook[], filteredWebhooks: Webhook[], filters: {name: string, status: string, event: string}, page: number, pageSize: number}} */
const state = {
    webhooks: [],
    filteredWebhooks: [],
    filters: { name: '', status: '', event: '' },
    page: 1,
    pageSize: 10
};

/**
 * @private
 */
function getMockWebhooks() {
    const events = [
        'order.created', 'order.updated', 'order.paid', 'order.cancelled',
        'product.created', 'product.updated', 'product.deleted',
        'customer.created', 'customer.updated',
        'inventory.low', 'inventory.updated',
        'payment.success', 'payment.failed',
        'user.created', 'user.updated'
    ];
    
    const webhookTemplates = [
        { name: '订单通知', events: ['order.created', 'order.updated', 'order.paid', 'order.cancelled'] },
        { name: '库存预警', events: ['inventory.low', 'inventory.updated'] },
        { name: '客户同步', events: ['customer.created', 'customer.updated'] },
        { name: '支付回调', events: ['payment.success', 'payment.failed'] },
        { name: '产品同步', events: ['product.created', 'product.updated', 'product.deleted'] },
        { name: '用户事件', events: ['user.created', 'user.updated'] }
    ];
    
    const statuses = ['active', 'active', 'active', 'inactive', 'active', 'active'];
    const urls = [
        'https://api.example.com/webhook/orders',
        'https://api.example.com/webhook/inventory',
        'https://api.example.com/webhook/customers',
        'https://api.example.com/webhook/payments',
        'https://api.example.com/webhook/products',
        'https://api.example.com/webhook/users'
    ];
    
    return webhookTemplates.map((w, i) => ({
        id: `WH-${String(i + 1).padStart(6, '0')}`,
        name: w.name,
        url: urls[i],
        events: w.events,
        status: statuses[i],
        timeout: 5000,
        retryCount: 3,
        secret: `whsec_${Array.from({length: 32}, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*36)]).join('')}`,
        headers: { 'Content-Type': 'application/json', 'X-Custom': 'value' },
        lastTriggeredAt: i % 2 === 0 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : '',
        totalCalls: Math.floor(Math.random() * 1000),
        successCalls: Math.floor(Math.random() * 900),
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
    }));
}

/**
 * @private
 */
function loadWebhooks() {
    try {
        const saved = localStorage.getItem('system_webhooks');
        if (saved) {
            state.webhooks = JSON.parse(saved);
        } else {
            state.webhooks = getMockWebhooks();
            localStorage.setItem('system_webhooks', JSON.stringify(state.webhooks));
        }
    } catch (e) {
        state.webhooks = getMockWebhooks();
    }
    applyFilters();
}

/**
 * @private
 */
function saveWebhooks() {
    try {
        localStorage.setItem('system_webhooks', JSON.stringify(state.webhooks));
    } catch (e) {}
}

/**
 * @private
 */
function applyFilters() {
    let filtered = state.webhooks;
    const f = state.filters;
    
    if (f.name) {
        filtered = filtered.filter(w => w.name.toLowerCase().includes(f.name.toLowerCase()));
    }
    if (f.status) {
        filtered = filtered.filter(w => w.status === f.status);
    }
    if (f.event) {
        filtered = filtered.filter(w => w.events.includes(f.event));
    }
    
    state.filteredWebhooks = filtered;
}

/**
 * @private
 * @param {string} status - 状态
 * @returns {object} 状态样式
 */
function getStatusStyle(status) {
    const map = {
        active: { color: '#D1FAE5', textColor: '#065F46', label: '✅ 活跃' },
        inactive: { color: '#F3F4F6', textColor: '#6B7280', label: '⛔ 停用' }
    };
    return map[status] || map.inactive;
}

/**
 * @private
 * @param {string[]} events - 事件列表
 * @returns {string} 事件摘要
 */
function getEventSummary(events) {
    if (!events || events.length === 0) return '无';
    if (events.length > 3) return `${events.slice(0, 3).join(', ')} +${events.length - 3}`;
    return events.join(', ');
}

/**
 * @private
 */
function render() {
    const tbody = document.getElementById('webhookListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredWebhooks.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-webhook" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无Webhook配置
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(w => {
        const status = getStatusStyle(w.status);
        const successRate = w.totalCalls > 0 ? Math.round((w.successCalls / w.totalCalls) * 100) : 0;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;font-size:14px;">${w.name}</div>
                    <div style="font-size:11px;color:#6B7280;">${w.id}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#4B5563;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${w.url}
                </td>
                <td style="padding:10px 16px;font-size:12px;color:#6B7280;max-width:150px;">
                    ${getEventSummary(w.events)}
                </td>
                <td style="padding:10px 16px;text-align:center;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;text-align:center;">
                    <div>${w.totalCalls}</div>
                    <div style="font-size:11px;color:${successRate >= 90 ? '#065F46' : successRate >= 70 ? '#92400E' : '#991B1B'};">
                        ${successRate}% 成功率
                    </div>
                </td>
                <td style="padding:10px 16px;font-size:12px;color:#6B7280;">
                    ${w.lastTriggeredAt ? new Date(w.lastTriggeredAt).toLocaleString() : '从未触发'}
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.SystemWebhooksModule.editWebhook('${w.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.SystemWebhooksModule.toggleStatus('${w.id}')" title="切换状态">
                            <i class="fas ${w.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.SystemWebhooksModule.testWebhook('${w.id}')" title="测试">
                            <i class="fas fa-vial"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.SystemWebhooksModule.deleteWebhook('${w.id}')" title="删除">
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

    const total = state.filteredWebhooks.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个Webhook，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SystemWebhooksModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SystemWebhooksModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredWebhooks.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function createWebhook() {
    const name = prompt('Webhook名称：');
    if (!name) return;
    
    const url = prompt('目标URL：');
    if (!url) return;
    
    const eventOptions = ['order.created', 'order.updated', 'order.paid', 'order.cancelled', 'product.created', 'product.updated', 'customer.created', 'inventory.low', 'payment.success'];
    const eventInput = prompt(`事件（用逗号分隔）：\n可用事件: ${eventOptions.join(', ')}`, 'order.created,order.paid');
    const events = eventInput ? eventInput.split(',').map(e => e.trim()).filter(e => e) : ['order.created'];
    
    const newWebhook = {
        id: `WH-${Date.now().toString().slice(-6)}`,
        name: name.trim(),
        url: url.trim(),
        events: events,
        status: 'active',
        timeout: 5000,
        retryCount: 3,
        secret: `whsec_${Array.from({length: 32}, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*36)]).join('')}`,
        headers: { 'Content-Type': 'application/json' },
        lastTriggeredAt: '',
        totalCalls: 0,
        successCalls: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.webhooks.push(newWebhook);
    saveWebhooks();
    applyFilters();
    render();
    showToast(`✅ Webhook "${newWebhook.name}" 已创建`, 'success');
}

/**
 * @private
 * @param {string} id - Webhook ID
 */
function editWebhook(id) {
    const webhook = state.webhooks.find(w => w.id === id);
    if (!webhook) { showToast('Webhook不存在', 'error'); return; }
    
    const newName = prompt('Webhook名称：', webhook.name);
    if (!newName) return;
    
    const newUrl = prompt('目标URL：', webhook.url);
    if (!newUrl) return;
    
    const newEvents = prompt(`事件（用逗号分隔）：\n当前: ${webhook.events.join(', ')}`, webhook.events.join(', '));
    const events = newEvents ? newEvents.split(',').map(e => e.trim()).filter(e => e) : webhook.events;
    
    webhook.name = newName.trim();
    webhook.url = newUrl.trim();
    webhook.events = events;
    webhook.updatedAt = new Date().toISOString();
    
    saveWebhooks();
    applyFilters();
    render();
    showToast(`✅ Webhook "${webhook.name}" 已更新`, 'success');
}

/**
 * @private
 * @param {string} id - Webhook ID
 */
function toggleStatus(id) {
    const webhook = state.webhooks.find(w => w.id === id);
    if (!webhook) { showToast('Webhook不存在', 'error'); return; }
    
    webhook.status = webhook.status === 'active' ? 'inactive' : 'active';
    webhook.updatedAt = new Date().toISOString();
    saveWebhooks();
    applyFilters();
    render();
    showToast(`Webhook "${webhook.name}" 已${webhook.status === 'active' ? '启用' : '停用'}`, 'success');
}

/**
 * @private
 * @param {string} id - Webhook ID
 */
function testWebhook(id) {
    const webhook = state.webhooks.find(w => w.id === id);
    if (!webhook) { showToast('Webhook不存在', 'error'); return; }
    
    showToast('⏳ 正在测试Webhook...', 'info');
    
    // 模拟测试
    setTimeout(() => {
        webhook.totalCalls += 1;
        const success = Math.random() > 0.1;
        if (success) {
            webhook.successCalls += 1;
            webhook.lastTriggeredAt = new Date().toISOString();
            saveWebhooks();
            applyFilters();
            render();
            showToast(`✅ Webhook "${webhook.name}" 测试成功`, 'success');
        } else {
            saveWebhooks();
            applyFilters();
            render();
            showToast(`❌ Webhook "${webhook.name}" 测试失败`, 'error');
        }
    }, 1500);
}

/**
 * @private
 * @param {string} id - Webhook ID
 */
function deleteWebhook(id) {
    const webhook = state.webhooks.find(w => w.id === id);
    if (!webhook) { showToast('Webhook不存在', 'error'); return; }
    if (!confirm(`确认删除Webhook "${webhook.name}"？`)) return;
    
    state.webhooks = state.webhooks.filter(w => w.id !== id);
    saveWebhooks();
    applyFilters();
    render();
    showToast(`Webhook "${webhook.name}" 已删除`, 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.event = document.getElementById('searchEvent')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    ['searchName', 'searchStatus', 'searchEvent'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    state.filters = { name: '', status: '', event: '' };
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
    document.getElementById('createBtn')?.addEventListener('click', createWebhook);
    
    document.querySelectorAll('#searchName, #searchStatus, #searchEvent').forEach(el => {
        el?.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 */
export async function init(options) {
    console.log('🌐 Webhook管理 初始化...');
    loadWebhooks();
    bindEvents();
    render();
    
    window.SystemWebhooksModule = {
        state,
        loadWebhooks,
        saveWebhooks,
        render,
        renderPagination,
        goToPage,
        createWebhook,
        editWebhook,
        toggleStatus,
        testWebhook,
        deleteWebhook,
        handleSearch,
        handleReset,
        applyFilters
    };
    
    console.log('✅ Webhook管理 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadWebhooks,
    saveWebhooks,
    createWebhook,
    editWebhook,
    toggleStatus,
    testWebhook,
    deleteWebhook,
    goToPage
};