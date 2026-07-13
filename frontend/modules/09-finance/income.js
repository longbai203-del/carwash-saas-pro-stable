/**
 * @file income.js
 * @module income
 * @description 收入管理 - 收入记录、分类统计
 * 
 * @example
 * import { init } from './income.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} IncomeRecord
 * @property {string} id - 收入ID
 * @property {string} category - 分类
 * @property {string} description - 描述
 * @property {number} amount - 金额
 * @property {string} method - 支付方式
 * @property {string} customer - 客户
 * @property {string} date - 日期
 * @property {string} status - 状态 (completed/pending)
 * @property {string} createdAt - 创建时间
 */

/** @type {{records: IncomeRecord[], filteredRecords: IncomeRecord[], filters: {category: string, method: string, dateFrom: string, dateTo: string}, stats: {total: number, count: number, byCategory: Object}, page: number, pageSize: number, editingId: string|null}} 状态 */
const state = {
    records: [],
    filteredRecords: [],
    filters: {
        category: '',
        method: '',
        dateFrom: '',
        dateTo: ''
    },
    stats: {
        total: 0,
        count: 0,
        byCategory: {}
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 分类颜色映射
 */
const CATEGORY_COLORS = {
    '服务收入': '#DBEAFE',
    '商品销售': '#D1FAE5',
    '会员费': '#EDE9FE',
    '其他': '#F3F4F6'
};

const CATEGORY_TEXT_COLORS = {
    '服务收入': '#1E40AF',
    '商品销售': '#065F46',
    '会员费': '#6D28D9',
    '其他': '#4B5563'
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
 * @returns {IncomeRecord[]} 模拟收入数据
 */
function getMockIncome() {
    const categories = ['服务收入', '商品销售', '会员费', '其他'];
    const descriptions = ['洗车服务', '汽车美容', '洗车液销售', '车蜡销售', '月卡会员', '季卡会员', '轮胎养护', '空调清洗'];
    const methods = ['微信', '支付宝', '现金', '银行卡'];
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '散客'];
    const statuses = ['completed', 'completed', 'completed', 'pending'];
    
    return Array.from({ length: 12 }, (_, i) => {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        return {
            id: `INC-${String(i + 1).padStart(6, '0')}`,
            category: cat,
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            amount: Math.floor(Math.random() * 1500) + 50,
            method: methods[Math.floor(Math.random() * methods.length)],
            customer: customers[Math.floor(Math.random() * customers.length)],
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * @private
 * @description 加载收入数据
 */
function loadIncome() {
    try {
        const saved = localStorage.getItem('income_data');
        if (saved) {
            state.records = JSON.parse(saved);
        } else {
            state.records = getMockIncome();
            localStorage.setItem('income_data', JSON.stringify(state.records));
        }
    } catch (e) {
        console.warn('加载收入数据失败:', e);
        state.records = getMockIncome();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存收入数据
 */
function saveIncome() {
    try {
        localStorage.setItem('income_data', JSON.stringify(state.records));
    } catch (e) {
        console.warn('保存收入数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.records;
    
    if (state.filters.category) {
        filtered = filtered.filter(r => r.category === state.filters.category);
    }
    
    if (state.filters.method) {
        filtered = filtered.filter(r => r.method === state.filters.method);
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
    const total = state.filteredRecords.reduce((sum, r) => sum + r.amount, 0);
    const count = state.filteredRecords.length;
    const byCategory = {};
    
    state.filteredRecords.forEach(r => {
        if (!byCategory[r.category]) byCategory[r.category] = 0;
        byCategory[r.category] += r.amount;
    });
    
    state.stats = { total, count, byCategory };
}

/**
 * @private
 * @description 渲染收入列表
 */
function render() {
    const tbody = document.getElementById('incomeTableBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredRecords.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-coins" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无收入记录
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(r => {
        const bgColor = CATEGORY_COLORS[r.category] || '#F3F4F6';
        const textColor = CATEGORY_TEXT_COLORS[r.category] || '#4B5563';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-family:monospace;font-size:13px;">${r.id}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${bgColor};color:${textColor};">
                        ${r.category}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${r.description}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#10B981;">
                    +¥${formatCurrency(r.amount)}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${r.method}</td>
                <td style="padding:10px 16px;font-size:13px;">${r.customer}</td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(r.date)}</td>
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
    const total = state.filteredRecords.length;
    const totalAmount = state.filteredRecords.reduce((sum, r) => sum + r.amount, 0);
    
    const elements = {
        'statTotalAmount': '¥' + formatCurrency(totalAmount),
        'statTotalCount': total,
        'statCompleted': state.filteredRecords.filter(r => r.status === 'completed').length,
        'statPending': state.filteredRecords.filter(r => r.status === 'pending').length
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
                共 ${total} 条收入
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
    `;
    
    html += `
        <button onclick="window.IncomeModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.IncomeModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.IncomeModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.IncomeModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.IncomeModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    html += `
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
 */
function handleSearch() {
    state.filters.category = document.getElementById('searchCategory')?.value || '';
    state.filters.method = document.getElementById('searchMethod')?.value || '';
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
    const categoryInput = document.getElementById('searchCategory');
    const methodInput = document.getElementById('searchMethod');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (categoryInput) categoryInput.value = '';
    if (methodInput) methodInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    state.filters = { category: '', method: '', dateFrom: '', dateTo: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function showCreateModal() {
    const category = prompt('分类 (服务收入/商品销售/会员费/其他)：', '服务收入');
    if (!category) return;
    const description = prompt('描述：');
    if (!description) return;
    const amount = parseFloat(prompt('金额：', '100'));
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效金额', 'error');
        return;
    }
    const method = prompt('支付方式 (微信/支付宝/现金/银行卡)：', '微信') || '微信';
    const customer = prompt('客户：', '散客') || '散客';
    
    const newRecord = {
        id: 'INC-' + Date.now().toString().slice(-6),
        category: category.trim(),
        description: description.trim(),
        amount: amount,
        method: method.trim(),
        customer: customer.trim(),
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        createdAt: new Date().toISOString()
    };
    
    state.records.push(newRecord);
    saveIncome();
    applyFilters();
    render();
    showToast('收入已创建', 'success');
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
    
    document.querySelectorAll('#searchCategory, #searchMethod, #dateFrom, #dateTo').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('💰 收入管理 初始化...');
    
    if (options?.data) {
        state.records = options.data;
        localStorage.setItem('income_data', JSON.stringify(state.records));
    }
    
    loadIncome();
    bindEvents();
    render();
    
    window.IncomeModule = {
        state,
        loadIncome,
        render,
        renderPagination,
        updateStats,
        goToPage,
        handleSearch,
        handleReset,
        showCreateModal,
        saveIncome,
        applyFilters
    };
    
    console.log('✅ 收入管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadIncome,
    goToPage,
    showCreateModal,
    saveIncome
};