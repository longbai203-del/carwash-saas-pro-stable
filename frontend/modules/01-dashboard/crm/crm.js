/**
 * modules/01-dashboard/crm/crm.js
 * CRM 概览 - 完整数据渲染
 */

// ============================================================
// 1. 数据
// ============================================================

const CRM_DATA = {
    stats: {
        total: 328,
        vip: 45,
        gold: 89,
        totalSpent: 245800
    },
    recentCustomers: [
        { name: '张伟', level: 'gold', spent: 12500, visit: '2026-07-05' },
        { name: '李娜', level: 'vip', spent: 32800, visit: '2026-07-06' },
        { name: '王强', level: 'silver', spent: 5600, visit: '2026-07-04' },
        { name: '刘洋', level: 'bronze', spent: 2300, visit: '2026-07-03' },
        { name: '陈静', level: 'vip', spent: 45600, visit: '2026-07-06' }
    ]
};

const LEVEL_MAP = {
    vip: { label: 'VIP', class: 'badge-vip' },
    gold: { label: '黄金', class: 'badge-gold' },
    silver: { label: '白银', class: 'badge-silver' },
    bronze: { label: '青铜', class: 'badge-bronze' }
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
    var stats = CRM_DATA.stats;

    // 更新统计卡片
    var totalEl = document.querySelector('.crm-card .value');
    var allCards = document.querySelectorAll('.crm-card');

    if (allCards.length >= 4) {
        // 总客户
        var valueEls = document.querySelectorAll('.crm-card .value');
        if (valueEls.length >= 4) {
            valueEls[0].textContent = stats.total;
            valueEls[1].textContent = stats.vip;
            valueEls[2].textContent = stats.gold;
            valueEls[3].textContent = '¥' + formatCurrency(stats.totalSpent);
        }
    }
}

function renderRecentCustomers() {
    var tbody = document.querySelector('.table tbody');
    if (!tbody) return;

    var html = '';
    for (var i = 0; i < CRM_DATA.recentCustomers.length; i++) {
        var c = CRM_DATA.recentCustomers[i];
        var level = LEVEL_MAP[c.level] || LEVEL_MAP.bronze;
        html += '<tr>' +
            '<td>' + c.name + '</td>' +
            '<td><span class="badge ' + level.class + '">' + level.label + '</span></td>' +
            '<td>¥' + formatCurrency(c.spent) + '</td>' +
            '<td>' + c.visit + '</td>' +
            '</tr>';
    }
    tbody.innerHTML = html;
}

// ============================================================
// 4. 核心功能
// ============================================================

export function init() {
    console.log('👥 CRM Dashboard 初始化...');

    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    // 渲染数据
    renderStats();
    renderRecentCustomers();

    // 刷新功能
    var refreshBtn = document.querySelector('.page-header .btn-secondary');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            var icon = this.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                setTimeout(function() {
                    icon.classList.remove('fa-spin');
                    showToast('CRM 数据已刷新', 'success');
                }, 1000);
            }
            // 重新渲染
            renderStats();
            renderRecentCustomers();
        });
    }

    console.log('✅ CRM Dashboard 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 100);
}

console.log('✅ CRM 模块加载完成');