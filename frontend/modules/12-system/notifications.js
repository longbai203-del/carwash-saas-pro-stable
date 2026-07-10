/**
 * @file notifications.js
 * @module notifications
 * @description 通知管理 - 系统通知和消息中心
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Notification
 * @property {string} id - 通知ID
 * @property {string} title - 标题
 * @property {string} content - 内容
 * @property {string} type - 类型 (info/success/warning/error)
 * @property {string} module - 来源模块
 * @property {string} status - 状态 (unread/read/archived)
 * @property {string} target - 目标用户/角色
 * @property {boolean} isGlobal - 是否全局
 * @property {string} createdAt - 创建时间
 * @property {string} readAt - 阅读时间
 */

/** @type {{notifications: Notification[], filteredNotifications: Notification[], filters: {type: string, status: string, module: string, search: string}, page: number, pageSize: number}} */
const state = {
    notifications: [],
    filteredNotifications: [],
    filters: { type: '', status: '', module: '', search: '' },
    page: 1,
    pageSize: 15
};

/**
 * @private
 */
function getMockNotifications() {
    const types = ['info', 'success', 'warning', 'error'];
    const modules = ['system', 'orders', 'inventory', 'finance', 'hr', 'marketing'];
    const statuses = ['unread', 'unread', 'read', 'read', 'archived'];
    const titles = [
        '系统更新完成',
        '新订单通知',
        '库存预警',
        '发票生成成功',
        '员工入职提醒',
        '促销活动开始',
        '支付成功通知',
        '订单取消通知',
        '退款申请',
        '新评论通知'
    ];
    const contents = [
        '系统已成功更新到 v2.1.0 版本，请查看更新日志。',
        '您有一笔新订单 #ORD-2024-001，请及时处理。',
        '商品 "洗车液" 库存低于安全线，请及时补货。',
        '发票 #INV-2024-001 已生成，请查看并发送给客户。',
        '新员工 张三 已完成入职流程，请确认。',
        '春节促销活动已开始，将持续到2月15日。',
        '订单 #ORD-2024-002 支付成功，金额 ¥299.00。',
        '订单 #ORD-2024-003 已被客户取消。',
        '客户 李四 申请退款 #REF-2024-001，请处理。',
        '客户 王五 在商品 "洗车套餐" 下发表了新评论。'
    ];
    const now = new Date();
    const notifications = [];
    
    for (let i = 0; i < 45; i++) {
        const date = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        const status = statuses[i % statuses.length];
        
        notifications.push({
            id: `NOTI-${String(i + 1).padStart(6, '0')}`,
            title: titles[i % titles.length],
            content: contents[i % contents.length],
            type: types[i % types.length],
            module: modules[i % modules.length],
            status: status,
            target: i % 3 === 0 ? 'admin' : 'all',
            isGlobal: i % 4 === 0,
            createdAt: date.toISOString(),
            readAt: status === 'read' || status === 'archived' 
                ? new Date(date.getTime() + Math.random() * 2 * 60 * 60 * 1000).toISOString() 
                : ''
        });
    }
    
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return notifications;
}

/**
 * @private
 */
function loadNotifications() {
    try {
        const saved = localStorage.getItem('system_notifications');
        if (saved) {
            state.notifications = JSON.parse(saved);
        } else {
            state.notifications = getMockNotifications();
            localStorage.setItem('system_notifications', JSON.stringify(state.notifications));
        }
    } catch (e) {
        state.notifications = getMockNotifications();
    }
    applyFilters();
}

/**
 * @private
 */
function saveNotifications() {
    try {
        localStorage.setItem('system_notifications', JSON.stringify(state.notifications));
    } catch (e) {}
}

/**
 * @private
 */
function applyFilters() {
    let filtered = state.notifications;
    const f = state.filters;
    
    if (f.type) {
        filtered = filtered.filter(n => n.type === f.type);
    }
    if (f.status) {
        filtered = filtered.filter(n => n.status === f.status);
    }
    if (f.module) {
        filtered = filtered.filter(n => n.module === f.module);
    }
    if (f.search) {
        const search = f.search.toLowerCase();
        filtered = filtered.filter(n => 
            n.title.toLowerCase().includes(search) || 
            n.content.toLowerCase().includes(search)
        );
    }
    
    state.filteredNotifications = filtered;
}

