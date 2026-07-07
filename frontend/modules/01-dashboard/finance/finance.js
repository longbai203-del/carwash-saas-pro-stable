/**
 * modules/01-dashboard/finance/finance.js
 * 财务概览 - 完整数据渲染
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
    var cards = document.querySelectorAll('.finance-card .value');

    if (cards.length >= 4) {
        cards[0].textContent = '¥' + formatCurrency(stats.income);
        cards[1].textContent = '¥' + formatCurrency(stats.expenses);
        cards[2].textContent = '¥' + formatCurrency(stats.profit);
        cards[3].textContent = stats.profitRate + '%';
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

    renderStats();

    var refreshBtn = document.querySelector('.page-header .btn-secondary');
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 100);
}

console.log('✅ Finance 模块加载完成');