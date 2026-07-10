/**
 * @file performance.js
 * @module performance
 * @description 绩效管理 - 员工绩效考核和评估
 * 
 * @example
 * import { init } from './performance.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} PerformanceRecord
 * @property {string} id - 绩效记录ID
 * @property {string} employeeId - 员工ID
 * @property {string} employeeName - 员工姓名
 * @property {string} department - 部门
 * @property {string} period - 期间 (YYYY-MM)
 * @property {number} score - 评分 (0-100)
 * @property {string} rating - 评级 (A/B/C/D)
 * @property {string} criteria - 考核标准
 * @property {string} evaluator - 评估人
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{records: PerformanceRecord[], filteredRecords: PerformanceRecord[], filters: {period: string, department: string, rating: string, employee: string}, stats: {total: number, avgScore: number, aCount: number, bCount: number, cCount: number, dCount: number}, page: number, pageSize: number}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        period: '',
        department: '',
        rating: '',
        employee: ''
    },
    stats: {
        total: 0,
        avgScore: 0,
        aCount: 0,
        bCount: 0,
        cCount: 0,
        dCount: 0
    },
    page: 1,
    pageSize: 10
};

/**
 * 评级配置
 */
const RATING_MAP = {
    A: { label: '优秀', color: '#D1FAE5', textColor: '#065F46', scoreRange: '90-100' },
    B: { label: '良好', color: '#DBEAFE', textColor: '#1E40AF', scoreRange: '75-89' },
    C: { label: '合格', color: '#FEF3C7', textColor: '#92400E', scoreRange: '60-74' },
    D: { label: '待提升', color: '#FEE2E2', textColor: '#991B1B', scoreRange: '0-59' }
};

/**
 * @private
 * @param {number} score - 评分
 * @returns {string} 评级
 */
