/**
 * modules/01-dashboard/inventory/inventory.js - 库存概览
 * @module inventory
 * @description 库存状态总览
 */

// ============================================================
// 1. 数据
// ============================================================

const INVENTORY_DATA = {
    stats: {
        total: 156,
        lowStock: 8,
        outOfStock: 3,
        totalValue: 245800
    },
    lowStockItems: [
        { name: '泡沫洗车液', stock: 5, minStock: 20, status: '紧急' },
        { name: '轮胎光亮剂', stock: 8, minStock: 15, status: '预警' },
        { name: '内饰清洗剂', stock: 3, minStock: 10, status: '紧急' },
        { name: '玻璃清洁剂', stock: 6, minStock: 12, status: '预警' }
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
    var stats = INVENTORY_DATA.stats;
    
    var cards = document.querySelectorAll('.inventory-card');
    var values = cards.length > 0 ? cards.querySelectorAll('.value') : [];
    
    if (values.length >= 4) {
        values[0].textContent = stats.total;
        values[1].textContent = stats.lowStock;
        values[2].textContent = stats.outOfStock;
        values[3].textContent = '¥' + formatCurrency(stats.totalValue);
    } else {
        // 备用：通过ID查找
        var idMap = {
            'invTotal': stats.total,
            'invLowStock': stats.lowStock,
            'invOutOfStock': stats.outOfStock,
            'invTotalValue': '¥' + formatCurrency(stats.totalValue)
        };
        Object.keys(idMap).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.textContent = idMap[id];
        });
        
        // 再尝试通过卡片内部的元素查找
        var allCards = document.querySelectorAll('.inventory-card, .stat-card, .card');
        allCards.forEach(function(card, index) {
            var valEl = card.querySelector('.value, .stat-value, .number');
            if (valEl) {
                var keys = ['total', 'lowStock', 'outOfStock', 'totalValue'];
                if (index < keys.length) {
                    var key = keys[index];
                    if (key === 'totalValue') {
                        valEl.textContent = '¥' + formatCurrency(stats.totalValue);
                    } else {
                        valEl.textContent = stats[key];
                    }
                }
            }
        });
    }
}

function renderLowStockItems() {
    var tbody = document.querySelector('.table tbody') || 
                document.querySelector('#lowStockTable tbody') ||
                document.querySelector('[data-lowstock-table] tbody');
    
    if (!tbody) {
        console.warn('⚠️ 找不到低库存表格');
        return;
    }

    var html = '';
    for (var i = 0; i < INVENTORY_DATA.lowStockItems.length; i++) {
        var item = INVENTORY_DATA.lowStockItems[i];
        var badgeClass = item.status === '紧急' ? 'badge-danger' : 'badge-warning';
        var badgeText = item.status === '紧急' ? '⚠️ 紧急' : '⚠️ 预警';
        html += '<tr>' +
            '<td>' + item.name + '</td>' +
            '<td>' + item.stock + '</td>' +
            '<td>' + item.minStock + '</td>' +
            '<td><span class="badge ' + badgeClass + '">' + badgeText + '</span></td>' +
            '</tr>';
    }
    tbody.innerHTML = html;
}

// ============================================================
// 4. 核心功能
// ============================================================

export function init() {
    console.log('📦 Inventory Dashboard 初始化...');

    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    setTimeout(function() {
        renderStats();
        renderLowStockItems();
    }, 100);

    var refreshBtn = document.querySelector('.page-header .btn-secondary, #refreshInventoryBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            var icon = this.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                setTimeout(function() {
                    icon.classList.remove('fa-spin');
                    showToast('库存数据已刷新', 'success');
                }, 1000);
            }
            renderStats();
            renderLowStockItems();
        });
    }

    console.log('✅ Inventory Dashboard 初始化完成');
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

console.log('✅ Inventory 模块加载完成');