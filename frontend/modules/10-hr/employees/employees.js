// modules/10-hr/employees/employees.js
import { getEmployees, deleteEmployee } from '../../../api/employees.js';
import { showToast } from '../../../js/utils.js';

const state = {
    employees: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { name: '', department: '', status: '' }
};

const DEPARTMENTS = ['管理部', '销售部', '服务部', '技术部', '市场部'];
const POSITIONS = ['经理', '主管', '员工', '实习生'];

export async function init() {
    console.log('员工管理已加载');
    await loadEmployees();
    bindEvents();
}

async function loadEmployees() {
    state.loading = true;
    showLoading();

    try {
        const data = await getMockEmployees();
        state.employees = data.list;
        state.pagination.total = data.total;
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('加载员工失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockEmployees() {
    const names = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛', '吴刚', '徐洁'];
    const departments = ['管理部', '销售部', '服务部', '技术部', '市场部'];
    const positions = ['经理', '主管', '员工', '实习生'];
    const statuses = ['active', 'active', 'active', 'inactive', 'active'];
    
    const employees = [];
    for (let i = 0; i < 25; i++) {
        const hireDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
        employees.push({
            id: `EMP-${String(i + 1).padStart(6, '0')}`,
            name: names[i % names.length] + (i > 9 ? ` ${String.fromCharCode(65 + i % 26)}` : ''),
            department: departments[i % departments.length],
            position: positions[i % positions.length],
            phone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
            email: `emp${i + 1}@company.com`,
            salary: Math.floor(Math.random() * 15000) + 3000,
            hireDate: hireDate.toISOString(),
            status: statuses[i % statuses.length]
        });
    }
    
    return {
        list: employees.slice(0, 10),
        total: employees.length
    };
}

function renderTable() {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;

    tbody.innerHTML = state.employees.map(emp => `
        <tr>
            <td>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                        ${emp.name.charAt(0)}
                    </div>
                    <div>
                        <div class="font-medium">${emp.name}</div>
                        <div class="text-xs text-gray-500">${emp.id}</div>
                    </div>
                </div>
            </td>
            <td>${emp.department}</td>
            <td>${emp.position}</td>
            <td>${emp.phone}</td>
            <td class="text-right font-semibold">¥${emp.salary.toFixed(2)}</td>
            <td class="text-sm">${new Date(emp.hireDate).toLocaleDateString()}</td>
            <td>
                <span class="badge ${emp.status === 'active' ? 'badge-success' : 'badge-secondary'}">
                    ${emp.status === 'active' ? '在职' : '离职'}
                </span>
            </td>
            <td>
                <div class="flex gap-1">
                    <button class="btn-sm btn-primary" onclick="editEmployee('${emp.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-danger" onclick="deleteEmployee('${emp.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const { page, limit, total } = state.pagination;
    const totalPages = Math.ceil(total / limit);

    container.innerHTML = `
        <div class="flex items-center justify-between px-4 py-3">
            <div class="text-sm text-gray-500">共 ${total} 名员工，第 ${page}/${totalPages} 页</div>
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
    loadEmployees();
};

window.editEmployee = function(id) {
    showToast(`编辑员工: ${id}`, 'info');
};

window.deleteEmployee = async function(id) {
    if (!confirm('确认删除该员工吗？')) return;
    try {
        await deleteEmployee(id);
        showToast('删除成功', 'success');
        await loadEmployees();
    } catch (error) {
        showToast('删除失败', 'error');
    }
};

function showCreateEmployee() {
    showToast('新建员工功能开发中', 'info');
}

function handleSearch() {
    state.pagination.page = 1;
    loadEmployees();
}

function handleReset() {
    state.filters = { name: '', department: '', status: '' };
    document.getElementById('searchName').value = '';
    document.getElementById('searchDepartment').value = '';
    document.getElementById('searchStatus').value = '';
    state.pagination.page = 1;
    loadEmployees();
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreateEmployee);
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