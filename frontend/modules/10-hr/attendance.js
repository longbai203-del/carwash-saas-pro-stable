/**
 * @file attendance.js
 * @module attendance
 * @description 考勤管理 - 员工打卡记录和管理
 * 
 * @example
 * import { init } from './attendance.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} AttendanceRecord
 * @property {string} id - 记录ID
 * @property {string} employeeId - 员工ID
 * @property {string} employeeName - 员工姓名
 * @property {string} department - 部门
 * @property {string} date - 日期
 * @property {string} checkIn - 打卡时间
 * @property {string} checkOut - 下班时间
 * @property {string} status - 状态 (present/absent/late/leave)
 * @property {number} overtime - 加班时长(小时)
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 */

/** @type {{records: AttendanceRecord[], filteredRecords: AttendanceRecord[], filters: {date: string, department: string, status: string, employee: string}, stats: {total: number, present: number, absent: number, late: number, leave: number}, page: number, pageSize: number}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        date: '',
        department: '',
        status: '',
        employee: ''
    },
    stats: {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0
    },
    page: 1,
    pageSize: 10
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    present: { label: '正常', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    late: { label: '迟到', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    absent: { label: '缺勤', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' },
    leave: { label: '请假', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-calendar-minus' }
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
 * @param {string} time - 时间字符串
 * @returns {string} 格式化后的时间
 */
function formatTime(time) {
    if (!time) return '-';
    return time;
}

/**
 * @private
 * @returns {AttendanceRecord[]} 模拟考勤数据
 */
function getMockAttendance() {
    const employees = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
    const departments = ['管理', '服务', '销售', '技术'];
    const statuses = ['present', 'present', 'late', 'absent', 'leave', 'present', 'present', 'late'];
    const checkInTimes = ['08:50', '08:55', '09:10', '09:30', '', '08:45', '08:58', '09:15'];
    const checkOutTimes = ['18:00', '18:10', '17:50', '18:30', '', '17:55', '18:05', '17:45'];
    const overtimes = [0, 0.5, 0, 1, 0, 0, 0.5, 0];
    
    const date = new Date().toISOString().split('T')[0];
    
    return employees.map((name, i) => ({
        id: `ATT-${String(i + 1).padStart(6, '0')}`,
        employeeId: `EMP-${String(i + 1).padStart(6, '0')}`,
        employeeName: name,
        department: departments[i % departments.length],
        date: date,
        checkIn: checkInTimes[i],
        checkOut: checkOutTimes[i],
        status: statuses[i],
        overtime: overtimes[i],
        note: statuses[i] === 'absent' ? '未打卡' : '',
        createdAt: new Date().toISOString()
    }));
}

/**
 * @private
 * @description 加载考勤数据
 */
