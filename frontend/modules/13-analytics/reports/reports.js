// modules/13-analytics/reports/reports.js
import { getReports, generateReport } from '../../../api/reports.js';
import { formatCurrency, formatDate, showToast } from '../../../js/utils.js';

const state = {
    reports: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { name: '', type: '', dateRange: { start: '', end: '' } }
};

const REPORT_TYPES = {
    sales: { label: '销售报表', icon: 'fa-chart-line', color: 'blue' },
    inventory: { label: '库存报表', icon: 'fa-boxes', color: 'green' },
    customer: { label: '客户报表', icon: 'fa-users', color: 'purple' },
    financial: { label: '财务报表', icon: 'fa-coins', color: 'gold' },
    employee: { label: '员工报表', icon: 'fa-user-tie', color: 'teal' },
    marketing: { label: '营销报表', icon: 'fa-bullhorn', color: 'pink' }
};

export async function init() {
    console.log('报表管理已加载');
    await loadReports();
    bindEvents();
}

async function loadReports() {
    state.loading = true;
    showLoading();

    try {
        const data = await getMockReports();
        state.reports = data.list;
        state.pagination.total = data.total;
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('加载报表失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockReports() {
    const names = ['2026年度销售报告', 'Q2库存分析', '客户增长报告', '财务状况分析', '员工绩效报告', '营销活动效果', '月度销售对比', '库存周转率分析'];
    const types = ['sales', 'inventory', 'customer', 'financial', 'employee', 'marketing'];
    const formats = ['PDF', 'Excel', 'CSV', '图表'];
    
    const reports = [];
    for (let i = 0; i < 25; i++) {
        const type = types[i % types.length];
        reports.push({
            id: `RPT-${String(i + 1).padStart(6, '0')}`,
            name: names[i % names.length] + (i > 7 ? ` ${String.fromCharCode(65 + i % 26)}` : ''),
            type: type,
            format: formats[i % formats.length],
            generatedBy: ['admin', 'zhangwei', 'lina'][i % 3],
            generatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            size: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9) + 1}MB`,
            status: Math.random() > 0.2 ? 'completed' : 'processing'
        });
    }
    
    return {
        list: reports.slice(0, 10),
        total: reports.length
    };
}

function renderTable() {
    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;

    const statusMap = {
        completed: { label: '已完成', color: 'success' },
        processing: { label: '生成中', color: 'warning' },
        failed: { label: '失败', color: 'danger' }
    };

    tbody.innerHTML = state.reports.map(report => {
        const typeInfo = REPORT_TYPES[report.type] || { label: report.type, icon: 'fa-file', color: 'gray' };
        return `
            <tr>
                <td>
                    <div>
                        <div class="font-medium">${report.name}</div>
                        <div class="text-xs text-gray-500">${report.id}</div>
                    </div>
                </td>
                <td>
                    <span class="badge badge-${typeInfo.color}">
                        <i class="fas ${typeInfo.icon}"></i>
                        ${typeInfo.label}
                    </span>
                </td>
                <td>
                    <span class="badge badge-secondary">${report.format}</span>
                </td>
                <td>${report.generatedBy}</td>
                <td class="text-sm">${formatDate(report.generatedAt)}</td>
                <td class="text-sm">${report.size}</td>
                <td>
                    <span class="badge badge-${statusMap[report.status]?.color || 'secondary'}">
                        ${statusMap[report.status]?.label || report.status}
                    </span>
                </td>
                <td>
                    <div class="flex gap-1">
                        ${report.status === 'completed' ? `
                            <button class="btn-sm btn-primary" onclick="downloadReport('${report.id}')">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn-sm btn-secondary" onclick="viewReport('${report.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        ` : `
                            <span class="text-sm text-gray-500">等待中...</span>
                        `}
                        <button class="btn-sm btn-danger" onclick="deleteReport('${report.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const { page, limit, total } = state.pagination;
    const totalPages = Math.ceil(total / limit);

    container.innerHTML = `
        <div class="flex items-center justify-between px-4 py-3">
            <div class="text-sm text-gray-500">共 ${total} 个报表，第 ${page}/${totalPages} 页</div>
            <div class="flex gap-1">
                <button class="px-3 py-1 border rounded ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                        onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>上一页</button>
                ${Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
                    const p = i + 1;
                    return `<button class="px-3 py-1 border rounded ${p === page ? 'bg-blue-500 text-white' : ''}" 
                            onclick="changePage(${p})">${p}</button>`;
                }).join('')}
                <button class="px-3 py-1 border rounded ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                        onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
            </div>
        </div>
    `;
}

window.changePage = function(page) {
    if (page < 1 || page > Math.ceil(state.pagination.total / state.pagination.limit)) return;
    state.pagination.page = page;
    loadReports();
};

window.downloadReport = function(id) {
    showToast(`下载报表: ${id}`, 'success');
    // 实际项目中触发文件下载
};

window.viewReport = function(id) {
    showToast(`查看报表: ${id}`, 'info');
};

window.deleteReport = async function(id) {
    if (!confirm('确认删除该报表吗？')) return;
    try {
        await deleteReport(id);
        showToast('删除成功', 'success');
        await loadReports();
    } catch (error) {
        showToast('删除失败', 'error');
    }
};

function showCreateReport() {
    showToast('新建报表功能开发中', 'info');
    // 打开报表配置弹窗
}

function handleSearch() {
    state.pagination.page = 1;
    loadReports();
}

function handleReset() {
    state.filters = { name: '', type: '', dateRange: { start: '', end: '' } };
    document.getElementById('searchName').value = '';
    document.getElementById('searchType').value = '';
    document.getElementById('dateStart').value = '';
    document.getElementById('dateEnd').value = '';
    state.pagination.page = 1;
    loadReports();
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreateReport);
}

function showLoading() {
    document.getElementById('loadingSpinner')?.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner')?.classList.add('hidden');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}