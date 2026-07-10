/**
 * @file penalties.js
 * @module penalties
 * @description 处罚管理 - 员工违规处罚记录
 * 
 * @example
 * import { init } from './penalties.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} PenaltyRecord
 * @property {string} id - 处罚记录ID
 * @property {string} employeeId - 员工ID
 * @property {string} employeeName - 员工姓名
 * @property {string} department - 部门
 * @property {string} type - 类型 (late/violation/quality/attendance/other)
 * @property {number} amount - 处罚金额
 * @property {string} reason - 处罚原因
 * @property {string} date - 处罚日期
 * @property {string} status - 状态 (pending/deducted)
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} deductedAt - 扣款时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} PenaltyState
 * @property {PenaltyRecord[]} records - 处罚记录列表
 * @property {PenaltyRecord[]} filteredRecords - 过滤后的处罚记录列表
 * @property {Object} filters - 筛选条件
 * @property {Object} stats - 统计数据
 * @property {number} page - 页码
 * @property {number} pageSize - 每页数量
 * @property {string|null} editingId - 编辑中的记录ID
 */

/** @type {PenaltyState} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        type: '',
        status: '',
        department: '',
        employee: '',
        dateFrom: '',
        dateTo: ''
    },
    stats: {
        totalAmount: 0,
        deductedAmount: 0,
        pendingAmount: 0,
        totalRecords: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 类型配置
 */
