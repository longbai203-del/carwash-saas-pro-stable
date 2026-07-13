/**
 * @file audit-logs.js
 * @module audit-logs
 * @description 审计日志 - 系统操作记录和审计追踪
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} AuditLog
 * @property {string} id - 日志ID
 * @property {string} userId - 用户ID
 * @property {string} username - 用户名
 * @property {string} tenantId - 租户ID
 * @property {string} action - 操作类型
 * @property {string} resource - 资源类型
 * @property {string} resourceId - 资源ID
 * @property {Object} changes - 变更内容
 * @property {string} ipAddress - IP地址
 * @property {string} userAgent - 用户代理
 * @property {string} status - 状态 (success/failure)
 * @property {string} error - 错误信息
 * @property {string} createdAt - 创建时间
 */

/** @type {{logs: AuditLog[], filteredLogs: AuditLog[], filters: {username: string, action: string, resource: string, dateFrom: string, dateTo: string, status: string}, page: number, pageSize: number}} */
const state = {
    logs: [],
    filteredLogs: [],
    filters: { username: '', action: '', resource: '', dateFrom: '', dateTo: '', status: '' },
    page: 1,
    pageSize: 20
};

/**
 * @private
 */
function getMockLogs() {
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'READ', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT'];
    const resources = ['user', 'product', 'order', 'customer', 'inventory', 'settings', 'report', 'payment'];
    const users = ['admin@carwash.com', 'zhangli@carwash.com', 'wangjun@carwash.com', 'chenxiao@carwash.com'];
    const statuses = ['success', 'success', 'success', 'failure'];
    const now = new Date();
    const logs = [];
    
    for (let i = 0; i < 50; i++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const resource = resources[Math.floor(Math.random() * resources.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const date = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        
        logs.push({
            id: `LOG-${String(i + 1).padStart(6, '0')}`,
            userId: `USR-${String(Math.floor(Math.random() * 5) + 1).padStart(6, '0')}`,
            username: users[Math.floor(Math.random() * users.length)],
            tenantId: `TEN-${String(Math.floor(Math.random() * 3) + 1).padStart(6, '0')}`,
            action: action,
            resource: resource,
            resourceId: `${resource.toUpperCase()}-${String(Math.floor(Math.random() * 1000)).padStart(6, '0')}`,
            changes: action === 'UPDATE' ? { before: { status: 'draft' }, after: { status: 'active' } } : {},
            ipAddress: ip,
            userAgent: ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'][Math.floor(Math.random() * 2)],
            status: status,
            error: status === 'failure' ? '权限不足' : '',
            createdAt: date.toISOString()
        });
    }
    
    // 按时间倒序
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return logs;
}

/**
 * @private
 */
function loadLogs() {
    try {
        const saved = localStorage.getItem('system_audit_logs');
        if (saved) {
            state.logs = JSON.parse(saved);
        } else {
            state.logs = getMockLogs();
            localStorage.setItem('system_audit_logs', JSON.stringify(state.logs));
        }
    } catch (e) {
        state.logs = getMockLogs();
    }
    applyFilters();
}

/**
 * @private
 */
function applyFilters() {
    let filtered = state.logs;
    const f = state.filters;
    
    if (f.username) {
        filtered = filtered.filter(l => l.username.toLowerCase().includes(f.username.toLowerCase()));
    }
    if (f.action) {
        filtered = filtered.filter(l => l.action === f.action);
    }
    if (f.resource) {
        filtered = filtered.filter(l => l.resource === f.resource);
    }
    if (f.status) {
        filtered = filtered.filter(l => l.status === f.status);
    }
    if (f.dateFrom) {
        filtered = filtered.filter(l => l.createdAt >= f.dateFrom);
    }
    if (f.dateTo) {
        filtered = filtered.filter(l => l.createdAt <= f.dateTo);
    }
    
    state.filteredLogs = filtered;
}

/**
 * @private
 * @param {string} date - ISO日期
 * @returns {string} 格式化时间
 */
function formatTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
}

/**
 * @private
 * @param {string} action - 操作类型
 * @returns {object} 操作样式
 */
function getActionStyle(action) {
    const map = {
        CREATE: { color: '#D1FAE5', textColor: '#065F46', icon: 'fa-plus-circle' },
        UPDATE: { color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-edit' },
        DELETE: { color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-trash' },
        READ: { color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-eye' },
        LOGIN: { color: '#E0E7FF', textColor: '#3730A3', icon: 'fa-sign-in-alt' },
        LOGOUT: { color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-sign-out-alt' },
        EXPORT: { color: '#FEF3C7', textColor: '#92400E', icon: 'fa-file-export' },
        IMPORT: { color: '#FEF3C7', textColor: '#92400E', icon: 'fa-file-import' }
    };
    return map[action] || { color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-circle' };
}

/**
 * @private
 */
function render() {
    const tbody = document.getElementById('auditLogBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredLogs.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-history" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无审计日志
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(log => {
        const actionStyle = getActionStyle(log.action);
        const isFailure = log.status === 'failure';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;">
                <td style="padding:8px 12px;font-size:13px;color:#6B7280;white-space:nowrap;">
                    ${formatTime(log.createdAt)}
                </td>
                <td style="padding:8px 12px;">
                    <div style="font-weight:500;font-size:13px;">${log.username}</div>
                    <div style="font-size:11px;color:#6B7280;">${log.userId}</div>
                </td>
                <td style="padding:8px 12px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:500;background:${actionStyle.color};color:${actionStyle.textColor};">
                        <i class="fas ${actionStyle.icon}" style="margin-right:4px;"></i>
                        ${log.action}
                    </span>
                </td>
                <td style="padding:8px 12px;font-size:13px;">
                    ${log.resource}
                    <div style="font-size:11px;color:#6B7280;">${log.resourceId}</div>
                </td>
                <td style="padding:8px 12px;font-size:12px;color:#6B7280;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${log.ipAddress}
                </td>
                <td style="padding:8px 12px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${isFailure ? '#FEE2E2' : '#D1FAE5'};color:${isFailure ? '#991B1B' : '#065F46'};">
                        ${isFailure ? '❌ 失败' : '✅ 成功'}
                    </span>
                    ${isFailure ? `<div style="font-size:11px;color:#EF4444;margin-top:2px;">${log.error}</div>` : ''}
                </td>
                <td style="padding:8px 12px;">
                    <button class="btn btn-sm btn-outline" onclick="window.SystemAuditLogsModule.viewDetails('${log.id}')" title="查看详情">
                        <i class="fas fa-search-plus"></i>
                    </button>
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

    const total = state.filteredLogs.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条日志，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SystemAuditLogsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SystemAuditLogsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredLogs.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 日志ID
 */
function viewDetails(id) {
    const log = state.logs.find(l => l.id === id);
    if (!log) { showToast('日志不存在', 'error'); return; }
    
    const changesStr = Object.keys(log.changes).length > 0 
        ? JSON.stringify(log.changes, null, 2) 
        : '无变更';
    
    alert(`📋 审计日志详情

ID: ${log.id}
用户: ${log.username} (${log.userId})
租户: ${log.tenantId}
操作: ${log.action}
资源: ${log.resource} (${log.resourceId})
状态: ${log.status === 'success' ? '✅ 成功' : '❌ 失败'}
${log.error ? '错误: ' + log.error : ''}
IP地址: ${log.ipAddress}
User Agent: ${log.userAgent}
时间: ${formatTime(log.createdAt)}

变更内容:
${changesStr}`);
}

/**
 * @private
 */
function handleSearch() {
    state.filters.username = document.getElementById('searchUsername')?.value || '';
    state.filters.action = document.getElementById('searchAction')?.value || '';
    state.filters.resource = document.getElementById('searchResource')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.dateFrom = document.getElementById('dateFrom')?.value || '';
    state.filters.dateTo = document.getElementById('dateTo')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    ['searchUsername', 'searchAction', 'searchResource', 'searchStatus', 'dateFrom', 'dateTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    state.filters = { username: '', action: '', resource: '', dateFrom: '', dateTo: '', status: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function clearLogs() {
    if (!confirm('⚠️ 确认清空所有审计日志？此操作不可恢复！')) return;
    if (!confirm('再次确认：清空所有审计日志？')) return;
    
    state.logs = [];
    saveLogs();
    applyFilters();
    render();
    showToast('所有审计日志已清空', 'warning');
}

/**
 * @private
 */
function saveLogs() {
    try {
        localStorage.setItem('system_audit_logs', JSON.stringify(state.logs));
    } catch (e) {}
}

/**
 * @private
 */
function exportLogs() {
    const data = state.filteredLogs.length > 0 ? state.filteredLogs : state.logs;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('审计日志已导出', 'success');
}

/**
 * @private
 */
function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('exportBtn')?.addEventListener('click', exportLogs);
    document.getElementById('clearBtn')?.addEventListener('click', clearLogs);
    
    document.querySelectorAll('#searchUsername, #searchAction, #searchResource, #searchStatus, #dateFrom, #dateTo').forEach(el => {
        el?.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 */
export async function init(options) {
    console.log('📋 审计日志 初始化...');
    loadLogs();
    bindEvents();
    render();
    
    window.SystemAuditLogsModule = {
        state,
        loadLogs,
        saveLogs,
        render,
        renderPagination,
        goToPage,
        viewDetails,
        handleSearch,
        handleReset,
        clearLogs,
        exportLogs,
        applyFilters
    };
    
    console.log('✅ 审计日志 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadLogs,
    saveLogs,
    viewDetails,
    clearLogs,
    exportLogs,
    goToPage
};