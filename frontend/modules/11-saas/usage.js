/**
 * @file usage.js
 * @module usage
 * @description 用量管理 - 租户资源用量监控
 * 
 * @example
 * import { init } from './usage.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} UsageRecord
 * @property {string} id - 用量记录ID
 * @property {string} tenantId - 租户ID
 * @property {string} tenantName - 租户名称
 * @property {string} metric - 指标 (storage/api/users/orders)
 * @property {number} used - 已用量
 * @property {number} limit - 限制量
 * @property {string} unit - 单位
 * @property {string} period - 周期 (day/week/month)
 * @property {string} date - 日期
 * @property {string} status - 状态 (normal/warning/exceeded)
 * @property {string} createdAt - 创建时间
 */

/** @type {{records: UsageRecord[], filteredRecords: UsageRecord[], filters: {tenant: string, metric: string, status: string}, stats: {total: number, normal: number, warning: number, exceeded: number}, page: number, pageSize: number}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        tenant: '',
        metric: '',
        status: ''
    },
    stats: {
        total: 0,
        normal: 0,
        warning: 0,
        exceeded: 0
    },
    page: 1,
    pageSize: 10
};

/**
 * 指标配置
 */
const METRIC_MAP = {
    storage: { label: '存储', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-hdd' },
    api: { label: 'API调用', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-code' },
    users: { label: '用户数', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-users' },
    orders: { label: '订单数', color: '#EDE9FE', textColor: '#6D28D9', icon: 'fa-shopping-bag' }
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    normal: { label: '正常', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    warning: { label: '预警', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-exclamation-triangle' },
    exceeded: { label: '超限', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
};

/**
 * @private
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
}

/**
 * @private
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

/**
 * @private
 * @param {number} size - 大小
 * @returns {string} 格式化后的大小
 */
function formatSize(size) {
    if (size === undefined || size === null) return '0 MB';
    if (size < 1) return (size * 1024).toFixed(0) + ' KB';
    if (size < 1024) return size.toFixed(1) + ' MB';
    return (size / 1024).toFixed(2) + ' GB';
}

/**
 * @private
 * @returns {UsageRecord[]} 模拟用量数据
 */
function getMockUsage() {
    const tenants = ['洗车店A', '洗车店B', '洗车店C', '洗车店D', '洗车店E', '洗车店F'];
    const metrics = ['storage', 'api', 'users', 'orders'];
    const statuses = ['normal', 'warning', 'exceeded', 'normal', 'normal', 'warning'];
    
    return Array.from({ length: 20 }, (_, i) => {
        const metric = metrics[i % metrics.length];
        let used, limit, unit;
        switch (metric) {
            case 'storage':
                used = Math.round((Math.random() * 800 + 50) * 10) / 10;
                limit = 1000;
                unit = 'MB';
                break;
            case 'api':
                used = Math.floor(Math.random() * 8000 + 200);
                limit = 10000;
                unit = '次';
                break;
            case 'users':
                used = Math.floor(Math.random() * 15 + 2);
                limit = 20;
                unit = '人';
                break;
            case 'orders':
                used = Math.floor(Math.random() * 800 + 50);
                limit = 1000;
                unit = '笔';
                break;
            default:
                used = 0;
                limit = 0;
                unit = '';
        }
        const usagePercent = limit > 0 ? used / limit : 0;
        let status;
        if (usagePercent > 0.9) status = 'exceeded';
        else if (usagePercent > 0.7) status = 'warning';
        else status = 'normal';
        
        return {
            id: `USG-${String(i + 1).padStart(6, '0')}`,
            tenantId: `TEN-${String(i % 6 + 1).padStart(6, '0')}`,
            tenantName: tenants[i % tenants.length],
            metric: metric,
            used: used,
            limit: limit,
            unit: unit,
            period: 'month',
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: status,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载用量数据
 */
function loadUsage() {
    try {
        const saved = localStorage.getItem('usage_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockUsage();
            localStorage.setItem('usage_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载用量数据失败:', e);
        state.records = getMockUsage();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存用量数据
 */
function saveUsage() {
    try {
        localStorage.setItem('usage_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存用量数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.records;
    
    if (state.filters.tenant) {
        const tenant = state.filters.tenant.toLowerCase();
        filtered = filtered.filter(r => r.tenantName.toLowerCase().includes(tenant));
    }
    
    if (state.filters.metric) {
        filtered = filtered.filter(r => r.metric === state.filters.metric);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    state.filteredRecords = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.records.length;
    const normal = state.records.filter(r => r.status === 'normal').length;
    const warning = state.records.filter(r => r.status === 'warning').length;
    const exceeded = state.records.filter(r => r.status === 'exceeded').length;
    
    state.stats = { total, normal, warning, exceeded };
}

/**
 * @private
 * @description 渲染用量列表
 */
function render() {
    const tbody = document.getElementById('usageListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-chart-bar" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无用量数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const metric = METRIC_MAP[r.metric] || METRIC_MAP.storage;
        const status = STATUS_MAP[r.status] || STATUS_MAP.normal;
        const usagePercent = r.limit > 0 ? Math.round((r.used / r.limit) * 100) : 0;
        const displayValue = r.metric === 'storage' ? formatSize(r.used) : formatNumber(r.used);
        const displayLimit = r.metric === 'storage' ? formatSize(r.limit) : formatNumber(r.limit);
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${r.tenantName}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${metric.color};color:${metric.textColor};">
                        <i class="fas ${metric.icon}" style="margin-right:4px;"></i>
                        ${metric.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;">
                    ${displayValue} / ${displayLimit}
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="flex:1;height:6px;background:#F3F4F6;border-radius:9999px;overflow:hidden;min-width:60px;">
                            <div style="height:100%;background:${usagePercent > 90 ? '#EF4444' : usagePercent > 70 ? '#F59E0B' : '#10B981'};border-radius:9999px;width:${Math.min(usagePercent, 100)}%;"></div>
                        </div>
                        <span style="font-size:11px;color:#6B7280;">${usagePercent}%</span>
                    </div>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.period}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.UsageModule.viewUsage('${r.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    updateStats();
    renderPagination();
}

/**
 * @private
 * @description 更新统计
 */
function updateStats() {
    const stats = state.stats;
    
    document.getElementById('statTotal')?.textContent = stats.total;
    document.getElementById('statNormal')?.textContent = stats.normal;
    document.getElementById('statWarning')?.textContent = stats.warning;
    document.getElementById('statExceeded')?.textContent = stats.exceeded;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredRecords.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条用量记录
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.UsageModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.UsageModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * @private
 * @param {number} page - 页码
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredRecords.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 用量记录ID
 */
function viewUsage(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('用量记录不存在', 'error');
        return;
    }
    
    const metric = METRIC_MAP[record.metric] || METRIC_MAP.storage;
    const status = STATUS_MAP[record.status] || STATUS_MAP.normal;
    const usagePercent = record.limit > 0 ? Math.round((record.used / record.limit) * 100) : 0;
    const displayValue = record.metric === 'storage' ? formatSize(record.used) : formatNumber(record.used);
    const displayLimit = record.metric === 'storage' ? formatSize(record.limit) : formatNumber(record.limit);
    
    alert(`用量详情：
租户: ${record.tenantName}
指标: ${metric.label}
已用量: ${displayValue}
限制量: ${displayLimit}
使用率: ${usagePercent}%
状态: ${status.label}
周期: ${record.period}
日期: ${formatDate(record.date)}`);
}

/**
 * @private
 */
function handleSearch() {
    state.filters.tenant = document.getElementById('searchTenant')?.value || '';
    state.filters.metric = document.getElementById('searchMetric')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const tenantInput = document.getElementById('searchTenant');
    const metricInput = document.getElementById('searchMetric');
    const statusInput = document.getElementById('searchStatus');
    
    if (tenantInput) tenantInput.value = '';
    if (metricInput) metricInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { tenant: '', metric: '', status: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function bindEvents() {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    
    document.querySelectorAll('#searchTenant, #searchMetric, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📊 用量管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('usage_data', JSON.stringify(state.records));
    }
    
    loadUsage();
    bindEvents();
    render();
    
    window.UsageModule = {
        state,
        loadUsage,
        render,
        renderPagination,
        updateStats,
        viewUsage,
        goToPage,
        handleSearch,
        handleReset,
        saveUsage,
        applyFilters
    };
    
    console.log('✅ 用量管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadUsage,
    viewUsage,
    goToPage,
    saveUsage
};