const TYPE_MAP = {
    late: { label: '迟到', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    violation: { label: '违规', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-exclamation-triangle' },
    quality: { label: '质量问题', color: '#FCE4EC', textColor: '#DC2626', icon: 'fa-times-circle' },
    attendance: { label: '考勤', color: '#F3E5F5', textColor: '#7B1FA2', icon: 'fa-calendar-times' },
    other: { label: '其他', color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-ellipsis-h' }
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    deducted: { label: '已扣款', color: '#D1FAE5', textColor: '#065F46' },
    pending: { label: '待扣款', color: '#FEF3C7', textColor: '#92400E' }
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
 * @returns {PenaltyRecord[]} 模拟处罚数据
 */
function getMockPenalties() {
    const employees = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
    const departments = ['管理', '服务', '销售', '技术', '服务', '管理', '销售', '技术'];
    const types = ['late', 'violation', 'quality', 'attendance', 'late', 'violation', 'quality', 'attendance'];
    const amounts = [50, 200, 100, 80, 50, 150, 120, 60];
    const reasons = ['上班迟到30分钟', '违反操作规范', '服务投诉', '无故缺勤', '迟到15分钟', '损坏设备', '服务质量不达标', '考勤异常'];
    const statuses = ['pending', 'deducted', 'pending', 'deducted', 'pending', 'deducted', 'pending', 'deducted'];
    
    return employees.map((name, i) => ({
        id: `PEN-${String(i + 1).padStart(6, '0')}`,
        employeeId: `EMP-${String(i + 1).padStart(6, '0')}`,
        employeeName: name,
        department: departments[i],
        type: types[i],
        amount: amounts[i],
        reason: reasons[i],
        date: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: statuses[i],
        note: statuses[i] === 'pending' ? '待确认扣款' : '已从薪资扣除',
        createdAt: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
        deductedAt: statuses[i] === 'deducted' 
            ? new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString()
            : null
    }));
}

/**
 * @private
 * @description 加载处罚数据
 */
function loadPenalties() {
    try {
        const saved = localStorage.getItem('penalty_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockPenalties();
            localStorage.setItem('penalty_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载处罚数据失败:', e);
        state.records = getMockPenalties();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存处罚数据
 */
function savePenalties() {
    try {
        localStorage.setItem('penalty_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存处罚数据失败:', e);
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
    
    if (state.filters.department) {
        filtered = filtered.filter(r => r.department === state.filters.department);
    }
    
    if (state.filters.employee) {
        const emp = state.filters.employee.toLowerCase();
        filtered = filtered.filter(r => r.employeeName.toLowerCase().includes(emp));
    }
    
    if (state.filters.dateFrom) {
        filtered = filtered.filter(r => r.date >= state.filters.dateFrom);
    }
    
    if (state.filters.dateTo) {
        filtered = filtered.filter(r => r.date <= state.filters.dateTo);
    }
    
    state.filteredRecords = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const totalAmount = state.filteredRecords.reduce((sum, r) => sum + r.amount, 0);
    const deductedAmount = state.filteredRecords
        .filter(r => r.status === 'deducted')
        .reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = state.filteredRecords
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + r.amount, 0);
    const totalRecords = state.filteredRecords.length;
    
    state.stats = { totalAmount, deductedAmount, pendingAmount, totalRecords };
}

/**
 * @private
 * @description 渲染处罚列表
 */
function render() {
    const tbody = document.getElementById('penaltyListBody') || document.getElementById('penaltyTableBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-exclamation-circle" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无处罚记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const type = TYPE_MAP[r.type] || TYPE_MAP.other;
        const status = STATUS_MAP[r.status] || STATUS_MAP.pending;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${r.employeeName}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.department}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        <i class="fas ${type.icon}" style="margin-right:4px;"></i>
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.reason}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#EF4444;">
                    ¥${formatCurrency(r.amount)}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(r.date)}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${r.status === 'pending' ? `
                            <button class="btn btn-sm btn-primary" onclick="window.PenaltiesModule.deductPenalty('${r.id}')" title="执行扣款">
                                <i class="fas fa-credit-card"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.PenaltiesModule.deletePenalty('${r.id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.PenaltiesModule.viewPenalty('${r.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${r.status === 'deducted' ? `
                            <button class="btn btn-sm btn-outline" onclick="window.PenaltiesModule.deletePenalty('${r.id}')" title="删除">
                                <i class="fas fa-trash"></i>
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
    
    const elements = {
        'statTotalAmount': '¥' + formatCurrency(stats.totalAmount),
        'statDeductedAmount': '¥' + formatCurrency(stats.deductedAmount),
        'statPendingAmount': '¥' + formatCurrency(stats.pendingAmount),
        'statTotalRecords': stats.totalRecords
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
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
                <button onclick="window.PenaltiesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.PenaltiesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @param {string} id - 处罚记录ID
 */
function viewPenalty(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    const type = TYPE_MAP[record.type] || TYPE_MAP.other;
    const statusMap = { deducted: '已扣款', pending: '待扣款' };
    
    alert(`处罚详情：
员工: ${record.employeeName}
部门: ${record.department}
类型: ${type.label}
金额: ¥${formatCurrency(record.amount)}
原因: ${record.reason}
日期: ${formatDate(record.date)}
状态: ${statusMap[record.status] || record.status}
${record.deductedAt ? '扣款时间: ' + formatDateTime(record.deductedAt) : ''}
备注: ${record.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 处罚记录ID
 */
function deductPenalty(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认从 ${record.employeeName} 的薪资中扣除处罚款？\n金额: ¥${formatCurrency(record.amount)}`)) return;
    
    record.status = 'deducted';
    record.deductedAt = new Date().toISOString();
    record.updatedAt = new Date().toISOString();
    
    savePenalties();
    applyFilters();
    render();
    showToast('处罚已执行扣款', 'success');
}

/**
 * @private
 * @param {string} id - 处罚记录ID
 */
function deletePenalty(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除 ${record.employeeName} 的处罚记录？`)) return;
    
    state.records = state.records.filter(r => r.id !== id);
    savePenalties();
    applyFilters();
    render();
    showToast('处罚记录已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const employeeName = prompt('员工姓名：');
    if (!employeeName) return;
    const department = prompt('部门：') || '服务';
    const typeOptions = ['1. late (迟到)', '2. violation (违规)', '3. quality (质量问题)', '4. attendance (考勤)', '5. other (其他)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
    const types = ['late', 'violation', 'quality', 'attendance', 'other'];
    const type = types[typeIdx - 1] || 'late';
    const amount = parseFloat(prompt('处罚金额：', '50'));
    if (isNaN(amount) || amount < 0) {
        showToast('请输入有效金额', 'error');
        return;
    }
    const reason = prompt('处罚原因：');
    if (!reason) return;
    const date = prompt('处罚日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
    const note = prompt('备注：') || '';
    const status = confirm('是否立即扣款？\n点击"确定"扣款，点击"取消"待扣款');
    
    const newRecord = {
        id: 'PEN-' + Date.now().toString().slice(-6),
        employeeId: 'EMP-' + String(Math.floor(Math.random() * 999) + 1).padStart(6, '0'),
        employeeName: employeeName.trim(),
        department: department,
        type: type,
        amount: amount,
        reason: reason.trim(),
        date: date || new Date().toISOString().split('T')[0],
        status: status ? 'deducted' : 'pending',
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deductedAt: status ? new Date().toISOString() : null
    };
    
    state.records.push(newRecord);
    savePenalties();
    applyFilters();
    render();
    showToast('处罚记录已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.type = document.getElementById('searchType')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.department = document.getElementById('searchDepartment')?.value || '';
    state.filters.employee = document.getElementById('searchEmployee')?.value || '';
    state.filters.dateFrom = document.getElementById('dateFrom')?.value || '';
    state.filters.dateTo = document.getElementById('dateTo')?.value || '';
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
    const deptInput = document.getElementById('searchDepartment');
    const empInput = document.getElementById('searchEmployee');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (typeInput) typeInput.value = '';
    if (statusInput) statusInput.value = '';
    if (deptInput) deptInput.value = '';
    if (empInput) empInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    state.filters = { type: '', status: '', department: '', employee: '', dateFrom: '', dateTo: '' };
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
    
    document.querySelectorAll('#searchType, #searchStatus, #searchDepartment, #searchEmployee, #dateFrom, #dateTo').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('⚠️ 处罚管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('penalty_data', JSON.stringify(state.records));
    }
    
    loadPenalties();
    bindEvents();
    render();
    
    // 暴露全局方法
    window.PenaltiesModule = {
        state,
        loadPenalties,
        render,
        renderPagination,
        updateStats,
        viewPenalty,
        deductPenalty,
        deletePenalty,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        savePenalties,
        applyFilters
    };
    
    console.log('✅ 处罚管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadPenalties,
    viewPenalty,
    deductPenalty,
    deletePenalty,
    goToPage,
    showCreateModal,
    savePenalties
};