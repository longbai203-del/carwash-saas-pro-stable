/**
 * @file inventory.js
 * @module inventory
 * @description 库存概览 - 库存状态总览
 * 
 * @example
 * import { init } from './inventory.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} InventoryStats
 * @property {number} total - 总商品数
 * @property {number} lowStock - 低库存预警数
 * @property {number} outOfStock - 已售罄数
 * @property {number} totalValue - 库存总价值
 */

/**
 * @typedef {Object} LowStockItem
 * @property {string} name - 商品名称
 * @property {number} stock - 当前库存
 * @property {number} minStock - 最低库存
 * @property {string} status - 状态 (紧急/预警)
 */

/**
 * @typedef {Object} InventoryData
 * @property {InventoryStats} stats - 统计数据
 * @property {LowStockItem[]} lowStockItems - 低库存商品列表
 */

/** @type {InventoryData} 默认数据 */
const DEFAULT_DATA = {
    stats: {
        total: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0
    },
    lowStockItems: []
};

/**
 * @private
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0';
    return Number(amount).toLocaleString('zh-CN');
}

/**
 * @private
 * @param {InventoryStats} stats - 统计数据
 * @description 渲染统计数据
 */
function renderStats(stats) {
    const cards = document.querySelectorAll('.inventory-card');
    const values = cards.length > 0 ? cards.querySelectorAll('.value') : [];
    
    if (values.length >= 4) {
        values[0].textContent = stats.total;
        values[1].textContent = stats.lowStock;
        values[2].textContent = stats.outOfStock;
        values[3].textContent = '¥' + formatCurrency(stats.totalValue);
        
        // 添加颜色类
        if (values[1]) {
            values[1].classList.add(stats.lowStock > 5 ? 'warning' : '');
        }
        if (values[2]) {
            values[2].classList.add(stats.outOfStock > 0 ? 'danger' : '');
        }
    } else {
        // 备用：通过ID查找
        const idMap = {
            'invTotal': stats.total,
            'invLowStock': stats.lowStock,
            'invOutOfStock': stats.outOfStock,
            'invTotalValue': '¥' + formatCurrency(stats.totalValue)
        };
        Object.keys(idMap).forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.textContent = idMap[id];
        });
        
        // 再尝试通过卡片内部的元素查找
        const allCards = document.querySelectorAll('.inventory-card, .stat-card, .card');
        allCards.forEach(function(card, index) {
            const valEl = card.querySelector('.value, .stat-value, .number');
            if (valEl) {
                const keys = ['total', 'lowStock', 'outOfStock', 'totalValue'];
                if (index < keys.length) {
                    const key = keys[index];
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

/**
 * @private
 * @param {LowStockItem[]} items - 低库存商品列表
 * @description 渲染低库存商品
 */
function renderLowStockItems(items) {
    const tbody = document.querySelector('.table tbody') || 
                  document.querySelector('#lowStockTable tbody') ||
                  document.querySelector('[data-lowstock-table] tbody');
    
    if (!tbody) {
        console.warn('⚠️ 找不到低库存表格');
        return;
    }

    if (!items || items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;padding:20px;color:#10B981;">
                    ✅ 所有商品库存充足
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    for (let i = 0; i < Math.min(items.length, 5); i++) {
        const item = items[i];
        const badgeClass = item.status === '紧急' ? 'badge-danger' : 'badge-warning';
        const badgeText = item.status === '紧急' ? '⚠️ 紧急' : '⚠️ 预警';
        html += `
            <tr>
                <td>${item.name}</td>
                <td>${item.stock}</td>
                <td>${item.minStock}</td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
            </tr>
        `;
    }
    tbody.innerHTML = html;
}

/**
 * @private
 * @param {InventoryData} data - 库存数据
 * @description 加载并渲染库存数据
 */
function loadInventoryData(data) {
    console.log('🔄 Loading inventory data...');
    
    const stats = data?.stats || DEFAULT_DATA.stats;
    const items = data?.lowStockItems || DEFAULT_DATA.lowStockItems;
    
    renderStats(stats);
    renderLowStockItems(items);
    console.log('✅ Inventory data loaded');
}

/**
 * @public
 * @param {InventoryData} data - 库存数据
 * @returns {Promise<void>}
 * @description 初始化库存概览
 */
export async function init(data) {
    console.log('📦 Inventory Dashboard 初始化...');

    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    // 使用传入数据或从API加载
    const inventoryData = data || await loadFromAPI();
    loadInventoryData(inventoryData);

    // 绑定刷新按钮
    const refreshBtn = document.querySelector('.page-header .btn-secondary, #refreshInventoryBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                setTimeout(function() {
                    icon.classList.remove('fa-spin');
                }, 1000);
            }
            const newData = await loadFromAPI();
            loadInventoryData(newData);
            showToast('库存数据已刷新', 'success');
        });
    }

    console.log('✅ Inventory Dashboard 初始化完成');
}

/**
 * @private
 * @returns {Promise<InventoryData>} 库存数据
 * @description 从API加载数据
 */
async function loadFromAPI() {
    try {
        const response = await apiClient.get('/inventory/stats');
        if (response && response.success) {
            return response.data;
        }
        return DEFAULT_DATA;
    } catch (error) {
        console.warn('⚠️ API加载失败，使用默认数据:', error);
        return DEFAULT_DATA;
    }
}

export default {
    init
};