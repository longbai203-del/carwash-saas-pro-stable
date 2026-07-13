/**
 * @file import.js
 * @module purchasing-import
 * @description 导入管理 - 批量导入商品和采购数据
 * 
 * @example
 * import { init } from './import.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ImportRecord
 * @property {string} id - 导入记录ID
 * @property {string} importNo - 导入编号
 * @property {string} type - 类型 (products/suppliers/purchase)
 * @property {string} fileName - 文件名
 * @property {number} totalRows - 总行数
 * @property {number} successRows - 成功行数
 * @property {number} failedRows - 失败行数
 * @property {string} status - 状态 (processing/completed/failed)
 * @property {string} uploadedAt - 上传时间
 * @property {string} completedAt - 完成时间
 * @property {string} note - 备注
 */

/** @type {{records: ImportRecord[], filteredRecords: ImportRecord[], filters: {type: string, status: string}, stats: {total: number, processing: number, completed: number, failed: number}, page: number, pageSize: number}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        type: '',
        status: ''
    },
    stats: {
        total: 0,
        processing: 0,
        completed: 0,
        failed: 0
    },
    page: 1,
    pageSize: 10
};

/**
 * 类型配置
 */
const TYPE_MAP = {
    products: { label: '商品导入', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-box' },
    suppliers: { label: '供应商导入', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-building' },
    purchase: { label: '采购导入', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-shopping-cart' }
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    processing: { label: '处理中', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-spinner' },
    completed: { label: '已完成', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    failed: { label: '失败', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
};

/**
 * @private
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
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
 * @returns {ImportRecord[]} 模拟导入数据
 */
function getMockImports() {
    const types = ['products', 'suppliers', 'purchase'];
    const statuses = ['processing', 'completed', 'failed'];
    const fileNames = ['商品数据.xlsx', '供应商列表.csv', '采购订单.xlsx', '库存更新.csv', '价格表.xlsx'];
    
    return Array.from({ length: 8 }, (_, i) => ({
        id: `IMP-${String(i + 1).padStart(6, '0')}`,
        importNo: `IMP${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        type: types[i % types.length],
        fileName: fileNames[i % fileNames.length],
        totalRows: Math.floor(Math.random() * 200) + 20,
        successRows: Math.floor(Math.random() * 180) + 15,
        failedRows: Math.floor(Math.random() * 20) + 0,
        status: statuses[i % statuses.length],
        uploadedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: statuses[i % statuses.length] !== 'processing' 
            ? new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString()
            : null,
        note: ''
    }));
}

/**
 * @private
 * @description 加载导入数据
 */
function loadImports() {
    try {
        const saved = localStorage.getItem('import_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockImports();
            localStorage.setItem('import_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载导入数据失败:', e);
        state.records = getMockImports();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存导入数据
 */
function saveImports() {
    try {
        localStorage.setItem('import_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存导入数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.records;
    
    if (state.filters.type) {
        filtered = filtered.filter(r => r.type === state.filters.type);
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
    const processing = state.records.filter(r => r.status === 'processing').length;
    const completed = state.records.filter(r => r.status === 'completed').length;
    const failed = state.records.filter(r => r.status === 'failed').length;
    
    state.stats = { total, processing, completed, failed };
}

/**
 * @private
 * @description 渲染导入列表
 */
function render() {
    const tbody = document.getElementById('importListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-file-import" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无导入记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const type = TYPE_MAP[r.type] || TYPE_MAP.products;
        const status = STATUS_MAP[r.status] || STATUS_MAP.processing;
        const successRate = r.totalRows > 0 ? Math.round((r.successRows / r.totalRows) * 100) : 0;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${r.importNo}</div>
                    <div style="font-size:12px;color:#6B7280;">${r.fileName}</div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        <i class="fas ${type.icon}" style="margin-right:4px;"></i>
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:center;font-weight:600;">
                    ${formatNumber(r.successRows)}/${formatNumber(r.totalRows)}
                    <div style="font-size:11px;color:#6B7280;">${successRate}%</div>
                </td>
                <td style="padding:10px 16px;text-align:center;font-size:13px;color:#EF4444;">
                    ${r.failedRows > 0 ? formatNumber(r.failedRows) : '-'}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(r.uploadedAt)}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.ImportModule.viewImport('${r.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${r.status === 'completed' && r.failedRows > 0 ? `
                            <button class="btn btn-sm btn-warning" onclick="window.ImportModule.downloadErrors('${r.id}')" title="下载错误">
                                <i class="fas fa-file-download"></i>
                            </button>
                        ` : ''}
                        ${r.status === 'processing' ? `
                            <button class="btn btn-sm btn-danger" onclick="window.ImportModule.cancelImport('${r.id}')" title="取消">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
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
    document.getElementById('statProcessing')?.textContent = stats.processing;
    document.getElementById('statCompleted')?.textContent = stats.completed;
    document.getElementById('statFailed')?.textContent = stats.failed;
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
                共 ${total} 条导入记录
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.ImportModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.ImportModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @param {string} id - 导入记录ID
 */
function viewImport(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('导入记录不存在', 'error');
        return;
    }
    
    const type = TYPE_MAP[record.type] || TYPE_MAP.products;
    const status = STATUS_MAP[record.status] || STATUS_MAP.processing;
    
    alert(`导入详情：
导入编号: ${record.importNo}
文件名称: ${record.fileName}
类型: ${type.label}
状态: ${status.label}
总行数: ${formatNumber(record.totalRows)}
成功: ${formatNumber(record.successRows)}
失败: ${formatNumber(record.failedRows)}
成功率: ${record.totalRows > 0 ? Math.round((record.successRows / record.totalRows) * 100) : 0}%
上传时间: ${formatDate(record.uploadedAt)}
${record.completedAt ? '完成时间: ' + formatDate(record.completedAt) : ''}
备注: ${record.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 导入记录ID
 */
function downloadErrors(id) {
    showToast('错误报告正在生成...', 'info');
    setTimeout(() => {
        showToast('错误报告已下载', 'success');
    }, 1500);
}

/**
 * @private
 * @param {string} id - 导入记录ID
 */
function cancelImport(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('导入记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认取消导入 ${record.importNo}？`)) return;
    
    record.status = 'failed';
    record.completedAt = new Date().toISOString();
    record.note = '用户取消导入';
    
    saveImports();
    applyFilters();
    render();
    showToast('导入已取消', 'success');
}

/**
 * @private
 */
function uploadFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const typeOptions = ['1. products (商品)', '2. suppliers (供应商)', '3. purchase (采购)'];
        const typeIdx = parseInt(prompt(`选择导入类型：\n${typeOptions.join('\n')}`, '1'));
        const types = ['products', 'suppliers', 'purchase'];
        const type = types[typeIdx - 1] || 'products';
        
        const newRecord = {
            id: 'IMP-' + Date.now().toString().slice(-6),
            importNo: `IMP${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
            type: type,
            fileName: file.name,
            totalRows: Math.floor(Math.random() * 100) + 10,
            successRows: 0,
            failedRows: 0,
            status: 'processing',
            uploadedAt: new Date().toISOString(),
            completedAt: null,
            note: ''
        };
        
        state.records.unshift(newRecord);
        saveImports();
        applyFilters();
        render();
        showToast(`文件 "${file.name}" 上传成功，正在处理...`, 'success');
        
        // 模拟处理完成
        setTimeout(() => {
            const record = state.records.find(r => r.id === newRecord.id);
            if (record) {
                record.status = 'completed';
                record.successRows = Math.floor(record.totalRows * (0.85 + Math.random() * 0.1));
                record.failedRows = record.totalRows - record.successRows;
                record.completedAt = new Date().toISOString();
                saveImports();
                applyFilters();
                render();
                showToast(`导入完成，成功 ${record.successRows} 条，失败 ${record.failedRows} 条`, 
                    record.failedRows > 0 ? 'warning' : 'success');
            }
        }, 3000 + Math.random() * 2000);
    };
    input.click();
}

/**
 * @private
 */
function handleSearch() {
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
    const typeInput = document.getElementById('searchType');
    const statusInput = document.getElementById('searchStatus');
    
    if (typeInput) typeInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { type: '', status: '' };
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
    
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) uploadBtn.addEventListener('click', uploadFile);
    
    document.querySelectorAll('#searchType, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📤 导入管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('import_data', JSON.stringify(state.records));
    }
    
    loadImports();
    bindEvents();
    render();
    
    window.ImportModule = {
        state,
        loadImports,
        render,
        renderPagination,
        updateStats,
        viewImport,
        downloadErrors,
        cancelImport,
        uploadFile,
        goToPage,
        handleSearch,
        handleReset,
        saveImports,
        applyFilters
    };
    
    console.log('✅ 导入管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadImports,
    viewImport,
    cancelImport,
    uploadFile,
    goToPage,
    saveImports
};