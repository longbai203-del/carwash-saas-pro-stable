/**
 * @file settlements.js
 * @module settlements
 * @description 结算管理 - 结算记录和状态跟踪
 * 
 * @example
 * import { init } from './settlements.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Settlement
 * @property {string} id - 结算ID
 * @property {string} orderId - 订单号
 * @property {string} customer - 客户名称
 * @property {number} amount - 结算金额
 * @property {string} method - 结算方式
 * @property {string} status - 状态 (pending/completed/failed)
 * @property {string} settlementDate - 结算日期
 * @property {string} note - 备注
 * @property {string} createdAt - 创建时间
 */

/** @type {{settlements: Settlement[], filteredSettlements: Settlement[], filters: {orderId: string, status: string, method: string}, stats: {totalAmount: number, count: number, completed: number}, page: number, pageSize: number}} 状态 */
const state = {
    settlements: [],
    filteredSettlements: [],
    filters: {
        orderId: '',
        status: '',
        method: ''
    },
    stats: {
        totalAmount: 0,
        count: 0,
        completed: 0
    },
    page: 1,
    pageSize: 10
};

/**
 * 结算方式配置
 */
const METHOD_MAP = {
    cash: { label: '现金', color: '#10B981' },
    card: { label: '刷卡', color: '#3B82F6' },
    wechat: { label: '微信', color: '#10B981' },
    alipay: { label: '支付宝', color: '#3B82F6' },
    bank: { label: '银行转账', color: '#6B7280' }
};

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
    return d.toLocaleDateString('zh-CN');
}

/**
 * @private
 * @returns {Settlement[]} 模拟结算数据
 */
