/**
 * @file leaves.js
 * @module leaves
 * @description 请假管理 - 员工请假申请和审批
 * 
 * @example
 * import { init } from './leaves.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} LeaveRecord
 * @property {string} id - 请假ID
 * @property {string} employeeId - 员工ID
 * @property {string} employeeName - 员工姓名
 * @property {string} department - 部门
 * @property {string} type - 类型 (annual/sick/personal/other)
 * @property {string} startDate - 开始日期
 * @property {string} endDate - 结束日期
 * @property {number} days - 天数
 * @property {string} reason - 原因
 * @property {string} status - 状态 (pending/approved/rejected)
 * @property {string} approver - 审批人
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} approvedAt - 审批时间
 */

/** @type {{records: LeaveRecord[], filteredRecords: LeaveRecord[], filters: {employee: string, type: string, status: string, dateFrom: string, dateTo: string}, stats: {total: number, pending: number, approved: number, rejected: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        employee: '',
        type: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    },
    stats: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 类型配置
 */
const TYPE_MAP = {
    annual: { label: '年假', color: '#DBEAFE', textColor: '#1E40AF' },
    sick: { label: '病假', color: '#FEF3C7', textColor: '#92400E' },
    personal: { label: '事假', color: '#F3F4F6', textColor: '#4B5563' },
    other: { label: '其他', color: '#EDE9FE', textColor: '#6D28D9' }
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    pending: { label: '待审批', color: '#FEF3C7', textColor: '#92400E' },
    approved: { label: '已批准', color: '#D1FAE5', textColor: '#065F46' },
    rejected: { label: '已拒绝', color: '#FEE2E2', textColor: '#991B1B' }
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
 * @param {number} days - 天数
 * @returns {string} 格式化后的天数
 */
function formatDays(days) {
    if (days === undefined || days === null) return '0天';
    return days + '天';
}

/**
 * @private
 * @param {string} date1 - 开始日期
 * @param {string} date2 - 结束日期
 * @returns {number} 天数差
 */
function calculateDays(date1, date2) {
    if (!date1 || !date2) return 0;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
}

/**
 * @private
 * @returns {LeaveRecord[]} 模拟请假数据
 */
function getMockLeaves() {
    const employees = ['张伟', '李娜', '王强', '刘洋', '陈静'];
    const types = ['annual', 'sick', 'personal', 'annual', 'other'];
    const statuses = ['pending', 'approved', 'approved', 'rejected', 'pending'];
    const reasons = ['家庭事务', '身体不适', '个人事务', '年假休息', '其他'];
    
    return employees.map((name, i) => {
        const startDate = new Date(Date.now() + (i + 1) * 2 * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3) + 1);
        const days = calculateDays(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
        
        return {
            id: `LEAVE-${String(i + 1).padStart(6, '0')}`,
            employeeId: `EMP-${String(i + 1).padStart(6, '0')}`,
            employeeName: name,
            department: ['管理', '服务', '销售', '技术', '服务'][i],
            type: types[i],
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            days: days,
            reason: reasons[i],
            status: statuses[i],
            approver: statuses[i] !== 'pending' ? '张伟' : '',
            note: '',
            createdAt: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000).toISOString(),
            approvedAt: statuses[i] !== 'pending' 
                ? new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString()
                : null
        };
    });
}

/**
 * @private
 * @description 加载请假数据
 */
