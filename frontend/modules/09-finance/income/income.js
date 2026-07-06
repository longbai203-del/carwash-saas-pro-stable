// modules/09-finance/income/income.js
import { getIncome, getIncomeStats } from '../../../api/finance.js';
import { formatCurrency, formatDate, showToast } from '../../../js/utils.js';

const state = {
    records: [],
    stats: { total: 0, count: 0, avg: 0 },
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { dateRange: { start: '', end: '' }, category: '' }
};

const CATEGORIES = ['服务收入', '商品销售', '会员费', '其他'];

export async function init() {
    console.log('收入管理已加载');
    await loadIncome();
    bindEvents();
}

async function loadIncome() {
    state.loading = true;
    showLoading();

    try {
        const data = await getMockIncome();
        state.records = data.list;
        state.stats = data.stats;
        state.pagination.total = data.total;
        renderTable();
        renderPagination();
        renderStats();
    } catch (error) {
        console.error('加载收入失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockIncome() {
    const categories = ['服务收入', '商品销售', '会员费', '其他'];
    const paymentMethods = ['现金', '微信', '支付宝', '银行卡'];
    
    const records = [];
    let total = 0;
    for (let i = 0; i < 30; i++) {
        const amount = Math.floor(Math.random() * 5000) + 100;
        total += amount;
        records.push({
            id: `INC-${String(i + 1).padStart(6, '0')}`,
            amount: amount,
            category: categories[i % categories.length],
            description: `${categories[i % categories.length]}-${String.fromCharCode(65 + i % 26)}`,
            paymentMethod: paymentMethods[i % paymentMethods.length],
            customerName: ['张伟', '李娜', '王强', '刘洋', '陈静'][i % 5],
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return {
        list: records.slice(0, 10),
        total: records.length,
        stats: {
            total: total,
            count: records.length,
            avg: total / records.length
        }
    };
}

function renderTable() {
    const tbody = document.getElementById('incomeTableBody');
    if (!tbody) return;

    const categoryColors = {
        '服务收入': 'blue',
        '商品销售': 'green',
        '会员费': 'purple',
        '其他': 'gray'
    };

    tbody.innerHTML = state.records.map(record => `
        <tr>
            <td class="font-mono">${record.id}</td>
            <td>
                <span class="badge badge-${categoryColors[record.category] || 'secondary'}">
                    ${record.category}
                </span>
            </td>
            <td>${record.description}</td>
            <td class="text-right font-semibold text-green-600">+¥${formatCurrency(record.amount)}</td>
            <td>${record.paymentMethod}</td>
            <td>${record.customerName || '-'}</td>
            <td class="text-sm">${formatDate(record.createdAt)}</td>
        </tr>
    `).join('');
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const { page, limit, total } = state.pagination;
    const totalPages = Math.ceil(total / limit);

    container.innerHTML = `
        <div class="flex items-center justify-between px-4 py-3">
            <div class="text-sm text-gray-500">共 ${total} 条，第 ${page}/${totalPages} 页</div>
            <div class="flex gap-1">
                <button class="px-3 py-1 border rounded ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                        onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>上一页</button>
                ${Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
                    const p = i + 1;
                    return `<button class="px-3 py-1 border rounded ${p === page ? 'bg-blue-500 text-white' : ''}" 
                            onclick="changePage(${p})">${p}</button>`;
                }).join('')}
                <button class="px-3 py-1 border rounded ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                        onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
            </div>
        </div>
    `;
}

function renderStats() {
    const container = document.getElementById('statsContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">总收入</div>
                <div class="stat-value text-green-600">¥${formatCurrency(state.stats.total)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">交易笔数</div>
                <div class="stat-value">${state.stats.count}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">平均收入</div>
                <div class="stat-value text-blue-600">¥${formatCurrency(state.stats.avg)}</div>
            </div>
        </div>
    `;
}

window.changePage = function(page) {
    if (page < 1 || page > Math.ceil(state.pagination.total / state.pagination.limit)) return;
    state.pagination.page = page;
    loadIncome();
};

function handleSearch() {
    state.pagination.page = 1;
    loadIncome();
}

function handleReset() {
    state.filters = { dateRange: { start: '', end: '' }, category: '' };
    document.getElementById('dateStart').value = '';
    document.getElementById('dateEnd').value = '';
    document.getElementById('searchCategory').value = '';
    state.pagination.page = 1;
    loadIncome();
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
}

function showLoading() {
    document.getElementById('loadingSpinner')?.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner')?.classList.add('hidden');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}