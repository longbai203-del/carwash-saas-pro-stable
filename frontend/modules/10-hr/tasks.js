/**
 * @file tasks.js
 * @module tasks
 * @description 任务管理 - 员工任务分配和跟踪
 * 
 * @example
 * import { init } from './tasks.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Task
 * @property {string} id - 任务ID
 * @property {string} title - 任务标题
 * @property {string} description - 任务描述
 * @property {string} assigneeId - 负责人ID
 * @property {string} assigneeName - 负责人姓名
 * @property {string} department - 部门
 * @property {string} priority - 优先级 (high/medium/low)
 * @property {string} status - 状态 (pending/in_progress/completed/cancelled)
 * @property {string} dueDate - 截止日期
 * @property {string} completedAt - 完成时间
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{tasks: Task[], filteredTasks: Task[], filters: {status: string, priority: string, assignee: string, department: string}, stats: {total: number, pending: number, inProgress: number, completed: number, cancelled: number}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    tasks: [],
    filteredTasks: [],
    filters: {
        status: '',
        priority: '',
        assignee: '',
        department: ''
    },
    stats: {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 优先级配置
 */
const PRIORITY_MAP = {
    high: { label: '高', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-arrow-up' },
    medium: { label: '中', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-minus' },
    low: { label: '低', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-arrow-down' }
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    pending: { label: '待处理', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    in_progress: { label: '进行中', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-spinner' },
    completed: { label: '已完成', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-check-circle' },
    cancelled: { label: '已取消', color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-times-circle' }
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
 * @returns {Task[]} 模拟任务数据
 */
function getMockTasks() {
    const titles = ['完成月度报表', '客户回访', '设备维护', '培训新员工', '库存盘点', '制定营销计划', '服务质量检查', '财务对账'];
    const assignees = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明'];
    const departments = ['管理', '服务', '销售', '技术', '服务', '管理'];
    const priorities = ['high', 'medium', 'low', 'high', 'medium', 'low', 'high', 'medium'];
    const statuses = ['pending', 'in_progress', 'completed', 'pending', 'in_progress', 'completed', 'cancelled', 'pending'];
    
    return titles.map((title, i) => {
        const dueDate = new Date(Date.now() + (i + 1) * 3 * 24 * 60 * 60 * 1000);
        return {
            id: `TASK-${String(i + 1).padStart(6, '0')}`,
            title: title,
            description: `${title} - 详细任务描述`,
            assigneeId: `EMP-${String(i % 6 + 1).padStart(6, '0')}`,
            assigneeName: assignees[i % 6],
            department: departments[i % 6],
            priority: priorities[i % priorities.length],
            status: statuses[i % statuses.length],
            dueDate: dueDate.toISOString().split('T')[0],
            completedAt: statuses[i % statuses.length] === 'completed' 
                ? new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString()
                : null,
            note: '',
            createdAt: new Date(Date.now() - (10 + i * 2) * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载任务数据
 */
function loadTasks() {
    try {
        const saved = localStorage.getItem('task_data');
        if (saved) {
            state.tasks = JSON.parse(saved);
        } else {
            state.tasks = getMockTasks();
            localStorage.setItem('task_data', JSON.stringify(state.tasks));
        }
    } catch (e) {
        console.warn('加载任务数据失败:', e);
        state.tasks = getMockTasks();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存任务数据
 */
function saveTasks() {
    try {
        localStorage.setItem('task_data', JSON.stringify(state.tasks));
    } catch (e) {
        console.warn('保存任务数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.tasks;
    
    if (state.filters.status) {
        filtered = filtered.filter(t => t.status === state.filters.status);
    }
    
    if (state.filters.priority) {
        filtered = filtered.filter(t => t.priority === state.filters.priority);
    }
    
    if (state.filters.assignee) {
        const assignee = state.filters.assignee.toLowerCase();
        filtered = filtered.filter(t => t.assigneeName.toLowerCase().includes(assignee));
    }
    
    if (state.filters.department) {
        filtered = filtered.filter(t => t.department === state.filters.department);
    }
    
    state.filteredTasks = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const total = state.filteredTasks.length;
    const pending = state.filteredTasks.filter(t => t.status === 'pending').length;
    const inProgress = state.filteredTasks.filter(t => t.status === 'in_progress').length;
    const completed = state.filteredTasks.filter(t => t.status === 'completed').length;
    const cancelled = state.filteredTasks.filter(t => t.status === 'cancelled').length;
    
    state.stats = { total, pending, inProgress, completed, cancelled };
}

/**
 * @private
 * @description 渲染任务列表
 */
function render() {
    const tbody = document.getElementById('taskListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredTasks.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-tasks" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无任务数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(t => {
        const priority = PRIORITY_MAP[t.priority] || PRIORITY_MAP.medium;
        const status = STATUS_MAP[t.status] || STATUS_MAP.pending;
        const isOverdue = t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueDate) < new Date();
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${t.title}</div>
                    <div style="font-size:12px;color:#6B7280;">${t.description || ''}</div>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${t.assigneeName}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${t.department}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${priority.color};color:${priority.textColor};">
                        <i class="fas ${priority.icon}" style="margin-right:4px;"></i>
                        ${priority.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:${isOverdue ? '#EF4444' : '#6B7280'};">
                    ${formatDate(t.dueDate)}
                    ${isOverdue ? ' ⚠️' : ''}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${t.status === 'pending' ? `
                            <button class="btn btn-sm btn-primary" onclick="window.TasksModule.updateTaskStatus('${t.id}', 'in_progress')" title="开始">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : ''}
                        ${t.status === 'in_progress' ? `
                            <button class="btn btn-sm btn-success" onclick="window.TasksModule.updateTaskStatus('${t.id}', 'completed')" title="完成">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${t.status === 'pending' || t.status === 'in_progress' ? `
                            <button class="btn btn-sm btn-danger" onclick="window.TasksModule.updateTaskStatus('${t.id}', 'cancelled')" title="取消">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.TasksModule.editTask('${t.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.TasksModule.viewTask('${t.id}')" title="查看">
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
    document.getElementById('statInProgress')?.textContent = stats.inProgress;
    document.getElementById('statCompleted')?.textContent = stats.completed;
    document.getElementById('statCancelled')?.textContent = stats.cancelled;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredTasks.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条任务
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.TasksModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.TasksModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
    const totalPages = Math.ceil(state.filteredTasks.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 任务ID
 */
function viewTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) {
        showToast('任务不存在', 'error');
        return;
    }
    
    const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium;
    const status = STATUS_MAP[task.status] || STATUS_MAP.pending;
    
    alert(`任务详情：
标题: ${task.title}
描述: ${task.description || '无'}
负责人: ${task.assigneeName}
部门: ${task.department}
优先级: ${priority.label}
状态: ${status.label}
截止日期: ${formatDate(task.dueDate)}
${task.completedAt ? '完成时间: ' + formatDateTime(task.completedAt) : ''}
备注: ${task.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 任务ID
 */
function editTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) {
        showToast('任务不存在', 'error');
        return;
    }
    
    const title = prompt('任务标题：', task.title);
    if (title === null) return;
    const description = prompt('任务描述：', task.description || '') || '';
    const assigneeName = prompt('负责人：', task.assigneeName) || task.assigneeName;
    const priorityOptions = ['1. high (高)', '2. medium (中)', '3. low (低)'];
    const priorityIdx = parseInt(prompt(`选择优先级：\n${priorityOptions.join('\n')}`, 
        task.priority === 'high' ? '1' : task.priority === 'medium' ? '2' : '3'));
    const priorities = ['high', 'medium', 'low'];
    const priority = priorities[priorityIdx - 1] || task.priority;
    const dueDate = prompt('截止日期 (YYYY-MM-DD)：', task.dueDate) || task.dueDate;
    const note = prompt('备注：', task.note || '') || '';
    
    task.title = title.trim() || task.title;
    task.description = description;
    task.assigneeName = assigneeName;
    task.priority = priority;
    task.dueDate = dueDate;
    task.note = note;
    task.updatedAt = new Date().toISOString();
    
    saveTasks();
    applyFilters();
    render();
    showToast('任务已更新', 'success');
}

/**
 * @private
 * @param {string} id - 任务ID
 * @param {string} status - 新状态
 */
function updateTaskStatus(id, status) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) {
        showToast('任务不存在', 'error');
        return;
    }
    
    const statusLabels = { pending: '待处理', in_progress: '进行中', completed: '已完成', cancelled: '已取消' };
    
    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (status === 'completed') {
        task.completedAt = new Date().toISOString();
    }
    
    saveTasks();
    applyFilters();
    render();
    showToast(`任务状态已更新为: ${statusLabels[status]}`, 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const title = prompt('任务标题：');
    if (!title) return;
    const description = prompt('任务描述：') || '';
    const assigneeName = prompt('负责人：') || '未分配';
    const department = prompt('部门：') || '服务';
    const priorityOptions = ['1. high (高)', '2. medium (中)', '3. low (低)'];
    const priorityIdx = parseInt(prompt(`选择优先级：\n${priorityOptions.join('\n')}`, '2'));
    const priorities = ['high', 'medium', 'low'];
    const priority = priorities[priorityIdx - 1] || 'medium';
    const dueDate = prompt('截止日期 (YYYY-MM-DD)：', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const note = prompt('备注：') || '';
    
    const newTask = {
        id: 'TASK-' + Date.now().toString().slice(-6),
        title: title.trim(),
        description: description,
        assigneeId: 'EMP-' + String(Math.floor(Math.random() * 999) + 1).padStart(6, '0'),
        assigneeName: assigneeName,
        department: department,
        priority: priority,
        status: 'pending',
        dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completedAt: null,
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.tasks.push(newTask);
    saveTasks();
    applyFilters();
    render();
    showToast('任务已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.priority = document.getElementById('searchPriority')?.value || '';
    state.filters.assignee = document.getElementById('searchAssignee')?.value || '';
    state.filters.department = document.getElementById('searchDepartment')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const statusInput = document.getElementById('searchStatus');
    const priorityInput = document.getElementById('searchPriority');
    const assigneeInput = document.getElementById('searchAssignee');
    const deptInput = document.getElementById('searchDepartment');
    
    if (statusInput) statusInput.value = '';
    if (priorityInput) priorityInput.value = '';
    if (assigneeInput) assigneeInput.value = '';
    if (deptInput) deptInput.value = '';
    
    state.filters = { status: '', priority: '', assignee: '', department: '' };
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
    
    document.querySelectorAll('#searchStatus, #searchPriority, #searchAssignee, #searchDepartment').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📋 任务管理 初始化...');
    
    if (options?.data) {
        state.tasks = options.data;
        localStorage.setItem('task_data', JSON.stringify(state.tasks));
    }
    
    loadTasks();
    bindEvents();
    render();
    
    window.TasksModule = {
        state,
        loadTasks,
        render,
        renderPagination,
        updateStats,
        viewTask,
        editTask,
        updateTaskStatus,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        saveTasks,
        applyFilters
    };
    
    console.log('✅ 任务管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadTasks,
    viewTask,
    editTask,
    updateTaskStatus,
    goToPage,
    showCreateModal,
    saveTasks
};