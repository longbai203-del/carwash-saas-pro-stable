/**
 * @file crm.js
 * @module crm
 * @description CRM客户关系管理 - 客户数据总览
 * 
 * @example
 * import { init } from './crm.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';
import { formatNumber, formatDate, getRelativeTime } from '../../../js/core/helpers.js';

/**
 * @typedef {Object} CRMStats
 * @property {number} totalCustomers - 总客户数
 * @property {number} activeCustomers - 活跃客户数
 * @property {number} newCustomers - 新客户数
 * @property {number} churnRate - 流失率
 * @property {number} avgLifetime - 平均客户生命周期
 * @property {number} avgSpending - 平均消费
 */

/**
 * @typedef {Object} CustomerItem
 * @property {string} id - 客户ID
 * @property {string} name - 客户姓名
 * @property {string} phone - 电话
 * @property {number} totalSpent - 总消费
 * @property {number} visitCount - 访问次数
 * @property {string} lastVisit - 最后访问时间
 * @property {string} status - 状态 (active/inactive/new)
 * @property {string} segment - 细分 (高价值/中价值/低价值)
 */

/**
 * @typedef {Object} CRMData
 * @property {CRMStats} stats - 统计数据
 * @property {CustomerItem[]} recentCustomers - 最近客户
 * @property {Object} segmentDistribution - 细分分布
 */

/** @type {CRMData} 默认数据 */
const DEFAULT_DATA = {
    stats: {
        totalCustomers: 0,
        activeCustomers: 0,
        newCustomers: 0,
        churnRate: 0,
        avgLifetime: 0,
        avgSpending: 0
    },
    recentCustomers: [],
    segmentDistribution: {}
};

/** @type {CRMData} 状态 */
const state = {
    data: DEFAULT_DATA,
    stats: DEFAULT_DATA.stats,
    recentCustomers: [],
    segmentDistribution: {},
    filters: { search: '', segment: '', status: '' },
    page: 1,
    pageSize: 10
};

/**
 * @private
 * @returns {Promise<CRMData>} CRM数据
 */
async function fetchCRMData() {
    try {
        const response = await apiClient.get('/crm/stats');
        if (response && response.success) {
            return response.data;
        }
        return getMockCRMData();
    } catch (error) {
        console.warn('API加载失败，使用模拟数据:', error);
        return getMockCRMData();
    }
}

/**
 * @private
 * @returns {CRMData} 模拟CRM数据
 */
