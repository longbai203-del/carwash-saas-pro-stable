/**
 * @file hr.js
 * @module hr
 * @description 人力资源概览 - 员工数据总览仪表板
 * 
 * @example
 * import { init } from './hr.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} HRStats
 * @property {number} total - 总员工数
 * @property {number} active - 在职员工数
 * @property {number} attendanceRate - 出勤率
 * @property {number} monthlyPayroll - 本月薪资
 * @property {number} departments - 部门数
 */

/**
 * @typedef {Object} AttendanceRecord
 * @property {string} name - 员工姓名
 * @property {string} department - 部门
 * @property {string} checkIn - 打卡时间
 * @property {string} status - 状态 (present/absent/late/leave)
 */

/**
 * @typedef {Object} HRState
 * @property {HRStats} stats - 统计数据
 * @property {AttendanceRecord[]} todayAttendance - 今日考勤
 * @property {Object} deptDistribution - 部门分布
 * @property {number[]} trendData - 出勤趋势
 * @property {boolean} loading - 加载状态
 */

/** @type {HRState} 状态 */
const state = {
    stats: {
        total: 0,
        active: 0,
        attendanceRate: 0,
        monthlyPayroll: 0,
        departments: 0
    },
    todayAttendance: [],
    deptDistribution: {
        '管理': { count: 0, percentage: 0, color: '#3B82F6' },
        '服务': { count: 0, percentage: 0, color: '#10B981' },
        '销售': { count: 0, percentage: 0, color: '#F59E0B' },
        '技术': { count: 0, percentage: 0, color: '#8B5CF6' },
        '其他': { count: 0, percentage: 0, color: '#6B7280' }
    },
    trendData: [0, 0, 0, 0, 0, 0, 0],
    loading: false
};

/** @type {number|null} 自动刷新定时器 */
let refreshInterval = null;

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
 * @returns {string} 格式化后的时间
 */
function formatTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * @private
 * @description 加载HR数据
 */
function loadHRData() {
    state.loading = true;
    
    try {
        // 从本地存储加载员工数据
        const employees = JSON.parse(localStorage.getItem('employee_data') || '[]');
        const attendance = JSON.parse(localStorage.getItem('attendance_data') || '[]');
        
        // 计算统计数据
        const total = employees.length;
        const active = employees.filter(e => e.status === 'active').length;
        const attendanceRate = total > 0 ? Math.round((active / total) * 100) : 0;
        const monthlyPayroll = employees
            .filter(e => e.status === 'active')
            .reduce((sum, e) => sum + (e.salary || 0), 0);
        
        // 计算部门分布
        const deptCount = {};
        employees.forEach(e => {
            const dept = e.department || '其他';
            deptCount[dept] = (deptCount[dept] || 0) + 1;
        });
        
        const deptNames = Object.keys(deptCount);
        deptNames.forEach(name => {
            if (state.deptDistribution[name]) {
                state.deptDistribution[name].count = deptCount[name];
                state.deptDistribution[name].percentage = Math.round((deptCount[name] / total) * 100);
            }
        });
        
        state.stats = {
            total,
            active,
            attendanceRate,
            monthlyPayroll,
            departments: deptNames.length
        };
        
        // 获取今日考勤
        const today = new Date().toISOString().split('T')[0];
        state.todayAttendance = attendance
            .filter(a => a.date === today)
            .slice(0, 5);
        
        // 生成趋势数据
        generateTrendData(attendance);
        
        state.loading = false;
        renderStats();
        renderAttendance();
        renderTrendChart();
        renderDeptDistribution();
        
    } catch (error) {
        console.error('加载HR数据失败:', error);
        state.loading = false;
        // 使用模拟数据
        loadMockData();
    }
}

/**
 * @private
 * @description 加载模拟数据
 */
function loadMockData() {
    const mockEmployees = [
        { id: 'EMP-001', name: '张伟', department: '管理', status: 'active', salary: 8000 },
        { id: 'EMP-002', name: '李娜', department: '服务', status: 'active', salary: 6000 },
        { id: 'EMP-003', name: '王强', department: '销售', status: 'active', salary: 7000 },
        { id: 'EMP-004', name: '刘洋', department: '技术', status: 'active', salary: 9000 },
        { id: 'EMP-005', name: '陈静', department: '服务', status: 'active', salary: 5500 },
        { id: 'EMP-006', name: '赵明', department: '管理', status: 'inactive', salary: 0 },
        { id: 'EMP-007', name: '孙丽', department: '服务', status: 'active', salary: 5000 },
        { id: 'EMP-008', name: '周涛', department: '销售', status: 'active', salary: 6500 }
    ];
    localStorage.setItem('employee_data', JSON.stringify(mockEmployees));
    
    const mockAttendance = [
        { name: '张伟', department: '管理', checkIn: '08:55', status: 'present', date: new Date().toISOString().split('T')[0] },
        { name: '李娜', department: '服务', checkIn: '09:10', status: 'late', date: new Date().toISOString().split('T')[0] },
        { name: '王强', department: '销售', checkIn: '08:50', status: 'present', date: new Date().toISOString().split('T')[0] },
        { name: '刘洋', department: '技术', checkIn: '08:45', status: 'present', date: new Date().toISOString().split('T')[0] },
        { name: '陈静', department: '服务', checkIn: '09:30', status: 'absent', date: new Date().toISOString().split('T')[0] }
    ];
    localStorage.setItem('attendance_data', JSON.stringify(mockAttendance));
    
    loadHRData();
}

