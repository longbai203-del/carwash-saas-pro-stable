/**
 * @file employees.js
 * @module employees
 * @description 员工管理 - 员工的CRUD操作
 * 
 * @example
 * import { init } from './employees.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Employee
 * @property {string} id - 员工ID
 * @property {string} name - 姓名
 * @property {string} department - 部门
 * @property {string} position - 职位
 * @property {string} phone - 电话
 * @property {string} email - 邮箱
 * @property {number} salary - 薪资
 * @property {string} hireDate - 入职日期
 * @property {string} status - 状态 (active/inactive/on_leave)
 * @property {string} notes - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{employees: Employee[], filteredEmployees: Employee[], filters: {name: string, department: string, status: string}, stats: {total: number, active: number, onLeave: number, inactive: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    employees: [],
    filteredEmployees: [],
    filters: {
        name: '',
        department: '',
        status: ''
    },
    stats: {
        total: 0,
        active: 0,
        onLeave: 0,
        inactive: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
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
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return amount.toFixed(2);
}

/**
 * @private
 * @returns {Employee[]} 模拟员工数据
 */
function getMockEmployees() {
    const names = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛', '吴刚', '徐洁'];
    const departments = ['管理', '服务', '销售', '技术'];
    const positions = ['经理', '主管', '员工', '总监'];
    const statuses = ['active', 'active', 'active', 'inactive', 'on_leave'];
    
    return names.map((name, i) => ({
        id: `EMP-${String(i + 1).padStart(6, '0')}`,
        name: name,
        department: departments[i % departments.length],
        position: positions[i % positions.length],
        phone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        email: `employee${i + 1}@example.com`,
        salary: [5000, 6000, 7000, 8000, 9000, 10000][Math.floor(Math.random() * 6)],
        hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: statuses[i % statuses.length],
        notes: '',
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

/**
 * @private
 * @description 加载员工数据
 */
function loadEmployees() {
    try {
        const saved = localStorage.getItem('employee_data');
        if (saved) {
            state.employees = JSON.parse(saved);
        } else {
            state.employees = getMockEmployees();
            localStorage.setItem('employee_data', JSON.stringify(state.employees));
        }
    } catch (e) {
        console.warn('加载员工数据失败:', e);
        state.employees = getMockEmployees();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存员工数据
 */
function saveEmployees() {
    try {
        localStorage.setItem('employee_data', JSON.stringify(state.employees));
    } catch (e) {
        console.warn('保存员工数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.employees;
    
    if (state.filters.name) {
        const name = state.filters.name.toLowerCase();
        filtered = filtered.filter(e => e.name.toLowerCase().includes(name));
    }
    
    if (state.filters.department) {
        filtered = filtered.filter(e => e.department === state.filters.department);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(e => e.status === state.filters.status);
    }
    
    state.filteredEmployees = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.employees.length;
    const active = state.employees.filter(e => e.status === 'active').length;
    const onLeave = state.employees.filter(e => e.status === 'on_leave').length;
    const inactive = state.employees.filter(e => e.status === 'inactive').length;
    
    state.stats = { total, active, onLeave, inactive };
}

/**
 * @private
 * @description 渲染员工列表
 */
function render() {
    const tbody = document.getElementById('employeeListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredEmployees.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-users" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无员工数据
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        active: { label: '在职', color: '#D1FAE5', textColor: '#065F46' },
        inactive: { label: '已离职', color: '#FEE2E2', textColor: '#991B1B' },
        on_leave: { label: '休假', color: '#FEF3C7', textColor: '#92400E' }
    };

    tbody.innerHTML = pageData.map(e => {
        const status = statusMap[e.status] || statusMap.inactive;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${e.name}</td>
                <td style="padding:10px 16px;font-size:13px;">${e.department}</td>
                <td style="padding:10px 16px;font-size:13px;">${e.position}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;">
                    ¥${formatCurrency(e.salary)}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(e.hireDate)}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.EmployeesModule.editEmployee('${e.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.EmployeesModule.viewEmployee('${e.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.EmployeesModule.deleteEmployee('${e.id}')" title="删除">
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
    document.getElementById('statOnLeave')?.textContent = stats.onLeave;
    document.getElementById('statInactive')?.textContent = stats.inactive;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredEmployees.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 位员工
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 位，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.EmployeesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.EmployeesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredEmployees.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 员工ID
 */
function viewEmployee(id) {
    const employee = state.employees.find(e => e.id === id);
    if (!employee) {
        showToast('员工不存在', 'error');
        return;
    }
    
    const statusMap = { active: '在职', inactive: '已离职', on_leave: '休假' };
    
    alert(`员工详情：
姓名: ${employee.name}
部门: ${employee.department}
职位: ${employee.position}
电话: ${employee.phone}
邮箱: ${employee.email}
薪资: ¥${formatCurrency(employee.salary)}
入职日期: ${formatDate(employee.hireDate)}
状态: ${statusMap[employee.status] || employee.status}
备注: ${employee.notes || '无'}`);
}

/**
 * @private
 * @param {string} id - 员工ID
 */
function editEmployee(id) {
    const employee = state.employees.find(e => e.id === id);
    if (!employee) {
        showToast('员工不存在', 'error');
        return;
    }
    
    const name = prompt('姓名：', employee.name);
    if (name === null) return;
    const department = prompt('部门：', employee.department) || employee.department;
    const position = prompt('职位：', employee.position) || employee.position;
    const salary = parseFloat(prompt('薪资：', employee.salary));
    if (isNaN(salary) || salary < 0) {
        showToast('请输入有效薪资', 'error');
        return;
    }
    const statusOptions = ['1. active (在职)', '2. inactive (已离职)', '3. on_leave (休假)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, 
        employee.status === 'active' ? '1' : employee.status === 'inactive' ? '2' : '3'));
    const statuses = ['active', 'inactive', 'on_leave'];
    const status = statuses[statusIdx - 1] || employee.status;
    
    employee.name = name.trim() || employee.name;
    employee.department = department;
    employee.position = position;
    employee.salary = salary;
    employee.status = status;
    employee.updatedAt = new Date().toISOString();
    
    saveEmployees();
    applyFilters();
    render();
    showToast('员工已更新', 'success');
}

/**
 * @private
 * @param {string} id - 员工ID
 */
function deleteEmployee(id) {
    const employee = state.employees.find(e => e.id === id);
    if (!employee) {
        showToast('员工不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除员工 "${employee.name}"？`)) return;
    
    state.employees = state.employees.filter(e => e.id !== id);
    saveEmployees();
    applyFilters();
    render();
    showToast('员工已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const name = prompt('姓名：');
    if (!name) return;
    const department = prompt('部门：') || '服务';
    const position = prompt('职位：') || '员工';
    const salary = parseFloat(prompt('薪资：', '5000'));
    if (isNaN(salary) || salary < 0) {
        showToast('请输入有效薪资', 'error');
        return;
    }
    const phone = prompt('电话：', '13800000000') || '13800000000';
    const email = prompt('邮箱：', '') || '';
    const status = confirm('是否在职？\n点击"确定"在职，点击"取消"其他状态');
    
    const newEmployee = {
        id: 'EMP-' + Date.now().toString().slice(-6),
        name: name.trim(),
        department: department,
        position: position,
        phone: phone,
        email: email,
        salary: salary,
        hireDate: new Date().toISOString().split('T')[0],
        status: status ? 'active' : 'inactive',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.employees.push(newEmployee);
    saveEmployees();
    applyFilters();
    render();
    showToast('员工已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.department = document.getElementById('searchDepartment')?.value || '';
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
    const deptInput = document.getElementById('searchDepartment');
    const statusInput = document.getElementById('searchStatus');
    
    if (nameInput) nameInput.value = '';
    if (deptInput) deptInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { name: '', department: '', status: '' };
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
    
    document.querySelectorAll('#searchName, #searchDepartment, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('👥 员工管理 初始化...');
    
    if (options?.data) {
        state.employees = options.data;
        localStorage.setItem('employee_data', JSON.stringify(state.employees));
    }
    
    loadEmployees();
    bindEvents();
    render();
    
    window.EmployeesModule = {
        state,
        loadEmployees,
        render,
        renderPagination,
        updateStats,
        viewEmployee,
        editEmployee,
        deleteEmployee,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveEmployees,
        applyFilters
    };
    
    console.log('✅ 员工管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadEmployees,
    viewEmployee,
    editEmployee,
    deleteEmployee,
    goToPage,
    showCreateModal,
    saveEmployees
};