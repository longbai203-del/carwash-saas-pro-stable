/**
 * @file finance.js
 * @module finance
 * @description 财务概览 - 财务状况总览仪表板
 * 
 * @example
 * import { init } from './finance.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} FinanceStats
 * @property {number} income - 本月收入
 * @property {number} expenses - 本月支出
 * @property {number} profit - 净利润
 * @property {number} profitRate - 利润率
 * @property {number} incomeChange - 收入变化
 * @property {number} expensesChange - 支出变化
 * @property {number} profitChange - 利润变化
 * @property {number} profitRateChange - 利润率变化
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id - 交易ID
 * @property {string} type - 类型 (income/expense)
 * @property {string} category - 分类
 * @property {string} description - 描述
 * @property {number} amount - 金额
 * @property {string} status - 状态 (completed/pending/failed)
 * @property {string} createdAt - 创建时间
 */

/**
 * @typedef {Object} FinanceState
 * @property {FinanceStats} stats - 统计数据
 * @property {Transaction[]} recentTransactions - 近期交易
 * @property {Object} trendData - 趋势数据
 * @property {Object} expenseCategories - 支出分类
 * @property {number} trendPeriod - 趋势周期
 * @property {boolean} loading - 加载状态
 */

/** @type {FinanceState} 状态 */
const state = {
    stats: {
        income: 0,
        expenses: 0,
        profit: 0,
        profitRate: 0,
        incomeChange: 0,
        expensesChange: 0,
        profitChange: 0,
        profitRateChange: 0
    },
    recentTransactions: [],
    trendData: {
        labels: [],
        income: [],
        expenses: []
    },
    expenseCategories: [
        { name: '采购', amount: 0, percentage: 0, color: '#3B82F6' },
        { name: '人力', amount: 0, percentage: 0, color: '#10B981' },
        { name: '租金', amount: 0, percentage: 0, color: '#F59E0B' },
        { name: '营销', amount: 0, percentage: 0, color: '#8B5CF6' },
        { name: '其他', amount: 0, percentage: 0, color: '#6B7280' }
    ],
    trendPeriod: 7,
    loading: false
};

/** @type {number|null} 自动刷新定时器 */
let refreshInterval = null;

/** @type {Chart|null} 图表实例 */
let trendChart = null;

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
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * @private
 * @returns {FinanceStats} 模拟统计数据
 */
function getMockStats() {
    const income = Math.floor(Math.random() * 50000) + 30000;
    const expenses = Math.floor(Math.random() * 30000) + 10000;
    const profit = income - expenses;
    const profitRate = income > 0 ? Math.round((profit / income) * 100) : 0;
    
    return {
        income: income,
        expenses: expenses,
        profit: profit,
        profitRate: profitRate,
        incomeChange: Math.round((Math.random() * 20 - 5) * 10) / 10,
        expensesChange: Math.round((Math.random() * 15 - 3) * 10) / 10,
        profitChange: Math.round((Math.random() * 25 - 8) * 10) / 10,
        profitRateChange: Math.round((Math.random() * 10 - 3) * 10) / 10
    };
}

/**
 * @private
 * @returns {Transaction[]} 模拟交易数据
 */
