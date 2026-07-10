/**
 * @file employee.js
 * @module employee
 * @description 员工概览 - 员工数据总览
 * 
 * @example
 * import { init } from './employee.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} EmployeeStats
 * @property {number} total - 总员工数
 * @property {number} active - 在职员工数
 * @property {number} attendanceRate - 出勤率
 * @property {number} monthlyPayroll - 本月薪资总额
 */

/**
 * @typedef {Object} EmployeeItem
 * @property {string} name - 员工姓名
 * @property {string} department - 部门
 * @property {string} position - 职位
 * @property {string} status - 状态 (在职/离职/休假)
 */

/**
 * @typedef {Object} EmployeeData
 * @property {EmployeeStats} stats - 统计数据
 * @property {EmployeeItem[]} employees - 员工列表
 */

/** @type {EmployeeData} 默认数据 */
const DEFAULT_DATA = {
    stats: {
        total: 0,
        active: 0,
        attendanceRate: 0,
        monthlyPayroll: 0
    },
    employees: []
};

/**
 * @private
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0';
    return Number(amount).toLocaleString('zh-CN');
}

/**
 * @private
 * @param {EmployeeStats} stats - 统计数据
 * @description 渲染统计数据
 */
function renderStats(stats) {
    const cards = document.querySelectorAll('.employee-card');
    if (cards.length >= 4) {
        const values = cards.querySelectorAll('.value');
        if (values.length >= 4) {
            values[0].textContent = stats.total;
            values[1].textContent = stats.active;
            values[2].textContent = stats.attendanceRate + '%';
            values[3].textContent = '¥' + formatCurrency(stats.monthlyPayroll);
        }
    } else {
        // 备用：通过ID查找
        const idMap = {
            'empTotal': stats.total,
            'empActive': stats.active,
            'empAttendance': stats.attendanceRate + '%',
            'empPayroll': '¥' + formatCurrency(stats.monthlyPayroll)
        };
        Object.keys(idMap).forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.textContent = idMap[id];
        });
    }
}

/**
 * @private
 * @param {EmployeeItem[]} employees - 员工列表
 * @description 渲染员工列表
 */
function renderEmployees(employees) {
    const tbody = document.querySelector('.table tbody') || 
                  document.querySelector('#employeeList tbody') ||
                  document.querySelector('[data-employee-table] tbody');
    
    if (!tbody) {
        console.warn('⚠️ 找不到员工表格');
        return;
    }

    if (!employees || employees.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;padding:20px;color:#9CA3AF;">
                    暂无员工数据
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    const statusMap = {
        '在职': 'badge-success',
        '离职': 'badge-danger',
        '休假': 'badge-warning'
    };
    
    for (let i = 0; i < Math.min(employees.length, 5); i++) {
        const e = employees[i];
        const badgeClass = statusMap[e.status] || 'badge-secondary';
        html += `
            <tr>
                <td>${e.name}</td>
                <td>${e.department}</td>
                <td>${e.position}</td>
                <td><span class="badge ${badgeClass}">${e.status}</span></td>
            </tr>
        `;
    }
    tbody.innerHTML = html;
}

/**
 * @private
 * @param {EmployeeData} data - 员工数据
 * @description 加载并渲染员工数据
 */
function loadEmployeeData(data) {
    console.log('🔄 Loading employee data...');
    
    const stats = data?.stats || DEFAULT_DATA.stats;
    const employees = data?.employees || DEFAULT_DATA.employees;
    
    renderStats(stats);
    renderEmployees(employees);
    console.log('✅ Employee data loaded');
}

/**
 * @public
 * @param {EmployeeData} data - 员工数据
 * @returns {Promise<void>}
 * @description 初始化员工概览
 */
export async function init(data) {
    console.log('👤 Employee Dashboard 初始化...');

    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    // 使用传入数据或从API加载
    const employeeData = data || await loadFromAPI();
    loadEmployeeData(employeeData);

    // 绑定刷新按钮
    const refreshBtn = document.querySelector('.page-header .btn-secondary, #refreshEmployeeBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                setTimeout(function() {
                    icon.classList.remove('fa-spin');
                }, 1000);
            }
            const newData = await loadFromAPI();
            loadEmployeeData(newData);
            showToast('员工数据已刷新', 'success');
        });
    }

    console.log('✅ Employee Dashboard 初始化完成');
}

/**
 * @private
 * @returns {Promise<EmployeeData>} 员工数据
 * @description 从API加载数据
 */
async function loadFromAPI() {
    try {
        const response = await apiClient.get('/employees/stats');
        if (response && response.success) {
            return response.data;
        }
        return DEFAULT_DATA;
    } catch (error) {
        console.warn('⚠️ API加载失败，使用默认数据:', error);
        return DEFAULT_DATA;
    }
}

export default {
    init
};