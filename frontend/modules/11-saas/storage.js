/**
 * @file storage.js
 * @module storage
 * @description 存储管理 - 租户存储空间管理
 * 
 * @example
 * import { init } from './storage.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} StorageRecord
 * @property {string} id - 存储记录ID
 * @property {string} tenantId - 租户ID
 * @property {string} tenantName - 租户名称
 * @property {string} fileName - 文件名
 * @property {string} fileType - 文件类型
 * @property {number} fileSize - 文件大小(MB)
 * @property {string} uploadDate - 上传日期
 * @property {string} status - 状态 (active/archived)
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 */

/** @type {{records: StorageRecord[], filteredRecords: StorageRecord[], filters: {tenant: string, fileType: string, status: string}, stats: {total: number, totalSize: number, active: number, archived: number}, page: number, pageSize: number}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        tenant: '',
        fileType: '',
        status: ''
    },
    stats: {
        total: 0,
        totalSize: 0,
        active: 0,
        archived: 0
    },
    page: 1,
    pageSize: 10
};

/**
 * 文件类型配置
 */
const TYPE_MAP = {
    image: { label: '图片', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-image' },
    document: { label: '文档', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-file-alt' },
    spreadsheet: { label: '表格', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-file-excel' },
    pdf: { label: 'PDF', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-file-pdf' },
    other: { label: '其他', color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-file' }
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
 * @param {number} size - 文件大小(MB)
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
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

/**
 * @private
 * @returns {StorageRecord[]} 模拟存储数据
 */
function getMockStorage() {
    const tenants = ['洗车店A', '洗车店B', '洗车店C', '洗车店D', '洗车店E'];
    const fileNames = ['logo.png', 'report.xlsx', 'contract.pdf', 'photo.jpg', 'data.csv', 'backup.zip', 'image_01.png', 'invoice.pdf'];
    const fileTypes = ['image', 'document', 'spreadsheet', 'pdf', 'image', 'other', 'image', 'pdf'];
    const statuses = ['active', 'active', 'archived', 'active', 'active', 'archived', 'active', 'active'];
    
    return Array.from({ length: 15 }, (_, i) => ({
        id: `STG-${String(i + 1).padStart(6, '0')}`,
        tenantId: `TEN-${String(i % 5 + 1).padStart(6, '0')}`,
        tenantName: tenants[i % tenants.length],
        fileName: fileNames[i % fileNames.length],
        fileType: fileTypes[i % fileTypes.length],
        fileSize: Math.round((Math.random() * 100 + 0.5) * 10) / 10,
        uploadDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: statuses[i % statuses.length],
        note: '',
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

/**
 * @private
 * @description 加载存储数据
 */
function loadStorage() {
    try {
        const saved = localStorage.getItem('storage_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockStorage();
            localStorage.setItem('storage_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载存储数据失败:', e);
        state.records = getMockStorage();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存存储数据
 */
function saveStorage() {
    try {
        localStorage.setItem('storage_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存存储数据失败:', e);
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
    
    if (state.filters.fileType) {
        filtered = filtered.filter(r => r.fileType === state.filters.fileType);
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
    const totalSize = state.records.reduce((sum, r) => sum + r.fileSize, 0);
    const active = state.records.filter(r => r.status === 'active').length;
    const archived = state.records.filter(r => r.status === 'archived').length;
    
    state.stats = { total, totalSize, active, archived };
}

/**
 * @private
 * @description 渲染存储列表
 */
function render() {
    const tbody = document.getElementById('storageListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-hdd" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无存储数据
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        active: { label: '活跃', color: '#D1FAE5', textColor: '#065F46' },
        archived: { label: '已归档', color: '#F3F4F6', textColor: '#4B5563' }
    };

    tbody.innerHTML = pageData.map(r => {
        const type = TYPE_MAP[r.fileType] || TYPE_MAP.other;
        const status = statusMap[r.status] || statusMap.active;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${r.tenantName}</td>
                <td style="padding:10px 16px;font-size:13px;">${r.fileName}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        <i class="fas ${type.icon}" style="margin-right:4px;"></i>
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;">
                    ${formatSize(r.fileSize)}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(r.uploadDate)}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.StorageModule.viewFile('${r.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${r.status === 'active' ? `
                            <button class="btn btn-sm btn-warning" onclick="window.StorageModule.archiveFile('${r.id}')" title="归档">
                                <i class="fas fa-archive"></i>
                            </button>
                        ` : ''}
                        ${r.status === 'archived' ? `
                            <button class="btn btn-sm btn-success" onclick="window.StorageModule.restoreFile('${r.id}')" title="恢复">
                                <i class="fas fa-undo"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger" onclick="window.StorageModule.deleteFile('${r.id}')" title="删除">
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
    document.getElementById('statTotalSize')?.textContent = formatSize(stats.totalSize);
    document.getElementById('statActive')?.textContent = stats.active;
    document.getElementById('statArchived')?.textContent = stats.archived;
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
                共 ${total} 个文件
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.StorageModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.StorageModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @param {string} id - 存储记录ID
 */
function viewFile(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('文件不存在', 'error');
        return;
    }
    
    const type = TYPE_MAP[record.fileType] || TYPE_MAP.other;
    const statusMap = { active: '活跃', archived: '已归档' };
    
    alert(`文件详情：
租户: ${record.tenantName}
文件名: ${record.fileName}
类型: ${type.label}
大小: ${formatSize(record.fileSize)}
状态: ${statusMap[record.status] || record.status}
上传日期: ${formatDate(record.uploadDate)}
备注: ${record.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 存储记录ID
 */
function archiveFile(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('文件不存在', 'error');
        return;
    }
    
    record.status = 'archived';
    record.updatedAt = new Date().toISOString();
    
    saveStorage();
    applyFilters();
    render();
    showToast('文件已归档', 'success');
}

/**
 * @private
 * @param {string} id - 存储记录ID
 */
function restoreFile(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('文件不存在', 'error');
        return;
    }
    
    record.status = 'active';
    record.updatedAt = new Date().toISOString();
    
    saveStorage();
    applyFilters();
    render();
    showToast('文件已恢复', 'success');
}

/**
 * @private
 * @param {string} id - 存储记录ID
 */
function deleteFile(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('文件不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除文件 "${record.fileName}"？`)) return;
    
    state.records = state.records.filter(r => r.id !== id);
    saveStorage();
    applyFilters();
    render();
    showToast('文件已删除', 'success');
}

/**
 * @private
 */
function uploadFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const tenantName = prompt('租户名称：', '洗车店A') || '洗车店A';
        const fileTypeMap = {
            'image': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
            'document': ['doc', 'docx', 'txt', 'rtf', 'md'],
            'spreadsheet': ['xls', 'xlsx', 'csv', 'ods'],
            'pdf': ['pdf']
        };
        const ext = file.name.split('.').pop().toLowerCase();
        let fileType = 'other';
        for (const [type, exts] of Object.entries(fileTypeMap)) {
            if (exts.includes(ext)) { fileType = type; break; }
        }
        
        const newRecord = {
            id: 'STG-' + Date.now().toString().slice(-6),
            tenantId: 'TEN-' + String(Math.floor(Math.random() * 999) + 1).padStart(6, '0'),
            tenantName: tenantName.trim(),
            fileName: file.name,
            fileType: fileType,
            fileSize: Math.round(file.size / 1024 / 1024 * 10) / 10,
            uploadDate: new Date().toISOString().split('T')[0],
            status: 'active',
            note: '',
            createdAt: new Date().toISOString()
        };
        
        state.records.push(newRecord);
        saveStorage();
        applyFilters();
        render();
        showToast(`文件 "${file.name}" 上传成功`, 'success');
    };
    input.click();
}

/**
 * @private
 */
function handleSearch() {
    state.filters.tenant = document.getElementById('searchTenant')?.value || '';
    state.filters.fileType = document.getElementById('searchType')?.value || '';
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
    const typeInput = document.getElementById('searchType');
    const statusInput = document.getElementById('searchStatus');
    
    if (tenantInput) tenantInput.value = '';
    if (typeInput) typeInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { tenant: '', fileType: '', status: '' };
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
    
    document.querySelectorAll('#searchTenant, #searchType, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('💾 存储管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('storage_data', JSON.stringify(state.records));
    }
    
    loadStorage();
    bindEvents();
    render();
    
    window.StorageModule = {
        state,
        loadStorage,
        render,
        renderPagination,
        updateStats,
        viewFile,
        archiveFile,
        restoreFile,
        deleteFile,
        uploadFile,
        goToPage,
        handleSearch,
        handleReset,
        saveStorage,
        applyFilters
    };
    
    console.log('✅ 存储管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadStorage,
    viewFile,
    archiveFile,
    restoreFile,
    deleteFile,
    uploadFile,
    goToPage,
    saveStorage
};