function getMockCRMData() {
    const now = new Date();
    const names = ['王小明', '李小红', '张伟', '刘洋', '陈静', '赵磊', '黄丽', '周敏', '吴强', '徐芳', '孙悦', '马明'];
    const statuses = ['active', 'active', 'active', 'inactive', 'new', 'active', 'active', 'inactive', 'new', 'active', 'active', 'inactive'];
    const segments = ['高价值', '中价值', '低价值', '高价值', '新客户', '中价值', '高价值', '低价值', '新客户', '中价值', '高价值', '低价值'];
    
    const customers = names.map((name, i) => ({
        id: `CUST-${String(i + 1).padStart(6, '0')}`,
        name: name,
        phone: `1${String(3 + Math.floor(Math.random() * 7))}${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
        totalSpent: Math.floor(Math.random() * 5000) + 100,
        visitCount: Math.floor(Math.random() * 20) + 1,
        lastVisit: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: statuses[i],
        segment: segments[i],
        createdAt: new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    const segmentDistribution = {
        '高价值': customers.filter(c => c.segment === '高价值').length,
        '中价值': customers.filter(c => c.segment === '中价值').length,
        '低价值': customers.filter(c => c.segment === '低价值').length,
        '新客户': customers.filter(c => c.segment === '新客户').length
    };
    
    return {
        stats: {
            totalCustomers: customers.length,
            activeCustomers: customers.filter(c => c.status === 'active').length,
            newCustomers: customers.filter(c => c.status === 'new').length,
            churnRate: 12.5,
            avgLifetime: 8.3,
            avgSpending: 1860
        },
        recentCustomers: customers.slice(0, 8),
        segmentDistribution
    };
}

/**
 * @private
 * @param {CRMData} data - CRM数据
 */
function loadCRMData(data) {
    state.data = data || DEFAULT_DATA;
    state.stats = data?.stats || DEFAULT_DATA.stats;
    state.recentCustomers = data?.recentCustomers || [];
    state.segmentDistribution = data?.segmentDistribution || {};
    
    try {
        localStorage.setItem('crm_data', JSON.stringify(state.data));
    } catch (e) {}
}

/**
 * @private
 */
function loadCachedData() {
    try {
        const cached = localStorage.getItem('crm_data');
        if (cached) {
            const data = JSON.parse(cached);
            state.data = data;
            state.stats = data.stats || DEFAULT_DATA.stats;
            state.recentCustomers = data.recentCustomers || [];
            state.segmentDistribution = data.segmentDistribution || {};
            return true;
        }
    } catch (e) {}
    return false;
}

/**
 * @private
 * @param {string} status - 状态
 * @returns {object} 状态样式
 */
function getStatusStyle(status) {
    const map = {
        active: { color: '#D1FAE5', textColor: '#065F46', label: '🟢 活跃' },
        inactive: { color: '#F3F4F6', textColor: '#6B7280', label: '⚫ 非活跃' },
        new: { color: '#DBEAFE', textColor: '#1E40AF', label: '🆕 新客户' }
    };
    return map[status] || map.inactive;
}

/**
 * @private
 * @param {string} segment - 细分
 * @returns {object} 细分样式
 */
function getSegmentStyle(segment) {
    const map = {
        '高价值': { color: '#D1FAE5', textColor: '#065F46', icon: '⭐' },
        '中价值': { color: '#DBEAFE', textColor: '#1E40AF', icon: '🌟' },
        '低价值': { color: '#FEF3C7', textColor: '#92400E', icon: '✨' },
        '新客户': { color: '#E0E7FF', textColor: '#3730A3', icon: '🆕' }
    };
    return map[segment] || map['中价值'];
}

/**
 * @private
 */
function render() {
    const container = document.getElementById('crmContainer');
    if (!container) return;
    
    // 统计卡片
    const stats = state.stats;
    const statsHtml = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:#4F46E5;">${stats.totalCustomers}</div>
                <div style="font-size:12px;color:#6B7280;">👥 总客户</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:#10B981;">${stats.activeCustomers}</div>
                <div style="font-size:12px;color:#6B7280;">🟢 活跃客户</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:#3B82F6;">${stats.newCustomers}</div>
                <div style="font-size:12px;color:#6B7280;">🆕 新客户</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:#EF4444;">${stats.churnRate}%</div>
                <div style="font-size:12px;color:#6B7280;">📉 流失率</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:#8B5CF6;">${stats.avgLifetime}月</div>
                <div style="font-size:12px;color:#6B7280;">⏱️ 平均生命周期</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:#F59E0B;">¥${formatNumber(stats.avgSpending)}</div>
                <div style="font-size:12px;color:#6B7280;">💰 平均消费</div>
            </div>
        </div>
    `;
    
    // 细分分布
    const segHtml = `
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;padding:12px 16px;background:#F9FAFB;border-radius:8px;">
            <span style="font-weight:500;color:#1F2937;font-size:14px;">📊 客户细分:</span>
            ${Object.entries(state.segmentDistribution).map(([key, value]) => {
                const style = getSegmentStyle(key);
                return `
                    <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:500;background:${style.color};color:${style.textColor};">
                        ${style.icon} ${key}: ${value}
                    </span>
                `;
            }).join('')}
        </div>
    `;
    
    // 搜索
    const searchHtml = `
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
            <input type="text" id="crmSearch" placeholder="搜索客户..." style="flex:1;min-width:150px;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;">
            <select id="crmSegmentFilter" style="padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;background:white;">
                <option value="">全部细分</option>
                <option value="高价值">⭐ 高价值</option>
                <option value="中价值">🌟 中价值</option>
                <option value="低价值">✨ 低价值</option>
                <option value="新客户">🆕 新客户</option>
            </select>
            <select id="crmStatusFilter" style="padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;background:white;">
                <option value="">全部状态</option>
                <option value="active">🟢 活跃</option>
                <option value="inactive">⚫ 非活跃</option>
                <option value="new">🆕 新客户</option>
            </select>
            <button class="btn btn-primary" onclick="window.CRMModule.search()">
                <i class="fas fa-search"></i> 搜索
            </button>
            <button class="btn btn-outline" onclick="window.CRMModule.resetFilter()">
                <i class="fas fa-undo"></i> 重置
            </button>
            <button class="btn btn-success" onclick="window.CRMModule.refreshCRM()" style="margin-left:auto;">
                <i class="fas fa-sync"></i> 刷新
            </button>
        </div>
    `;
    
    // 客户列表
    const filtered = filterCustomers();
    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = filtered.slice(start, end);
    
    let listHtml = '';
    if (pageData.length === 0) {
        listHtml = `
            <div style="text-align:center;padding:40px;color:#9CA3AF;">
                <i class="fas fa-users" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                暂无客户数据
            </div>
        `;
    } else {
        listHtml = `
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <thead style="background:#F9FAFB;">
                        <tr>
                            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6B7280;">客户</th>
                            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6B7280;">电话</th>
                            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6B7280;">消费</th>
                            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6B7280;">访问</th>
                            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6B7280;">最后访问</th>
                            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6B7280;">细分</th>
                            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#6B7280;">状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageData.map(c => {
                            const status = getStatusStyle(c.status);
                            const segment = getSegmentStyle(c.segment);
                            return `
                                <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                                    onmouseover="this.style.background='#F9FAFB'"
                                    onmouseout="this.style.background=''">
                                    <td style="padding:10px 12px;font-weight:500;">${c.name}</td>
                                    <td style="padding:10px 12px;color:#6B7280;">${c.phone}</td>
                                    <td style="padding:10px 12px;font-weight:600;color:#4F46E5;">¥${formatNumber(c.totalSpent)}</td>
                                    <td style="padding:10px 12px;color:#6B7280;">${c.visitCount}次</td>
                                    <td style="padding:10px 12px;font-size:12px;color:#6B7280;">${getRelativeTime(c.lastVisit)}</td>
                                    <td style="padding:10px 12px;">
                                        <span style="display:inline-flex;align-items:center;gap:2px;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:${segment.color};color:${segment.textColor};">
                                            ${segment.icon} ${c.segment}
                                        </span>
                                    </td>
                                    <td style="padding:10px 12px;">
                                        <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:500;background:${status.color};color:${status.textColor};">
                                            ${status.label}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // 分页
    const total = filtered.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    const paginationHtml = totalPages > 1 ? `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.CRMModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.CRMModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    ` : '';
    
    container.innerHTML = statsHtml + segHtml + searchHtml + listHtml + paginationHtml;
}

/**
 * @private
 * @returns {CustomerItem[]} 筛选后的客户
 */
function filterCustomers() {
    let filtered = state.recentCustomers;
    const search = state.filters.search || '';
    const segment = state.filters.segment || '';
    const status = state.filters.status || '';
    
    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(s) || 
            c.phone.includes(s)
        );
    }
    if (segment) {
        filtered = filtered.filter(c => c.segment === segment);
    }
    if (status) {
        filtered = filtered.filter(c => c.status === status);
    }
    return filtered;
}

/**
 * @private
 * @param {number} page - 页码
 */
function goToPage(page) {
    const total = filterCustomers().length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function search() {
    state.filters.search = document.getElementById('crmSearch')?.value || '';
    state.filters.segment = document.getElementById('crmSegmentFilter')?.value || '';
    state.filters.status = document.getElementById('crmStatusFilter')?.value || '';
    state.page = 1;
    render();
}

/**
 * @private
 */
function resetFilter() {
    document.getElementById('crmSearch').value = '';
    document.getElementById('crmSegmentFilter').value = '';
    document.getElementById('crmStatusFilter').value = '';
    state.filters = { search: '', segment: '', status: '' };
    state.page = 1;
    render();
}

/**
 * @private
 */
async function refreshCRM() {
    try {
        const data = await fetchCRMData();
        loadCRMData(data);
        render();
        showToast('✅ CRM数据已刷新', 'success');
    } catch (error) {
        showToast('❌ 刷新失败: ' + error.message, 'error');
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('👥 CRM模块 初始化...');
    
    const hasCache = loadCachedData();
    
    if (options?.data) {
        loadCRMData(options.data);
    } else if (!hasCache) {
        const data = await fetchCRMData();
        loadCRMData(data);
    }
    
    render();
    
    window.CRMModule = {
        state,
        loadCRMData,
        fetchCRMData,
        render,
        goToPage,
        search,
        resetFilter,
        refreshCRM,
        filterCustomers
    };
    
    console.log('✅ CRM模块 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadCRMData,
    fetchCRMData,
    render,
    goToPage,
    search,
    resetFilter,
    refreshCRM
};