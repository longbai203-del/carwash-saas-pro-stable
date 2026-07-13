/**
 * @file payroll.js
 * @module payroll
 * @description 薪资管理 - 员工薪资计算和发放
 * 
 * @example
 * import { init } from './payroll.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} PayrollRecord
 * @property {string} id - 薪资记录ID
 * @property {string} employeeId - 员工ID
 * @property {string} employeeName - 员工姓名
 * @property {string} department - 部门
 * @property {string} period - 期间 (YYYY-MM)
 * @property {number} basicSalary - 基本工资
 * @property {number} bonus - 奖金
 * @property {number} commission - 佣金
 * @property {number} overtimePay - 加班费
 * @property {number} allowance - 津贴
 * @property {number} deductions - 扣款
 * @property {number} netPay - 实发工资
 * @property {string} status - 状态 (pending/paid)
 * @property {string} paymentDate - 发放日期
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 */

/** @type {{records: PayrollRecord[], filteredRecords: PayrollRecord[], filters: {period: string, department: string, status: string, employee: string}, stats: {totalPayroll: number, paidCount: number, pendingCount: number, totalEmployees: number}, page: number, pageSize: number}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        period: '',
        department: '',
        status: '',
        employee: ''
    },
    stats: {
        totalPayroll: 0,
        paidCount: 0,
        pendingCount: 0,
        totalEmployees: 0
    },
    page: 1,
    pageSize: 10
};

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
 * @returns {PayrollRecord[]} 模拟薪资数据
 */
