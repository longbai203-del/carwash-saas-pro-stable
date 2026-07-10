/**
 * @file backup.js
 * @module backup
 * @description 备份管理 - 数据库备份、恢复和归档
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Backup
 * @property {string} id - 备份ID
 * @property {string} name - 备份名称
 * @property {string} type - 类型 (full/incremental/differential)
 * @property {number} size - 大小（字节）
 * @property {string} status - 状态 (completed/running/failed)
 * @property {string} createdAt - 创建时间
 * @property {string} completedAt - 完成时间
 * @property {string} location - 存储位置
 * @property {string} description - 描述
 */

/** @type {{backups: Backup[], filteredBackups: Backup[], filters: {name: string, type: string, status: string}, page: number, pageSize: number, isRestoring: boolean, restoreProgress: number}} */
const state = {
    backups: [],
    filteredBackups: [],
    filters: { name: '', type: '', status: '' },
    page: 1,
    pageSize: 10,
    isRestoring: false,
    restoreProgress: 0
};

/**
 * @private
 */
function getMockBackups() {
    const types = ['full', 'full', 'incremental', 'incremental', 'differential', 'full', 'incremental'];
    const statuses = ['completed', 'completed', 'completed', 'failed', 'completed', 'completed', 'running'];
    const names = ['完整备份 2024-01-15', '完整备份 2024-01-08', '增量备份 2024-01-14', '增量备份 2024-01-13', '差异备份 2024-01-12', '完整备份 2024-01-01', '增量备份 2024-01-14'];
    const sizes = [524288000, 512345600, 102400000, 98304000, 204800000, 498073600, 100663296];
    const now = new Date();
    
    return names.map((name, i) => {
        const date = new Date(now.getTime() - (7 - i) * 24 * 60 * 60 * 1000);
        const status = statuses[i % statuses.length];
        const completedAt = status === 'completed' || status === 'failed' 
            ? new Date(date.getTime() + 30 * 60 * 1000).toISOString() 
            : '';
        
        return {
            id: `BCK-${String(i + 1).padStart(6, '0')}`,
            name: name,
            type: types[i % types.length],
            size: sizes[i % sizes.length],
            status: status,
            createdAt: date.toISOString(),
            completedAt: completedAt,
            location: `/backups/${name.replace(/\s/g, '_')}.sql.gz`,
            description: ['自动备份', '手动备份', '自动备份', '自动备份', '手动备份', '手动备份', '自动备份'][i]
        };
    });
}

/**
 * @private
 */
function loadBackups() {
    try {
        const saved = localStorage.getItem('system_backups');
        if (saved) {
            state.backups = JSON.parse(saved);
        } else {
            state.backups = getMockBackups();
            localStorage.setItem('system_backups', JSON.stringify(state.backups));
        }
    } catch (e) {
        state.backups = getMockBackups();
    }
    applyFilters();
}

/**
 * @private
 */
function saveBackups() {
    try {
        localStorage.setItem('system_backups', JSON.stringify(state.backups));
    } catch (e) {}
}

/**
 * @private
 */
function applyFilters() {
    let filtered = state.backups;
    const f = state.filters;
    
    if (f.name) {
        filtered = filtered.filter(b => b.name.toLowerCase().includes(f.name.toLowerCase()));
    }
    if (f.type) {
        filtered = filtered.filter(b => b.type === f.type);
    }
    if (f.status) {
        filtered = filtered.filter(b => b.status === f.status);
    }
    
    state.filteredBackups = filtered;
}

/**
 * @private
 * @param {number} bytes - 字节数
 * @returns {string} 可读大小
 */
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * @private
 * @param {string} date - ISO日期
 * @returns {string} 格式化日期时间
 */
function formatDateTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
}

/**
 * @private
 * @param {string} type - 备份类型
 * @returns {object} 类型样式
 */
function getTypeStyle(type) {
    const map = {
        full: { color: '#DBEAFE', textColor: '#1E40AF', label: '📦 完整' },
        incremental: { color: '#D1FAE5', textColor: '#065F46', label: '📋 增量' },
        differential: { color: '#FEF3C7', textColor: '#92400E', label: '📊 差异' }
    };
    return map[type] || map.full;
}

/**
 * @private
 * @param {string} status - 状态
 * @returns {object} 状态样式
 */
function getStatusStyle(status) {
    const map = {
        completed: { color: '#D1FAE5', textColor: '#065F46', icon: '✅' },
        running: { color: '#FEF3C7', textColor: '#92400E', icon: '⏳' },
        failed: { color: '#FEE2E2', textColor: '#991B1B', icon: '❌' }
    };
    return map[status] || map.completed;
}

/**
 * @private
 */