/**
 * @private
 * @description 生成趋势数据
 */
function generateTrendData(attendance) {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const now = new Date();
    
    state.trendData = days.map((_, index) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - index));
        const dateStr = date.toISOString().split('T')[0];
        const dayAttendance = attendance.filter(a => a.date === dateStr);
        const present = dayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
        return Math.round((present / (dayAttendance.length || 1)) * 100);
    });
}

/**
 * @private
 * @description 渲染统计数据
 */
function renderStats() {
    const stats = state.stats;
    
    document.getElementById('statTotal')?.textContent = stats.total;
    document.getElementById('statActive')?.textContent = stats.active;
    document.getElementById('statAttendance')?.textContent = stats.attendanceRate + '%';
    document.getElementById('statPayroll')?.textContent = '¥' + formatCurrency(stats.monthlyPayroll);
    document.getElementById('statDepartments')?.textContent = stats.departments;
}

/**
 * @private
 * @description 渲染今日考勤
 */
function renderAttendance() {
    const tbody = document.getElementById('todayAttendanceBody');
    if (!tbody) return;
    
    if (state.todayAttendance.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;padding:32px;color:#9CA3AF;">
                    今日暂无考勤记录
                </td>
            </tr>
        `;
        return;
    }
    
    const statusMap = {
        present: { label: '✅ 正常', color: '#D1FAE5', textColor: '#065F46' },
        late: { label: '⚠️ 迟到', color: '#FEF3C7', textColor: '#92400E' },
        absent: { label: '❌ 缺勤', color: '#FEE2E2', textColor: '#991B1B' },
        leave: { label: '📋 请假', color: '#DBEAFE', textColor: '#1E40AF' }
    };
    
    tbody.innerHTML = state.todayAttendance.map(a => {
        const status = statusMap[a.status] || statusMap.absent;
        return `
            <tr style="border-bottom:1px solid #F3F4F6;">
                <td style="padding:10px 16px;font-weight:500;">${a.name}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${a.department}</td>
                <td style="padding:10px 16px;text-align:center;font-size:13px;">${a.checkIn || '-'}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * @private
 * @description 渲染趋势图表
 */
function renderTrendChart() {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const maxValue = Math.max(...state.trendData, 1);
    
    for (let i = 0; i < 7; i++) {
        const bar = document.getElementById(`attBar${i + 1}`);
        if (bar) {
            const height = (state.trendData[i] / 100) * 150;
            bar.style.height = Math.max(height, 4) + 'px';
            bar.title = `${days[i]}: ${state.trendData[i]}%`;
        }
    }
}

/**
 * @private
 * @description 渲染部门分布
 */
function renderDeptDistribution() {
    const deptNames = Object.keys(state.deptDistribution);
    deptNames.forEach((name, index) => {
        const bar = document.getElementById(`deptBar${index + 1}`);
        const pct = document.getElementById(`deptPct${index + 1}`);
        const dept = state.deptDistribution[name];
        if (bar) {
            bar.style.width = dept.percentage + '%';
        }
        if (pct) {
            pct.textContent = dept.percentage + '%';
        }
    });
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const refreshBtn = document.getElementById('refreshHR');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadHRData();
            showToast('数据已刷新', 'success');
        });
    }
    
    const viewAllBtn = document.getElementById('viewAllEmployees');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            if (typeof window.router !== 'undefined') {
                window.router.navigate('/hr/employees');
            } else {
                window.location.hash = '#/hr/employees';
            }
        });
    }
}

/**
 * @private
 * @description 启动自动刷新
 */
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(() => {
        console.log('🔄 自动刷新HR数据...');
        loadHRData();
    }, 60000);
}

/**
 * @private
 * @description 停止自动刷新
 */
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('👤 人力资源概览 初始化...');
    
    if (options?.data) {
        localStorage.setItem('employee_data', JSON.stringify(options.data.employees || []));
        localStorage.setItem('attendance_data', JSON.stringify(options.data.attendance || []));
    }
    
    loadHRData();
    bindEvents();
    startAutoRefresh();
    
    window.HRModule = {
        state,
        loadHRData,
        renderStats,
        renderAttendance,
        renderTrendChart,
        renderDeptDistribution,
        stopAutoRefresh
    };
    
    console.log('✅ 人力资源概览 初始化完成');
}

/**
 * @public
 * @description 刷新数据
 */
export function refresh() {
    loadHRData();
}

/**
 * @public
 * @description 停止自动刷新
 */
export function stopRefresh() {
    stopAutoRefresh();
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    refresh,
    stopRefresh,
    loadHRData
};