function loadLeaves() {
    try {
        const saved = localStorage.getItem('leave_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockLeaves();
            localStorage.setItem('leave_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载请假数据失败:', e);
        state.records = getMockLeaves();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存请假数据
 */
function saveLeaves() {
    try {
        localStorage.setItem('leave_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存请假数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.records;
    
    if (state.filters.employee) {
        const emp = state.filters.employee.toLowerCase();
        filtered = filtered.filter(r => r.employeeName.toLowerCase().includes(emp));
    }
    
    if (state.filters.type) {
        filtered = filtered.filter(r => r.type === state.filters.type);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(r => r.status === state.filters.status);
    }
    
    if (state.filters.dateFrom) {
        filtered = filtered.filter(r => r.startDate >= state.filters.dateFrom);
    }
    
    if (state.filters.dateTo) {
        filtered = filtered.filter(r => r.endDate <= state.filters.dateTo);
    }
    
    state.filteredRecords = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.filteredRecords.length;
    const pending = state.filteredRecords.filter(r => r.status === 'pending').length;
    const approved = state.filteredRecords.filter(r => r.status === 'approved').length;
    const rejected = state.filteredRecords.filter(r => r.status === 'rejected').length;
    
    state.stats = { total, pending, approved, rejected };
}

/**
 * @private
 * @description 渲染请假列表
 */
function render() {
    const tbody = document.getElementById('leaveListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-calendar-minus" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无请假记录
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
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">
                    ${formatDate(r.startDate)} ~ ${formatDate(r.endDate)}
                </td>
                <td style="padding:10px 16px;text-align:center;font-weight:600;">
                    ${formatDays(r.days)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${r.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.LeavesModule.approveLeave('${r.id}')" title="批准">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.LeavesModule.rejectLeave('${r.id}')" title="拒绝">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.LeavesModule.viewLeave('${r.id}')" title="查看">
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
    
    document.getElementById('statTotal')?.textContent = stats.total;
    document.getElementById('statPending')?.textContent = stats.pending;
    document.getElementById('statApproved')?.textContent = stats.approved;
    document.getElementById('statRejected')?.textContent = stats.rejected;
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
                <button onclick="window.LeavesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.LeavesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @param {string} id - 请假ID
 */
function viewLeave(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    const type = TYPE_MAP[record.type] || TYPE_MAP.other;
    const status = STATUS_MAP[record.status] || STATUS_MAP.pending;
    
    alert(`请假详情：
员工: ${record.employeeName}
部门: ${record.department}
类型: ${type.label}
日期: ${formatDate(record.startDate)} ~ ${formatDate(record.endDate)}
天数: ${formatDays(record.days)}
原因: ${record.reason}
状态: ${status.label}
审批人: ${record.approver || '-'}
备注: ${record.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 请假ID
 */
function approveLeave(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认批准 ${record.employeeName} 的请假申请？\n天数: ${formatDays(record.days)}`)) return;
    
    record.status = 'approved';
    record.approver = '张伟';
    record.approvedAt = new Date().toISOString();
    
    saveLeaves();
    applyFilters();
    render();
    showToast('请假已批准', 'success');
}

/**
 * @private
 * @param {string} id - 请假ID
 */
function rejectLeave(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    if (!confirm(`确认拒绝 ${record.employeeName} 的请假申请？`)) return;
    
    record.status = 'rejected';
    record.approver = '张伟';
    record.approvedAt = new Date().toISOString();
    
    saveLeaves();
    applyFilters();
    render();
    showToast('请假已拒绝', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const employeeName = prompt('员工姓名：');
    if (!employeeName) return;
    const department = prompt('部门：') || '服务';
    const typeOptions = ['1. annual (年假)', '2. sick (病假)', '3. personal (事假)', '4. other (其他)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
    const types = ['annual', 'sick', 'personal', 'other'];
    const type = types[typeIdx - 1] || 'annual';
    const startDate = prompt('开始日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
    const endDate = prompt('结束日期 (YYYY-MM-DD)：', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const reason = prompt('请假原因：');
    if (!reason) return;
    const note = prompt('备注：') || '';
    
    const days = calculateDays(startDate, endDate);
    
    const newRecord = {
        id: 'LEAVE-' + Date.now().toString().slice(-6),
        employeeId: 'EMP-' + String(Math.floor(Math.random() * 999) + 1).padStart(6, '0'),
        employeeName: employeeName.trim(),
        department: department,
        type: type,
        startDate: startDate,
        endDate: endDate,
        days: days,
        reason: reason.trim(),
        status: 'pending',
        approver: '',
        note: note,
        createdAt: new Date().toISOString(),
        approvedAt: null
    };
    
    state.records.push(newRecord);
    saveLeaves();
    applyFilters();
    render();
    showToast('请假申请已提交', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.employee = document.getElementById('searchEmployee')?.value || '';
    state.filters.type = document.getElementById('searchType')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
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
    const empInput = document.getElementById('searchEmployee');
    const typeInput = document.getElementById('searchType');
    const statusInput = document.getElementById('searchStatus');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (empInput) empInput.value = '';
    if (typeInput) typeInput.value = '';
    if (statusInput) statusInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    state.filters = { employee: '', type: '', status: '', dateFrom: '', dateTo: '' };
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
    
    document.querySelectorAll('#searchEmployee, #searchType, #searchStatus, #dateFrom, #dateTo').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📋 请假管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('leave_data', JSON.stringify(state.records));
    }
    
    loadLeaves();
    bindEvents();
    render();
    
    window.LeavesModule = {
        state,
        loadLeaves,
        render,
        renderPagination,
        updateStats,
        viewLeave,
        approveLeave,
        rejectLeave,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveLeaves,
        applyFilters
    };
    
    console.log('✅ 请假管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadLeaves,
    viewLeave,
    approveLeave,
    rejectLeave,
    goToPage,
    showCreateModal,
    saveLeaves
};