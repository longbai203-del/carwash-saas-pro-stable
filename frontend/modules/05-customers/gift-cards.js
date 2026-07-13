/**
 * @file gift-cards.js
 * @module gift-cards
 * @description 礼品卡管理模块 - 礼品卡的CRUD操作和数据管理
 * 
 * @example
 * import { init } from './gift-cards.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} GiftCard
 * @property {string} id - 礼品卡ID
 * @property {string} number - 礼品卡号
 * @property {string} [holder] - 持卡人
 * @property {number} balance - 余额
 * @property {number} initialAmount - 初始金额
 * @property {string} type - 类型 (physical/digital)
 * @property {string} status - 状态 (active/used/expired/frozen)
 * @property {string} validFrom - 有效期开始
 * @property {string} validTo - 有效期结束
 * @property {string} [customerId] - 关联客户ID
 * @property {string} [customerName] - 关联客户名称
 * @property {string} [notes] - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} GiftCardState
 * @property {GiftCard[]} cards - 礼品卡列表
 * @property {GiftCard[]} filteredCards - 过滤后的礼品卡列表
 * @property {string} searchQuery - 搜索关键词
 * @property {string} typeFilter - 类型筛选
 * @property {string} statusFilter - 状态筛选
 * @property {number} page - 页码
 * @property {number} limit - 每页数量
 * @property {string|null} editingId - 编辑中的礼品卡ID
 */

