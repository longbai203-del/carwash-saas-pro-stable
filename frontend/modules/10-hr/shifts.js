/**
 * @file shifts.js
 * @module shifts
 * @description 班次管理 - 工作班次的CRUD操作
 * 
 * @example
 * import { init } from './shifts.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Shift
 * @property {string} id - 班次ID
 * @property {string} name - 班次名称
 * @property {string} startTime - 开始时间
 * @property {string} endTime - 结束时间
 * @property {number} duration - 时长(小时)
 * @property {string} color - 颜色
 * @property {string} status - 状态 (active/inactive)
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{shifts: Shift[], filteredShifts: Shift[], filters: {name: string, status: string}, stats: {total: number, active: number, inactive: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    shifts: [],
    filteredShifts: [],
    filters: {
        name: '',
        status: ''
    },
    stats: {
        total: 0,
        active: 0,
        inactive: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

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
 * @param {string} time1 - 开始时间
 * @param {string} time2 - 结束时间
 * @returns {number} 时长(小时)
 */
function calculateDuration(time1, time2) {
    if (!time1 || !time2) return 0;
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 1440;
    return Math.round(diff / 60 * 10) / 10;
}

/**
 * @private
 * @returns {Shift[]} 模拟班次数据
 */
function getMockShifts() {
    return [
        { id: 'SHIFT-001', name: '早班', startTime: '08:00', endTime: '16:00', duration: 8, color: '#3B82F6', status: 'active', note: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'SHIFT-002', name: '中班', startTime: '10:00', endTime: '18:00', duration: 8, color: '#10B981', status: 'active', note: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'SHIFT-003', name: '晚班', startTime: '14:00', endTime: '22:00', duration: 8, color: '#F59E0B', status: 'active', note: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'SHIFT-004', name: '夜班', startTime: '22:00', endTime: '06:00', duration: 8, color: '#8B5CF6', status: 'inactive', note: '暂未启用', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'SHIFT-005', name: '周末班', startTime: '09:00', endTime: '18:00', duration: 9, color: '#EF4444', status: 'active', note: '周末值班', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
}

/**
 * @private
 * @description 加载班次数据
 */
function loadShifts() {
    try {
        const saved = localStorage.getItem('shift_data');
        if (saved) {
            state.shifts = JSON.parse(saved);
        } else {
            state.shifts = getMockShifts();
            localStorage.setItem('shift_data', JSON.stringify(state.shifts));
        }
    } catch (e) {
        console.warn('加载班次数据失败:', e);
        state.shifts = getMockShifts();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存班次数据
 */
function saveShifts() {
    try {
        localStorage.setItem('shift_data', JSON.stringify(state.shifts));
    } catch (e) {
        console.warn('保存班次数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.shifts;
    
    if (state.filters.name) {
        const name = state.filters.name.toLowerCase();
        filtered = filtered.filter(s => s.name.toLowerCase().includes(name));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(s => s.status === state.filters.status);
    }
    
    state.filteredShifts = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.shifts.length;
    const active = state.shifts.filter(s => s.status === 'active').length;
    const inactive = state.shifts.filter(s => s.status === 'inactive').length;
    
    state.stats = { total, active, inactive };
}

/**
 * @private
 * @description 渲染班次列表
 */
function render() {
    const tbody = document.getElementById('shiftListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredShifts.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-clock" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无班次数据
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        active: { label: '启用', color: '#D1FAE5', textColor: '#065F46' },
        inactive: { label: '停用', color: '#FEE2E2', textColor: '#991B1B' }
    };

    tbody.innerHTML = pageData.map(s => {
        const status = statusMap[s.status] || statusMap.inactive;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:16px;height:16px;border-radius:50%;background:${s.color};"></div>
                        <span style="font-weight:500;">${s.name}</span>
                    </div>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatTime(s.startTime)}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatTime(s.endTime)}</td>
                <td style="padding:10px 16px;text-align:center;font-weight:600;">${s.duration}小时</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.ShiftsModule.editShift('${s.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.ShiftsModule.viewShift('${s.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.ShiftsModule.deleteShift('${s.id}')" title="删除">
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
    document.getElementById('statInactive')?.textContent = stats.inactive;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredShifts.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 个班次
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 个，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.ShiftsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.ShiftsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredShifts.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 班次ID
 */
function viewShift(id) {
    const shift = state.shifts.find(s => s.id === id);
    if (!shift) {
        showToast('班次不存在', 'error');
        return;
    }
    
    const statusMap = { active: '启用', inactive: '停用' };
    
    alert(`班次详情：
名称: ${shift.name}
开始时间: ${formatTime(shift.startTime)}
结束时间: ${formatTime(shift.endTime)}
时长: ${shift.duration}小时
颜色: ${shift.color}
状态: ${statusMap[shift.status] || shift.status}
备注: ${shift.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 班次ID
 */
function editShift(id) {
    const shift = state.shifts.find(s => s.id === id);
    if (!shift) {
        showToast('班次不存在', 'error');
        return;
    }
    
    const name = prompt('班次名称：', shift.name);
    if (name === null) return;
    const startTime = prompt('开始时间 (HH:MM)：', shift.startTime);
    if (startTime === null) return;
    const endTime = prompt('结束时间 (HH:MM)：', shift.endTime);
    if (endTime === null) return;
    const color = prompt('颜色代码：', shift.color) || shift.color;
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"停用');
    const note = prompt('备注：', shift.note || '') || '';
    
    shift.name = name.trim() || shift.name;
    shift.startTime = startTime.trim() || shift.startTime;
    shift.endTime = endTime.trim() || shift.endTime;
    shift.duration = calculateDuration(shift.startTime, shift.endTime);
    shift.color = color;
    shift.status = status ? 'active' : 'inactive';
    shift.note = note;
    shift.updatedAt = new Date().toISOString();
    
    saveShifts();
    applyFilters();
    render();
    showToast('班次已更新', 'success');
}

/**
 * @private
 * @param {string} id - 班次ID
 */
function deleteShift(id) {
    const shift = state.shifts.find(s => s.id === id);
    if (!shift) {
        showToast('班次不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除班次 "${shift.name}"？`)) return;
    
    state.shifts = state.shifts.filter(s => s.id !== id);
    saveShifts();
    applyFilters();
    render();
    showToast('班次已删除', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const name = prompt('班次名称：');
    if (!name) return;
    const startTime = prompt('开始时间 (HH:MM)：', '08:00');
    if (!startTime) return;
    const endTime = prompt('结束时间 (HH:MM)：', '16:00');
    if (!endTime) return;
    const color = prompt('颜色代码：', '#3B82F6') || '#3B82F6';
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"停用');
    const note = prompt('备注：') || '';
    
    const duration = calculateDuration(startTime, endTime);
    
    const newShift = {
        id: 'SHIFT-' + Date.now().toString().slice(-6),
        name: name.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        duration: duration,
        color: color,
        status: status ? 'active' : 'inactive',
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.shifts.push(newShift);
    saveShifts();
    applyFilters();
    render();
    showToast('班次已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
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
    const statusInput = document.getElementById('searchStatus');
    
    if (nameInput) nameInput.value = '';
    if (statusInput) statusInput.value = '';
    
    state.filters = { name: '', status: '' };
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
    
    document.querySelectorAll('#searchName, #searchStatus').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('⏰ 班次管理 初始化...');
    
    if (options?.data) {
        state.shifts = options.data;
        localStorage.setItem('shift_data', JSON.stringify(state.shifts));
    }
    
    loadShifts();
    bindEvents();
    render();
    
    window.ShiftsModule = {
        state,
        loadShifts,
        render,
        renderPagination,
        updateStats,
        viewShift,
        editShift,
        deleteShift,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveShifts,
        applyFilters
    };
    
    console.log('✅ 班次管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadShifts,
    viewShift,
    editShift,
    deleteShift,
    goToPage,
    showCreateModal,
    saveShifts
};