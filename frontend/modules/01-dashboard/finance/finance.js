/**
 * modules/01-dashboard/finance/finance.js - 财务概览
 * @module finance
 * @description 财务状况总览
 */

// ============================================================
// 1. 数据
// ============================================================

const FINANCE_DATA = {
    stats: {
        income: 245800,
        expenses: 178200,
        profit: 67600,
        profitRate: 27.5
    }
};

// ============================================================
// 2. 工具函数
// ============================================================

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0';
    return Number(amount).toLocaleString('zh-CN');
}

function showToast(message, type) {
    var toast = document.createElement('div');
    var colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        padding: 12px 24px;
        background: ${colors[type] || '#4F46E5'};
        color: white;
        border-radius: 8px;
        z-index: 99999;
        font-size: 14px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
}

// ============================================================
// 3. 渲染函数
// ============================================================

function renderStats() {
    var stats = FINANCE_DATA.stats;
    
    var cards = document.querySelectorAll('.finance-card');
    var values = cards.length > 0 ? cards.querySelectorAll('.value') : [];
    
    if (values.length >= 4) {
        values[0].textContent = '¥' + formatCurrency(stats.income);
        values[1].textContent = '¥' + formatCurrency(stats.expenses);
        values[2].textContent = '¥' + formatCurrency(stats.profit);
        values[3].textContent = stats.profitRate + '%';
        
        // 添加颜色类
        if (values[0]) values[0].classList.add('positive');
        if (values[1]) values[1].classList.add('negative');
        if (values[2]) values[2].classList.add('positive');
        if (values[3]) values[3].classList.add('positive');
    } else {
        // 备用：通过ID查找
        var idMap = {
            'finIncome': '¥' + formatCurrency(stats.income),
            'finExpenses': '¥' + formatCurrency(stats.expenses),
            'finProfit': '¥' + formatCurrency(stats.profit),
            'finProfitRate': stats.profitRate + '%'
        };
        Object.keys(idMap).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.textContent = idMap[id];
                if (id === 'finIncome' || id === 'finProfit') {
                    el.classList.add('positive');
                } else if (id === 'finExpenses') {
                    el.classList.add('negative');
                }
            }
        });
        
        // 再尝试通过卡片内部的元素查找
        var allCards = document.querySelectorAll('.finance-card, .stat-card, .card');
        allCards.forEach(function(card, index) {
            var valEl = card.querySelector('.value, .stat-value, .number');
            if (valEl) {
                var keys = ['income', 'expenses', 'profit', 'profitRate'];
                if (index < keys.length) {
                    var key = keys[index];
                    if (key === 'income') {
                        valEl.textContent = '¥' + formatCurrency(stats.income);
                        valEl.classList.add('positive');
                    } else if (key === 'expenses') {
                        valEl.textContent = '¥' + formatCurrency(stats.expenses);
                        valEl.classList.add('negative');
                    } else if (key === 'profit') {
                        valEl.textContent = '¥' + formatCurrency(stats.profit);
                        valEl.classList.add('positive');
                    } else if (key === 'profitRate') {
                        valEl.textContent = stats.profitRate + '%';
                        valEl.classList.add('positive');
                    }
                }
            }
        });
    }
}

// ============================================================
// 4. 核心功能
// ============================================================

export function init() {
    console.log('💰 Finance Dashboard 初始化...');

    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    setTimeout(function() {
        renderStats();
    }, 100);

    var refreshBtn = document.querySelector('.page-header .btn-secondary, #refreshFinanceBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            var icon = this.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                setTimeout(function() {
                    icon.classList.remove('fa-spin');
                    showToast('财务数据已刷新', 'success');
                }, 1000);
            }
            renderStats();
        });
    }

    console.log('✅ Finance Dashboard 初始化完成');
}

// ============================================================
// 5. 自动初始化
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(init, 200);
    });
} else {
    setTimeout(init, 200);
}

console.log('✅ Finance 模块加载完成');