/**
 * @file system-logs.js
 * @module system-logs
 * @description 系统日志 - 系统运行日志和错误监控
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} SystemLog
 * @property {string} id - 日志ID
 * @property {string} level - 日志级别 (info/warn/error/debug)
 * @property {string} category - 分类 (system/database/api/performance/security)
 * @property {string} message - 日志消息
 * @property {Object} metadata - 元数据
 * @property {string} source - 来源
 * @property {string} createdAt - 创建时间
 */

/** @type {{logs: SystemLog[], filteredLogs: SystemLog[], filters: {level: string, category: string, search: string, dateFrom: string, dateTo: string}, page: number, pageSize: number, autoRefresh: boolean}} */
const state = {
    logs: [],
    filteredLogs: [],
    filters: { level: '', category: '', search: '', dateFrom: '', dateTo: '' },
    page: 1,
    pageSize: 20,
    autoRefresh: false,
    refreshInterval: null
};

/**
 * @private
 */
function getMockSystemLogs() {
    const levels = ['info', 'info', 'info', 'warn', 'error', 'debug'];
    const categories = ['system', 'database', 'api', 'performance', 'security'];
    const messages = [
        '系统启动完成',
        '数据库连接成功',
        'API请求处理完成',
        '缓存清理完成',
        '用户登录成功',
        '数据库查询超时',
        'API响应延迟',
        '内存使用率过高',
        '磁盘空间不足',
        '安全审计通过',
        '定期维护完成',
        '配置更新成功',
        '服务重启',
        '任务调度执行',
        '备份完成'
    ];
    const sources = ['system-service', 'db-connector', 'api-gateway', 'cache-manager', 'scheduler'];
    const now = new Date();
    const logs = [];
    
    for (let i = 0; i < 100; i++) {
        const level = levels[Math.floor(Math.random() * levels.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const date = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        const hasMetadata = Math.random() > 0.6;
        
        logs.push({
            id: `SYS-${String(i + 1).padStart(6, '0')}`,
            level: level,
            category: category,
            message: messages[Math.floor(Math.random() * messages.length)],
            metadata: hasMetadata ? { duration: Math.floor(Math.random() * 500) + 'ms', count: Math.floor(Math.random() * 100) } : {},
            source: sources[Math.floor(Math.random() * sources.length)],
            createdAt: date.toISOString()
        });
    }
    
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return logs;
}

/**
 * @private
 */
function loadLogs() {
    try {
        const saved = localStorage.getItem('system_logs');
        if (saved) {
            state.logs = JSON.parse(saved);
        } else {
            state.logs = getMockSystemLogs();
            localStorage.setItem('system_logs', JSON.stringify(state.logs));
        }
    } catch (e) {
        state.logs = getMockSystemLogs();
    }
    applyFilters();
}

/**
 * @private
 */
function saveLogs() {
    try {
        localStorage.setItem('system_logs', JSON.stringify(state.logs));
    } catch (e) {}
}

/**
 * @private
 */
function applyFilters() {
    let filtered = state.logs;
    const f = state.filters;
    
    if (f.level) {
        filtered = filtered.filter(l => l.level === f.level);
    }
    if (f.category) {
        filtered = filtered.filter(l => l.category === f.category);
    }
    if (f.search) {
        const search = f.search.toLowerCase();
        filtered = filtered.filter(l => 
            l.message.toLowerCase().includes(search) ||
            l.source.toLowerCase().includes(search) ||
            l.id.toLowerCase().includes(search)
        );
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
 * @param {string} level - 日志级别
 * @returns {object} 级别样式
 */
function getLevelStyle(level) {
    const map = {
        info: { color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-info-circle', label: 'INFO' },
        warn: { color: '#FEF3C7', textColor: '#92400E', icon: 'fa-exclamation-triangle', label: 'WARN' },
        error: { color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle', label: 'ERROR' },
        debug: { color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-bug', label: 'DEBUG' }
    };
    return map[level] || map.info;
}

/**
 * @private
 * @param {string} category - 分类
 * @returns {string} 分类颜色
 */
function getCategoryColor(category) {
    const map = {
        system: '#4F46E5',
        database: '#059669',
        api: '#D97706',
        performance: '#7C3AED',
        security: '#DC2626'
    };
    return map[category] || '#6B7280';
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
 */
function render() {
    const tbody = document.getElementById('systemLogBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredLogs.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-terminal" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无系统日志
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(log => {
        const level = getLevelStyle(log.level);
        const catColor = getCategoryColor(log.category);
        const metadataStr = Object.keys(log.metadata).length > 0 
            ? Object.entries(log.metadata).map(([k, v]) => `${k}:${v}`).join(' ')
            : '';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;${log.level === 'error' ? 'background:#FEF2F2;' : ''}">
                <td style="padding:6px 12px;font-size:12px;color:#6B7280;white-space:nowrap;">
                    ${formatTime(log.createdAt)}
                </td>
                <td style="padding:6px 12px;">
                    <span style="display:inline-block;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${level.color};color:${level.textColor};">
                        ${level.label}
                    </span>
                </td>
                <td style="padding:6px 12px;">
                    <span style="display:inline-block;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:500;background:${catColor}20;color:${catColor};border:1px solid ${catColor}40;">
                        ${log.category}
                    </span>
                </td>
                <td style="padding:6px 12px;font-size:13px;font-weight:${log.level === 'error' ? '600' : '400'};color:${log.level === 'error' ? '#991B1B' : '#1F2937'};">
                    <span style="display:flex;align-items:center;gap:6px;">
                        <i class="fas ${level.icon}" style="color:${level.textColor};font-size:12px;"></i>
                        ${log.message}
                        ${metadataStr ? `<span style="font-size:11px;color:#6B7280;font-weight:400;">${metadataStr}</span>` : ''}
                    </span>
                </td>
                <td style="padding:6px 12px;font-size:12px;color:#6B7280;">
                    ${log.source}
                </td>
                <td style="padding:6px 12px;">
                    <button class="btn btn-sm btn-outline" onclick="window.SystemLogsModule.viewDetails('${log.id}')" title="查看详情">
                        <i class="fas fa-search-plus"></i>
                    </button>
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

    const total = state.filteredLogs.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条日志，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SystemLogsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SystemLogsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const total = state.logs.length;
    const errors = state.logs.filter(l => l.level === 'error').length;
    const warns = state.logs.filter(l => l.level === 'warn').length;
    const info = state.logs.filter(l => l.level === 'info').length;
    const filtered = state.filteredLogs.length;
    
    const el = document.getElementById('logStats');
    if (el) {
        el.innerHTML = `
            <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:13px;">
                <span>📊 总计: ${total}</span>
                <span style="color:#EF4444;">❌ 错误: ${errors}</span>
                <span style="color:#D97706;">⚠️ 警告: ${warns}</span>
                <span style="color:#3B82F6;">ℹ️ 信息: ${info}</span>
                ${filtered !== total ? `<span style="color:#6B7280;">🔍 过滤后: ${filtered}</span>` : ''}
            </div>
        `;
    }
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
    
    const level = getLevelStyle(log.level);
    alert(`📋 系统日志详情

ID: ${log.id}
级别: ${level.label}
分类: ${log.category}
来源: ${log.source}
时间: ${formatTime(log.createdAt)}

消息:
${log.message}

元数据:
${Object.keys(log.metadata).length > 0 ? JSON.stringify(log.metadata, null, 2) : '无'}`);
}

/**
 * @private
 */
function handleSearch() {
    state.filters.level = document.getElementById('searchLevel')?.value || '';
    state.filters.category = document.getElementById('searchCategory')?.value || '';
    state.filters.search = document.getElementById('searchKeyword')?.value || '';
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
    ['searchLevel', 'searchCategory', 'searchKeyword', 'dateFrom', 'dateTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    state.filters = { level: '', category: '', search: '', dateFrom: '', dateTo: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function clearLogs() {
    if (!confirm('⚠️ 确认清空所有系统日志？')) return;
    if (!confirm('再次确认：清空所有系统日志？')) return;
    
    state.logs = [];
    saveLogs();
    applyFilters();
    render();
    showToast('所有系统日志已清空', 'warning');
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
    a.download = `system_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('系统日志已导出', 'success');
}

/**
 * @private
 */
function toggleAutoRefresh() {
    state.autoRefresh = !state.autoRefresh;
    
    if (state.autoRefresh) {
        state.refreshInterval = setInterval(() => {
            // 模拟添加新日志
            const levels = ['info', 'info', 'warn', 'error'];
            const level = levels[Math.floor(Math.random() * levels.length)];
            const categories = ['system', 'database', 'api', 'performance'];
            const messages = ['操作完成', '查询成功', '请求处理', '缓存更新', '任务执行'];
            
            const newLog = {
                id: `SYS-${Date.now().toString().slice(-6)}`,
                level: level,
                category: categories[Math.floor(Math.random() * categories.length)],
                message: messages[Math.floor(Math.random() * messages.length)] + ' ' + new Date().toLocaleTimeString(),
                metadata: { runtime: Math.floor(Math.random() * 200) + 'ms' },
                source: 'live-monitor',
                createdAt: new Date().toISOString()
            };
            
            state.logs.unshift(newLog);
            saveLogs();
            applyFilters();
            render();
        }, 5000);
        
        document.getElementById('refreshToggle')?.classList.add('active');
        showToast('自动刷新已开启', 'info');
    } else {
        if (state.refreshInterval) {
            clearInterval(state.refreshInterval);
            state.refreshInterval = null;
        }
        document.getElementById('refreshToggle')?.classList.remove('active');
        showToast('自动刷新已关闭', 'info');
    }
}

/**
 * @private
 */
function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('exportBtn')?.addEventListener('click', exportLogs);
    document.getElementById('clearBtn')?.addEventListener('click', clearLogs);
    document.getElementById('refreshToggle')?.addEventListener('click', toggleAutoRefresh);
    
    document.querySelectorAll('#searchLevel, #searchCategory, #searchKeyword, #dateFrom, #dateTo').forEach(el => {
        el?.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 */
export async function init(options) {
    console.log('🖥️ 系统日志 初始化...');
    loadLogs();
    bindEvents();
    render();
    
    window.SystemLogsModule = {
        state,
        loadLogs,
        saveLogs,
        render,
        renderPagination,
        updateStats,
        goToPage,
        viewDetails,
        handleSearch,
        handleReset,
        clearLogs,
        exportLogs,
        toggleAutoRefresh,
        applyFilters
    };
    
    console.log('✅ 系统日志 初始化完成');
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
    toggleAutoRefresh,
    goToPage
};