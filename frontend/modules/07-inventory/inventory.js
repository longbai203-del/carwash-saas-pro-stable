/**
 * @file inventory.js
 * @module inventory
 * @description 库存概览 - 库存状态总览仪表板
 * 
 * @example
 * import { init } from './inventory.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} InventoryStats
 * @property {number} totalItems - 总商品数
 * @property {number} totalQuantity - 总数量
 * @property {number} lowStock - 低库存数
 * @property {number} outStock - 缺货数
 * @property {number} totalValue - 总价值
 */

/**
 * @typedef {Object} CategoryDistribution
 * @property {string} name - 分类名称
 * @property {number} count - 数量
 * @property {number} percentage - 占比
 * @property {string} color - 颜色
 */

/**
 * @typedef {Object} InventoryState
 * @property {InventoryStats} stats - 统计数据
 * @property {Array} lowStockItems - 低库存商品列表
 * @property {CategoryDistribution[]} categories - 分类分布
 * @property {number[]} trendData - 趋势数据
 * @property {boolean} loading - 加载状态
 */

/** @type {InventoryState} 状态 */
const state = {
    stats: {
        totalItems: 0,
        totalQuantity: 0,
        lowStock: 0,
        outStock: 0,
        totalValue: 0
    },
    lowStockItems: [],
    categories: [
        { name: '洗车', count: 0, percentage: 0, color: '#3B82F6' },
        { name: '美容', count: 0, percentage: 0, color: '#10B981' },
        { name: '保养', count: 0, percentage: 0, color: '#F59E0B' },
        { name: '会员', count: 0, percentage: 0, color: '#8B5CF6' },
        { name: '其他', count: 0, percentage: 0, color: '#6B7280' }
    ],
    trendData: [0, 0, 0, 0, 0, 0, 0],
    loading: false
};

/** @type {number|null} 自动刷新定时器 */
let refreshInterval = null;

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
 * @description 加载库存数据
 */
function loadInventoryData() {
    state.loading = true;
    
    try {
        // 从本地存储加载库存数据
        const stockData = JSON.parse(localStorage.getItem('stock_data') || '[]');
        
        // 计算统计数据
        const totalItems = stockData.length;
        const totalQuantity = stockData.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const lowStock = stockData.filter(item => item.status === 'low').length;
        const outStock = stockData.filter(item => item.status === 'out').length;
        const totalValue = stockData.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
        
        state.stats = {
            totalItems,
            totalQuantity,
            lowStock,
            outStock,
            totalValue
        };
        
        // 获取低库存商品（前5个）
        state.lowStockItems = stockData
            .filter(item => item.status === 'low' || item.status === 'out')
            .slice(0, 5);
        
        // 计算分类分布
        calculateCategoryDistribution(stockData);
        
        // 生成趋势数据
        generateTrendData();
        
        state.loading = false;
        renderStats();
        renderLowStockItems();
        renderTrendChart();
        renderCategoryDistribution();
        
    } catch (error) {
        console.error('加载库存数据失败:', error);
        state.loading = false;
        showToast('加载库存数据失败', 'error');
    }
}

/**
 * @private
 * @description 计算分类分布
 */
function calculateCategoryDistribution(stockData) {
    const categories = ['洗车', '美容', '保养', '会员', '其他'];
    const counts = {};
    categories.forEach(c => counts[c] = 0);
    
    stockData.forEach(item => {
        const cat = item.category || '其他';
        if (counts[cat] !== undefined) {
            counts[cat]++;
        } else {
            counts['其他']++;
        }
    });
    
    const total = stockData.length || 1;
    state.categories = categories.map((name, index) => ({
        name: name,
        count: counts[name] || 0,
        percentage: Math.round((counts[name] || 0) / total * 100),
        color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#6B7280'][index]
    }));
}

/**
 * @private
 * @description 生成趋势数据
 */
function generateTrendData() {
    // 模拟近7天趋势数据
    state.trendData = Array.from({ length: 7 }, () => 
        Math.floor(Math.random() * 100) + 20
    );
}

/**
 * @private
 * @description 渲染统计数据
 */
