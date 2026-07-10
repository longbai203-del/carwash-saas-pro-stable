/**
 * @file schedules.js
 * @module schedules
 * @description 排班管理 - 员工排班和轮班管理
 * 
 * @example
 * import { init } from './schedules.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ScheduleRecord
 * @property {string} id - 排班记录ID
 * @property {string} employeeId - 员工ID
 * @property {string} employeeName - 员工姓名
 * @property {string} department - 部门
 * @property {string} date - 日期
 * @property {string} shiftId - 班次ID
 * @property {string} shiftName - 班次名称
 * @property {string} startTime - 开始时间
 * @property {string} endTime - 结束时间
 * @property {string} status - 状态 (scheduled/completed/absent)
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{records: ScheduleRecord[], filteredRecords: ScheduleRecord[], filters: {date: string, department: string, shift: string, employee: string}, stats: {total: number, scheduled: number, completed: number, absent: number}, page: number, pageSize: number}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        date: '',
        department: '',
        shift: '',
        employee: ''
    },
    stats: {
        total: 0,
        scheduled: 0,
        completed: 0,
        absent: 0
    },
    page: 1,
    pageSize: 10
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
 * @returns {ScheduleRecord[]} 模拟排班数据
 */
function getMockSchedules() {
    const employees = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
    const departments = ['管理', '服务', '销售', '技术', '服务', '管理', '销售', '技术'];
    const shifts = [
        { id: 'SHIFT-001', name: '早班', start: '08:00', end: '16:00' },
        { id: 'SHIFT-002', name: '中班', start: '10:00', end: '18:00' },
        { id: 'SHIFT-003', name: '晚班', start: '14:00', end: '22:00' }
    ];
    const statuses = ['scheduled', 'completed', 'scheduled', 'completed', 'absent', 'scheduled', 'completed', 'scheduled'];
    const date = new Date().toISOString().split('T')[0];
    
    return employees.map((name, i) => {
        const shift = shifts[i % shifts.length];
        return {
            id: `SCH-${String(i + 1).padStart(6, '0')}`,
            employeeId: `EMP-${String(i + 1).padStart(6, '0')}`,
            employeeName: name,
            department: departments[i],
            date: date,
            shiftId: shift.id,
            shiftName: shift.name,
            startTime: shift.start,
            endTime: shift.end,
            status: statuses[i],
            note: statuses[i] === 'absent' ? '未到岗' : '',
            createdAt: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载排班数据
 */
function loadSchedules() {
    try {
        const saved = localStorage.getItem('schedule_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockSchedules();
            localStorage.setItem('schedule_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载排班数据失败:', e);
        state.records = getMockSchedules();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存排班数据
 */
function saveSchedules() {
    try {
        localStorage.setItem('schedule_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存排班数据失败:', e);
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
    
    if (state.filters.shift) {
        filtered = filtered.filter(r => r.shiftId === state.filters.shift);
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
    const scheduled = state.filteredRecords.filter(r => r.status === 'scheduled').length;
    const completed = state.filteredRecords.filter(r => r.status === 'completed').length;
    const absent = state.filteredRecords.filter(r => r.status === 'absent').length;
    
    state.stats = { total, scheduled, completed, absent };
}

/**
 * @private
 * @description 渲染排班列表
 */
function render() {
    const tbody = document.getElementById('scheduleListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-calendar-alt" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无排班数据
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        scheduled: { label: '已排班', color: '#DBEAFE', textColor: '#1E40AF' },
        completed: { label: '已完成', color: '#D1FAE5', textColor: '#065F46' },
        absent: { label: '缺勤', color: '#FEE2E2', textColor: '#991B1B' }
    };

    tbody.innerHTML = pageData.map(r => {
        const status = statusMap[r.status] || statusMap.scheduled;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${r.employeeName}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.department}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(r.date)}</td>
                <td style="padding:10px 16px;font-weight:500;">${r.shiftName}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.startTime} - ${r.endTime}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.SchedulesModule.editSchedule('${r.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.SchedulesModule.viewSchedule('${r.id}')" title="查看">
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
    document.getElementById('statScheduled')?.textContent = stats.scheduled;
    document.getElementById('statCompleted')?.textContent = stats.completed;
    document.getElementById('statAbsent')?.textContent = stats.absent;
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
                <button onclick="window.SchedulesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SchedulesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @param {string} id - 排班记录ID
 */
function viewSchedule(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    const statusMap = { scheduled: '已排班', completed: '已完成', absent: '缺勤' };
    
    alert(`排班详情：
员工: ${record.employeeName}
部门: ${record.department}
日期: ${formatDate(record.date)}
班次: ${record.shiftName}
时间: ${record.startTime} - ${record.endTime}
状态: ${statusMap[record.status] || record.status}
备注: ${record.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 排班记录ID
 */
function editSchedule(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    const shiftName = prompt('班次名称：', record.shiftName) || record.shiftName;
    const startTime = prompt('开始时间 (HH:MM)：', record.startTime) || record.startTime;
    const endTime = prompt('结束时间 (HH:MM)：', record.endTime) || record.endTime;
    const statusOptions = ['1. scheduled (已排班)', '2. completed (已完成)', '3. absent (缺勤)'];
    const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, 
        record.status === 'scheduled' ? '1' : record.status === 'completed' ? '2' : '3'));
    const statuses = ['scheduled', 'completed', 'absent'];
    const status = statuses[statusIdx - 1] || record.status;
    const note = prompt('备注：', record.note || '') || '';
    
    record.shiftName = shiftName;
    record.startTime = startTime;
    record.endTime = endTime;
    record.status = status;
    record.note = note;
    record.updatedAt = new Date().toISOString();
    
    saveSchedules();
    applyFilters();
    render();
    showToast('排班已更新', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const employeeName = prompt('员工姓名：');
    if (!employeeName) return;
    const department = prompt('部门：') || '服务';
    const date = prompt('日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
    const shiftName = prompt('班次名称：', '早班') || '早班';
    const startTime = prompt('开始时间 (HH:MM)：', '08:00') || '08:00';
    const endTime = prompt('结束时间 (HH:MM)：', '16:00') || '16:00';
    const note = prompt('备注：') || '';
    
    const newRecord = {
        id: 'SCH-' + Date.now().toString().slice(-6),
        employeeId: 'EMP-' + String(Math.floor(Math.random() * 999) + 1).padStart(6, '0'),
        employeeName: employeeName.trim(),
        department: department,
        date: date || new Date().toISOString().split('T')[0],
        shiftId: 'SHIFT-' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
        shiftName: shiftName,
        startTime: startTime,
        endTime: endTime,
        status: 'scheduled',
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.records.push(newRecord);
    saveSchedules();
    applyFilters();
    render();
    showToast('排班已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.date = document.getElementById('searchDate')?.value || '';
    state.filters.department = document.getElementById('searchDepartment')?.value || '';
    state.filters.shift = document.getElementById('searchShift')?.value || '';
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
    const shiftInput = document.getElementById('searchShift');
    const empInput = document.getElementById('searchEmployee');
    
    if (dateInput) dateInput.value = '';
    if (deptInput) deptInput.value = '';
    if (shiftInput) shiftInput.value = '';
    if (empInput) empInput.value = '';
    
    state.filters = { date: '', department: '', shift: '', employee: '' };
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
    
    document.querySelectorAll('#searchDate, #searchDepartment, #searchShift, #searchEmployee').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📅 排班管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('schedule_data', JSON.stringify(state.records));
    }
    
    loadSchedules();
    bindEvents();
    render();
    
    window.SchedulesModule = {
        state,
        loadSchedules,
        render,
        renderPagination,
        updateStats,
        viewSchedule,
        editSchedule,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveSchedules,
        applyFilters
    };
    
    console.log('✅ 排班管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadSchedules,
    viewSchedule,
    editSchedule,
    goToPage,
    showCreateModal,
    saveSchedules
};