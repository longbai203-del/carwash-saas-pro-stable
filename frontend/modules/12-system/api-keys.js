/**
 * @file api-keys.js
 * @module api-keys
 * @description API密钥管理 - 生成、管理和监控API密钥
 * 
 * @example
 * import { init } from './api-keys.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ApiKey
 * @property {string} id - 密钥ID
 * @property {string} name - 密钥名称
 * @property {string} key - 密钥值
 * @property {string} type - 类型 (public/secret)
 * @property {string} status - 状态 (active/expired/revoked)
 * @property {string} tenantId - 租户ID
 * @property {string[]} permissions - 权限列表
 * @property {string} expiresAt - 过期时间
 * @property {string} lastUsedAt - 最后使用时间
 * @property {number} usageCount - 使用次数
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{keys: ApiKey[], filteredKeys: ApiKey[], filters: {name: string, type: string, status: string}, page: number, pageSize: number}} */
const state = {
    keys: [],
    filteredKeys: [],
    filters: { name: '', type: '', status: '' },
    page: 1,
    pageSize: 10
};

/**
 * @private
 * @returns {ApiKey[]} 模拟API密钥数据
 */
function getMockKeys() {
    const now = new Date();
    const types = ['public', 'secret', 'public', 'secret', 'public'];
    const statuses = ['active', 'active', 'expired', 'revoked', 'active'];
    const names = ['Web App API', 'Mobile App API', 'Integration API', 'Analytics API', 'Admin API'];
    const permissions = [
        ['read:products', 'read:orders'],
        ['read:products', 'write:orders', 'read:customers'],
        ['read:inventory', 'read:reports'],
        ['read:analytics', 'read:reports'],
        ['*']
    ];
    
    return names.map((name, i) => {
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + (i % 3 === 0 ? -1 : 12));
        const lastUsed = new Date(now);
        lastUsed.setDate(lastUsed.getDate() - Math.floor(Math.random() * 30));
        
        return {
            id: `KEY-${String(i + 1).padStart(6, '0')}`,
            name: name,
            key: types[i] === 'public' 
                ? `pk_live_${Array.from({length: 24}, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*36)]).join('')}`
                : `sk_live_${Array.from({length: 24}, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*36)]).join('')}`,
            type: types[i],
            status: statuses[i],
            tenantId: `TEN-${String(Math.floor(Math.random() * 5) + 1).padStart(6, '0')}`,
            permissions: permissions[i % permissions.length],
            expiresAt: expiresAt.toISOString().split('T')[0],
            lastUsedAt: i % 2 === 0 ? lastUsed.toISOString() : '',
            usageCount: Math.floor(Math.random() * 5000),
            createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 */
function loadKeys() {
    try {
        const saved = localStorage.getItem('system_api_keys');
        if (saved) {
            state.keys = JSON.parse(saved);
        } else {
            state.keys = getMockKeys();
            localStorage.setItem('system_api_keys', JSON.stringify(state.keys));
        }
    } catch (e) {
        console.warn('加载API密钥数据失败:', e);
        state.keys = getMockKeys();
    }
    applyFilters();
}

/**
 * @private
 */
function saveKeys() {
    try {
        localStorage.setItem('system_api_keys', JSON.stringify(state.keys));
    } catch (e) {
        console.warn('保存API密钥数据失败:', e);
    }
}

/**
 * @private
 */
function applyFilters() {
    let filtered = state.keys;
    if (state.filters.name) {
        filtered = filtered.filter(k => k.name.toLowerCase().includes(state.filters.name.toLowerCase()));
    }
    if (state.filters.type) {
        filtered = filtered.filter(k => k.type === state.filters.type);
    }
    if (state.filters.status) {
        filtered = filtered.filter(k => k.status === state.filters.status);
    }
    state.filteredKeys = filtered;
}

/**
 * @private
 * @param {string} key - API密钥值（隐藏显示）
 * @returns {string} 隐藏后的密钥
 */
function maskKey(key) {
    if (!key) return '-';
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '••••' + key.substring(key.length - 4);
}

/**
 * @private
 * @param {string} date - 日期字符串
 * @returns {string} 格式化日期
 */
function formatDate(date) {
    if (!date) return '从未使用';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
}

/**
 * @private
 * @param {string} status - 状态
 * @returns {object} 状态样式
 */
function getStatusStyle(status) {
    const map = {
        active: { color: '#D1FAE5', textColor: '#065F46', label: '✅ 活跃' },
        expired: { color: '#FEE2E2', textColor: '#991B1B', label: '❌ 已过期' },
        revoked: { color: '#F3F4F6', textColor: '#6B7280', label: '🚫 已撤销' }
    };
    return map[status] || map.active;
}

/**
 * @private
 */
function render() {
    const tbody = document.getElementById('apiKeyListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredKeys.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-key" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无API密钥
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(k => {
        const status = getStatusStyle(k.status);
        const isExpiring = k.status === 'active' && new Date(k.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${k.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${k.id}</div>
                </td>
                <td style="padding:10px 16px;font-family:monospace;font-size:13px;">
                    <span style="background:#F3F4F6;padding:2px 8px;border-radius:4px;cursor:pointer;" 
                          onclick="navigator.clipboard?.writeText('${k.key}')" 
                          title="点击复制">
                        ${maskKey(k.key)}
                        <i class="fas fa-copy" style="font-size:12px;margin-left:4px;color:#6B7280;"></i>
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:500;background:${k.type === 'public' ? '#DBEAFE' : '#FEF3C7'};color:${k.type === 'public' ? '#1E40AF' : '#92400E'};">
                        ${k.type === 'public' ? '🔑 Public' : '🔒 Secret'}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">
                    ${k.permissions.join(', ')}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                        ${isExpiring ? ' ⚠️' : ''}
                    </span>
                    <div style="font-size:11px;color:#6B7280;margin-top:2px;">
                        ${isExpiring ? `到期: ${k.expiresAt}` : `到期: ${k.expiresAt}`}
                    </div>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">
                    <div>使用: ${k.usageCount}</div>
                    <div style="font-size:11px;">${formatDate(k.lastUsedAt)}</div>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${k.status === 'active' ? `
                            <button class="btn btn-sm btn-warning" onclick="window.SystemApiKeysModule.revokeKey('${k.id}')" title="撤销">
                                <i class="fas fa-ban"></i>
                            </button>
                        ` : ''}
                        ${k.status === 'revoked' ? `
                            <button class="btn btn-sm btn-success" onclick="window.SystemApiKeysModule.reactivateKey('${k.id}')" title="恢复">
                                <i class="fas fa-undo"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger" onclick="window.SystemApiKeysModule.deleteKey('${k.id}')" title="删除">
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

    const total = state.filteredKeys.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个密钥，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SystemApiKeysModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SystemApiKeysModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredKeys.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function generateApiKey(name, type, permissions, expiresIn) {
    const prefix = type === 'public' ? 'pk_live' : 'sk_live';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const random = Array.from({length: 24}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${prefix}_${random}`;
}

/**
 * @private
 */
function showCreateModal() {
    const name = prompt('密钥名称：');
    if (!name) return;
    
    const typeOptions = ['1. public (公共)', '2. secret (私密)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
    const type = typeIdx === 2 ? 'secret' : 'public';
    
    const permsInput = prompt('权限（用逗号分隔，如: read:products,write:orders）：', 'read:products,read:orders');
    const permissions = permsInput ? permsInput.split(',').map(p => p.trim()).filter(p => p) : ['read:products'];
    
    const expiresIn = parseInt(prompt('有效期（月）：', '12')) || 12;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + expiresIn);
    
    const newKey = {
        id: `KEY-${Date.now().toString().slice(-6)}`,
        name: name.trim(),
        key: generateApiKey(name, type, permissions, expiresIn),
        type: type,
        status: 'active',
        tenantId: store.getCurrentTenant?.()?.id || 'TEN-000001',
        permissions: permissions,
        expiresAt: expiresAt.toISOString().split('T')[0],
        lastUsedAt: '',
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.keys.push(newKey);
    saveKeys();
    applyFilters();
    render();
    showToast(`✅ API密钥 "${newKey.name}" 已创建`, 'success');
    
    // 显示完整密钥（仅创建时显示一次）
    alert(`🔑 新API密钥已创建\n\n名称: ${newKey.name}\n密钥: ${newKey.key}\n类型: ${newKey.type}\n\n⚠️ 请妥善保存，此密钥仅显示一次！`);
}

/**
 * @private
 */
function revokeKey(id) {
    const key = state.keys.find(k => k.id === id);
    if (!key) { showToast('密钥不存在', 'error'); return; }
    if (!confirm(`确认撤销密钥 "${key.name}"？`)) return;
    
    key.status = 'revoked';
    key.updatedAt = new Date().toISOString();
    saveKeys();
    applyFilters();
    render();
    showToast(`密钥 "${key.name}" 已撤销`, 'warning');
}

/**
 * @private
 */
function reactivateKey(id) {
    const key = state.keys.find(k => k.id === id);
    if (!key) { showToast('密钥不存在', 'error'); return; }
    
    key.status = 'active';
    key.updatedAt = new Date().toISOString();
    saveKeys();
    applyFilters();
    render();
    showToast(`密钥 "${key.name}" 已恢复`, 'success');
}

/**
 * @private
 */
function deleteKey(id) {
    const key = state.keys.find(k => k.id === id);
    if (!key) { showToast('密钥不存在', 'error'); return; }
    if (!confirm(`确认永久删除密钥 "${key.name}"？此操作不可恢复！`)) return;
    
    state.keys = state.keys.filter(k => k.id !== id);
    saveKeys();
    applyFilters();
    render();
    showToast(`密钥 "${key.name}" 已删除`, 'success');
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
    document.getElementById('searchName').value = '';
    document.getElementById('searchType').value = '';
    document.getElementById('searchStatus').value = '';
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
    document.getElementById('createBtn')?.addEventListener('click', showCreateModal);
    
    document.querySelectorAll('#searchName, #searchType, #searchStatus').forEach(el => {
        el?.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 */
export async function init(options) {
    console.log('🔑 API密钥管理 初始化...');
    loadKeys();
    bindEvents();
    render();
    
    window.SystemApiKeysModule = {
        state,
        loadKeys,
        saveKeys,
        render,
        renderPagination,
        goToPage,
        generateApiKey,
        showCreateModal,
        revokeKey,
        reactivateKey,
        deleteKey,
        handleSearch,
        handleReset
    };
    
    console.log('✅ API密钥管理 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadKeys,
    saveKeys,
    showCreateModal,
    revokeKey,
    reactivateKey,
    deleteKey,
    goToPage
};