function getMockSettlements() {
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静'];
    const methods = ['cash', 'card', 'wechat', 'alipay', 'cash'];
    const statuses = ['pending', 'completed', 'completed', 'failed', 'pending', 'completed'];
    const orderIds = ['ORD-001', 'ORD-002', 'ORD-003', 'ORD-004', 'ORD-005', 'ORD-006'];
    
    return orderIds.map((orderId, i) => ({
        id: `SET-${String(i + 1).padStart(6, '0')}`,
        orderId: orderId,
        customer: customers[i % customers.length],
        amount: Math.floor(Math.random() * 5000) + 500,
        method: methods[i % methods.length],
        status: statuses[i % statuses.length],
        settlementDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        note: '',
        createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

/**
 * @private
 * @description 加载结算数据
 */
function loadSettlements() {
    try {
        const saved = localStorage.getItem('settlement_data');
        if (saved) {
            state.settlements = JSON.parse(saved);
        } else {
            state.settlements = getMockSettlements();
            localStorage.setItem('settlement_data', JSON.stringify(state.settlements));
        }
    } catch (e) {
        console.warn('加载结算数据失败:', e);
        state.settlements = getMockSettlements();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存结算数据
 */
function saveSettlements() {
    try {
        localStorage.setItem('settlement_data', JSON.stringify(state.settlements));
    } catch (e) {
        console.warn('保存结算数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.settlements;
    
    if (state.filters.orderId) {
        filtered = filtered.filter(s => s.orderId.includes(state.filters.orderId));
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(s => s.status === state.filters.status);
    }
    
    if (state.filters.method) {
        filtered = filtered.filter(s => s.method === state.filters.method);
    }
    
    state.filteredSettlements = filtered;
    calculateStats();
}

/**
 * @private
 * @description 计算统计
 */
function calculateStats() {
    const totalAmount = state.filteredSettlements.reduce((sum, s) => sum + s.amount, 0);
    const count = state.filteredSettlements.length;
    const completed = state.filteredSettlements.filter(s => s.status === 'completed').length;
    
    state.stats = { totalAmount, count, completed };
}

/**
 * @private
 * @description 渲染结算列表
 */
function render() {
    const tbody = document.getElementById('settlementListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredSettlements.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-handshake" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无结算记录
                </td>
            </tr>
        `;
        return;
    }

    const statusMap = {
        pending: { label: '待结算', color: '#FEF3C7', textColor: '#92400E' },
        completed: { label: '已结算', color: '#D1FAE5', textColor: '#065F46' },
        failed: { label: '失败', color: '#FEE2E2', textColor: '#991B1B' }
    };

    tbody.innerHTML = pageData.map(s => {
        const status = statusMap[s.status] || statusMap.pending;
        const method = METHOD_MAP[s.method] || METHOD_MAP.cash;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-family:monospace;font-size:13px;">${s.orderId}</td>
                <td style="padding:10px 16px;font-size:13px;">${s.customer}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;">
                    ¥${formatCurrency(s.amount)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${method.color}20;color:${method.color};">
                        ${method.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">${formatDate(s.settlementDate)}</td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        ${s.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="window.SettlementsModule.completeSettlement('${s.id}')" title="完成结算">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="window.SettlementsModule.viewSettlement('${s.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    updateStats();
    renderPagination();
}

/**
 * @private
 * @description 更新统计
 */
function updateStats() {
    const stats = state.stats;
    
    document.getElementById('statTotalAmount')?.textContent = '¥' + formatCurrency(stats.totalAmount);
    document.getElementById('statCount')?.textContent = stats.count;
    document.getElementById('statCompleted')?.textContent = stats.completed;
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredSettlements.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条记录
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.SettlementsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.SettlementsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * @private
 * @param {number} page - 页码
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredSettlements.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 结算ID
 */
function viewSettlement(id) {
    const settlement = state.settlements.find(s => s.id === id);
    if (!settlement) {
        showToast('结算记录不存在', 'error');
        return;
    }
    
    const statusMap = { pending: '待结算', completed: '已结算', failed: '失败' };
    const method = METHOD_MAP[settlement.method] || METHOD_MAP.cash;
    
    alert(`结算详情：
订单号: ${settlement.orderId}
客户: ${settlement.customer}
金额: ¥${formatCurrency(settlement.amount)}
方式: ${method.label}
状态: ${statusMap[settlement.status] || settlement.status}
结算日期: ${formatDate(settlement.settlementDate)}
备注: ${settlement.note || '无'}`);
}

/**
 * @private
 * @param {string} id - 结算ID
 */
function completeSettlement(id) {
    const settlement = state.settlements.find(s => s.id === id);
    if (!settlement) {
        showToast('结算记录不存在', 'error');
        return;
    }
    
    settlement.status = 'completed';
    settlement.settlementDate = new Date().toISOString().split('T')[0];
    
    saveSettlements();
    applyFilters();
    render();
    showToast('结算已完成', 'success');
}

/**
 * @private
 */
function handleSearch() {
    state.filters.orderId = document.getElementById('searchOrderId')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.method = document.getElementById('searchMethod')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const orderInput = document.getElementById('searchOrderId');
    const statusInput = document.getElementById('searchStatus');
    const methodInput = document.getElementById('searchMethod');
    
    if (orderInput) orderInput.value = '';
    if (statusInput) statusInput.value = '';
    if (methodInput) methodInput.value = '';
    
    state.filters = { orderId: '', status: '', method: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function bindEvents() {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    
    document.querySelectorAll('#searchOrderId, #searchStatus, #searchMethod').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 */
export async function init(options) {
    console.log('🤝 结算管理 初始化...');
    
    if (options?.data) {
        state.settlements = options.data;
        localStorage.setItem('settlement_data', JSON.stringify(state.settlements));
    }
    
    loadSettlements();
    bindEvents();
    render();
    
    window.SettlementsModule = {
        state,
        loadSettlements,
        render,
        renderPagination,
        updateStats,
        viewSettlement,
        completeSettlement,
        goToPage,
        handleSearch,
        handleReset,
        saveSettlements,
        applyFilters
    };
    
    console.log('✅ 结算管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadSettlements,
    viewSettlement,
    completeSettlement,
    goToPage,
    saveSettlements
};