/**
 * @private
 * @param {string} type - 通知类型
 * @returns {object} 类型样式
 */
function getTypeStyle(type) {
    const map = {
        info: { color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-info-circle' },
        success: { color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
        warning: { color: '#FEF3C7', textColor: '#92400E', icon: 'fa-exclamation-triangle' },
        error: { color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
    };
    return map[type] || map.info;
}

/**
 * @private
 * @param {string} status - 状态
 * @returns {object} 状态样式
 */
function getStatusStyle(status) {
    const map = {
        unread: { color: '#DBEAFE', textColor: '#1E40AF', label: '📩 未读' },
        read: { color: '#F3F4F6', textColor: '#6B7280', label: '📖 已读' },
        archived: { color: '#F3F4F6', textColor: '#9CA3AF', label: '📦 已归档' }
    };
    return map[status] || map.unread;
}

/**
 * @private
 * @param {string} date - ISO日期
 * @returns {string} 相对时间
 */
function getRelativeTime(date) {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(date).toLocaleDateString('zh-CN');
}

/**
 * @private
 */
function render() {
    const tbody = document.getElementById('notificationListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredNotifications.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-bell" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无通知
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(n => {
        const type = getTypeStyle(n.type);
        const status = getStatusStyle(n.status);
        const isUnread = n.status === 'unread';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;${isUnread ? 'background:#EEF2FF;' : ''}transition:background 0.2s;"
                onmouseover="this.style.background='${isUnread ? '#E0E7FF' : '#F9FAFB'}'"
                onmouseout="this.style.background='${isUnread ? '#EEF2FF' : ''}'">
                <td style="padding:10px 12px;">
                    <div style="display:flex;align-items:flex-start;gap:8px;">
                        <i class="fas ${type.icon}" style="color:${type.textColor};margin-top:2px;"></i>
                        <div>
                            <div style="font-weight:${isUnread ? '600' : '400'};font-size:14px;color:#1F2937;">
                                ${n.title}
                                ${isUnread ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#3B82F6;margin-left:6px;"></span>' : ''}
                            </div>
                            <div style="font-size:13px;color:#6B7280;">${n.content}</div>
                            <div style="display:flex;gap:12px;margin-top:4px;font-size:11px;color:#9CA3AF;">
                                <span>${getRelativeTime(n.createdAt)}</span>
                                <span>${n.module}</span>
                                ${n.isGlobal ? '<span>🌐 全局</span>' : ''}
                                ${n.target !== 'all' ? `<span>🎯 ${n.target}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td style="padding:10px 12px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 12px;text-align:right;">
                    <div style="display:flex;gap:4px;justify-content:flex-end;">
                        ${n.status === 'unread' ? `
                            <button class="btn btn-sm btn-outline" onclick="window.SystemNotificationsModule.markAsRead('${n.id}')" title="标记已读">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${n.status !== 'archived' ? `
                            <button class="btn btn-sm btn-outline" onclick="window.SystemNotificationsModule.archiveNotification('${n.id}')" title="归档">
                                <i class="fas fa-archive"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger" onclick="window.SystemNotificationsModule.deleteNotification('${n.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderPagination();
    updateStats();
}

/**
 * @private
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredNotifications.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条通知，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SystemNotificationsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SystemNotificationsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
function updateStats() {
    const total = state.notifications.length;
    const unread = state.notifications.filter(n => n.status === 'unread').length;
    const read = state.notifications.filter(n => n.status === 'read').length;
    const archived = state.notifications.filter(n => n.status === 'archived').length;
    
    const el = document.getElementById('notificationStats');
    if (el) {
        el.innerHTML = `
            <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:13px;">
                <span>📊 总计: ${total}</span>
                <span style="color:#1E40AF;">📩 未读: ${unread}</span>
                <span style="color:#6B7280;">📖 已读: ${read}</span>
                <span style="color:#9CA3AF;">📦 已归档: ${archived}</span>
            </div>
        `;
    }
}

/**
 * @private
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredNotifications.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 通知ID
 */
function markAsRead(id) {
    const noti = state.notifications.find(n => n.id === id);
    if (!noti) { showToast('通知不存在', 'error'); return; }
    
    noti.status = 'read';
    noti.readAt = new Date().toISOString();
    saveNotifications();
    applyFilters();
    render();
    showToast('已标记为已读', 'success');
}

/**
 * @private
 */
function markAllAsRead() {
    const unread = state.notifications.filter(n => n.status === 'unread');
    if (unread.length === 0) {
        showToast('没有未读通知', 'info');
        return;
    }
    
    unread.forEach(n => {
        n.status = 'read';
        n.readAt = new Date().toISOString();
    });
    saveNotifications();
    applyFilters();
    render();
    showToast(`已标记 ${unread.length} 条通知为已读`, 'success');
}

/**
 * @private
 * @param {string} id - 通知ID
 */
function archiveNotification(id) {
    const noti = state.notifications.find(n => n.id === id);
    if (!noti) { showToast('通知不存在', 'error'); return; }
    
    noti.status = 'archived';
    saveNotifications();
    applyFilters();
    render();
    showToast('已归档', 'success');
}

/**
 * @private
 * @param {string} id - 通知ID
 */
function deleteNotification(id) {
    const noti = state.notifications.find(n => n.id === id);
    if (!noti) { showToast('通知不存在', 'error'); return; }
    if (!confirm(`确认删除通知 "${noti.title}"？`)) return;
    
    state.notifications = state.notifications.filter(n => n.id !== id);
    saveNotifications();
    applyFilters();
    render();
    showToast('通知已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const title = prompt('通知标题：');
    if (!title) return;
    
    const content = prompt('通知内容：');
    if (!content) return;
    
    const typeOptions = ['1. info (信息)', '2. success (成功)', '3. warning (警告)', '4. error (错误)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
    const types = ['info', 'success', 'warning', 'error'];
    const type = types[typeIdx - 1] || 'info';
    
    const moduleOptions = ['system', 'orders', 'inventory', 'finance', 'hr', 'marketing'];
    const moduleIdx = parseInt(prompt(`选择模块：\n${moduleOptions.map((m, i) => `${i+1}. ${m}`).join('\n')}`, '1'));
    const module = moduleOptions[moduleIdx - 1] || 'system';
    
    const target = prompt('目标用户 (all/admin/特定角色)：', 'all') || 'all';
    
    const newNoti = {
        id: `NOTI-${Date.now().toString().slice(-6)}`,
        title: title.trim(),
        content: content.trim(),
        type: type,
        module: module,
        status: 'unread',
        target: target,
        isGlobal: target === 'all',
        createdAt: new Date().toISOString(),
        readAt: ''
    };
    
    state.notifications.unshift(newNoti);
    saveNotifications();
    applyFilters();
    render();
    showToast('✅ 通知已发送', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.type = document.getElementById('searchType')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.module = document.getElementById('searchModule')?.value || '';
    state.filters.search = document.getElementById('searchKeyword')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    ['searchType', 'searchStatus', 'searchModule', 'searchKeyword'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    state.filters = { type: '', status: '', module: '', search: '' };
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
    document.getElementById('markAllReadBtn')?.addEventListener('click', markAllAsRead);
    
    document.querySelectorAll('#searchType, #searchStatus, #searchModule, #searchKeyword').forEach(el => {
        el?.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 */
export async function init(options) {
    console.log('🔔 通知管理 初始化...');
    loadNotifications();
    bindEvents();
    render();
    
    window.SystemNotificationsModule = {
        state,
        loadNotifications,
        saveNotifications,
        render,
        renderPagination,
        updateStats,
        goToPage,
        markAsRead,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        showCreateModal,
        handleSearch,
        handleReset,
        applyFilters
    };
    
    console.log('✅ 通知管理 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadNotifications,
    saveNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    showCreateModal,
    goToPage
};