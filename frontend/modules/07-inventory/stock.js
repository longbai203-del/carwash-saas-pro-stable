/**
 * modules/07-inventory/stock/stock.js - 库存管理模块
 * @module stock
 * @description 库存查看、预警、调拨管理
 * 
 * @example
 * import { init } from './stock.js';
 * init();
 */

/**
 * 库存状态
 */
const state = {
    items: [],
    loading: false,
    page: 1,
    pageSize: 10,
    filters: {
        name: '',
        category: '',
        status: ''
    }
};

/**
 * 初始化库存管理
 * @returns {Promise<void>}
 */
export async function init() {
    console.log('📦 库存管理模块初始化...');
    
    try {
        loadStockItems();
        render();
        bindEvents();
        console.log('✅ 库存管理初始化完成');
    } catch (error) {
        console.error('❌ 库存管理初始化失败:', error);
        showError('加载库存数据失败');
    }
}

/**
 * 加载库存数据
 * @returns {void}
 */
function loadStockItems() {
    const saved = localStorage.getItem('stock_data');
    if (saved) {
        try {
            state.items = JSON.parse(saved);
        } catch (e) {
            state.items = getMockStock();
        }
    } else {
        state.items = getMockStock();
        localStorage.setItem('stock_data', JSON.stringify(state.items));
    }
}

/**
 * 获取模拟库存数据
 * @returns {Array} 库存数组
 */
function getMockStock() {
    const names = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂'];
    const categories = ['洗车', '美容', '保养'];
    const units = ['桶', '瓶', '个', '箱'];
    const statuses = ['normal', 'low', 'out'];
    
    return Array.from({ length: 15 }, (_, i) => ({
        id: `STK-${String(i + 1).padStart(6, '0')}`,
        name: names[i % names.length] + (i > 5 ? ' (升级版)' : ''),
        category: categories[i % categories.length],
        quantity: Math.floor(Math.random() * 500) + 5,
        unit: units[i % units.length],
        minStock: 20,
        maxStock: 200,
        status: statuses[i % statuses.length],
        lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

/**
 * 渲染库存列表
 * @returns {void}
 */
function render() {
    const tbody = document.getElementById('stockTableBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.items.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-warehouse" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无库存数据
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        normal: { label: '正常', color: '#D1FAE5', textColor: '#065F46' },
        low: { label: '低库存', color: '#FEF3C7', textColor: '#92400E' },
        out: { label: '缺货', color: '#FEE2E2', textColor: '#991B1B' }
    };

    tbody.innerHTML = pageData.map(item => {
        const status = statusMap[item.status] || statusMap.normal;
        const isLow = item.quantity <= item.minStock;
        
        return `
            <tr>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <div style="font-weight:500;">${item.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${item.id}</div>
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">${item.category}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;text-align:right;font-weight:600;${isLow ? 'color:#EF4444;' : ''}">
                    ${item.quantity} ${item.unit}
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;text-align:right;color:#6B7280;">
                    ${item.minStock} ${item.unit}
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;text-align:right;color:#6B7280;">
                    ${item.maxStock} ${item.unit}
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <span style="display:inline-block;padding:4px 10px;border-radius:9999px;font-size:12px;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#6B7280;">
                    ${new Date(item.lastUpdated).toLocaleDateString()}
                </td>
            </tr>
        `;
    }).join('');

    updateStats();
    renderPagination();
}

/**
 * 更新统计
 * @returns {void}
 */
function updateStats() {
    const total = state.items.length;
    const low = state.items.filter(i => i.status === 'low').length;
    const out = state.items.filter(i => i.status === 'out').length;
    const totalQty = state.items.reduce((sum, i) => sum + i.quantity, 0);

    document.getElementById('totalItems').textContent = total;
    document.getElementById('lowStock').textContent = low;
    document.getElementById('outStock').textContent = out;
    document.getElementById('totalQuantity').textContent = totalQty;
}

/**
 * 渲染分页
 * @returns {void}
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.items.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="changePage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="changePage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * 切换页面
 * @param {number} page - 页码
 * @returns {void}
 */
window.changePage = function(page) {
    const total = state.items.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
};

/**
 * 搜索库存
 * @returns {void}
 */
function handleSearch() {
    const name = document.getElementById('searchName').value.toLowerCase();
    const category = document.getElementById('searchCategory').value;
    const status = document.getElementById('searchStatus').value;
    
    state.filteredItems = state.items.filter(item => {
        let match = true;
        if (name && !item.name.toLowerCase().includes(name)) match = false;
        if (category && item.category !== category) match = false;
        if (status && item.status !== status) match = false;
        return match;
    });
    state.page = 1;
    render();
}

/**
 * 重置搜索
 * @returns {void}
 */
function handleReset() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchCategory').value = '';
    document.getElementById('searchStatus').value = '';
    state.filteredItems = [...state.items];
    state.page = 1;
    render();
}

/**
 * 绑定事件
 * @returns {void}
 */
function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.querySelectorAll('#searchName, #searchCategory, #searchStatus').forEach(el => {
        el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * 显示Toast提示
 * @param {string} message - 消息内容
 * @param {string} type - 类型
 * @returns {void}
 */
function showToast(message, type) {
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#4F46E5'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        background: ${colors[type] || '#4F46E5'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 * @returns {void}
 */
function showError(message) {
    const container = document.querySelector('.stock-container');
    if (!container) return;
    container.innerHTML = `
        <div style="padding:40px;text-align:center;">
            <i class="fas fa-exclamation-circle" style="font-size:48px;color:#EF4444;"></i>
            <p style="color:#6B7280;">${message}</p>
            <button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;">
                重新加载
            </button>
        </div>
    `;
}

// 暴露全局函数
window.changePage = window.changePage;

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default { init };