function getMockTransactions() {
    const descriptions = ['洗车服务收入', '会员充值', '商品销售', '工资支出', '租金支出', '采购支出', '营销费用', '设备维护'];
    const types = ['income', 'income', 'income', 'expense', 'expense', 'expense', 'expense', 'expense'];
    const categories = ['service', 'membership', 'product', 'payroll', 'rent', 'purchase', 'marketing', 'maintenance'];
    const statuses = ['completed', 'completed', 'completed', 'completed', 'pending', 'completed'];
    
    return Array.from({ length: 8 }, (_, i) => {
        const type = types[i % types.length];
        const amount = type === 'income' 
            ? Math.floor(Math.random() * 5000) + 100 
            : Math.floor(Math.random() * 3000) + 50;
        const daysAgo = Math.floor(Math.random() * 7);
        
        return {
            id: `TXN-${String(i + 1).padStart(6, '0')}`,
            type: type,
            category: categories[i % categories.length],
            description: descriptions[i % descriptions.length],
            amount: amount,
            status: statuses[i % statuses.length],
            createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * @private
 * @param {number} days - 天数
 * @returns {Object} 趋势数据
 */
function getMockTrendData(days) {
    const labels = [];
    const income = [];
    const expenses = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
        income.push(Math.floor(Math.random() * 8000) + 2000);
        expenses.push(Math.floor(Math.random() * 5000) + 1000);
    }
    
    return { labels, income, expenses };
}

/**
 * @private
 * @description 加载财务数据
 */
function loadFinanceData() {
    state.loading = true;
    
    try {
        // 从本地存储加载财务数据
        const savedStats = localStorage.getItem('finance_stats');
        if (savedStats) {
            state.stats = JSON.parse(savedStats);
        } else {
            state.stats = getMockStats();
            localStorage.setItem('finance_stats', JSON.stringify(state.stats));
        }
        
        // 加载交易数据
        const savedTransactions = localStorage.getItem('finance_transactions');
        if (savedTransactions) {
            state.recentTransactions = JSON.parse(savedTransactions).slice(0, 5);
        } else {
            const transactions = getMockTransactions();
            state.recentTransactions = transactions.slice(0, 5);
            localStorage.setItem('finance_transactions', JSON.stringify(transactions));
        }
        
        // 加载趋势数据
        state.trendData = getMockTrendData(state.trendPeriod);
        
        // 计算支出分类
        calculateExpenseCategories();
        
        state.loading = false;
        renderStats();
        renderRecentTransactions();
        renderTrendChart();
        renderExpenseCategories();
        
    } catch (error) {
        console.error('加载财务数据失败:', error);
        state.loading = false;
        showToast('加载财务数据失败', 'error');
    }
}

/**
 * @private
 * @description 计算支出分类
 */
function calculateExpenseCategories() {
    const categories = ['采购', '人力', '租金', '营销', '其他'];
    const amounts = {};
    categories.forEach(c => amounts[c] = 0);
    
    // 从交易中统计支出
    const allTransactions = JSON.parse(localStorage.getItem('finance_transactions') || '[]');
    const expenses = allTransactions.filter(t => t.type === 'expense' && t.status === 'completed');
    
    expenses.forEach(t => {
        const cat = t.category || '其他';
        const catMap = {
            'purchase': '采购',
            'payroll': '人力',
            'rent': '租金',
            'marketing': '营销',
            'maintenance': '其他',
            'other': '其他'
        };
        const name = catMap[cat] || '其他';
        if (amounts[name] !== undefined) {
            amounts[name] += t.amount || 0;
        } else {
            amounts['其他'] += t.amount || 0;
        }
    });
    
    const total = Object.values(amounts).reduce((sum, v) => sum + v, 0) || 1;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#6B7280'];
    
    state.expenseCategories = categories.map((name, index) => ({
        name: name,
        amount: amounts[name] || 0,
        percentage: Math.round((amounts[name] || 0) / total * 100),
        color: colors[index]
    }));
}

/**
 * @private
 * @description 渲染统计数据
 */
function renderStats() {
    const stats = state.stats;
    
    const elements = {
        'statIncome': '¥' + formatCurrency(stats.income),
        'statExpenses': '¥' + formatCurrency(stats.expenses),
        'statProfit': '¥' + formatCurrency(stats.profit),
        'statProfitRate': stats.profitRate + '%'
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
    
    // 渲染变化
    const changes = {
        'statIncomeChange': { value: stats.incomeChange, positive: stats.incomeChange >= 0 },
        'statExpensesChange': { value: stats.expensesChange, positive: stats.expensesChange >= 0 },
        'statProfitChange': { value: stats.profitChange, positive: stats.profitChange >= 0 },
        'statProfitRateChange': { value: stats.profitRateChange, positive: stats.profitRateChange >= 0 }
    };
    
    Object.keys(changes).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const change = changes[id];
            const sign = change.positive ? '+' : '';
            el.innerHTML = `
                <i class="fas ${change.positive ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                ${sign}${Math.abs(change.value)}%
            `;
            el.style.color = change.positive ? '#10B981' : '#EF4444';
        }
    });
}

/**
 * @private
 * @description 渲染近期交易
 */
function renderRecentTransactions() {
    const tbody = document.getElementById('recentTransactionsBody');
    if (!tbody) return;
    
    if (state.recentTransactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:32px;color:#9CA3AF;">
                    <i class="fas fa-receipt" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                    暂无交易记录
                </td>
            </tr>
        `;
        return;
    }
    
    const typeMap = {
        income: { label: '收入', color: '#10B981', bg: '#D1FAE5' },
        expense: { label: '支出', color: '#EF4444', bg: '#FEE2E2' }
    };
    
    const statusMap = {
        completed: { label: '已完成', color: '#065F46', bg: '#D1FAE5' },
        pending: { label: '处理中', color: '#92400E', bg: '#FEF3C7' },
        failed: { label: '失败', color: '#991B1B', bg: '#FEE2E2' }
    };
    
    tbody.innerHTML = state.recentTransactions.map(t => {
        const type = typeMap[t.type] || typeMap.income;
        const status = statusMap[t.status] || statusMap.completed;
        const sign = t.type === 'income' ? '+' : '-';
        const color = t.type === 'income' ? '#10B981' : '#EF4444';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;">
                <td style="padding:10px 16px;font-family:monospace;font-size:13px;">${t.id}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.bg};color:${type.color};">
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;">${t.description}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:${color};">
                    ${sign}¥${formatCurrency(t.amount)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.bg};color:${status.color};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(t.createdAt)}</td>
            </tr>
        `;
    }).join('');
}