function getMockPayroll() {
    const employees = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
    const departments = ['管理', '服务', '销售', '技术', '服务', '管理', '销售', '技术'];
    const basicSalaries = [8000, 6000, 7000, 9000, 5500, 8500, 6500, 7500];
    const statuses = ['paid', 'pending', 'paid', 'paid', 'pending', 'paid', 'pending', 'paid'];
    const period = new Date().toISOString().slice(0, 7);
    
    return employees.map((name, i) => {
        const bonus = Math.floor(Math.random() * 2000) + 500;
        const commission = Math.floor(Math.random() * 3000) + 1000;
        const overtimePay = Math.floor(Math.random() * 1000) + 200;
        const allowance = Math.floor(Math.random() * 800) + 300;
        const deductions = Math.floor(Math.random() * 500) + 100;
        const netPay = basicSalaries[i] + bonus + commission + overtimePay + allowance - deductions;
        
        return {
            id: `PAY-${String(i + 1).padStart(6, '0')}`,
            employeeId: `EMP-${String(i + 1).padStart(6, '0')}`,
            employeeName: name,
            department: departments[i],
            period: period,
            basicSalary: basicSalaries[i],
            bonus: bonus,
            commission: commission,
            overtimePay: overtimePay,
            allowance: allowance,
            deductions: deductions,
            netPay: netPay,
            status: statuses[i],
            paymentDate: statuses[i] === 'paid' 
                ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : '',
            note: '',
            createdAt: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载薪资数据
 */
function loadPayroll() {
    try {
        const saved = localStorage.getItem('payroll_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockPayroll();
            localStorage.setItem('payroll_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载薪资数据失败:', e);
        state.records = getMockPayroll();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存薪资数据
 */
function savePayroll() {
    try {
        localStorage.setItem('payroll_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存薪资数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.records;
    
    if (state.filters.period) {
        filtered = filtered.filter(r => r.period === state.filters.period);
    }
    
    if (state.filters.department) {
        filtered = filtered.filter(r => r.department === state.filters.department);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    if (state.filters.employee) {
        const emp = state.filters.employee.toLowerCase();
        filtered = filtered.filter(r => r.employeeName.toLowerCase().includes(emp));
    }
    
    state.filteredRecords = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const totalPayroll = state.filteredRecords.reduce((sum, r) => sum + r.netPay, 0);
    const paidCount = state.filteredRecords.filter(r => r.status === 'paid').length;
    const pendingCount = state.filteredRecords.filter(r => r.status === 'pending').length;
    const totalEmployees = state.filteredRecords.length;
    
    state.stats = { totalPayroll, paidCount, pendingCount, totalEmployees };
}

/**
 * @private
 * @description 渲染薪资列表
 */
function render() {
    const tbody = document.getElementById('payrollListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-money-bill" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无薪资记录
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        paid: { label: '已发放', color: '#D1FAE5', textColor: '#065F46' },
        pending: { label: '待发放', color: '#FEF3C7', textColor: '#92400E' }
    };

    tbody.innerHTML = pageData.map(r => {
        const status = statusMap[r.status] || statusMap.pending;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${r.employeeName}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.department}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.period}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;">
                    ¥${formatCurrency(r.basicSalary)}
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:700;color:#4F46E5;">
                    ¥${formatCurrency(r.netPay)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${r.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.PayrollModule.paySalary('${r.id}')" title="发放薪资">
                                <i class="fas fa-credit-card"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.PayrollModule.viewPayroll('${r.id}')" title="查看">
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
    
    document.getElementById('statTotalPayroll')?.textContent = '¥' + formatCurrency(stats.totalPayroll);
    document.getElementById('statPaidCount')?.textContent = stats.paidCount;
    document.getElementById('statPendingCount')?.textContent = stats.pendingCount;
    document.getElementById('statTotalEmployees')?.textContent = stats.totalEmployees;
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
                共 ${total} 条记录
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.PayrollModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.PayrollModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @param {string} id - 薪资记录ID
 */
function viewPayroll(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    const statusMap = { paid: '已发放', pending: '待发放' };
    
    alert(`薪资详情：
员工: ${record.employeeName}
部门: ${record.department}
期间: ${record.period}
基本工资: ¥${formatCurrency(record.basicSalary)}
奖金: ¥${formatCurrency(record.bonus)}
佣金: ¥${formatCurrency(record.commission)}
加班费: ¥${formatCurrency(record.overtimePay)}
津贴: ¥${formatCurrency(record.allowance)}
扣款: ¥${formatCurrency(record.deductions)}
实发工资: ¥${formatCurrency(record.netPay)}
状态: ${statusMap[record.status] || record.status}
发放日期: ${formatDate(record.paymentDate)}
备注: ${record.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 薪资记录ID
 */
function paySalary(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认发放 ${record.employeeName} 的薪资？\n金额: ¥${formatCurrency(record.netPay)}`)) return;
    
    record.status = 'paid';
    record.paymentDate = new Date().toISOString().split('T')[0];
    
    savePayroll();
    applyFilters();
    render();
    showToast('薪资已发放', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.period = document.getElementById('searchPeriod')?.value || '';
    state.filters.department = document.getElementById('searchDepartment')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.employee = document.getElementById('searchEmployee')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const periodInput = document.getElementById('searchPeriod');
    const deptInput = document.getElementById('searchDepartment');
    const statusInput = document.getElementById('searchStatus');
    const empInput = document.getElementById('searchEmployee');
    
    if (periodInput) periodInput.value = '';
    if (deptInput) deptInput.value = '';
    if (statusInput) statusInput.value = '';
    if (empInput) empInput.value = '';
    
    state.filters = { period: '', department: '', status: '', employee: '' };
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
    
    document.querySelectorAll('#searchPeriod, #searchDepartment, #searchStatus, #searchEmployee').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('💰 薪资管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('payroll_data', JSON.stringify(state.records));
    }
    
    loadPayroll();
    bindEvents();
    render();
    
    window.PayrollModule = {
        state,
        loadPayroll,
        render,
        renderPagination,
        updateStats,
        viewPayroll,
        paySalary,
        goToPage,
        handleSearch,
        handleReset,
        savePayroll,
        applyFilters
    };
    
    console.log('✅ 薪资管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadPayroll,
    viewPayroll,
    paySalary,
    goToPage,
    savePayroll
};