function renderStats() {
    const stats = state.stats;
    
    const elements = {
        'statTotalItems': stats.totalItems,
        'statTotalQuantity': stats.totalQuantity,
        'statLowStock': stats.lowStock,
        'statOutStock': stats.outStock,
        'statTotalValue': '¥' + formatCurrency(stats.totalValue)
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @description 渲染低库存商品列表
 */
function renderLowStockItems() {
    const tbody = document.getElementById('lowStockTableBody');
    if (!tbody) return;
    
    if (state.lowStockItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:32px;color:#10B981;">
                    <i class="fas fa-check-circle" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                    所有商品库存充足
                </td>
            </tr>
        `;
        return;
    }
    
    const statusMap = {
        critical: { label: '⚠️ 紧急', color: '#FEE2E2', textColor: '#991B1B' },
        low: { label: '⚠️ 预警', color: '#FEF3C7', textColor: '#92400E' },
        out: { label: '⛔ 缺货', color: '#FEE2E2', textColor: '#991B1B' }
    };
    
    tbody.innerHTML = state.lowStockItems.map(item => {
        const status = statusMap[item.status] || statusMap.low;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;">
                <td style="padding:10px 16px;font-weight:500;">${item.name}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;background:#F3F4F6;color:#4B5563;">
                        ${item.category || '未分类'}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#EF4444;">
                    ${item.quantity} ${item.unit || ''}
                </td>
                <td style="padding:10px 16px;text-align:right;color:#6B7280;">
                    ${item.minStock || 0} ${item.unit || ''}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;text-align:center;">
                    <button class="btn btn-sm btn-primary" onclick="window.InventoryModule.goToStock()" style="padding:4px 12px;background:#4F46E5;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                        补货
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * @private
 * @description 渲染趋势图表
 */
function renderTrendChart() {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const maxValue = Math.max(...state.trendData, 1);
    
    for (let i = 0; i < 7; i++) {
        const bar = document.getElementById(`bar${i + 1}`);
        if (bar) {
            const height = (state.trendData[i] / maxValue) * 150;
            bar.style.height = Math.max(height, 4) + 'px';
            // 添加tooltip
            bar.title = `${days[i]}: ${state.trendData[i]}件`;
        }
    }
}

/**
 * @private
 * @description 渲染分类分布
 */
function renderCategoryDistribution() {
    state.categories.forEach((cat, index) => {
        const bar = document.getElementById(`catBar${index + 1}`);
        const pct = document.getElementById(`catPct${index + 1}`);
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
 * @description 绑定事件
 */
function bindEvents() {
    const refreshBtn = document.getElementById('refreshInventory');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadInventoryData();
            showToast('数据已刷新', 'success');
        });
    }
    
    const viewAllBtn = document.getElementById('viewAllStock');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            if (typeof window.router !== 'undefined') {
                window.router.navigate('/inventory/stock');
            } else {
                window.location.hash = '#/inventory/stock';
            }
        });
    }
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
        console.log('🔄 自动刷新库存数据...');
        loadInventoryData();
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
 * @param {Array} options.data - 初始数据
 * @returns {Promise<void>}
 * @description 初始化库存概览
 */
export async function init(options) {
    console.log('📊 库存概览 初始化...');
    
    if (options?.data) {
        localStorage.setItem('stock_data', JSON.stringify(options.data));
    }
    
    loadInventoryData();
    bindEvents();
    startAutoRefresh();
    
    // 暴露全局方法
    window.InventoryModule = {
        state,
        loadInventoryData,
        renderStats,
        renderLowStockItems,
        renderTrendChart,
        renderCategoryDistribution,
        goToStock: () => {
            if (typeof window.router !== 'undefined') {
                window.router.navigate('/inventory/stock');
            } else {
                window.location.hash = '#/inventory/stock';
            }
        },
        stopAutoRefresh
    };
    
    console.log('✅ 库存概览 初始化完成');
}

/**
 * @public
 * @description 刷新数据
 */
export function refresh() {
    loadInventoryData();
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
    loadInventoryData
};