/** @type {GiftCardState} 状态 */
const state = {
    cards: [],
    filteredCards: [],
    searchQuery: '',
    typeFilter: 'all',
    statusFilter: 'all',
    page: 1,
    limit: 10,
    editingId: null
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
 * @returns {GiftCard[]} 模拟礼品卡数据
 */
function getMockGiftCards() {
    const holders = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
    const types = ['physical', 'digital', 'physical', 'digital'];
    const statuses = ['active', 'active', 'used', 'active', 'expired', 'frozen'];
    const amounts = [100, 200, 300, 500, 1000, 2000];
    
    const cards = [];
    for (let i = 0; i < 12; i++) {
        const amount = amounts[Math.floor(Math.random() * amounts.length)];
        const daysFrom = Math.floor(Math.random() * 60);
        const daysTo = Math.floor(Math.random() * 180) + 30;
        
        cards.push({
            id: `GIFT-${String(i + 1).padStart(6, '0')}`,
            number: `GC${String(Math.floor(Math.random() * 1000000000000)).padStart(12, '0')}`,
            holder: holders[i % holders.length],
            balance: amount * (0.2 + Math.random() * 0.8),
            initialAmount: amount,
            type: types[i % types.length],
            status: statuses[i % statuses.length],
            validFrom: new Date(Date.now() - daysFrom * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            validTo: new Date(Date.now() + daysTo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerId: `CUS-${String(i + 1).padStart(6, '0')}`,
            customerName: holders[i % holders.length],
            notes: Math.random() > 0.7 ? '生日礼品卡' : '',
            createdAt: new Date(Date.now() - (30 + Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return cards;
}

/**
 * @private
 * @description 加载礼品卡数据
 */
function loadGiftCards() {
    try {
        const saved = localStorage.getItem('giftcard_data');
        if (saved) {
            state.cards = JSON.parse(saved);
        } else {
            state.cards = getMockGiftCards();
            localStorage.setItem('giftcard_data', JSON.stringify(state.cards));
        }
    } catch (e) {
        console.warn('加载礼品卡数据失败:', e);
        state.cards = getMockGiftCards();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存礼品卡数据
 */
function saveGiftCards() {
    try {
        localStorage.setItem('giftcard_data', JSON.stringify(state.cards));
    } catch (e) {
        console.warn('保存礼品卡数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.cards;
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(c => 
            c.number.toLowerCase().includes(query) ||
            (c.holder && c.holder.toLowerCase().includes(query)) ||
            (c.customerName && c.customerName.toLowerCase().includes(query))
        );
    }
    
    if (state.typeFilter !== 'all') {
        filtered = filtered.filter(c => c.type === state.typeFilter);
    }
    
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(c => c.status === state.statusFilter);
    }
    
    state.filteredCards = filtered;
    renderGiftCards();
    updateStats();
    renderPagination();
}

/**
 * @private
 * @description 渲染礼品卡列表
 */
function renderGiftCards() {
    const container = document.getElementById('giftCardListBody');
    if (!container) return;
    
    const start = (state.page - 1) * state.limit;
    const end = start + state.limit;
    const paginated = state.filteredCards.slice(start, end);
    
    if (paginated.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-gift" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无礼品卡数据
                </td>
            </tr>
        `;
        return;
    }
    
    const statusMap = {
        'active': { label: '有效', color: '#065F46', bg: '#D1FAE5' },
        'used': { label: '已使用', color: '#92400E', bg: '#FEF3C7' },
        'expired': { label: '已过期', color: '#991B1B', bg: '#FEE2E2' },
        'frozen': { label: '已冻结', color: '#1E40AF', bg: '#DBEAFE' }
    };
    
    const typeMap = {
        'physical': '实体卡',
        'digital': '电子卡'
    };
    
    container.innerHTML = paginated.map(card => {
        const status = statusMap[card.status] || statusMap.active;
        const typeLabel = typeMap[card.type] || card.type;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-family:monospace;font-size:13px;">${card.number}</td>
                <td style="padding:10px 16px;">${card.holder || '-'}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;">
                    ¥${formatCurrency(card.balance)}
                </td>
                <td style="padding:10px 16px;text-align:right;font-size:13px;color:#6B7280;">
                    ¥${formatCurrency(card.initialAmount)}
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;background:#F3F4F6;color:#4B5563;">
                        ${typeLabel}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.bg};color:${status.color};">
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.GiftCardsModule.editGiftCard('${card.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.GiftCardsModule.viewGiftCard('${card.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.GiftCardsModule.deleteGiftCard('${card.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    const total = state.filteredCards.length;
    const totalPages = Math.ceil(total / state.limit);
    
    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 张礼品卡
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 张礼品卡，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
    `;
    
    html += `
        <button onclick="window.GiftCardsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.GiftCardsModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.GiftCardsModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.GiftCardsModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.GiftCardsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * @private
 * @description 更新统计数据
 */
function updateStats() {
    const total = state.cards.length;
    const active = state.cards.filter(c => c.status === 'active').length;
    const used = state.cards.filter(c => c.status === 'used').length;
    const expired = state.cards.filter(c => c.status === 'expired').length;
    const totalBalance = state.cards.reduce((sum, c) => sum + c.balance, 0);
    const totalInitial = state.cards.reduce((sum, c) => sum + c.initialAmount, 0);
    
    const elements = {
        'statTotal': total,
        'statActive': active,
        'statUsed': used,
        'statExpired': expired,
        'statTotalBalance': '¥' + formatCurrency(totalBalance),
        'statTotalInitial': '¥' + formatCurrency(totalInitial)
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @param {string} id - 礼品卡ID
 * @description 查看礼品卡详情
 */
function viewGiftCard(id) {
    const card = state.cards.find(c => c.id === id);
    if (!card) {
        showToast('礼品卡不存在', 'error');
        return;
    }
    
    const statusMap = {
        'active': '有效',
        'used': '已使用',
        'expired': '已过期',
        'frozen': '已冻结'
    };
    
    const typeMap = {
        'physical': '实体卡',
        'digital': '电子卡'
    };
    
    alert(`礼品卡详情：
卡号: ${card.number}
持卡人: ${card.holder || '-'}
余额: ¥${formatCurrency(card.balance)}
初始金额: ¥${formatCurrency(card.initialAmount)}
类型: ${typeMap[card.type] || card.type}
状态: ${statusMap[card.status] || card.status}
有效期: ${formatDate(card.validFrom)} ~ ${formatDate(card.validTo)}
客户: ${card.customerName || '-'}
备注: ${card.notes || '无'}`);
}

/**
 * @private
 * @param {string} id - 礼品卡ID
 * @description 编辑礼品卡
 */
function editGiftCard(id) {
    const card = state.cards.find(c => c.id === id);
    if (!card) {
        showToast('礼品卡不存在', 'error');
        return;
    }
    
    const modal = document.getElementById('giftCardModal');
    if (modal) {
        state.editingId = id;
        document.getElementById('modalTitle').textContent = '编辑礼品卡';
        document.getElementById('giftCardNumber').value = card.number;
        document.getElementById('giftCardHolder').value = card.holder || '';
        document.getElementById('giftCardBalance').value = card.balance;
        document.getElementById('giftCardInitial').value = card.initialAmount;
        document.getElementById('giftCardType').value = card.type || 'physical';
        document.getElementById('giftCardStatus').value = card.status || 'active';
        document.getElementById('giftCardValidFrom').value = card.validFrom || '';
        document.getElementById('giftCardValidTo').value = card.validTo || '';
        document.getElementById('giftCardNotes').value = card.notes || '';
        modal.style.display = 'flex';
    } else {
        // 降级方案
        const holder = prompt('持卡人：', card.holder || '') || '';
        const balance = parseFloat(prompt('余额：', card.balance));
        if (isNaN(balance) || balance < 0) {
            showToast('请输入有效余额', 'error');
            return;
        }
        const statusOptions = ['1. active (有效)', '2. used (已使用)', '3. expired (已过期)', '4. frozen (已冻结)'];
        const statusIdx = prompt(`选择状态：\n${statusOptions.join('\n')}`, 
            card.status === 'active' ? '1' : card.status === 'used' ? '2' : card.status === 'expired' ? '3' : '4');
        if (statusIdx !== null) {
            const statuses = ['active', 'used', 'expired', 'frozen'];
            const newStatus = statuses[parseInt(statusIdx) - 1];
            if (newStatus) card.status = newStatus;
        }
        
        card.holder = holder;
        card.balance = balance;
        card.updatedAt = new Date().toISOString();
        
        saveGiftCards();
        applyFilters();
        showToast('礼品卡已更新', 'success');
    }
}

/**
 * @private
 * @param {string} id - 礼品卡ID
 * @description 删除礼品卡
 */
function deleteGiftCard(id) {
    const card = state.cards.find(c => c.id === id);
    if (!card) {
        showToast('礼品卡不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除礼品卡 "${card.number}"？`)) return;
    
    state.cards = state.cards.filter(c => c.id !== id);
    saveGiftCards();
    applyFilters();
    showToast('礼品卡已删除', 'success');
}

/**
 * @private
 * @description 保存礼品卡（弹窗）
 */
function saveGiftCard() {
    const number = document.getElementById('giftCardNumber').value.trim();
    const holder = document.getElementById('giftCardHolder').value.trim();
    const balance = parseFloat(document.getElementById('giftCardBalance').value);
    const initialAmount = parseFloat(document.getElementById('giftCardInitial').value);
    const type = document.getElementById('giftCardType').value;
    const status = document.getElementById('giftCardStatus').value;
    const validFrom = document.getElementById('giftCardValidFrom').value;
    const validTo = document.getElementById('giftCardValidTo').value;
    const notes = document.getElementById('giftCardNotes').value.trim();

    if (!number) { showToast('请输入卡号', 'warning'); return; }
    if (isNaN(balance) || balance < 0) { showToast('请输入有效余额', 'warning'); return; }
    if (isNaN(initialAmount) || initialAmount < 0) { showToast('请输入有效初始金额', 'warning'); return; }

    const data = { number, holder, balance, initialAmount, type, status, validFrom, validTo, notes };

    if (state.editingId) {
        const card = state.cards.find(c => c.id === state.editingId);
        if (card) {
            Object.assign(card, data);
            card.updatedAt = new Date().toISOString();
            showToast('礼品卡已更新', 'success');
        }
    } else {
        const newCard = {
            id: `GIFT-${String(Date.now()).slice(-6)}`,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.cards.push(newCard);
        showToast('礼品卡已创建', 'success');
    }

    closeModal();
    saveGiftCards();
    applyFilters();
}

/**
 * @private
 * @description 显示新建礼品卡弹窗
 */
function showCreateModal() {
    state.editingId = null;
    const modal = document.getElementById('giftCardModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = '新建礼品卡';
        document.getElementById('giftCardNumber').value = `GC${String(Math.floor(Math.random() * 1000000000000)).padStart(12, '0')}`;
        document.getElementById('giftCardHolder').value = '';
        document.getElementById('giftCardBalance').value = '';
        document.getElementById('giftCardInitial').value = '';
        document.getElementById('giftCardType').value = 'digital';
        document.getElementById('giftCardStatus').value = 'active';
        document.getElementById('giftCardValidFrom').value = new Date().toISOString().split('T')[0];
        document.getElementById('giftCardValidTo').value = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        document.getElementById('giftCardNotes').value = '';
        modal.style.display = 'flex';
    } else {
        // 降级方案
        const number = prompt('卡号：', `GC${String(Math.floor(Math.random() * 1000000000000)).padStart(12, '0')}`);
        if (!number) return;
        const amount = parseFloat(prompt('金额：', '100'));
        if (isNaN(amount) || amount <= 0) {
            showToast('请输入有效金额', 'error');
            return;
        }
        const holder = prompt('持卡人：') || '';
        
        const newCard = {
            id: `GIFT-${String(Date.now()).slice(-6)}`,
            number: number.trim(),
            holder: holder,
            balance: amount,
            initialAmount: amount,
            type: 'digital',
            status: 'active',
            validFrom: new Date().toISOString().split('T')[0],
            validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.cards.push(newCard);
        saveGiftCards();
        applyFilters();
        showToast('礼品卡已创建', 'success');
    }
}

/**
 * @private
 * @description 关闭弹窗
 */
function closeModal() {
    const modal = document.getElementById('giftCardModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 * @param {number} page - 页码
 * @description 跳转到指定页
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredCards.length / state.limit);
    if (page < 1 || page > totalPages) return;
    state.page = page;
    renderGiftCards();
    renderPagination();
}

/**
 * @private
 * @description 搜索礼品卡
 */
function searchGiftCards(query) {
    state.searchQuery = query;
    state.page = 1;
    applyFilters();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFiltersAndRender() {
    applyFilters();
}

/**
 * @private
 * @description 重置筛选
 */
function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.value = '';
    if (typeFilter) typeFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    
    state.searchQuery = '';
    state.typeFilter = 'all';
    state.statusFilter = 'all';
    state.page = 1;
    applyFilters();
}

/**
 * @private
 * @description 刷新数据
 */
function refresh() {
    loadGiftCards();
    showToast('数据已刷新', 'success');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                searchGiftCards(this.value);
            }, 300);
        });
    }
    
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', applyFiltersAndRender);
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFiltersAndRender);
    }
    
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    const refreshBtn = document.getElementById('refreshGiftCards');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
    
    const createBtn = document.getElementById('createBtn');
    if (createBtn) {
        createBtn.addEventListener('click', showCreateModal);
    }
}

/**
 * @private
 * @description 初始化弹窗事件
 */
function initModalEvents() {
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    const cancelBtn = document.getElementById('cancelModal');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    const saveBtn = document.getElementById('saveGiftCard');
    if (saveBtn) saveBtn.addEventListener('click', saveGiftCard);
    
    const modal = document.getElementById('giftCardModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {GiftCard[]} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('🎁 礼品卡管理 初始化...');
    
    if (options?.data) {
        state.cards = options.data;
        localStorage.setItem('giftcard_data', JSON.stringify(state.cards));
    }
    
    loadGiftCards();
    bindEvents();
    initModalEvents();
    
    window.GiftCardsModule = {
        state,
        loadGiftCards,
        renderGiftCards,
        renderPagination,
        updateStats,
        viewGiftCard,
        editGiftCard,
        deleteGiftCard,
        goToPage,
        showCreateModal,
        closeModal,
        searchGiftCards,
        applyFilters: applyFiltersAndRender,
        resetFilters,
        refresh,
        saveGiftCards
    };
    
    console.log('✅ 礼品卡管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadGiftCards,
    viewGiftCard,
    editGiftCard,
    deleteGiftCard,
    goToPage,
    showCreateModal,
    saveGiftCard,
    refresh,
    saveGiftCards
};