function render() {
    const tbody = document.getElementById('backupListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredBackups.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-database" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无备份记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(b => {
        const type = getTypeStyle(b.type);
        const status = getStatusStyle(b.status);
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;font-size:14px;">${b.name}</div>
                    <div style="font-size:11px;color:#6B7280;">${b.id}</div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:4px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">
                    ${formatSize(b.size)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.icon} ${b.status}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">
                    <div>创建: ${formatDateTime(b.createdAt)}</div>
                    <div style="font-size:11px;">完成: ${formatDateTime(b.completedAt)}</div>
                </td>
                <td style="padding:10px 16px;font-size:12px;color:#6B7280;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${b.location}
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;flex-wrap:wrap;">
                        ${b.status === 'completed' ? `
                            <button class="btn btn-sm btn-primary" onclick="window.SystemBackupModule.restoreBackup('${b.id}')" title="恢复">
                                <i class="fas fa-undo"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="window.SystemBackupModule.downloadBackup('${b.id}')" title="下载">
                                <i class="fas fa-download"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger" onclick="window.SystemBackupModule.deleteBackup('${b.id}')" title="删除">
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

    const total = state.filteredBackups.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个备份，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SystemBackupModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SystemBackupModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredBackups.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function createBackup() {
    const typeOptions = ['full (完整)', 'incremental (增量)', 'differential (差异)'];
    const typeIdx = parseInt(prompt(`选择备份类型：\n${typeOptions.map((t, i) => `${i+1}. ${t}`).join('\n')}`, '1'));
    const types = ['full', 'incremental', 'differential'];
    const type = types[typeIdx - 1] || 'full';
    
    const name = prompt('备份名称：', `备份 ${new Date().toLocaleString()}`);
    if (!name) return;
    
    const description = prompt('描述：', '');
    
    const newBackup = {
        id: `BCK-${Date.now().toString().slice(-6)}`,
        name: name.trim(),
        type: type,
        size: 0,
        status: 'running',
        createdAt: new Date().toISOString(),
        completedAt: '',
        location: `/backups/${name.trim().replace(/\s/g, '_')}_${Date.now()}.sql.gz`,
        description: description || ''
    };
    
    state.backups.unshift(newBackup);
    saveBackups();
    applyFilters();
    render();
    showToast(`⏳ 备份 "${newBackup.name}" 正在创建...`, 'info');
    
    // 模拟备份完成
    setTimeout(() => {
        const backup = state.backups.find(b => b.id === newBackup.id);
        if (backup) {
            backup.status = 'completed';
            backup.completedAt = new Date().toISOString();
            backup.size = Math.floor(Math.random() * 500 * 1024 * 1024) + 50 * 1024 * 1024;
            saveBackups();
            applyFilters();
            render();
            showToast(`✅ 备份 "${backup.name}" 创建完成 (${formatSize(backup.size)})`, 'success');
        }
    }, 3000);
}

/**
 * @private
 * @param {string} id - 备份ID
 */
function restoreBackup(id) {
    const backup = state.backups.find(b => b.id === id);
    if (!backup) { showToast('备份不存在', 'error'); return; }
    
    if (backup.status !== 'completed') {
        showToast('只能恢复已完成的备份', 'error');
        return;
    }
    
    if (!confirm(`⚠️ 确认恢复备份 "${backup.name}"？此操作将覆盖当前数据！`)) return;
    if (!confirm(`再次确认：恢复备份 "${backup.name}"？`)) return;
    
    state.isRestoring = true;
    state.restoreProgress = 0;
    showToast('⏳ 开始恢复备份...', 'info');
    
    // 模拟恢复进度
    const interval = setInterval(() => {
        state.restoreProgress += Math.random() * 15 + 5;
        if (state.restoreProgress >= 100) {
            state.restoreProgress = 100;
            clearInterval(interval);
            setTimeout(() => {
                state.isRestoring = false;
                showToast(`✅ 备份 "${backup.name}" 恢复完成`, 'success');
                render();
            }, 500);
        }
        renderRestoreProgress();
    }, 500);
    
    // 显示恢复进度UI
    renderRestoreProgress();
}

/**
 * @private
 */
function renderRestoreProgress() {
    const container = document.getElementById('restoreProgressContainer');
    if (!container) return;
    
    if (!state.isRestoring) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:8px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-weight:500;color:#1F2937;">⏳ 正在恢复备份...</span>
                <span style="font-size:14px;color:#4F46E5;font-weight:600;">${Math.round(state.restoreProgress)}%</span>
            </div>
            <div style="width:100%;height:8px;background:#F3F4F6;border-radius:4px;overflow:hidden;">
                <div style="height:100%;background:linear-gradient(90deg,#4F46E5,#7C3AED);border-radius:4px;transition:width 0.3s;width:${state.restoreProgress}%;"></div>
            </div>
        </div>
    `;
}

/**
 * @private
 * @param {string} id - 备份ID
 */
function downloadBackup(id) {
    const backup = state.backups.find(b => b.id === id);
    if (!backup) { showToast('备份不存在', 'error'); return; }
    
    // 模拟下载
    const blob = new Blob([`Mock backup data for ${backup.name}`], { type: 'application/gzip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backup.name.replace(/\s/g, '_') + '.sql.gz';
    a.click();
    URL.revokeObjectURL(url);
    showToast(`📥 开始下载 ${backup.name}`, 'success');
}

/**
 * @private
 * @param {string} id - 备份ID
 */
function deleteBackup(id) {
    const backup = state.backups.find(b => b.id === id);
    if (!backup) { showToast('备份不存在', 'error'); return; }
    if (!confirm(`确认删除备份 "${backup.name}"？`)) return;
    
    state.backups = state.backups.filter(b => b.id !== id);
    saveBackups();
    applyFilters();
    render();
    showToast(`🗑️ 备份 "${backup.name}" 已删除`, 'success');
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
    document.getElementById('createBtn')?.addEventListener('click', createBackup);
    
    document.querySelectorAll('#searchName, #searchType, #searchStatus').forEach(el => {
        el?.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 */
export async function init(options) {
    console.log('💾 备份管理 初始化...');
    loadBackups();
    bindEvents();
    render();
    
    window.SystemBackupModule = {
        state,
        loadBackups,
        saveBackups,
        render,
        renderPagination,
        renderRestoreProgress,
        goToPage,
        createBackup,
        restoreBackup,
        downloadBackup,
        deleteBackup,
        handleSearch,
        handleReset,
        applyFilters
    };
    
    console.log('✅ 备份管理 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadBackups,
    saveBackups,
    createBackup,
    restoreBackup,
    downloadBackup,
    deleteBackup,
    goToPage
};