/**
 * @private
 * @description 渲染趋势图表
 */
function renderTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    
    // 如果Chart.js可用
    if (typeof Chart !== 'undefined') {
        if (trendChart) {
            trendChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: state.trendData.labels,
                datasets: [
                    {
                        label: '收入',
                        data: state.trendData.income,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4
                    },
                    {
                        label: '支出',
                        data: state.trendData.expenses,
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '¥' + value;
                            }
                        }
                    }
                }
            }
        });
    } else {
        // 降级方案：简单柱状图
        renderSimpleTrendChart();
    }
}

/**
 * @private
 * @description 渲染简单趋势图（无Chart.js）
 */
function renderSimpleTrendChart() {
    const container = document.getElementById('trendChartContainer');
    if (!container) return;
    
    const data = state.trendData;
    const maxValue = Math.max(...data.income, ...data.expenses, 1);
    
    let html = `
        <div style="display:flex;align-items:flex-end;height:180px;gap:8px;padding:0 4px;">
    `;
    
    for (let i = 0; i < data.labels.length; i++) {
        const incomeHeight = (data.income[i] / maxValue) * 150;
        const expenseHeight = (data.expenses[i] / maxValue) * 150;
        
        html += `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
                <div style="display:flex;gap:2px;align-items:flex-end;height:150px;">
                    <div style="width:14px;height:${Math.max(incomeHeight, 4)}px;background:#10B981;border-radius:2px 2px 0 0;transition:height 0.5s;"></div>
                    <div style="width:14px;height:${Math.max(expenseHeight, 4)}px;background:#EF4444;border-radius:2px 2px 0 0;transition:height 0.5s;"></div>
                </div>
                <span style="font-size:10px;color:#6B7280;">${data.labels[i]}</span>
            </div>
        `;
    }
    
    html += `
        </div>
        <div style="display:flex;justify-content:center;gap:16px;margin-top:8px;font-size:12px;">
            <span><span style="display:inline-block;width:12px;height:12px;background:#10B981;border-radius:2px;vertical-align:middle;"></span> 收入</span>
            <span><span style="display:inline-block;width:12px;height:12px;background:#EF4444;border-radius:2px;vertical-align:middle;"></span> 支出</span>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * @private
 * @description 渲染支出分类
 */
function renderExpenseCategories() {
    state.expenseCategories.forEach((cat, index) => {
        const bar = document.getElementById(`expCatBar${index + 1}`);
        const pct = document.getElementById(`expCatPct${index + 1}`);
        if (bar) {
            bar.style.width = cat.percentage + '%';
        }
        if (pct) {
            pct.textContent = cat.percentage + '%';
        }
    });
}

/**
 * @private
 * @param {number} days - 天数
 * @description 切换趋势周期
 */
function changeTrendPeriod(days) {
    state.trendPeriod = days;
    state.trendData = getMockTrendData(days);
    renderTrendChart();
    
    // 更新按钮状态
    document.querySelectorAll('.trend-period').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.period) === days);
    });
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const refreshBtn = document.getElementById('refreshFinance');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadFinanceData();
            showToast('数据已刷新', 'success');
        });
    }
    
    const viewAllBtn = document.getElementById('viewAllReports');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            if (typeof window.router !== 'undefined') {
                window.router.navigate('/finance/reports');
            } else {
                window.location.hash = '#/finance/reports';
            }
        });
    }
    
    // 趋势周期切换
    document.querySelectorAll('.trend-period').forEach(btn => {
        btn.addEventListener('click', function() {
            const days = parseInt(this.dataset.period);
            changeTrendPeriod(days);
        });
    });
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
        console.log('🔄 自动刷新财务数据...');
        loadFinanceData();
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
 * @param {FinanceStats} options.data - 初始数据
 * @returns {Promise<void>}
 * @description 初始化财务概览
 */
export async function init(options) {
    console.log('💰 财务概览 初始化...');
    
    if (options?.data) {
        localStorage.setItem('finance_stats', JSON.stringify(options.data));
    }
    
    loadFinanceData();
    bindEvents();
    startAutoRefresh();
    
    // 暴露全局方法
    window.FinanceModule = {
        state,
        loadFinanceData,
        renderStats,
        renderRecentTransactions,
        renderTrendChart,
        renderExpenseCategories,
        changeTrendPeriod,
        stopAutoRefresh
    };
    
    console.log('✅ 财务概览 初始化完成');
}

/**
 * @public
 * @description 刷新数据
 */
export function refresh() {
    loadFinanceData();
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
    loadFinanceData,
    changeTrendPeriod
};