function loadAttendance() {
    try {
        const saved = localStorage.getItem('attendance_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockAttendance();
            localStorage.setItem('attendance_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载考勤数据失败:', e);
        state.records = getMockAttendance();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存考勤数据
 */
function saveAttendance() {
    try {
        localStorage.setItem('attendance_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存考勤数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.records;
    
    if (state.filters.date) {
        filtered = filtered.filter(r => r.date === state.filters.date);
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
    const total = state.filteredRecords.length;
    const present = state.filteredRecords.filter(r => r.status === 'present').length;
    const absent = state.filteredRecords.filter(r => r.status === 'absent').length;
    const late = state.filteredRecords.filter(r => r.status === 'late').length;
    const leave = state.filteredRecords.filter(r => r.status === 'leave').length;
    
    state.stats = { total, present, absent, late, leave };
}

/**
 * @private
 * @description 渲染考勤列表
 */
function render() {
    const tbody = document.getElementById('attendanceListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-clock" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无考勤记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const status = STATUS_MAP[r.status] || STATUS_MAP.absent;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${r.employeeName}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.department}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(r.date)}</td>
                <td style="padding:10px 16px;text-align:center;">${formatTime(r.checkIn)}</td>
                <td style="padding:10px 16px;text-align:center;">${formatTime(r.checkOut)}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.AttendanceModule.editAttendance('${r.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.AttendanceModule.viewAttendance('${r.id}')" title="查看">
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
    document.getElementById('statPresent')?.textContent = stats.present;
    document.getElementById('statAbsent')?.textContent = stats.absent;
    document.getElementById('statLate')?.textContent = stats.late;
    document.getElementById('statLeave')?.textContent = stats.leave;
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
                <button onclick="window.AttendanceModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.AttendanceModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @param {string} id - 记录ID
 */
function viewAttendance(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    const status = STATUS_MAP[record.status] || STATUS_MAP.absent;
    
    alert(`考勤详情：
员工: ${record.employeeName}
部门: ${record.department}
日期: ${formatDate(record.date)}
打卡: ${formatTime(record.checkIn)}
下班: ${formatTime(record.checkOut)}
状态: ${status.label}
加班: ${record.overtime || 0} 小时
备注: ${record.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 记录ID
 */
function editAttendance(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    const checkIn = prompt('打卡时间 (HH:MM)：', record.checkIn || '');
    if (checkIn === null) return;
    const checkOut = prompt('下班时间 (HH:MM)：', record.checkOut || '');
    if (checkOut === null) return;
    const statusOptions = ['1. present (正常)', '2. late (迟到)', '3. absent (缺勤)', '4. leave (请假)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, 
        record.status === 'present' ? '1' : record.status === 'late' ? '2' : record.status === 'absent' ? '3' : '4'));
    const statuses = ['present', 'late', 'absent', 'leave'];
    const status = statuses[statusIdx - 1] || record.status;
    const overtime = parseFloat(prompt('加班时长 (小时)：', record.overtime || '0')) || 0;
    const note = prompt('备注：', record.note || '') || '';
    
    record.checkIn = checkIn.trim() || record.checkIn;
    record.checkOut = checkOut.trim() || record.checkOut;
    record.status = status;
    record.overtime = overtime;
    record.note = note;
    
    saveAttendance();
    applyFilters();
    render();
    showToast('考勤已更新', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const employeeName = prompt('员工姓名：');
    if (!employeeName) return;
    const department = prompt('部门：') || '服务';
    const date = prompt('日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
    const checkIn = prompt('打卡时间 (HH:MM)：', '09:00') || '09:00';
    const checkOut = prompt('下班时间 (HH:MM)：', '18:00') || '18:00';
    const statusOptions = ['1. present (正常)', '2. late (迟到)', '3. absent (缺勤)', '4. leave (请假)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, '1'));
    const statuses = ['present', 'late', 'absent', 'leave'];
    const status = statuses[statusIdx - 1] || 'present';
    const note = prompt('备注：') || '';
    
    const newRecord = {
        id: 'ATT-' + Date.now().toString().slice(-6),
        employeeId: 'EMP-' + String(Math.floor(Math.random() * 999) + 1).padStart(6, '0'),
        employeeName: employeeName.trim(),
        department: department,
        date: date || new Date().toISOString().split('T')[0],
        checkIn: checkIn,
        checkOut: checkOut,
        status: status,
        overtime: 0,
        note: note,
        createdAt: new Date().toISOString()
    };
    
    state.records.push(newRecord);
    saveAttendance();
    applyFilters();
    render();
    showToast('考勤记录已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.date = document.getElementById('searchDate')?.value || '';
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
    const dateInput = document.getElementById('searchDate');
    const deptInput = document.getElementById('searchDepartment');
    const statusInput = document.getElementById('searchStatus');
    const empInput = document.getElementById('searchEmployee');
    
    if (dateInput) dateInput.value = '';
    if (deptInput) deptInput.value = '';
    if (statusInput) statusInput.value = '';
    if (empInput) empInput.value = '';
    
    state.filters = { date: '', department: '', status: '', employee: '' };
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
    
    document.querySelectorAll('#searchDate, #searchDepartment, #searchStatus, #searchEmployee').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📋 考勤管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('attendance_data', JSON.stringify(state.records));
    }
    
    loadAttendance();
    bindEvents();
    render();
    
    window.AttendanceModule = {
        state,
        loadAttendance,
        render,
        renderPagination,
        updateStats,
        viewAttendance,
        editAttendance,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveAttendance,
        applyFilters
    };
    
    console.log('✅ 考勤管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadAttendance,
    viewAttendance,
    editAttendance,
    goToPage,
    showCreateModal,
    saveAttendance
};