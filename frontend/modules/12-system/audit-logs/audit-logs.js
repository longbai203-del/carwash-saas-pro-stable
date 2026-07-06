// modules/12-system/audit-logs/audit-logs.js
import { getAuditLogs } from '../../../api/system.js';
import { formatDateTime, showToast } from '../../../js/utils.js';

const state = {
    logs: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { user: '', action: '', dateRange: { start: '', end: '' } }
};

const ACTION_TYPES = {
    login: { label: '登录', icon: 'fa-sign-in-alt', color: 'blue' },
    logout: { label: '登出', icon: 'fa-sign-out-alt', color: 'gray' },
    create: { label: '创建', icon: 'fa-plus', color: 'green' },
    update: { label: '更新', icon: 'fa-edit', color: 'orange' },
    delete: { label: '删除', icon: 'fa-trash', color: 'red' },
    export: { label: '导出', icon: 'fa-download', color: 'purple' },
    import: { label: '导入', icon: 'fa-upload', color: 'teal' },
    permission: { label: '权限变更', icon: 'fa-lock', color: 'red' }
};

export async function init() {
    console.log('审计日志已加载');
    await loadLogs();
    bindEvents();
}

async function loadLogs() {
    state.loading = true;
    showLoading();

    try {
        const data = await getMockLogs();
        state.logs = data.list;
        state.pagination.total = data.total;
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('加载日志失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockLogs() {
    const users = ['admin', 'zhangwei', 'lina', 'wangqiang', 'liuyang', 'chenjing'];
    const actions = ['login', 'logout', 'create', 'update', 'delete', 'export', 'import', 'permission'];
    const resources = ['用户管理', '订单管理', '商品管理', '客户管理', '库存管理', '系统设置', '财务报表'];
    const ips = ['192.168.1.100', '192.168.1.101', '10.0.0.50', '172.16.0.25', '192.168.1.105'];
    
    const logs = [];
    for (let i = 0; i < 40; i++) {
        const action = actions[i % actions.length];
        logs.push({
            id: `LOG-${String(i + 1).padStart(6, '0')}`,
            user: users[i % users.length],
            action: action,
            resource: resources[i % resources.length],
            resourceId: `RES-${String(Math.floor(Math.random() * 1000) + 1).padStart(6, '0')}`,
            details: `${ACTION_TYPES[action]?.label || action} ${resources[i % resources.length]}`,
            ip: ips[i % ips.length],
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    // 按时间倒序
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
        list: logs.slice(0, 10),
        total: logs.length
    };
}

function renderTable() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

    tbody.innerHTML = state.logs.map(log => {
        const actionInfo = ACTION_TYPES[log.action] || { label: log.action, icon: 'fa-circle', color: 'gray' };
        return `
            <tr>
                <td class="font-mono text-sm">${log.id}</td>
                <td>
                    <span class="font-medium">${log.user}</span>
                </td>
                <td>
                    <span class="badge badge-${actionInfo.color}">
                        <i class="fas ${actionInfo.icon}"></i>
                        ${actionInfo.label}
                    </span>
                </td>
                <td>${log.resource}</td>
                <td class="text-sm">${log.details}</td>
                <td class="font-mono text-sm">${log.ip}</td>
                <td class="text-sm">${formatDateTime(log.createdAt)}</td>
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
            <div class="text-sm text-gray-500">共 ${total} 条日志，第 ${page}/${totalPages} 页</div>
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
    loadLogs();
};

function handleSearch() {
    state.pagination.page = 1;
    loadLogs();
}

function handleReset() {
    state.filters = { user: '', action: '', dateRange: { start: '', end: '' } };
    document.getElementById('searchUser').value = '';
    document.getElementById('searchAction').value = '';
    document.getElementById('dateStart').value = '';
    document.getElementById('dateEnd').value = '';
    state.pagination.page = 1;
    loadLogs();
}

function exportLogs() {
    showToast('导出日志中...', 'info');
    // 实际项目中生成CSV或Excel下载
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('exportBtn')?.addEventListener('click', exportLogs);
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