function getRating(score) {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    return 'D';
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
 * @returns {PerformanceRecord[]} 模拟绩效数据
 */
function getMockPerformance() {
    const employees = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
    const departments = ['管理', '服务', '销售', '技术', '服务', '管理', '销售', '技术'];
    const period = new Date().toISOString().slice(0, 7);
    const scores = [92, 78, 85, 95, 65, 88, 70, 82];
    const evaluators = ['刘总', '张经理', '李主管', '王总监', '张经理', '刘总', '李主管', '王总监'];
    const criteria = ['工作表现', '服务质量', '销售业绩', '技术水平', '服务态度', '管理能力', '销售业绩', '技术能力'];
    
    return employees.map((name, i) => {
        const score = scores[i];
        const rating = getRating(score);
        return {
            id: `PERF-${String(i + 1).padStart(6, '0')}`,
            employeeId: `EMP-${String(i + 1).padStart(6, '0')}`,
            employeeName: name,
            department: departments[i],
            period: period,
            score: score,
            rating: rating,
            criteria: criteria[i],
            evaluator: evaluators[i],
            note: score >= 90 ? '优秀员工' : score < 70 ? '需要改进' : '',
            createdAt: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
}

/**
 * @private
 * @description 加载绩效数据
 */
function loadPerformance() {
    try {
        const saved = localStorage.getItem('performance_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockPerformance();
            localStorage.setItem('performance_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载绩效数据失败:', e);
        state.records = getMockPerformance();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存绩效数据
 */
function savePerformance() {
    try {
        localStorage.setItem('performance_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存绩效数据失败:', e);
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
    
    if (state.filters.rating) {
        filtered = filtered.filter(r => r.rating === state.filters.rating);
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
    const sumScore = state.filteredRecords.reduce((sum, r) => sum + r.score, 0);
    const avgScore = total > 0 ? Math.round(sumScore / total * 10) / 10 : 0;
    const aCount = state.filteredRecords.filter(r => r.rating === 'A').length;
    const bCount = state.filteredRecords.filter(r => r.rating === 'B').length;
    const cCount = state.filteredRecords.filter(r => r.rating === 'C').length;
    const dCount = state.filteredRecords.filter(r => r.rating === 'D').length;
    
    state.stats = { total, avgScore, aCount, bCount, cCount, dCount };
}

/**
 * @private
 * @description 渲染绩效列表
 */
function render() {
    const tbody = document.getElementById('performanceListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-chart-bar" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无绩效记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const rating = RATING_MAP[r.rating] || RATING_MAP.C;
        const scoreColor = r.score >= 90 ? '#10B981' : r.score >= 75 ? '#3B82F6' : r.score >= 60 ? '#F59E0B' : '#EF4444';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:500;">${r.employeeName}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.department}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.period}</td>
                <td style="padding:10px 16px;text-align:center;font-weight:700;color:${scoreColor};">
                    ${r.score}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${rating.color};color:${rating.textColor};">
                        ${rating.label} (${r.rating})
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.criteria}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.PerformanceModule.editPerformance('${r.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.PerformanceModule.viewPerformance('${r.id}')" title="查看">
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
    document.getElementById('statAvgScore')?.textContent = stats.avgScore;
    document.getElementById('statACount')?.textContent = stats.aCount;
    document.getElementById('statBCount')?.textContent = stats.bCount;
    document.getElementById('statCCount')?.textContent = stats.cCount;
    document.getElementById('statDCount')?.textContent = stats.dCount;
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
                <button onclick="window.PerformanceModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.PerformanceModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
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
 * @param {string} id - 绩效记录ID
 */
function viewPerformance(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    const rating = RATING_MAP[record.rating] || RATING_MAP.C;
    
    alert(`绩效详情：
员工: ${record.employeeName}
部门: ${record.department}
期间: ${record.period}
评分: ${record.score}
评级: ${rating.label} (${record.rating})
考核标准: ${record.criteria}
评估人: ${record.evaluator}
备注: ${record.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 绩效记录ID
 */
function editPerformance(id) {
    const record = state.records.find(r => r.id === id);
    if (!record) {
        showToast('记录不存在', 'error');
        return;
    }
    
    const score = parseFloat(prompt('评分 (0-100)：', record.score));
    if (isNaN(score) || score < 0 || score > 100) {
        showToast('请输入0-100的有效评分', 'error');
        return;
    }
    const rating = getRating(score);
    const criteria = prompt('考核标准：', record.criteria) || record.criteria;
    const evaluator = prompt('评估人：', record.evaluator) || record.evaluator;
    const note = prompt('备注：', record.note || '') || '';
    
    record.score = score;
    record.rating = rating;
    record.criteria = criteria;
    record.evaluator = evaluator;
    record.note = note;
    record.updatedAt = new Date().toISOString();
    
    savePerformance();
    applyFilters();
    render();
    showToast('绩效记录已更新', 'success');
}

/**
 * @private
 */
function showCreateModal() {
    const employeeName = prompt('员工姓名：');
    if (!employeeName) return;
    const department = prompt('部门：') || '服务';
    const period = prompt('期间 (YYYY-MM)：', new Date().toISOString().slice(0, 7));
    const score = parseFloat(prompt('评分 (0-100)：', '80'));
    if (isNaN(score) || score < 0 || score > 100) {
        showToast('请输入0-100的有效评分', 'error');
        return;
    }
    const criteria = prompt('考核标准：') || '综合表现';
    const evaluator = prompt('评估人：') || '系统管理员';
    const note = prompt('备注：') || '';
    const rating = getRating(score);
    
    const newRecord = {
        id: 'PERF-' + Date.now().toString().slice(-6),
        employeeId: 'EMP-' + String(Math.floor(Math.random() * 999) + 1).padStart(6, '0'),
        employeeName: employeeName.trim(),
        department: department,
        period: period || new Date().toISOString().slice(0, 7),
        score: score,
        rating: rating,
        criteria: criteria,
        evaluator: evaluator,
        note: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.records.push(newRecord);
    savePerformance();
    applyFilters();
    render();
    showToast('绩效记录已创建', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.period = document.getElementById('searchPeriod')?.value || '';
    state.filters.department = document.getElementById('searchDepartment')?.value || '';
    state.filters.rating = document.getElementById('searchRating')?.value || '';
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
    const ratingInput = document.getElementById('searchRating');
    const empInput = document.getElementById('searchEmployee');
    
    if (periodInput) periodInput.value = '';
    if (deptInput) deptInput.value = '';
    if (ratingInput) ratingInput.value = '';
    if (empInput) empInput.value = '';
    
    state.filters = { period: '', department: '', rating: '', employee: '' };
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
    
    document.querySelectorAll('#searchPeriod, #searchDepartment, #searchRating, #searchEmployee').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('📊 绩效管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('performance_data', JSON.stringify(state.records));
    }
    
    loadPerformance();
    bindEvents();
    render();
    
    window.PerformanceModule = {
        state,
        loadPerformance,
        render,
        renderPagination,
        updateStats,
        viewPerformance,
        editPerformance,
        goToPage,
        showCreateModal,
        handleSearch,
        handleReset,
        savePerformance,
        applyFilters
    };
    
    console.log('✅ 绩效管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadPerformance,
    viewPerformance,
    editPerformance,
    goToPage,
    showCreateModal,
    savePerformance
};