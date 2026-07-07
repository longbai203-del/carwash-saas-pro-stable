/**
 * modules/01-dashboard/marketing/marketing.js
 * 营销概览 - 完整数据渲染
 */

// ============================================================
// 1. 数据
// ============================================================

const MARKETING_DATA = {
    stats: {
        activeCampaigns: 12,
        conversionRate: 23,
        newCustomers: 156,
        revenue: 45800
    },
    promotions: [
        { name: '夏日特惠', type: '折扣', status: '进行中', usage: 128 },
        { name: '新客立减', type: '优惠券', status: '进行中', usage: 56 },
        { name: '会员折扣', type: '会员专享', status: '已结束', usage: 89 },
        { name: '节日促销', type: '限时抢购', status: '进行中', usage: 45 }
    ]
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
    var stats = MARKETING_DATA.stats;
    var cards = document.querySelectorAll('.marketing-card .value');

    if (cards.length >= 4) {
        cards[0].textContent = stats.activeCampaigns;
        cards[1].textContent = stats.conversionRate + '%';
        cards[2].textContent = stats.newCustomers;
        cards[3].textContent = '¥' + formatCurrency(stats.revenue);
    }
}

function renderPromotions() {
    var tbody = document.querySelector('.table tbody');
    if (!tbody) return;

    var statusMap = {
        '进行中': 'badge-success',
        '已结束': 'badge-secondary',
        '待开始': 'badge-info'
    };

    var html = '';
    for (var i = 0; i < MARKETING_DATA.promotions.length; i++) {
        var p = MARKETING_DATA.promotions[i];
        var badgeClass = statusMap[p.status] || 'badge-secondary';
        html += '<tr>' +
            '<td>' + p.name + '</td>' +
            '<td>' + p.type + '</td>' +
            '<td><span class="badge ' + badgeClass + '">' + p.status + '</span></td>' +
            '<td>' + p.usage + '</td>' +
            '</tr>';
    }
    tbody.innerHTML = html;
}

// ============================================================
// 4. 核心功能
// ============================================================

export function init() {
    console.log('📢 Marketing Dashboard 初始化...');

    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    renderStats();
    renderPromotions();

    var refreshBtn = document.querySelector('.page-header .btn-secondary');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            var icon = this.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                setTimeout(function() {
                    icon.classList.remove('fa-spin');
                    showToast('营销数据已刷新', 'success');
                }, 1000);
            }
            renderStats();
            renderPromotions();
        });
    }

    console.log('✅ Marketing Dashboard 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 100);
}

console.log('✅ Marketing 模块加载完成');