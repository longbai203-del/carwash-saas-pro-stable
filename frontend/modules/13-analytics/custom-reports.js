/**
 * @file custom-reports.js
 * @module custom-reports
 * @description 自定义报表 - 用户自定义数据报表
 * 
 * @example
 * import { init } from './custom-reports.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} CustomReport
 * @property {string} id - 报表ID
 * @property {string} name - 报表名称
 * @property {string} description - 报表描述
 * @property {string} type - 类型 (table/chart/summary)
 * @property {string} dataSource - 数据源
 * @property {string[]} columns - 显示列
 * @property {Object} filters - 筛选条件
 * @property {string} dateRange - 日期范围
 * @property {string} status - 状态 (active/inactive)
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 * @property {string} lastRun - 最后运行时间
 */

/** @type {{reports: CustomReport[], filteredReports: CustomReport[], filters: {name: string, type: string, status: string}, stats: {total: number, active: number, inactive: number}, page: number, pageSize: number, editingId: string|null, previewData: Array|null}} 状态 */
const state = {
    reports: [],
    filteredReports: [],
    filters: {
        name: '',
        type: '',
        status: ''
    },
    stats: {
        total: 0,
        active: 0,
        inactive: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null,
    previewData: null
};

/**
 * 报表类型配置
 */
const TYPE_MAP = {
    table: { label: '表格', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-table' },
    chart: { label: '图表', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-chart-bar' },
    summary: { label: '汇总', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-calculator' }
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
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的完整日期时间
 */
function formatDateTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
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
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return amount.toFixed(2);
}

/**
 * @private
 * @returns {CustomReport[]} 模拟自定义报表数据
 */
function getMockReports() {
    return [
        { id: 'CR-001', name: '月度销售报表', description: '每月销售数据汇总', type: 'table', dataSource: 'orders', columns: ['日期', '订单数', '收入', '客单价'], filters: { status: 'completed' }, dateRange: 'last_month', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'CR-002', name: '客户分析图表', description: '客户分布和消费分析', type: 'chart', dataSource: 'customers', columns: ['等级', '数量', '消费总额'], filters: {}, dateRange: 'last_quarter', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'CR-003', name: '库存汇总', description: '库存状态汇总', type: 'summary', dataSource: 'inventory', columns: ['商品数', '总价值', '低库存数'], filters: {}, dateRange: 'today', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'CR-004', name: '员工绩效报表', description: '员工绩效数据', type: 'table', dataSource: 'employees', columns: ['姓名', '部门', '评分', '评级'], filters: {}, dateRange: 'this_month', status: 'inactive', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastRun: null }
    ];
}

/**
 * @private
 * @description 加载自定义报表数据
 */
function loadReports() {
    try {
        const saved = localStorage.getItem('custom_report_data');
        if (saved) {
            state.reports = JSON.parse(saved);
        } else {
            state.reports = getMockReports();
            localStorage.setItem('custom_report_data', JSON.stringify(state.reports));
        }
    } catch (e) {
        console.warn('加载自定义报表数据失败:', e);
        state.reports = getMockReports();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存自定义报表数据
 */
function saveReports() {
    try {
        localStorage.setItem('custom_report_data', JSON.stringify(state.reports));
    } catch (e) {
        console.warn('保存自定义报表数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.reports;
    
    if (state.filters.name) {
        const name = state.filters.name.toLowerCase();
        filtered = filtered.filter(r => r.name.toLowerCase().includes(name) || 
            (r.description && r.description.toLowerCase().includes(name)));
    }
    
    if (state.filters.type) {
        filtered = filtered.filter(r => r.type === state.filters.type);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    state.filteredReports = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.reports.length;
    const active = state.reports.filter(r => r.status === 'active').length;
    const inactive = state.reports.filter(r => r.status === 'inactive').length;
    
    state.stats = { total, active, inactive };
}

/**
 * @private
 * @description 渲染自定义报表列表
 */
function render() {
    const tbody = document.getElementById('customReportListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredReports.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-file-export" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无自定义报表数据
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        active: { label: '启用', color: '#D1FAE5', textColor: '#065F46' },
        inactive: { label: '停用', color: '#FEE2E2', textColor: '#991B1B' }
    };

    tbody.innerHTML = pageData.map(r => {
        const type = TYPE_MAP[r.type] || TYPE_MAP.table;
        const status = statusMap[r.status] || statusMap.inactive;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${r.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${r.description || ''}</div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        <i class="fas ${type.icon}" style="margin-right:4px;"></i>
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.dataSource}</td>
                <td style="padding:10px 16px;text-align:center;">${r.columns ? r.columns.length : 0}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.lastRun ? formatDate(r.lastRun) : '-'}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-primary" onclick="window.CustomReportsModule.previewReport('${r.id}')" title="预览">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.CustomReportsModule.editReport('${r.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="window.CustomReportsModule.runReport('${r.id}')" title="运行">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.CustomReportsModule.deleteReport('${r.id}')" title="删除">
                            <i class="fas fa-trash"></i>
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
    document.getElementById('statActive')?.textContent = stats.active;
    document.getElementById('statInactive')?.textContent = stats.inactive;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredReports.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 个自定义报表
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.CustomReportsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.CustomReportsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredReports.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 报表ID
 */
function previewReport(id) {
    const report = state.reports.find(r => r.id === id);
    if (!report) {
        showToast('报表不存在', 'error');
        return;
    }
    
    // 生成预览数据
    const previewData = generatePreviewData(report);
    state.previewData = previewData;
    
    const modal = document.getElementById('reportPreviewModal');
    if (modal) {
        const content = document.getElementById('reportPreviewContent');
        if (content) {
            content.innerHTML = renderPreviewContent(report, previewData);
        }
        modal.style.display = 'flex';
    } else {
        // 降级方案
        alert(`报表预览: ${report.name}\n数据源: ${report.dataSource}\n列数: ${report.columns ? report.columns.length : 0}`);
    }
}

/**
 * @private
 * @param {CustomReport} report - 报表对象
 * @param {Array} data - 预览数据
 * @returns {string} 预览HTML
 */
function renderPreviewContent(report, data) {
    if (!data || data.length === 0) {
        return '<div style="text-align:center;padding:40px;color:#9CA3AF;">暂无预览数据</div>';
    }
    
    if (report.type === 'chart') {
        // 简单图表预览
        return `
            <div style="height:200px;display:flex;align-items:flex-end;gap:12px;padding:20px 0;">
                ${data.slice(0, 7).map((item, index) => {
                    const height = Math.max((item.value || 0) / Math.max(...data.map(d => d.value || 0)) * 150, 4);
                    return `
                        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
                            <div style="height:${height}px;width:100%;background:linear-gradient(180deg,#4F46E5,#818CF8);border-radius:4px 4px 0 0;transition:height 0.5s;min-height:4px;"></div>
                            <span style="font-size:10px;color:#6B7280;">${item.label || index + 1}</span>
                            <span style="font-size:10px;font-weight:600;">${item.value || 0}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else if (report.type === 'summary') {
        // 汇总预览
        const summary = data[0] || {};
        return `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px;padding:20px 0;">
                ${Object.entries(summary).map(([key, value]) => `
                    <div style="background:#F9FAFB;border-radius:8px;padding:16px;text-align:center;">
                        <div style="font-size:12px;color:#6B7280;">${key}</div>
                        <div style="font-size:20px;font-weight:700;color:#1F2937;">${typeof value === 'number' ? formatNumber(value) : value}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        // 表格预览
        const columns = Object.keys(data[0] || {});
        return `
            <div style="overflow-x:auto;padding:8px 0;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <thead>
                        <tr style="background:#F9FAFB;border-bottom:2px solid #E5E7EB;">
                            ${columns.map(col => `<th style="padding:8px 12px;text-align:left;font-weight:600;color:#6B7280;">${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.slice(0, 10).map(row => `
                            <tr style="border-bottom:1px solid #F3F4F6;">
                                ${columns.map(col => `<td style="padding:8px 12px;">${row[col] !== undefined ? row[col] : '-'}</td>`).join('')}
                            </tr>
                        `).join('')}
                        ${data.length > 10 ? `<tr><td colspan="${columns.length}" style="padding:8px 12px;text-align:center;color:#6B7280;font-style:italic;">... 还有 ${data.length - 10} 行</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        `;
    }
}

/**
 * @private
 * @param {CustomReport} report - 报表对象
 * @returns {Array} 预览数据
 */
function generatePreviewData(report) {
    const data = [];
    const count = Math.floor(Math.random() * 10) + 5;
    
    if (report.type === 'chart') {
        const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        for (let i = 0; i < Math.min(count, labels.length); i++) {
            data.push({ label: labels[i], value: Math.floor(Math.random() * 100) + 10 });
        }
        return data;
    }
    
    if (report.type === 'summary') {
        return [{
            '总记录数': Math.floor(Math.random() * 1000) + 100,
            '总金额': '¥' + formatCurrency(Math.floor(Math.random() * 100000) + 10000),
            '平均值': Math.floor(Math.random() * 500) + 50,
            '最大值': Math.floor(Math.random() * 2000) + 200
        }];
    }
    
    // 表格数据
    const columns = report.columns || ['日期', '数值'];
    for (let i = 0; i < count; i++) {
        const row = {};
        columns.forEach(col => {
            if (col.includes('日期') || col.includes('时间')) {
                row[col] = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString();
            } else if (col.includes('金额') || col.includes('收入') || col.includes('价格')) {
                row[col] = '¥' + formatCurrency(Math.floor(Math.random() * 1000) + 50);
            } else if (col.includes('数量') || col.includes('订单')) {
                row[col] = Math.floor(Math.random() * 50) + 5;
            } else {
                row[col] = ['正常', '良好', '优秀', '待改进'][Math.floor(Math.random() * 4)];
            }
        });
        data.push(row);
    }
    return data;
}

/**
 * @private
 */
function closePreview() {
    const modal = document.getElementById('reportPreviewModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 * @param {string} id - 报表ID
 */
function runReport(id) {
    const report = state.reports.find(r => r.id === id);
    if (!report) {
        showToast('报表不存在', 'error');
        return;
    }
    
    report.lastRun = new Date().toISOString();
    saveReports();
    applyFilters();
    render();
    showToast(`报表 "${report.name}" 已运行`, 'success');
    
    // 自动预览
    previewReport(id);
}

/**
 * @private
 * @param {string} id - 报表ID
 */
function editReport(id) {
    const report = state.reports.find(r => r.id === id);
    if (!report) {
        showToast('报表不存在', 'error');
        return;
    }
    
    state.editingId = id;
    const modal = document.getElementById('reportModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = '编辑自定义报表';
        document.getElementById('formName').value = report.name;
        document.getElementById('formDescription').value = report.description || '';
        document.getElementById('formType').value = report.type || 'table';
        document.getElementById('formDataSource').value = report.dataSource || '';
        document.getElementById('formColumns').value = report.columns ? report.columns.join(', ') : '';
        document.getElementById('formStatus').value = report.status || 'active';
        modal.style.display = 'flex';
    } else {
        // 降级方案
        const name = prompt('报表名称：', report.name);
        if (name === null) return;
        const description = prompt('报表描述：', report.description || '') || '';
        const status = confirm('是否启用？');
        
        report.name = name.trim() || report.name;
        report.description = description;
        report.status = status ? 'active' : 'inactive';
        report.updatedAt = new Date().toISOString();
        
        saveReports();
        applyFilters();
        render();
        showToast('报表已更新', 'success');
    }
}

/**
 * @private
 * @param {string} id - 报表ID
 */
function deleteReport(id) {
    const report = state.reports.find(r => r.id === id);
    if (!report) {
        showToast('报表不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除报表 "${report.name}"？`)) return;
    
    state.reports = state.reports.filter(r => r.id !== id);
    saveReports();
    applyFilters();
    render();
    showToast('报表已删除', 'success');
}

/**
 * @private
 */
function saveReport() {
    const name = document.getElementById('formName').value.trim();
    const description = document.getElementById('formDescription').value.trim();
    const type = document.getElementById('formType').value;
    const dataSource = document.getElementById('formDataSource').value.trim();
    const columnsStr = document.getElementById('formColumns').value.trim();
    const status = document.getElementById('formStatus').value;

    if (!name) { showToast('请输入报表名称', 'warning'); return; }
    if (!dataSource) { showToast('请输入数据源', 'warning'); return; }

    const columns = columnsStr ? columnsStr.split(',').map(s => s.trim()).filter(s => s) : [];

    const data = { name, description, type, dataSource, columns, status };

    if (state.editingId) {
        const report = state.reports.find(r => r.id === state.editingId);
        if (report) {
            Object.assign(report, data);
            report.updatedAt = new Date().toISOString();
            showToast('报表已更新', 'success');
        }
    } else {
        const newReport = {
            id: 'CR-' + Date.now().toString().slice(-6),
            ...data,
            dateRange: 'this_month',
            filters: {},
            lastRun: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.reports.push(newReport);
        showToast('报表已创建', 'success');
    }

    closeModal();
    saveReports();
    applyFilters();
    render();
}

/**
 * @private
 */
function showCreateModal() {
    state.editingId = null;
    const modal = document.getElementById('reportModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = '新建自定义报表';
        document.getElementById('formName').value = '';
        document.getElementById('formDescription').value = '';
        document.getElementById('formType').value = 'table';
        document.getElementById('formDataSource').value = '';
        document.getElementById('formColumns').value = '';
        document.getElementById('formStatus').value = 'active';
        modal.style.display = 'flex';
    } else {
        // 降级方案
        const name = prompt('报表名称：');
        if (!name) return;
        const description = prompt('报表描述：') || '';
        const typeOptions = ['1. table (表格)', '2. chart (图表)', '3. summary (汇总)'];
        const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
        const types = ['table', 'chart', 'summary'];
        const type = types[typeIdx - 1] || 'table';
        const dataSource = prompt('数据源 (orders/customers/inventory/employees)：') || 'orders';
        const columns = prompt('显示列 (用逗号分隔)：', '日期, 订单数, 收入');
        const status = confirm('是否启用？');
        
        const newReport = {
            id: 'CR-' + Date.now().toString().slice(-6),
            name: name.trim(),
            description: description,
            type: type,
            dataSource: dataSource.trim(),
            columns: columns ? columns.split(',').map(s => s.trim()) : [],
            status: status ? 'active' : 'inactive',
            dateRange: 'this_month',
            filters: {},
            lastRun: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.reports.push(newReport);
        saveReports();
        applyFilters();
        render();
        showToast('报表已创建', 'success');
    }
}

/**
 * @private
 */
function closeModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'none';
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
    const nameInput = document.getElementById('searchName');
    const typeInput = document.getElementById('searchType');
    const statusInput = document.getElementById('searchStatus');
    
    if (nameInput) nameInput.value = '';
    if (typeInput) typeInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { name: '', type: '', status: '' };
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
    
    const createBtn = document.getElementById('createBtn');
    if (createBtn) createBtn.addEventListener('click', showCreateModal);
    
    document.querySelectorAll('#searchName, #searchType, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
    
    const modal = document.getElementById('reportPreviewModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closePreview();
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closePreview();
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📊 自定义报表 初始化...');
    
    if (options?.data) {
        state.reports = options.data;
        localStorage.setItem('custom_report_data', JSON.stringify(state.reports));
    }
    
    loadReports();
    bindEvents();
    render();
    
    window.CustomReportsModule = {
        state,
        loadReports,
        render,
        renderPagination,
        updateStats,
        previewReport,
        runReport,
        editReport,
        deleteReport,
        goToPage,
        showCreateModal,
        closeModal,
        closePreview,
        handleSearch,
        handleReset,
        saveReports,
        applyFilters
    };
    
    console.log('✅ 自定义报表 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadReports,
    previewReport,
    runReport,
    editReport,
    deleteReport,
    goToPage,
    showCreateModal,
    saveReports
};